import { TenantClient, getNodeUrl } from "@terminal3/t3n-sdk";
import { connectT3n } from "./t3n.js";

const CONTRACT_ID = 982;
const MAP_TAIL = "secrets";
const SECRET_KEY = "github_token";

try {
  const token = process.env.GITHUB_TOKEN;
  if (!token?.trim()) {
    throw new Error("GITHUB_TOKEN is not configured.");
  }

  const { client, tenantDid } = await connectT3n();
  console.log("Connected as:", tenantDid);

  const tenant = new TenantClient({
    t3n: client,
    baseUrl: getNodeUrl(),
    tenantDid,
  });
  await tenant.tenant.me();
  console.log("TenantClient ready.");

  const permissions = {
    visibility: "private",
    writers: { only: [] },
    readers: { only: [CONTRACT_ID] },
  };

  try {
    await tenant.maps.create({ tail: MAP_TAIL, ...permissions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/\bMapAlreadyExists\b|\bmap\b[^\r\n]*\balready[ -]exists\b/i.test(message)) {
      throw error;
    }
  }

  // Reapply restrictions before seeding, including for an existing map.
  await tenant.maps.update(MAP_TAIL, {
    ...permissions,
    adminReadable: false,
    extraReadGrants: [],
    extraWriteGrants: [],
  });
  console.log("\nSecrets map ready.");
  console.log("Contract reader:", CONTRACT_ID);

  await tenant.executeControl("map-entry-set", {
    map_name: tenant.canonicalName(MAP_TAIL),
    key: SECRET_KEY,
    value: token,
  });
  console.log("\nGitHub token stored securely.");
  console.log("Key:", SECRET_KEY);
} catch (error) {
  let message = error instanceof Error ? error.message : "Unknown error";
  for (const secret of [process.env.GITHUB_TOKEN, process.env.T3N_API_KEY, process.env.T3N_PRIVATE_KEY]) {
    if (secret) message = message.split(secret).join("[REDACTED]");
  }
  console.error("Failed to set up secrets:", message);
  process.exitCode = 1;
}
