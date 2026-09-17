# Tasks: Native Project Context

## Phase 1 — Specify / plan / analyze

- [x] T001 Define the native-project-context user scenarios and acceptance criteria.
- [x] T002 Define the desktop-first native boundary and Android non-parity constraint.
- [x] T003 Analyze the feature against the project constitution and mutation invariants.
- [x] T004 Record initial Git engine decision in ADR-0002.

## Phase 2 — Native workspace

- [x] T010 Add official Tauri dialog plugin with open-only capability.
- [x] T011 Implement canonical workspace open/validate metadata command.
- [x] T012 Implement scoped root listing and text reads with escape protection.

## Phase 3 — Native Git

- [x] T020 Add the `git2` read-only dependency without network features.
- [x] T021 Implement branch/status/changed-path/origin inspection.
- [x] T022 Implement patch-style working-tree diff.

## Phase 4 — Renderer adapters and product state

- [x] T030 Add Tauri `WorkspaceService` / `GitService` adapters.
- [x] T031 Replace demo project fixture with runtime project state.
- [x] T032 Add native open/refresh/error/non-Git UI states.
- [x] T033 Render real project entries and real Git diff.
- [x] T034 Keep agent mutations and native Git mutations unavailable.

## Phase 5 — Validation / converge

- [x] T040 Add Rust unit and integration tests for workspace scoping and Git reads.
- [x] T041 Add a native CI job alongside renderer gates.
- [x] T042 Run renderer typecheck/build on the implementation HEAD.
- [x] T043 Run native tests on the implementation HEAD.
- [x] T044 Produce convergence evidence and leave Android S001 explicit for the next wave.
