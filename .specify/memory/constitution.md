# Daily Cockpit Constitution

## I. Project is the unit of interaction

The product is organized around an active project, not around a generic chat. Workspace, specs, Git, GitHub and AI context must resolve through that project.

## II. Local-first canonical data

Code, Git and Markdown are canonical. Search indexes, caches, model context and future SQLite data are derived and replaceable. The app must not require a backend for the core local workflow.

## III. Explicit mutation boundary

Read-only capabilities may execute autonomously when safe. Workspace patches, commits, pushes, PR creation/updates, merges and other external mutations require a visible review/approval boundary unless a later spec introduces an explicit trusted policy.

## IV. Ports before platform implementations

WorkspaceService, GitService, GitHubService, SecretStore and AgentRuntime are contracts. Desktop, Android and web adapters may differ without leaking platform-specific behavior into product logic.

## V. Spec-driven delivery

Every meaningful feature starts from WHAT/WHY in `spec.md`, then implementation details belong in `plan.md`, actionable work in `tasks.md`, followed by analyze -> implement -> converge. Architecture decisions with cross-feature impact are recorded as ADRs.

## VI. Mobile-first, not mobile-identical

Android is a primary interaction surface. Desktop and Android should share product semantics, but capability parity must be proven. Filesystem, Git, secrets and OAuth behavior may require platform-specific adapters and spikes.

## VII. Reversible AI actions

AI-generated changes are represented as inspectable operations or patches before mutation. The user must be able to understand what capability is being used and what will change.

## Quality gates

- TypeScript strict mode for renderer code.
- No direct platform API use from domain/UI when a capability contract exists.
- No secret in repository, Markdown workspace, logs or model-visible context by default.
- New mutation tools declare their mutation semantics and approval behavior.
- Specs and implementation must converge before a feature is considered complete.
