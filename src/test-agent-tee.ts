import { getContractVersion, getNodeUrl } from "@terminal3/t3n-sdk";
import { connectAgentT3n } from "./agent-t3n.js";

const TENANT_SCRIPT =
  "z:6495cf23db8d8a7ec6c507a8487856be5effc1fd:securedesk";

type TicketResult = {
  number: number;
  url: string;
};

try {
  const { client, agentDid } = await connectAgentT3n();
  console.log(`Agent connected: ${agentDid}`);

  // The installed SDK exposes this lookup as getContractVersion.
  const scriptVersion = await getContractVersion(getNodeUrl(), TENANT_SCRIPT);
  if (scriptVersion !== "0.1.0") {
    throw new Error(`Expected deployed securedesk version 0.1.0, got ${scriptVersion}.`);
  }

  console.log("\nCalling delegated TEE contract...");
  const result = await client.executeAndDecode<TicketResult>({
    contract_id: TENANT_SCRIPT,
    contract_version: scriptVersion,
    function_name: "create-ticket",
    input: {
      title: "Delegated Agent Test - T3 SecureDesk",
      description:
        "This ticket was created by the dedicated T3 SecureDesk Agent DID through Terminal 3 Member Delegation and the protected TEE contract.",
    },
  });

  if (
    !Number.isSafeInteger(result.number) ||
    result.number <= 0 ||
    typeof result.url !== "string" ||
    !result.url.startsWith("https://github.com/")
  ) {
    throw new Error("Unexpected delegated TEE response.");
  }

  console.log("\nDelegated agent ticket created.");
  console.log("Number:", result.number);
  console.log("URL:", result.url);
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("Failed delegated agent TEE test:", message);
  process.exitCode = 1;
}
