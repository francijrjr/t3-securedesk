import { TenantClient, getNodeUrl, getContractVersion } from "@terminal3/t3n-sdk";
import { connectT3n } from "./t3n.js";

try {
  const { client, tenantDid } = await connectT3n();
  console.log("Connected as:", tenantDid);
  const tenant = new TenantClient({ t3n: client, baseUrl: getNodeUrl(), tenantDid });
  const scriptName = tenant.canonicalName("securedesk");
  const version = await getContractVersion(getNodeUrl(), scriptName);
  if (version !== "0.1.0") throw new Error("Expected deployed securedesk version 0.1.0.");

  console.log("\nCalling TEE contract...");
  // T3N wraps this JSON in generic-input.input for the WIT export.
  const ticket = await client.executeAndDecode<{ number: number; url: string }>({
    contract_id: scriptName,
    contract_version: version,
    function_name: "create-ticket",
    input: {
      title: "TEE Test - T3 SecureDesk",
      description: "This issue was created through the Terminal 3 TEE contract.",
    },
  });

  if (!Number.isSafeInteger(ticket.number) || ticket.number <= 0 || typeof ticket.url !== "string") {
    throw new Error("Unexpected TEE response. Check the existing Issues before retrying.");
  }
  console.log("\nTicket created through TEE.");
  console.log("Number:", ticket.number);
  console.log("URL:", ticket.url);
} catch (error) {
  let message = error instanceof Error ? error.message : "Unknown error";
  for (const secret of [process.env.GITHUB_TOKEN, process.env.T3N_API_KEY, process.env.T3N_PRIVATE_KEY]) {
    if (secret) message = message.split(secret).join("[REDACTED]");
  }
  console.error("Failed to create ticket through TEE:", message);
  process.exitCode = 1;
}
