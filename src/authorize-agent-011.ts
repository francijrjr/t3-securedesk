import { getContractVersion, getNodeUrl } from "@terminal3/t3n-sdk";
import { connectAgentT3n } from "./agent-t3n.js";
import { connectT3n } from "./t3n.js";

const contract = "z:6495cf23db8d8a7ec6c507a8487856be5effc1fd:securedesk";

try {
  const { agentDid } = await connectAgentT3n();
  const { client } = await connectT3n();
  const version = await getContractVersion(getNodeUrl(), contract);
  if (version !== "0.1.1") throw new Error(`Expected securedesk version 0.1.1, got ${version}.`);
  await client.updateAgentAuth(agentDid, {
    scriptName: contract,
    versionReq: "=0.1.1",
    functions: ["create-ticket"],
    allowedHosts: ["api.github.com"],
  });
  console.log("Agent egress authorization configured.");
  console.log("Agent:", agentDid);
  console.log("Contract:", contract);
  console.log("Version: 0.1.1");
  console.log("Function: create-ticket");
  console.log("Allowed host: api.github.com");
} catch (error) {
  console.error("Failed to authorize agent egress:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
}
