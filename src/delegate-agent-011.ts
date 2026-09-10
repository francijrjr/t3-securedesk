import { TenantClient, getNodeUrl } from "@terminal3/t3n-sdk";
import { connectT3n } from "./t3n.js";
import { connectAgentT3n } from "./agent-t3n.js";

try {
  const { agentDid } = await connectAgentT3n();
  const { client, tenantDid } = await connectT3n();
  const tenant = new TenantClient({ t3n: client, baseUrl: getNodeUrl(), tenantDid });
  const contract = tenant.canonicalName("securedesk");
  await client.updateMemberDelegation({
    grantee: agentDid,
    contract_id: contract,
    version_req: "0.1.1",
    functions: ["create-ticket"],
    scopes: [],
    allowed_hosts: ["api.github.com"],
  });
  console.log("Member delegation configured.");
  console.log("Agent:", agentDid);
  console.log("Contract:", contract);
  console.log("Version: 0.1.1");
  console.log("Function: create-ticket");
  console.log("Allowed host: api.github.com");
} catch (error) {
  console.error("Failed to configure member delegation:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
}
