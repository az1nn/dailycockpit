# Tasks: Project + Agent + GitHub MVP

## Phase 1 — Foundation

- [x] T001 Bootstrap React + TypeScript + Vite application shell.
- [x] T002 Add minimal Tauri 2 desktop/mobile-ready shell under `src-tauri/`.
- [x] T003 Define `ProjectContext` in `src/domain/project.ts`.
- [x] T004 Define Workspace/Git/GitHub/Agent capability contracts in `src/platform/contracts.ts`.
- [x] T005 Implement responsive desktop/Android-sized cockpit UI in `src/App.tsx` and `src/styles.css`.
- [x] T006 Implement demo agent event stream and mutation-approval state in `src/agent/demoRuntime.ts`.
- [x] T007 Establish project constitution in `.specify/memory/constitution.md`.
- [x] T008 Add renderer typecheck/build CI.

## Phase 2 — Native project context

- [ ] T020 Run S001 Android Workspace Storage spike and document results.
- [ ] T021 Implement native `WorkspaceService` adapter.
- [ ] T022 Run S003 Native Git Engine spike (`git2` vs `gix`) and record ADR.
- [ ] T023 Implement real `GitService.status()` and `GitService.diff()`.
- [ ] T024 Replace demo project state with native project discovery.

## Phase 3 — SecretStore + AI

- [ ] T030 Run S002 Secret Store spike across restart/reinstall/Android lifecycle.
- [ ] T031 Implement `SecretStore` interface and selected native adapter.
- [ ] T032 Add OpenAI BYOK configuration without exposing the key to workspace/model context.
- [ ] T033 Replace demo runtime with streaming provider-backed `AgentRuntime`.
- [ ] T034 Add structured read-only tools for workspace and Git context.

## Phase 4 — GitHub

- [ ] T040 Run S004 OAuth callback/authentication spike for desktop and Android.
- [ ] T041 Implement GitHub authentication adapter.
- [ ] T042 Implement PR list/detail/check status read path.
- [ ] T043 Connect GitHub project state to the cockpit UI.

## Phase 5 — Reviewed mutations

- [ ] T050 Generate inspectable workspace patches without applying them.
- [ ] T051 Build diff review surface and approval token lifecycle.
- [ ] T052 Apply approved patches through `WorkspaceService`.
- [ ] T053 Implement approved Git commit/push.
- [ ] T054 Implement approved GitHub PR creation/update/merge.

## Phase 6 — Validation

- [ ] T060 Add unit tests for capability policy and agent event reducer.
- [ ] T061 Add renderer integration tests.
- [ ] T062 Add desktop native E2E.
- [ ] T063 Add Android emulator/device smoke tests.
- [ ] T064 Run Spec Kit analyze -> implement -> converge until converged.
