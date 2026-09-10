import { TenantClient, getNodeUrl } from "@terminal3/t3n-sdk";
import { connectAgentT3n } from "./agent-t3n.js";
import { connectT3n } from "./t3n.js";

const securedeskContract =
  "z:6495cf23db8d8a7ec6c507a8487856be5effc1fd:securedesk";

try {
  const [{ client: agentClient, agentDid }, { client: userClient, tenantDid }] =
    await Promise.all([connectAgentT3n(), connectT3n()]);

  const tenant = new TenantClient({
    t3n: userClient,
    baseUrl: getNodeUrl(),
    tenantDid,
  });
  const memberDelegation = await userClient.getMemberDelegation();
  const relevantGrants = memberDelegation.grants.filter(
    (grant) =>
      grant.grantee === agentDid &&
      (grant.contract_id === securedeskContract || grant.contract_id === "*"),
  );

  console.log("Agent:", agentDid);
  console.log("Tenant:", tenantDid);
  console.log("\nMember delegation:");
  console.log(JSON.stringify(relevantGrants, null, 2));

  const verdict = await agentClient.checkDelegation({
    contract: securedeskContract,
    pii_did: tenantDid,
    functions: ["create-ticket"],
    scopes: [],
  });

  console.log("\nDelegation verdict:");
  console.log(JSON.stringify(verdict, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("Failed to check delegation:", message);
  process.exitCode = 1;
}
