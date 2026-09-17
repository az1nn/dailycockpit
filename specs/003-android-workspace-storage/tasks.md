# Tasks: Android Workspace Storage

## Phase 1 — Specify / plan / analyze

- [x] T001 Verify PR #2 merge and derive the feature branch from updated `master`.
- [x] T002 Create independent Spec Kit 003 for Android workspace storage.
- [x] T003 Re-evaluate S001 candidates against current Android/Tauri evidence.
- [x] T004 Select hybrid SAF source + app-owned working copy as the implementation hypothesis.
- [ ] T005 Update S001 with implementation evidence and final status.

## Phase 2 — Cross-platform workspace representation

- [ ] T010 Extend workspace metadata with explicit representation/source/access state.
- [ ] T011 Preserve existing desktop path behavior without interpreting Android source URIs as paths.
- [ ] T012 Add contract tests/type coverage for the new metadata shape.

## Phase 3 — Android SAF source adapter

- [ ] T020 Add a narrow Tauri Android native bridge for `ACTION_OPEN_DOCUMENT_TREE`.
- [ ] T021 Capture and persist read/write URI grant flags with `takePersistableUriPermission`.
- [ ] T022 Add source-access inspection/recovery state.
- [ ] T023 Ensure no broad storage permission or generic intent/filesystem API is exposed.

## Phase 4 — App-owned materialization

- [ ] T030 Create an app-owned working directory for the selected source.
- [ ] T031 Recursively materialize supported document-tree entries with bounded streaming.
- [ ] T032 Validate relative paths before writing into the working copy.
- [ ] T033 Preserve `.git` for native Git while hiding it from normal workspace listing.
- [ ] T034 Define explicit refresh/rematerialization behavior; do not add implicit bidirectional sync.

## Phase 5 — WorkspaceService / ProjectContext integration

- [ ] T040 Route Android open/import through `WorkspaceService`.
- [ ] T041 Restore the active source/working-copy relationship after app restart.
- [ ] T042 List real files through `WorkspaceService` on Android.
- [ ] T043 Read real UTF-8 files through `WorkspaceService` on Android.
- [ ] T044 Surface permission-lost/source-missing/materialization errors as product states.

## Phase 6 — Git viability

- [ ] T050 Validate Android build support for the current `git2` configuration.
- [ ] T051 Validate Git repository detection/status/diff against a materialized repository.
- [ ] T052 If blocked, capture reproducible evidence and keep the Git engine decision reversible behind `GitService`.
- [ ] T053 Keep commit/push/merge/reset/patch application unavailable.

## Phase 7 — Lifecycle validation

- [ ] T060 Validate persisted access after app restart.
- [ ] T061 Validate/document behavior after device reboot.
- [ ] T062 Document uninstall/reinstall recovery and confirm app-owned data loss is intentional.
- [ ] T063 Validate source grant revocation or missing-source recovery.

## Phase 8 — Gates / convergence

- [ ] T070 Keep renderer typecheck/build green.
- [ ] T071 Keep Rust unit/integration tests green.
- [ ] T072 Add/execute Android build and emulator validation.
- [ ] T073 Record at least one physical-device validation.
- [ ] T074 Produce `convergence.md` against spec/plan/tasks.
- [ ] T075 Mark S001 complete only when emulator/device and lifecycle evidence satisfy the exit criteria.
- [ ] T076 Promote the PR from draft/implementation state only after all mandatory evidence gates are closed.
