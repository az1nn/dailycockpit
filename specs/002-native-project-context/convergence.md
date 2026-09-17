# Convergence: Native Project Context

## Outcome

Spec 002 converged successfully for the desktop native-project-context slice.

The implementation replaces the fixture-backed project with runtime workspace state, routes filesystem and Git reads through narrow Tauri adapters, keeps Git inspection read-only, and preserves Android workspace storage as an explicit unresolved spike rather than claiming parity.

## Implemented evidence

- Desktop workspace selection uses the official Tauri dialog plugin with open-only capability.
- Native workspace commands canonicalize the selected root, hide `.git`, scope file reads to the active workspace and reject path/symlink escapes outside it.
- Native Git inspection uses `git2` behind `GitService`; no shell execution capability is exposed to the renderer.
- Git status reports branch, clean/dirty state, changed paths and origin URL when present.
- Git diff covers tracked modifications and untracked file content.
- The renderer constructs `ProjectContext` from runtime native metadata instead of demo project fixtures.
- Non-Git workspaces and native failures remain explicit product states.
- Mutation authority was not expanded: commit, push, checkout, merge and patch application remain unavailable.

## Validation evidence

Implementation HEAD before convergence-only documentation: `8263f9eab22181f7e9272eb61f21d3d40547c96f`.

GitHub Actions CI run `#9` (`35220198547`) completed successfully on that implementation HEAD:

- `renderer`: PASS — install, TypeScript typecheck and Vite build.
- `native`: PASS — Tauri Linux prerequisites, Rust toolchain and `cargo test --manifest-path src-tauri/Cargo.toml`.

Native coverage includes both unit tests in `project.rs` and integration coverage in `src-tauri/tests/native_project_context.rs`, exercising the public command surface against temporary filesystem and Git repositories.

The final documentation-only convergence HEAD must retain the same renderer/native CI gates before the PR leaves draft.

## Acceptance convergence

| Requirement area | Result | Evidence |
| --- | --- | --- |
| Real desktop workspace | PASS | Native picker -> canonical workspace metadata -> runtime `ProjectContext`. |
| Real Git status/diff | PASS | `git2` native adapter supplies branch/status/origin/diff, including untracked content. |
| Safe workspace reads | PASS | Canonical-root scoping, traversal rejection, symlink escape rejection, `.git` hidden. |
| Explicit non-Git/error states | PASS | Renderer keeps workspace usable without Git and surfaces native errors. |
| Read-only authority | PASS | No shell plugin or Git/workspace mutation command added. |
| Renderer validation | PASS | CI renderer job green on implementation HEAD. |
| Native validation | PASS | CI native cargo-test job green on implementation HEAD. |

## Residual boundaries

The following are deliberately not closed by Spec 002:

- Android workspace storage remains `S001 — Android Workspace Storage` and requires Storage Access Framework/content-URI or app-owned workspace experiments.
- SecretStore / BYOK provider runtime remains a later vertical slice.
- GitHub authentication and remote PR reads remain later work.
- Git/workspace mutation remains subject to a separate reviewed-mutation specification and approval lifecycle.
- Workspace persistence across restarts remains out of scope.

## Final classification

`IMPLEMENTED_AND_VERIFIED`, subject only to the final same-HEAD CI pass after this convergence documentation commit.
