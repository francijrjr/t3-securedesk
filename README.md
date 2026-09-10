# T3 SecureDesk

A simple enterprise support agent built with the Terminal 3 ADK, TypeScript,
native fetch, and GitHub Issues.

## Current status

- T3N authentication and DID verification work.
- Direct GitHub operations support creating tickets, fetching tickets, adding
  comments, and escalating tickets with the `priority-high` label.
- The Rust `z-securedesk` TEE contract builds successfully and exports `create-ticket`.
- Contract version `0.1.0` is registered with contract ID `982` in the current tenant.
- Secrets provisioning, delegation, and end-to-end TEE invocation are not implemented yet.

The application still uses the direct GitHub integration:

```text
User -> T3 SecureDesk -> T3N authentication -> GitHub Issues
```

## 1. Install dependencies

Run from the project root:

```powershell
npm install
```

Create `.env` only if it does not already exist:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Configure these variables locally:

```dotenv
T3N_API_KEY=
DID=
GITHUB_TOKEN=
GITHUB_OWNER=francijrjr
GITHUB_REPO=t3-securedesk
```

Use the API key and DID supplied by Terminal 3. The API key is an Ethereum
private key used locally to sign authentication challenges. The configured DID
is checked against the authenticated DID. `T3N_PRIVATE_KEY` and `T3N_DID` are
also accepted and take precedence over `T3N_API_KEY` and `DID`.

For GitHub, use a fine-grained token restricted to the selected repository with
Issues read/write and the required Metadata read permission. Never commit `.env`
or include tokens in source code or documentation.

## 2. Check T3N authentication

```powershell
npm run check:t3n
```

Expected output:

```text
Connected as: did:t3n:...
```

## 3. Create a GitHub ticket

This command creates a real Issue:

```powershell
npm run dev -- "I cannot access the ERP"
```

## 4. Test GitHub actions

Create the `priority-high` label manually in the GitHub repository first.

For Issue #1:

```powershell
npm run test:actions
```

To select another existing Issue, for example #7:

```powershell
npm run test:actions -- 7
```

The script fetches the Issue, displays its title and state, adds the comment
`The user reported that the problem persists.`, and adds `priority-high`
without removing existing labels. Each execution adds a new comment.

Expected output:

```text
Ticket:
Ticket created by T3 SecureDesk
open

Comment added.
Ticket escalated.
```

The displayed title and state come from the selected Issue.

## 5. Run local checks

From the project root:

```powershell
npx tsc --noEmit
npm test
```

The automated TypeScript tests mock GitHub requests and do not modify real Issues.

## 6. Build the TEE contract

Install Rust using [rustup](https://rustup.rs/) if it is not installed yet.
Open a new terminal after installation. If PowerShell still cannot find Cargo,
update the current terminal's PATH:

```powershell
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
```

From the project root, enter the contract directory before building:

```powershell
cd z-securedesk
rustup target add wasm32-wasip2
cargo build --target wasm32-wasip2 --release
cargo test --lib
```

The artifact is:

```text
z-securedesk/target/wasm32-wasip2/release/z_securedesk.wasm
```

Optional component inspection, from `z-securedesk`:

```powershell
cargo install wasm-tools --locked
wasm-tools validate target/wasm32-wasip2/release/z_securedesk.wasm
wasm-tools component wit target/wasm32-wasip2/release/z_securedesk.wasm
```

The interface should contain `z:securedesk/contracts@0.1.0` and `create-ticket`.
Return to the project root afterward:

```powershell
cd ..
```

See [the contract README](z-securedesk/README.md) for the WIT dependencies and
runtime requirements.

## 7. Register the contract - one-time operation per version

**The current tenant already has this registration. Do not run this step again
for version `0.1.0`.**

| Field | Registered value |
| --- | --- |
| Name | `z:6495cf23db8d8a7ec6c507a8487856be5effc1fd:securedesk` |
| Version | `0.1.0` |
| Contract ID | `982` |

For an initial registration in a tenant where this version is not registered,
run from the project root after building the WASM:

```powershell
npm run register:contract
```

The script authenticates with `connectT3n()`, creates a `TenantClient`, checks
`tenant.tenant.me()`, reads the WASM, and registers it. The DID comes from the
real authenticated session.

Expected output:

```text
Connected as: did:t3n:...
TenantClient ready.

Contract registered successfully.
Name: z:<tenant-id>:securedesk
Version: 0.1.0
Contract ID: ...
```

If you see `version 0.1.0 is not higher than current version 0.1.0`, the version
is already registered. Keep using its existing contract ID. Do not increase the
version just to repeat the command.

For a future changed contract build, update its version and the registration
script's `CONTRACT_VERSION` deliberately, rebuild, and register once. A new
registration receives a new contract ID; retain it for later map ACL setup.

Registration does not provision secrets or invoke `create-ticket`.

## Project structure

```text
src/
  index.ts              CLI entry point
  agent.ts              Organizes ticket operations
  github.ts             Direct GitHub integration
  config.ts             Local environment configuration
  t3n.ts                T3N authentication
  check-t3n.ts           Connection check
  test-actions.ts       Live GitHub action checks
  register-contract.ts  TEE contract registration
z-securedesk/
  Cargo.toml
  src/lib.rs
  src/github.rs
  wit/world.wit
  wit/deps/
tests/
```

## Official references

- [Set up the development environment](https://docs.terminal3.io/developers/adk/get-started/prerequisites/set-up-dev-env)
- [Write a TEE contract](https://docs.terminal3.io/developers/adk/get-started/walkthrough/write-contract)
- [Build a TEE contract](https://docs.terminal3.io/developers/adk/get-started/walkthrough/build-contract)
- [Register a TEE contract](https://docs.terminal3.io/developers/adk/get-started/walkthrough/register-contract)
