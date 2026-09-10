import { connectAgentT3n } from "./agent-t3n.js";

const contract = "z:6495cf23db8d8a7ec6c507a8487856be5effc1fd:securedesk";

try {
  const { client, agentDid } = await connectAgentT3n();
  console.log("Agent connected:", agentDid);
  console.log("\nCalling delegated SecureDesk 0.1.1...");
  const ticket = await client.executeAndDecode<{ number: number; url: string }>({
    contract_id: contract,
    contract_version: "0.1.1",
    function_name: "create-ticket",
    input: {
      title: "SecureDesk Agent 0.1.1 Diagnostic",
      description: "Delegated Agent DID diagnostic execution.",
    },
  });
  console.log("\nDelegated agent ticket created.");
  console.log("Number:", ticket.number);
  console.log("URL:", ticket.url);
} catch (error) {
  console.error("Failed delegated SecureDesk 0.1.1 test:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
}
