import { TenantClient, getNodeUrl } from "@terminal3/t3n-sdk";
import { connectT3n } from "./t3n.js";
import { connectAgentT3n } from "./agent-t3n.js";

try {
  const { agentDid } = await connectAgentT3n();
  const { client, tenantDid } = await connectT3n();
  if (agentDid === tenantDid) throw new Error("Agent and tenant must have different DIDs.");

  const tenant = new TenantClient({ t3n: client, baseUrl: getNodeUrl(), tenantDid });
  const contract = tenant.canonicalName("securedesk");
  await client.updateMemberDelegation({
    grantee: agentDid,
    contract_id: contract,
    version_req: "0.1.0",
    functions: ["create-ticket"],
    allowed_hosts: ["api.github.com"],
    // Tenant KV access is controlled by map ACLs; no user-data scopes are needed.
    scopes: [],
  });

  console.log("Member delegation configured.\n");
  console.log("Agent:", agentDid);
  console.log("Contract:", contract);
  console.log("Version: 0.1.0");
  console.log("Function: create-ticket");
  console.log("Allowed host: api.github.com");
} catch (error) {
  let message = error instanceof Error ? error.message : "Unknown error";
  for (const secret of [process.env.AGENT_KEY, process.env.T3N_API_KEY, process.env.T3N_PRIVATE_KEY, process.env.GITHUB_TOKEN]) {
    if (secret) message = message.split(secret).join("[REDACTED]");
  }
  console.error("Failed to configure member delegation:", message);
  process.exitCode = 1;
}
