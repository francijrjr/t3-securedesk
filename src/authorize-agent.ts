import { getContractVersion, getNodeUrl } from "@terminal3/t3n-sdk";
import { connectAgentT3n } from "./agent-t3n.js";
import { connectT3n } from "./t3n.js";

const securedeskScript =
  "z:6495cf23db8d8a7ec6c507a8487856be5effc1fd:securedesk";
const userContractsScript = "tee:user/contracts";

try {
  // Obtain the actual agent DID, but use the tenant session for the write.
  const { agentDid } = await connectAgentT3n();
  const { client } = await connectT3n();
  console.log("Data owner connected.");

  const [userContractVersion, scriptVersion] = await Promise.all([
    getContractVersion(getNodeUrl(), userContractsScript),
    getContractVersion(getNodeUrl(), securedeskScript),
  ]);
  if (scriptVersion !== "0.1.0") {
    throw new Error(`Expected deployed securedesk version 0.1.0, got ${scriptVersion}.`);
  }
  if (!userContractVersion) throw new Error("tee:user/contracts has no deployed version.");

  // The installed SDK performs the current agent-auth-update call and emits
  // its canonical snake_case wire payload while preserving other grants.
  await client.updateAgentAuth(agentDid, {
    scriptName: "*",
    versionReq: `=${scriptVersion}`,
    functions: ["create-ticket"],
    allowedHosts: ["api.github.com"],
  });

  console.log("\nAgent egress authorization configured.");
  console.log("Agent:", agentDid);
  console.log("Contract:", securedeskScript);
  console.log("Version:", scriptVersion);
  console.log("Function: create-ticket");
  console.log("Allowed host: api.github.com");
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("Failed to authorize agent egress:", message);
  process.exitCode = 1;
}
