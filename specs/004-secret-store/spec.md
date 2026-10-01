# Feature Specification: Secret Store

**Feature Branch**: `feat/secret-store-s002`  
**Status**: Proposed — S002 evidence gathering  
**Priority**: Foundation / prerequisite for BYOK

## Why

Daily Cockpit needs to accept provider credentials without turning Workspace files, derived indexes, renderer storage, logs, source code or model-visible context into a secret database. The product requires one stable `SecretStore` capability whose lifecycle is understandable on desktop and Android before AI-provider work depends on it.

## User scenarios

### P1 — Save a provider credential safely

As a user, I can save a credential for a configured provider and Daily Cockpit persists it using the platform secret-storage boundary rather than plaintext application state.

**Acceptance**
- Secret values are not stored in Workspace Markdown or SQLite.
- Secret values are not persisted in browser/local storage.
- The stored credential is addressed through an opaque logical identifier.
- The product reports success/failure without echoing the secret.

### P1 — Reopen and unlock after restart

As a user, after restarting the application I can regain access to previously saved credentials through the selected unlock model.

**Acceptance**
- Restart behavior is deterministic and documented.
- Incorrect unlock material does not expose or destroy valid secrets.
- Locked/unavailable states are explicit.

### P1 — Replace or delete a credential

As a user, I can rotate or remove a credential without leaving the previous logical value available to normal product reads.

**Acceptance**
- Replace updates the logical credential atomically from the product perspective.
- Delete makes the logical credential unavailable.
- Errors do not print secret values.

### P1 — Recover from unavailable secret storage

As a user, if the vault, unlock material, permission, biometric state or installation lifecycle makes a secret unavailable, Daily Cockpit tells me what happened and lets me re-enter credentials where recovery is possible.

**Acceptance**
- Missing, locked, corrupt and unavailable states are distinct enough to drive recovery UI.
- Uninstall/reinstall semantics are documented.
- The application never silently falls back to plaintext storage.

## Functional requirements

- FR-001: The application SHALL expose secret persistence through a `SecretStore` boundary independent of the selected backend.
- FR-002: Provider credentials SHALL NOT be persisted in Workspace Markdown, SQLite, localStorage, logs, fixtures or source-controlled configuration.
- FR-003: The secret backend SHALL encrypt persisted secret material at rest.
- FR-004: The application SHALL NOT rely on a compiled, default or static vault password/master key.
- FR-005: The system SHALL define explicit locked, unlocked, missing, corrupt and unavailable secret-store states.
- FR-006: The system SHALL support create/read/replace/delete for opaque credential records.
- FR-007: Secret-store errors SHALL be redacted and SHALL NOT include secret values.
- FR-008: Restart persistence and unlock SHALL be validated on supported desktop runtime and Android.
- FR-009: Android validation SHALL include emulator evidence and at least one physical-device evidence record before S002 is complete.
- FR-010: Biometric behavior SHALL be evaluated separately from encrypted persistence and classified as required, optional or deferred with evidence.
- FR-011: Uninstall/reinstall behavior and credential recovery/re-entry SHALL be explicit.
- FR-012: Consumers SHALL depend on `SecretStore`, not directly on Stronghold or another backend-specific API.
- FR-013: Provider credentials SHALL NOT enter model-visible prompt/context data by default; transport authentication and model context are separate channels.

## Non-goals

- OpenAI/provider request execution.
- OAuth tokens or GitHub remote authentication.
- Cloud secret synchronization.
- Cross-device credential backup.
- Automatic secret export.
- Choosing Stronghold as final architecture without S002 evidence.

## Success criteria

- SC-001: A canary secret can be stored, the app restarted, the store unlocked and the same canary read without plaintext persistence outside the secret backend.
- SC-002: Wrong unlock material fails without exposing the stored secret.
- SC-003: Replace/delete operations behave deterministically and remain redacted in logs.
- SC-004: Android emulator runtime proves create/read/restart/unlock for the selected backend.
- SC-005: At least one physical-device run records the same core lifecycle.
- SC-006: The selected master-key model has explicit bootstrap, restart, loss and recovery semantics.
- SC-007: Validation shows the canary secret does not appear in model-visible context or normal telemetry/log output.
