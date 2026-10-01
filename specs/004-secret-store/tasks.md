# Tasks: Secret Store / S002

## Phase 1 — Specify / evidence

- [x] T001 Reconcile S001 status and confirm S002 can advance as an independent workstream.
- [x] T002 Create `feat/secret-store-s002` from canonical `master` HEAD `492d20f33d11626d68fd0af512be444c301f56dc`.
- [x] T003 Create S002 spike record and Spec Kit 004.
- [x] T004 Re-check current Tauri Stronghold release/support evidence.
- [ ] T005 Run Spec Kit analysis and close documentation inconsistencies before implementation.

## Phase 2 — SecretStore boundary

- [ ] T010 Define backend-neutral `SecretStore` contract.
- [ ] T011 Define redacted error/state model: locked, unlocked, unavailable, missing, corrupt.
- [ ] T012 Add contract/unit tests.
- [ ] T013 Prove no secret persistence in Workspace/SQLite/browser storage/log fixtures.

## Phase 3 — Stronghold candidate

- [ ] T020 Add official Stronghold candidate behind `SecretStore`.
- [ ] T021 Implement logical create/read/replace/delete.
- [ ] T022 Implement explicit lock/unlock lifecycle.
- [ ] T023 Reject static/default/compiled vault passwords.
- [ ] T024 Add wrong-key and missing/corrupt-vault tests.

## Phase 4 — Master-key strategy

- [ ] T030 Implement the smallest testable passphrase/KDF strategy.
- [ ] T031 Evaluate random platform-protected master key.
- [ ] T032 Evaluate biometric gating as a separate capability.
- [ ] T033 Record selected strategy and rejected alternatives with evidence.

## Phase 5 — Runtime validation

- [ ] T040 Prove desktop create/save/restart/unlock/read.
- [ ] T041 Scan desktop logs/persisted non-secret state for canary leakage.
- [ ] T042 Build and run Stronghold path on Android emulator.
- [ ] T043 Prove Android process-kill/restart/unlock/read.
- [ ] T044 Exercise wrong unlock and unavailable/corrupt recovery on Android.
- [ ] T045 Probe biometric success/failure/cancel/fallback behavior.
- [ ] T046 Record uninstall/reinstall and credential re-entry behavior.
- [ ] T047 Record at least one physical-device core lifecycle.

## Phase 6 — Decision / convergence

- [ ] T050 Compare Stronghold evidence against required `SecretStore` behavior.
- [ ] T051 Accept backend/key strategy, replace backend, or explicitly narrow support.
- [ ] T052 Record ADR only after S002 evidence supports a durable decision.
- [ ] T053 Produce `convergence.md`.
- [ ] T054 Mark S002 complete only when desktop + Android + key-lifecycle gates are satisfied.
