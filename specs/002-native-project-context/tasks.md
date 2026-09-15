# Tasks: Native Project Context

## Phase 1 — Specify / plan / analyze

- [x] T001 Define the native-project-context user scenarios and acceptance criteria.
- [x] T002 Define the desktop-first native boundary and Android non-parity constraint.
- [x] T003 Analyze the feature against the project constitution and mutation invariants.
- [x] T004 Record initial Git engine decision in ADR-0002.

## Phase 2 — Native workspace

- [ ] T010 Add official Tauri dialog plugin with open-only capability.
- [ ] T011 Implement canonical workspace open/validate metadata command.
- [ ] T012 Implement scoped root listing and text reads with escape protection.

## Phase 3 — Native Git

- [ ] T020 Add the `git2` read-only dependency without network features.
- [ ] T021 Implement branch/status/changed-path/origin inspection.
- [ ] T022 Implement patch-style working-tree diff.

## Phase 4 — Renderer adapters and product state

- [ ] T030 Add Tauri `WorkspaceService` / `GitService` adapters.
- [ ] T031 Replace demo project fixture with runtime project state.
- [ ] T032 Add native open/refresh/error/non-Git UI states.
- [ ] T033 Render real project entries and real Git diff.
- [ ] T034 Keep agent mutations and native Git mutations unavailable.

## Phase 5 — Validation / converge

- [ ] T040 Add Rust tests for workspace scoping and Git reads.
- [ ] T041 Add a native CI job alongside renderer gates.
- [ ] T042 Run renderer typecheck/build on the implementation HEAD.
- [ ] T043 Run native tests on the implementation HEAD.
- [ ] T044 Produce convergence evidence and leave Android S001 explicit for the next wave.
