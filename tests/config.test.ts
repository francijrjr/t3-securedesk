import { afterEach, describe, expect, it, vi } from "vitest";
import { getT3nPrivateKey, getT3nExpectedDid } from "../src/config.js";

afterEach(() => vi.unstubAllEnvs());

describe("T3N DID configuration", () => {
  it("reads DID and gives T3N_DID precedence", () => {
    vi.stubEnv("T3N_DID", undefined);
    vi.stubEnv("DID", " did:t3n:example ");
    expect(getT3nExpectedDid()).toBe("did:t3n:example");
    vi.stubEnv("T3N_DID", "did:t3n:another");
    expect(getT3nExpectedDid()).toBe("did:t3n:another");
  });

  it("rejects malformed DIDs", () => {
    vi.stubEnv("T3N_DID", "invalid");
    expect(getT3nExpectedDid).toThrow("Invalid DID");
  });
});

describe("T3N private key configuration", () => {
  const key = "1".padStart(64, "0");

  it("normalizes whitespace and an optional prefix", () => {
    vi.stubEnv("T3N_PRIVATE_KEY", ` ${key} `);
    expect(getT3nPrivateKey()).toBe(`0x${key}`);
  });

  it("accepts the legacy variable and prefers the explicit variable", () => {
    vi.stubEnv("T3N_PRIVATE_KEY", undefined);
    vi.stubEnv("T3N_API_KEY", key);
    expect(getT3nPrivateKey()).toBe(`0x${key}`);
    vi.stubEnv("T3N_PRIVATE_KEY", `0x${"2".padStart(64, "0")}`);
    expect(getT3nPrivateKey()).toBe(`0x${"2".padStart(64, "0")}`);
  });

  it.each(["", "api-secret", "0x1234", "g".repeat(64), "0".repeat(64), "f".repeat(64), "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"])("rejects invalid input without disclosing it (%#)", (value) => {
    vi.stubEnv("T3N_PRIVATE_KEY", value);
    vi.stubEnv("T3N_API_KEY", key);
    expect(getT3nPrivateKey).toThrow(/T3N_PRIVATE_KEY/);
    if (value) {
      try { getT3nPrivateKey(); } catch (error) {
        expect((error as Error).message).not.toContain(value);
      }
    }
  });
});
