import { readFile } from "node:fs/promises";
import { TenantClient, getNodeUrl } from "@terminal3/t3n-sdk";
import { connectT3n } from "./t3n.js";

const CONTRACT_TAIL = "securedesk";
const CONTRACT_VERSION = "0.1.0";
const WASM_PATH = new URL(
  "../z-securedesk/target/wasm32-wasip2/release/z_securedesk.wasm",
  import.meta.url
);

try {
  const { client, tenantDid } = await connectT3n();
  console.log("Connected as:", tenantDid);

  const tenant = new TenantClient({
    t3n: client,
    baseUrl: getNodeUrl(),
    tenantDid,
  });

  await tenant.tenant.me();
  console.log("TenantClient ready.");

  const wasmBytes = await readFile(WASM_PATH);
  const result = await tenant.contracts.register({
    tail: CONTRACT_TAIL,
    version: CONTRACT_VERSION,
    wasm: wasmBytes,
  });

  const contractId = result.contract_id;
  const tenantId = tenantDid.slice("did:t3n:".length);

  console.log("\nContract registered successfully.");
  console.log("Name:", `z:${tenantId}:${CONTRACT_TAIL}`);
  console.log("Version:", CONTRACT_VERSION);
  console.log("Contract ID:", contractId);
} catch (error) {
  console.error("Failed to register contract:");
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
}
