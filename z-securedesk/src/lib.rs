wit_bindgen::generate!({
    world: "securedesk",
    path: "wit",
    generate_all,
});

mod github;

struct Component;

impl exports::z::securedesk::contracts::Guest for Component {
    fn create_ticket(
        req: exports::z::securedesk::contracts::GenericInput,
    ) -> Result<Vec<u8>, String> {
        let input = req.input.ok_or("create-ticket: missing input")?;
        github::create_ticket(&input)
    }
}

export!(Component);
