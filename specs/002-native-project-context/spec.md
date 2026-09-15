# Feature Specification: Native Project Context

**Feature Branch**: `feat/native-project-context`  
**Status**: Ready for implementation  
**Priority**: MVP #1 / Wave 2

## Why

The foundation shell still uses demonstrative project state. Daily Cockpit only becomes a useful project operating surface when a developer can open a real local workspace and see filesystem and Git state produced by the native Tauri boundary.

## User scenarios

### P1 — Open a real local project

As a developer on desktop, I choose a local project directory and Daily Cockpit establishes that directory as the active `ProjectContext`.

**Acceptance**
- Directory selection uses a native desktop picker.
- The selected directory is canonicalized and validated natively.
- Project name and workspace root come from the selected directory, not fixtures.
- Opening a non-Git directory is allowed and represented explicitly.

### P1 — Understand real Git state

As a developer, after opening a Git repository I can see its current branch, clean/dirty state, changed paths and working-tree diff without leaving Daily Cockpit.

**Acceptance**
- Branch/status/diff are obtained through the native `GitService` adapter.
- Git inspection does not invoke an unrestricted shell command from the renderer.
- Staged, unstaged and untracked working-tree changes are represented by the native read path.
- A clean repository produces an empty diff and a clean state.

### P1 — Read workspace files safely

As a developer, I can inspect files from the selected workspace while the native boundary prevents reads that escape the project root.

**Acceptance**
- Root-level entries can be listed from the active workspace.
- Text reads resolve relative to the canonical workspace root.
- Path traversal and symlink escapes outside the root are rejected.
- `.git` internals are not surfaced as normal project files.

### P1 — Fail closed without inventing mobile parity

As a developer, filesystem/Git errors are visible product states rather than silent fallbacks to demo data.

**Acceptance**
- Native errors are shown to the user.
- No workspace or Git mutation is introduced in this slice.
- Android directory-selection parity is not claimed; it remains a dedicated storage spike.

## Functional requirements

- FR-001: The system SHALL replace the fixture-backed active project with runtime project state after a workspace is opened.
- FR-002: The renderer SHALL access native filesystem and Git operations only through capability adapters.
- FR-003: The native workspace boundary SHALL canonicalize the project root before reading entries or files.
- FR-004: The native workspace boundary SHALL reject text reads outside the active root.
- FR-005: The native Git boundary SHALL report branch, clean/dirty state, changed paths and origin URL when present.
- FR-006: The native Git boundary SHALL return a patch-style diff for current working-tree changes.
- FR-007: Git inspection SHALL remain read-only; commit, push, checkout, merge and patch application remain unavailable.
- FR-008: The desktop directory picker SHALL be permission-scoped to open only.
- FR-009: The UI SHALL represent empty, loading, non-Git, clean, dirty and error states.

## Non-goals

- Android workspace storage implementation.
- SecretStore, OpenAI BYOK or a provider-backed agent runtime.
- GitHub authentication or PR reads.
- Any Git/workspace mutation.
- Workspace persistence across application restarts.

## Success criteria

- SC-001: A desktop user can open an arbitrary local Git repository and see its actual branch and status.
- SC-002: Modifying a tracked file is reflected in changed paths and the Changes view diff.
- SC-003: Opening a non-Git directory keeps the project usable and labels Git as unavailable.
- SC-004: Attempts to read outside the workspace root fail at the Rust boundary.
- SC-005: Renderer typecheck/build and native Rust tests pass on the feature HEAD.
