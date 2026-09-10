# Verified Bugs in the T3 SecureDesk Challenge

## Bug 1 — Delegated Agent HTTP egress denied despite matching authorization

**Environment:** Terminal 3 testnet; `@terminal3/t3n-sdk` 5.2.0

**Identities:**

- Tenant: `did:t3n:6495cf23db8d8a7ec6c507a8487856be5effc1fd`
- Agent: `did:t3n:c47096a9171cab2e1db5cdacb3b10ef45fa24608`

**Contract:** `z:6495cf23db8d8a7ec6c507a8487856be5effc1fd:securedesk`

Diagnostic version 0.1.1 was registered as Contract ID 985. Member Delegation and Agent egress authorization were configured for `create-ticket`, `scopes: []`, and `allowedHosts: ["api.github.com"]`.

`checkDelegation()` returned `authorised: true`, `disclosed: true`, with `member_delegation` in `satisfied` and `missing: []`.

The Tenant control test successfully executed the same version 0.1.1 and created Issue #4:

```text
Calling SecureDesk 0.1.1...

Ticket created through TEE.
Number: 4
URL: https://github.com/francijrjr/t3-securedesk/issues/4
```

The Agent authenticated successfully and reached the contract, but the HTTP call was denied:

```text
Agent connected: did:t3n:c47096a9171cab2e1db5cdacb3b10ef45fa24608

Calling delegated SecureDesk 0.1.1...

Failed delegated SecureDesk 0.1.1 test:
RPC Error: contract error: SECUREDESK_HTTP_EGRESS_DENIED
[4613b8b7-af07-49b9-9853-89b433d64b02]
```

The A/B test confirms that the contract, WASM, GitHub, `github_token`, secrets KV, Contract ID 985 ACL, Tenant HTTP access, Agent authentication, and Member Delegation work. The only failing path is HTTP egress during delegated Agent execution.

This behavior is consistent with a delegated-Agent egress authorization/runtime issue in the current testnet, without allowing conclusions about Terminal 3 internals.

## Bug 2 — Trust manifest regression in SDK 5.3.0

On testnet, upgrading `@terminal3/t3n-sdk` from 5.2.0 to 5.3.0 caused a failure before authentication:

```text
Trust manifest at
https://cn-api.sg.testnet.t3n.terminal3.io/api/trust-manifest
is malformed.
```

Pinning the version back to 5.2.0 restored the testnet connection.

## Bug 3 — A second key under the same account produced the same DID

During onboarding, a second key claimed under the same account produced a different private key but authenticated to the same T3N DID.

This prevented testing Member Delegation between truly distinct identities. A separate account was required to obtain the dedicated Agent DID.
