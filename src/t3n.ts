import {
  T3nClient,
  setEnvironment,
  loadWasmComponent,
  fetchTrustedManifest,
  eth_get_address,
  metamask_sign,
  createEthAuthInput,
} from "@terminal3/t3n-sdk";

import { getT3nPrivateKey, getT3nExpectedDid } from "./config.js";

export async function connectT3n() {
  setEnvironment("testnet");

  const privateKey = getT3nPrivateKey();
  const expectedDid = getT3nExpectedDid();
  const address = eth_get_address(privateKey);
  const wasmComponent = await loadWasmComponent();

  const client = new T3nClient({
    trustAnchor: await fetchTrustedManifest("testnet"),
    wasmComponent,
    handlers: {
      EthSign: metamask_sign(
        address,
        undefined,
        privateKey
      ),
    },
  });

  await client.handshake();

  const authenticatedDid = await client.authenticate(
    createEthAuthInput(address)
  );

  if (expectedDid && authenticatedDid.value !== expectedDid) {
    throw new Error("The authenticated DID does not match DID in .env. Check that the key and DID belong to the same Terminal 3 account and network.");
  }

  return {
    client,
    tenantDid: authenticatedDid.value,
  };
}
