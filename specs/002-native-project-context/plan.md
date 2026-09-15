# Implementation Plan: Native Project Context

## Technical context

- Renderer: React 19.3 + TypeScript 7 + Vite 8.3
- Native shell: Tauri 2.11
- Desktop directory selection: official `@tauri-apps/plugin-dialog` / `tauri-plugin-dialog`
- Native Git read engine for this slice: `git2` 0.21.x with default network features disabled
- Canonical state: selected workspace + Git repository
- Runtime boundary: Tauri commands behind TypeScript `WorkspaceService` / `GitService` adapters

## Evidence incorporated before implementation

- Tauri commands are the supported request/response primitive for calling Rust from the renderer and are registered through one `invoke_handler`.
- The official dialog plugin returns filesystem paths on desktop, but its folder picker is not supported on Android. Therefore desktop selection is implemented here and Android workspace storage remains S001.
- `git2` 0.21 exposes direct `Repository`, status and diff APIs through libgit2. `gix` remains architecturally viable and is compared in ADR-0002; the port prevents engine lock-in.

## Constitution check

- Project is unit of interaction: PASS — native state populates the active ProjectContext.
- Local-first canonical data: PASS — no hosted backend or derived copy is introduced.
- Explicit mutation boundary: PASS — this slice is read-only and mutation methods remain unavailable.
- Ports before implementations: PASS — renderer imports adapters through existing contracts, not Rust internals.
- Spec-driven delivery: PASS — 002 is independent of the foundation feature history.
- Mobile-first, not mobile-identical: PASS — Android folder picking is explicitly not treated as desktop-equivalent.
- Reversible AI actions: N/A — no AI mutation is introduced.

## Architecture

```text
React UI
  |
  +-- ProjectContext (runtime state)
  |
  +-- WorkspaceService ----------------+
  |                                     |
  +-- GitService -----------------------+--> Tauri invoke
                                        |
                                        +-- project.rs
                                            |-- scoped filesystem reads
                                            `-- git2 read adapter
```

The renderer never receives a generic shell capability. Native commands are narrow and typed around the product ports.

## Native commands

```text
open_workspace(path)
list_workspace_entries(root, relative?)
read_workspace_text(root, path)
git_status(root)
git_diff(root)
```

All commands are reads. Future write commands require a separate reviewed-mutation feature and approval token lifecycle.

## Delivery sequence

1. Add Spec Kit 002 and run consistency analysis.
2. Add narrowly scoped desktop directory-picker capability.
3. Implement canonical workspace validation/list/read commands.
4. Implement `git2` status/diff commands.
5. Add TypeScript native adapters.
6. Replace fixture project state with runtime state in the cockpit.
7. Add Rust tests and native CI gate.
8. Converge code against spec/plan/tasks and record residual gaps.

## Android boundary

The official Tauri dialog plugin documents that Android does not support the folder picker. This feature therefore must not use a successful desktop picker as evidence of Android filesystem parity. S001 will evaluate Android Storage Access Framework/content-URI or an app-managed workspace model separately.
