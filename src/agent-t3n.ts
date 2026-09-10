import "dotenv/config";
import {
  T3nClient, setEnvironment, loadWasmComponent, fetchTrustedManifest,
  eth_get_address, metamask_sign, createEthAuthInput,
} from "@terminal3/t3n-sdk";

export async function connectAgentT3n() {
  setEnvironment("testnet");
  const key = process.env.AGENT_KEY?.trim();
  if (!key) throw new Error("Set AGENT_KEY in .env using a fresh Terminal 3 claim credential.");

  const hex = key.replace(/^0x/i, "").toLowerCase();
  const order = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
  if (!/^[0-9a-f]{64}$/.test(hex) || BigInt(`0x${hex}`) === 0n || BigInt(`0x${hex}`) >= order) {
    throw new Error("AGENT_KEY must be a valid Ethereum private key.");
  }
  for (const tenantKey of [process.env.T3N_API_KEY, process.env.T3N_PRIVATE_KEY]) {
    if (tenantKey?.trim().replace(/^0x/i, "").toLowerCase() === hex) {
      throw new Error("AGENT_KEY must not reuse the tenant credential.");
    }
  }

  const privateKey = `0x${hex}`;
  const address = eth_get_address(privateKey);
  const client = new T3nClient({
    trustAnchor: await fetchTrustedManifest("testnet"),
    wasmComponent: await loadWasmComponent(),
    handlers: { EthSign: metamask_sign(address, undefined, privateKey) },
  });
  await client.handshake();
  const authenticatedDid = await client.authenticate(createEthAuthInput(address));
  return { client, agentDid: authenticatedDid.value };
}
