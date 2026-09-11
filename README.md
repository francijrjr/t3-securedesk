# T3 SecureDesk

## Overview

T3 SecureDesk is an enterprise IT support agent built for the Terminal 3 Agent Build Challenge. It uses GitHub Issues as a reproducible service-desk backend.

## Problem

Support workflows often need to create, inspect, comment on, and escalate tickets while keeping external credentials outside the application layer. SecureDesk demonstrates this flow with GitHub Issues and a protected TEE path.

## Why Terminal 3

Terminal 3 provides authenticated DIDs, scoped delegation, protected TEE execution, private secrets storage, and outbound host controls. SecureDesk uses these capabilities to keep the GitHub token inside T3N while allowing the contract to perform the protected operation.

## Features

- Create a GitHub Issue
- Get an existing Issue
- Add a comment
- Escalate an Issue with the `priority-high` label
- Execute protected `create-ticket` through the TEE contract

## Architecture

```text
User / Data Owner
       ↓
T3 SecureDesk Agent DID
       ↓
Member Delegation
       ↓
Terminal 3 TEE Contract
       ↓
T3N secrets KV
       ↓
api.github.com
       ↓
GitHub Issue
```

## Tech Stack

- TypeScript and `tsx`
- `@terminal3/t3n-sdk@5.2.0`
- Rust and WebAssembly Component Model
- Terminal 3 TEE host interfaces: `kv_store`, `http`, and `tenant_context`
- GitHub Issues API
- Vitest for TypeScript tests

## Project Structure

```text
src/
  agent-t3n.ts
  agent.ts
  authorize-agent.ts
  authorize-agent-011.ts
  authorize-tee.ts
  check-agent.ts
  check-delegation.ts
  check-t3n.ts
  config.ts
  delegate-agent.ts
  delegate-agent-011.ts
  github.ts
  index.ts
  read-tee-logs.ts
  register-contract.ts
  test-actions.ts
  test-agent-tee.ts
  test-agent-tee-011.ts
  test-tee.ts
  test-tee-011.ts
tests/
z-securedesk/
  Cargo.toml
  src/lib.rs
  src/github.rs
  wit/world.wit
  wit/deps/
docs/bugs.md
.env.example
package.json
tsconfig.json
README.md
```

## Setup

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Install Rust with [rustup](https://rustup.rs/) if you want to build the contract. Configure the environment variables locally; never commit `.env`.

## Environment Variables

Only variable names are shown here. Use real values only in the local, gitignored `.env` file.

```env
T3N_API_KEY=
AGENT_KEY=
GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO=
```

## Running the Project

Run the normal application and direct action checks:

```powershell
npm run dev -- "I cannot access the ERP"
npm run test:actions
npm run test:actions -- 7
```

Run identity and local validation checks:

```powershell
npm run check:t3n
npm run check:agent
npm run check:delegation
npx tsc --noEmit
npm test
```

Run the tenant and delegated TEE flows:

```powershell
npm run test:tee
npm run test:tee:011
npm run delegate:agent
npm run authorize:agent
npm run test:agent-tee
npm run delegate:agent:011
npm run authorize:agent:011
npm run test:agent-tee:011
```

Inspect contract logs when available:

```powershell
npm run logs:tee
```

Contract registration and secrets setup are administrative operations. Existing registrations and secrets should not be recreated casually:

```powershell
npm run register:contract
npm run setup:secrets
```

## TEE Contract

The Rust contract exports only `create-ticket`. It accepts a JSON object with `title` and `description`, reads `github_token` from the tenant's private `secrets` map, and posts to the fixed repository through `api.github.com`.

The registered versions are:

| Version | Contract ID | Purpose |
| --- | ---: | --- |
| `0.1.0` | 982 | Original working contract |
| `0.1.1` | 985 | Diagnostic contract with sanitized errors |

Build and inspect the component from the repository root:

```powershell
cd z-securedesk
rustup target add wasm32-wasip2
cargo build --target wasm32-wasip2 --release
cargo test --lib
wasm-tools component wit target/wasm32-wasip2/release/z_securedesk.wasm
cd ..
```

## Delegation and Least Privilege

The tenant and dedicated Agent identities are:

```text
Tenant: did:t3n:6495cf23db8d8a7ec6c507a8487856be5effc1fd
Agent:  did:t3n:c47096a9171cab2e1db5cdacb3b10ef45fa24608
```

The delegated grant is limited to the SecureDesk contract, `create-ticket`, no user-data scopes, and the single external host `api.github.com`. The tenant self-grant and Agent authorization are maintained separately.

## Verified Results

Tenant execution of version 0.1.1 succeeded:

```text
Ticket created through TEE.
Number: 4
URL: https://github.com/francijrjr/t3-securedesk/issues/4
```

This A/B control demonstrates that the WASM, secret, KV ACL, GitHub token, endpoint, payload, and tenant egress all work.

### Challenge Status

| Capability | Status |
| --- | --- |
| T3N tenant authentication | ✅ |
| Dedicated Agent DID | ✅ |
| GitHub Issues integration | ✅ |
| Rust/WASM TEE contract | ✅ |
| T3N secrets KV | ✅ |
| Tenant TEE → GitHub | ✅ |
| Member Delegation | ✅ |
| Delegated Agent contract execution | ✅ |
| Delegated Agent outbound HTTP | ⚠️ T3N testnet egress denied |

## Known Terminal 3 Testnet Limitation

The delegated Agent authenticates, reaches the contract, and passes the delegation check, but version 0.1.1 returns:

```text
SECUREDESK_HTTP_EGRESS_DENIED
```

This is reproducible on the tested Terminal 3 testnet with matching Agent authorization and `api.github.com` allowlisting. It appears to be a delegated-Agent egress authorization/runtime limitation. The result does not establish how Terminal 3 implements the internal authorization path.

## Security

- The GitHub token is stored in the private T3N `secrets` KV.
- The Rust contract reads `github_token` inside the TEE.
- TypeScript never passes `GITHUB_TOKEN` to the contract.
- `.env` is gitignored; credentials must never be committed.
- External access is restricted to `api.github.com`.
- Diagnostic errors expose classifications only, never tokens, headers, request bodies, or response bodies.
- Private keys, including `AGENT_KEY` and tenant credentials, must never be shared.

## Bugs Found

See [docs/bugs.md](docs/bugs.md) for the evidence and reproduction notes. The three key findings are:

1. A second key under the same account produced a different private key but the same DID.
2. SDK 5.3.0 produced a malformed trust-manifest error on the tested testnet; 5.2.0 is pinned.
3. Delegated Agent HTTP egress was denied despite matching authorization, while the same contract/version succeeded as the tenant.

## Maintenance

I would like to continue maintaining and developing T3 SecureDesk after the challenge.

Potential future integrations include Jira, ServiceNow, and GLPI. These are future work and are not currently implemented.

## Challenge Submission

Repository: [github.com/francijrjr/t3-securedesk](https://github.com/francijrjr/t3-securedesk)

Built for the T3N Agent Build Challenge.
