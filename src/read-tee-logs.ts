import { TenantClient, getNodeUrl } from "@terminal3/t3n-sdk";
import { connectT3n } from "./t3n.js";

try {
  const { client, tenantDid } = await connectT3n();
  const tenant = new TenantClient({
    t3n: client,
    baseUrl: getNodeUrl(),
    tenantDid,
  });
  const result = await tenant.contracts.logs("securedesk", {
    sinceSeq: 0,
    limit: 100,
  });

  if (result.entries.length === 0) {
    console.log("No TEE log entries returned.");
  } else {
    for (const entry of result.entries) {
      console.log(
        `Sequence: ${entry.span_id ?? "n/a"} | Level: ${entry.level} | Timestamp: ${new Date(entry.ts_ms).toISOString()} | Message: ${entry.message}`,
      );
    }
  }
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("Failed to read TEE logs:", message);
  process.exitCode = 1;
}
