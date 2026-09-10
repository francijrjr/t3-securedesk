use crate::host::{interfaces::{http, kv_store}, tenant::tenant_context};
use serde::{Deserialize, Serialize};

const OWNER: &str = "francijrjr";
const REPO: &str = "t3-securedesk";

#[derive(Deserialize)]
struct TicketInput {
    title: String,
    description: String,
}

#[derive(Deserialize, Serialize)]
struct TicketResult {
    number: u64,
    #[serde(rename(deserialize = "html_url"))]
    url: String,
}

pub fn create_ticket(input: &[u8]) -> Result<Vec<u8>, String> {
    let payload = ticket_payload(input)?;
    let token = github_token()?;
    let response = http::call(&http::Request {
        method: http::Verb::Post,
        url: format!("https://api.github.com/repos/{OWNER}/{REPO}/issues"),
        headers: Some(vec![
            ("Authorization".into(), format!("Bearer {token}")),
            ("Accept".into(), "application/vnd.github+json".into()),
            ("Content-Type".into(), "application/json".into()),
            ("User-Agent".into(), "T3-SecureDesk".into()),
            ("X-GitHub-Api-Version".into(), "2022-11-28".into()),
        ]),
        payload: Some(payload),
    }).map_err(|_| "GitHub request failed".to_string())?;

    ticket_result(response.code, &response.payload)
}

fn ticket_payload(input: &[u8]) -> Result<Vec<u8>, String> {
    let ticket: TicketInput = serde_json::from_slice(input)
        .map_err(|_| "create-ticket: expected JSON with title and description".to_string())?;
    if ticket.title.trim().is_empty() || ticket.description.trim().is_empty() {
        return Err("create-ticket: title and description must not be empty".into());
    }
    serde_json::to_vec(&serde_json::json!({
        "title": ticket.title,
        "body": ticket.description,
    })).map_err(|_| "Failed to encode GitHub request".into())
}

fn github_token() -> Result<String, String> {
    // T3N requires the full map name, built from the host's raw tenant DID.
    let map = format!("z:{}:secrets", hex::encode(tenant_context::tenant_did()));
    let bytes = kv_store::get(&map, b"github_token")
        .map_err(|_| "Failed to read secrets map".to_string())?
        .ok_or("github_token is missing from the secrets map")?;
    let token = String::from_utf8(bytes)
        .map_err(|_| "github_token must be UTF-8".to_string())?;
    if token.trim().is_empty() || token.contains(['\r', '\n']) {
        return Err("github_token is empty or contains a line break".into());
    }
    Ok(token)
}

fn ticket_result(status: u16, payload: &[u8]) -> Result<Vec<u8>, String> {
    if status != 201 {
        return Err(format!("Error creating ticket: HTTP {status}"));
    }
    let ticket: TicketResult = serde_json::from_slice(payload)
        .map_err(|_| "Invalid GitHub ticket response".to_string())?;
    serde_json::to_vec(&ticket).map_err(|_| "Failed to encode ticket result".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_description_to_github_body() {
        let payload = ticket_payload(br#"{"title":"ERP","description":"Cannot sign in"}"#).unwrap();
        let value: serde_json::Value = serde_json::from_slice(&payload).unwrap();
        assert_eq!(value, serde_json::json!({"title":"ERP","body":"Cannot sign in"}));
    }

    #[test]
    fn rejects_invalid_input_before_host_calls() {
        for input in [b"invalid".as_slice(), br#"{"title":"ERP"}"#, br#"{"title":" ","description":"Issue"}"#] {
            assert!(ticket_payload(input).is_err());
        }
    }

    #[test]
    fn returns_only_number_and_url() {
        let output = ticket_result(201, br#"{"number":1,"html_url":"https://github.com/example/1","body":"private text"}"#).unwrap();
        let value: serde_json::Value = serde_json::from_slice(&output).unwrap();
        assert_eq!(value, serde_json::json!({"number":1,"url":"https://github.com/example/1"}));
    }

    #[test]
    fn does_not_expose_upstream_error_body() {
        assert_eq!(ticket_result(403, b"sensitive response").unwrap_err(), "Error creating ticket: HTTP 403");
        assert_eq!(ticket_result(201, b"sensitive response").unwrap_err(), "Invalid GitHub ticket response");
    }
}
