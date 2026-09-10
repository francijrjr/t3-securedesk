import { TenantClient, getNodeUrl, getContractVersion } from "@terminal3/t3n-sdk";
import { connectT3n } from "./t3n.js";

try {
  const { client, tenantDid } = await connectT3n();
  console.log("Connected as:", tenantDid);
  const tenant = new TenantClient({ t3n: client, baseUrl: getNodeUrl(), tenantDid });
  const scriptName = tenant.canonicalName("securedesk");
  const version = await getContractVersion(getNodeUrl(), scriptName);
  if (version !== "0.1.0") throw new Error("Expected deployed securedesk version 0.1.0.");

  await client.updateAgentAuth(tenantDid, {
    scriptName,
    versionReq: "=0.1.0",
    functions: ["create-ticket"],
    allowedHosts: ["api.github.com"],
  });

  console.log("\nTEE authorization created.");
  console.log("Contract:", scriptName);
  console.log("Function: create-ticket");
  console.log("Allowed host: api.github.com");
} catch (error) {
  let message = error instanceof Error ? error.message : "Unknown error";
  for (const secret of [process.env.GITHUB_TOKEN, process.env.T3N_API_KEY, process.env.T3N_PRIVATE_KEY]) {
    if (secret) message = message.split(secret).join("[REDACTED]");
  }
  console.error("Failed to authorize TEE:", message);
  process.exitCode = 1;
}
