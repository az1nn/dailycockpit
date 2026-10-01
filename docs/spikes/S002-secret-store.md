# S002 — Secret Store

- Status: Proposed / Requires Spike
- Opened: 2026-09-30
- Feature: `specs/004-secret-store/`
- Candidate under test: Tauri Stronghold v2.x behind `SecretStore`
- Canonical decision: `SecretStore` is the architecture boundary; Stronghold is not accepted until evidence closes this spike.

## Question

How should Daily Cockpit persist BYOK/API credentials locally across desktop and Android without plaintext-at-rest, hard-coded vault keys, renderer-owned storage, or lifecycle behavior we have not validated?

## Current evidence

- Tauri's official Stronghold plugin provides an encrypted secure database and loads snapshots from a path using a password.
- As of 2026-09-30, the current plugins-workspace release line includes Stronghold 2.4.0.
- The official Tauri plugin support matrix marks Stronghold as supported on desktop while Android/iOS remain `?` (unknown/untested/planned), so mobile support must be proven in this repository rather than assumed.
- Tauri also exposes a separate biometric plugin on Android/iOS. Biometric prompting and secret persistence are separate concerns and must not be conflated.

Sources:
- https://v2.tauri.app/reference/javascript/stronghold/
- https://github.com/tauri-apps/plugins-workspace
- https://github.com/tauri-apps/plugins-workspace/releases

## Security invariants

- No provider secret is written to Workspace Markdown, SQLite, localStorage, logs, crash messages, fixtures, or source control.
- No static vault password/master key is embedded in the binary or renderer bundle.
- Renderer code does not receive a generic Stronghold API or arbitrary vault path access.
- Product code depends on `SecretStore`; backend selection remains replaceable.
- Wrong-key, corrupt-vault, locked, unavailable and missing-secret states are explicit.
- Reinstall/recovery behavior is documented instead of silently implying durability.

## Experiments

### E1 — Desktop persistence

Create a vault, write an opaque canary secret, save, terminate, restart, unlock and read the exact canary.

Pass:
- ciphertext/snapshot persists;
- plaintext is absent from ordinary app state and logs;
- wrong unlock material fails cleanly;
- delete removes the logical secret.

### E2 — Master-key model

Compare at minimum:

A. user-entered passphrase -> memory-hard KDF -> Stronghold password;
B. random master key protected by platform secure storage;
C. random master key gated/unwrapped by platform biometric capability where available.

Reject any design that uses a compiled/default/static password.

Output:
- threat assumptions;
- bootstrap/unlock flow;
- restart behavior;
- lost-key behavior;
- recovery semantics.

### E3 — Android runtime

On emulator:
- create/open vault;
- write/read canary;
- kill process and restart;
- unlock/read again;
- verify logs do not expose secret;
- verify app storage location/lifecycle.

On physical device:
- repeat core flow before S002 can be closed.

### E4 — Biometric capability

Validate whether biometrics can gate access to the selected master-key strategy on Android without making biometric availability a prerequisite for all users.

Record:
- enrollment unavailable;
- authentication success/failure/cancel;
- device credential fallback policy;
- whether biometric state changes invalidate wrapped key material.

### E5 — Reinstall / recovery

Document and validate what is lost on uninstall/reinstall for the chosen vault/key placement.

The default acceptable MVP outcome is explicit credential re-entry after reinstall unless a separate recovery/export mechanism is intentionally designed and reviewed.

## Exit criteria

S002 can be marked complete only when:

- `SecretStore` contract is defined and tested;
- selected backend is proven on desktop and Android runtime;
- master-key bootstrap/unlock is not static or renderer-owned;
- restart persistence is demonstrated;
- wrong-key/corrupt/missing states are recoverable and tested;
- biometric behavior is either integrated with evidence or explicitly classified as optional/future;
- uninstall/reinstall behavior is verified and documented;
- at least one physical-device evidence record exists;
- no secret leakage appears in expected renderer/native logs or persisted non-secret state.

Until then, Stronghold remains a candidate implementation, not the architecture decision.
