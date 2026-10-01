# Implementation Plan: Secret Store / S002

## Technical context

- Native shell: Tauri 2.x
- Current app boundary style: typed renderer/domain ports backed by narrow Rust/Tauri capabilities
- Current Tauri dependency: 2.11.x
- Secret architecture boundary: `SecretStore`
- First backend candidate: official Tauri Stronghold plugin
- Current upstream release observed 2026-09-30: Stronghold 2.4.0
- Mobile status: upstream plugin matrix still marks Stronghold Android/iOS as `?`, therefore runtime evidence is mandatory

## Constitution / architecture check

- Local-first: PASS — secrets stay local unless explicitly used with a configured provider.
- Markdown canonical: PASS — secrets are deliberately outside Workspace Markdown.
- SQLite derived only: PASS — SQLite must not become a credential store.
- Ports before implementations: PASS — application code consumes `SecretStore`.
- Mobile-first, not mobile-identical: PASS — unlock/key protection may differ by platform.
- Proposed / Requires Spike: PASS — Stronghold remains a candidate until S002 exits.

## Contract

Define a narrow capability similar to:

```text
SecretStore
  status() -> locked | unlocked | unavailable | corrupt
  unlock(context)
  has(secretId)
  read(secretId)
  write(secretId, secret)
  delete(secretId)
  lock()
```

The exact transport shape may differ between Rust and TypeScript, but backend-specific objects, arbitrary vault paths and generic Stronghold primitives must not escape the native adapter.

## Backend hypothesis

Start with Stronghold because it is an official Tauri encrypted secret database, but validate rather than assume mobile viability.

Stronghold snapshot encryption still requires a password/key input. The central S002 decision is therefore not "Stronghold yes/no" alone; it is the complete key hierarchy:

```text
user/platform unlock factor
        ↓
master-key bootstrap / unwrap
        ↓
Stronghold snapshot password
        ↓
encrypted credential records
```

A hard-coded or renderer-stored password fails S002.

## Candidate key strategies

### A — User passphrase + KDF

Pros:
- portable;
- no hidden dependency on platform key APIs;
- deterministic recovery story if user remembers passphrase.

Questions:
- UX cost;
- KDF parameters and salt placement;
- whether every launch requires manual unlock.

### B — Random master key + platform secure storage

Pros:
- low-friction normal restart;
- can leverage Android Keystore / desktop credential facilities.

Questions:
- cross-platform abstraction;
- reinstall/key-loss semantics;
- migration and backup expectations.

### C — Platform-protected key + biometric gate

Pros:
- strong mobile UX when available.

Questions:
- biometric authentication is not itself a persistence backend;
- enrollment changes, fallback credentials and hardware support;
- desktop parity must not be fabricated.

S002 may select different protection adapters per platform while keeping one `SecretStore` product boundary.

## Delivery sequence

1. Add S002 spike record and Spec Kit 004.
2. Add the backend-neutral `SecretStore` contract and redacted error model.
3. Integrate Stronghold only behind that contract.
4. Add deterministic host tests for create/read/replace/delete, wrong-key and corrupt/missing-state behavior where feasible.
5. Prove desktop restart persistence.
6. Add Android build/runtime probe.
7. Validate Android process-kill/restart persistence on emulator.
8. Probe biometric gating separately from storage.
9. Record uninstall/reinstall semantics.
10. Run the core lifecycle on a physical Android device.
11. Compare evidence and either accept Stronghold + selected key strategy, keep the abstraction and replace the backend, or narrow platform support explicitly.
12. Run convergence and close S002 only after all mandatory evidence gates pass.

## Test strategy

### Unit / host
- contract state transitions;
- logical secret identifiers;
- redaction;
- replace/delete semantics;
- wrong unlock material;
- missing/corrupt vault handling where reproducible.

### Desktop native
- create -> save -> terminate -> restart -> unlock -> read;
- log scan for canary value.

### Android emulator
- build/install/start;
- create/read canary;
- force-stop/process death;
- restart/unlock/read;
- wrong unlock;
- logcat scan;
- biometric capability probe when emulator supports it.

### Physical Android
- repeat core lifecycle;
- record device/OS;
- record biometric availability/result;
- validate reinstall/re-entry behavior before S002 closure.

## Non-goals for this wave

- Provider HTTP calls.
- OAuth.
- GitHub credentials.
- Cloud backup/sync.
- Secret migration from a previous production format.
