# z-securedesk

One T3N TEE contract operation: `contracts.create-ticket`.

The operation accepts JSON bytes in `generic-input.input`:

```json
{"title":"ERP problem","description":"The user cannot sign in"}
```

It creates an Issue in `francijrjr/t3-securedesk` and returns JSON bytes:

```json
{"number":1,"url":"https://github.com/francijrjr/t3-securedesk/issues/1"}
```

The repository is fixed by `OWNER` and `REPO` in `src/github.rs`. No local
environment file is read. At runtime the contract reads the UTF-8 token from
`github_token` in `z:<tenant-id>:secrets`, deriving the tenant ID from the host.
Neither the token nor upstream response bodies are logged or returned on errors.

## Build

Run from this directory:

```sh
rustup target add wasm32-wasip2
cargo build --target wasm32-wasip2 --release
wasm-tools component wit target/wasm32-wasip2/release/z_securedesk.wasm
```

The output exports `contracts` with `create-ticket`. Native parsing and response
tests can be run with `cargo test --lib`. These tests do not execute T3N host calls.

## WIT provenance

The two packages in `wit/deps` are copied unchanged from
[Terminal-3/z-tenant-flight](https://github.com/Terminal-3/z-tenant-flight/tree/1226b396ac909379df0814308c5c9ea055e703f0),
commit `1226b396ac909379df0814308c5c9ea055e703f0`.

The current [write-contract tutorial](https://docs.terminal3.io/developers/adk/get-started/walkthrough/write-contract)
shows `host:interfaces@2.2.0` and `host:tenant@1.2.0`. The referenced repository
actually vendors `host:interfaces@2.1.0` and `host:tenant@1.0.0`; this contract
retains those real ABI versions rather than relabeling their definitions.
The host-interfaces source explicitly documents its compatibility pin.
Cluster ABI compatibility must be verified before registration; a successful
local build alone does not verify cluster support.

Vendored packages contain other interface definitions, but `world.wit` imports
only `tenant-context`, `kv-store`, and `http`. Logging and other capabilities
are not imported.
The Rust standard library also introduces WASI imports in the compiled component
(including CLI, streams, and clocks); these are visible in `wasm-tools` output.

## Later runtime setup (not performed here)

Registration, the secrets map and its contract ACL, seeding `github_token`,
and authorization for outbound `api.github.com` access are required before a
live invocation can succeed. See the official
[registration guide](https://docs.terminal3.io/developers/adk/get-started/walkthrough/register-contract).
No registration, delegation, secret provisioning, or TypeScript integration
is included in this step. GitHub POST requests are not idempotent; a repeated
invocation can create another Issue.
