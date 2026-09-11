# Feature Specification: Project + Agent + GitHub MVP

**Feature Branch**: `feat/mvp-foundation`  
**Status**: In progress  
**Priority**: MVP #1

## Why

The current mobile development workflow is fragmented across an AI chat and GitHub. Daily Cockpit must collapse that context switching into one project-centric operating surface while keeping local files and Git as canonical sources of truth.

## User scenarios

### P1 — Open a project and understand its state

As a developer, I open Daily Cockpit and immediately see the active repository, branch, workspace state and active specification so I do not have to restate project context in every AI conversation.

**Acceptance**
- Project identity and branch are always visible.
- Workspace/Git state is represented independently from AI state.
- The interface works on desktop and a narrow Android-sized viewport.

### P1 — Ask the project-aware agent

As a developer, I ask a question or request a change and the agent plans explicit tool calls against the active project.

**Acceptance**
- Agent events distinguish narration from tool activity.
- Tool calls identify the capability being used.
- Read-only and mutating calls are distinguishable.
- No mutating call is executed silently.

### P1 — Review a proposed mutation

As a developer, when the agent wants to patch files or mutate Git/GitHub, I receive an approval boundary before the action.

**Acceptance**
- Patch, commit, push and merge are classified as mutations.
- The UI can present a pending mutation without executing it.
- A later implementation can attach a patch/diff to the approval without changing the agent event model.

### P1 — Work with GitHub from the project

As a developer, I can inspect project PRs and eventually create/update them without leaving Daily Cockpit.

**Acceptance**
- GitHub behavior is behind a `GitHubService` contract.
- Repository identity is part of ProjectContext.
- Authentication details are not embedded into product/domain code.

## Functional requirements

- FR-001: The system SHALL maintain a single active `ProjectContext`.
- FR-002: The system SHALL expose workspace, Git, GitHub and agent capabilities through explicit contracts.
- FR-003: The system SHALL classify agent tool calls as read-only or mutating.
- FR-004: The system SHALL require approval for workspace patch, commit, push and merge mutations.
- FR-005: The application shell SHALL support desktop and narrow mobile layouts from the same React codebase.
- FR-006: The system SHALL keep code, Git and Markdown canonical; AI state is derived context.
- FR-007: The application SHALL be able to run without a hosted application backend for the local core workflow.

## Non-goals for this feature

- Full IDE/editor parity with VS Code.
- Calendar, generic notes, formatter utilities or unrelated productivity modules.
- Autonomous unreviewed repository mutation.
- Perfect desktop/Android filesystem parity before the storage spike.

## Success criteria

- SC-001: A fresh user can identify project, branch, spec and agent state from the first screen.
- SC-002: The same renderer is usable at >= 1280px and <= 430px widths.
- SC-003: Every mutation represented by the initial tool model routes through an approval-required state.
- SC-004: Native implementations can replace demo adapters without changing the UI/domain contracts.
