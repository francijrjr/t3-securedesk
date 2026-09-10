import { connectT3n } from "./t3n.js";

const scriptName =
  "z:6495cf23db8d8a7ec6c507a8487856be5effc1fd:securedesk";

try {
  const { client, tenantDid } = await connectT3n();
  console.log("Connected as:", tenantDid);

  console.log("\nCalling SecureDesk 0.1.1...");
  const ticket = await client.executeAndDecode<{ number: number; url: string }>({
    contract_id: scriptName,
    contract_version: "0.1.1",
    function_name: "create-ticket",
    input: {
      title: "SecureDesk 0.1.1 Tenant Diagnostic",
      description:
        "Validating diagnostic contract version 0.1.1 through the tenant execution path.",
    },
  });

  console.log("\nTicket created through TEE.");
  console.log("Number:", ticket.number);
  console.log("URL:", ticket.url);
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("Failed SecureDesk 0.1.1 tenant test:", message);
  process.exitCode = 1;
}
