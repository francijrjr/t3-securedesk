import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variable ${name} is not configured.`);
  }

  return value;
}

export function getT3nPrivateKey() {
  // Keep the old variable working for existing installations.
  const value = (process.env.T3N_PRIVATE_KEY ?? process.env.T3N_API_KEY)?.trim();
  if (!value) {
    throw new Error("Configure T3N_PRIVATE_KEY in .env with an Ethereum private key.");
  }

  const hex = value.replace(/^0x/i, "");
  const order = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
  if (!/^[0-9a-fA-F]{64}$/.test(hex) || BigInt(`0x${hex}`) === 0n || BigInt(`0x${hex}`) >= order) {
    throw new Error("Invalid T3N private key. Set T3N_PRIVATE_KEY in .env to a valid Ethereum private key: 64 hexadecimal characters, optionally prefixed with 0x. An API token or wallet address cannot be used here.");
  }

  return `0x${hex}`;
}

export function getGitHubConfig() {
  return {
    token: required("GITHUB_TOKEN"),
    owner: required("GITHUB_OWNER"),
    repo: required("GITHUB_REPO"),
  };
}

export function getT3nExpectedDid() {
  const did = (process.env.T3N_DID ?? process.env.DID)?.trim();
  if (did && !/^did:[a-z0-9]+:\S+$/.test(did)) {
    throw new Error("Invalid DID in .env. Use the complete DID provided by Terminal 3.");
  }
  return did || undefined;
}
