# Daily Cockpit Architecture Baseline

## Product boundary

Daily Cockpit is not a collection of embedded ChatGPT/GitHub webviews. It is a project operating surface that integrates model and repository capabilities through explicit adapters.

## Core model

```text
ProjectContext
  |-- WorkspaceService
  |-- GitService
  |-- GitHubService
  `-- AgentRuntime
```

`ProjectContext` gives every interaction a stable repository/spec/branch identity. The agent receives context through tools rather than unrestricted filesystem access.

## Canonical vs derived

Canonical:
- repository files
- Markdown specs/docs
- Git history and refs

Derived:
- future SQLite/search index
- AI conversation state
- embeddings/context summaries
- cached GitHub metadata

Derived state must be disposable and reconstructable.

## Trust boundary

Read-only tools may run without a confirmation dialog. Mutation tools are explicit operations and require approval. The initial protected set is:

```text
workspace.patch
git.commit
git.push
github.pr.create/update
github.pr.merge
```

Future policy automation may reduce prompts only through an explicit spec; the runtime must not infer blanket write permission from conversation tone.

## Platform adapters

Desktop and Android share contracts, not necessarily implementation details. Tauri/Rust owns native boundaries for filesystem, Git and secrets. Android-specific behavior is validated via spikes before being declared equivalent to desktop.

## MVP sequencing

The MVP path is intentionally narrow: project context -> agent -> Git/GitHub -> reviewed mutations. Calendar, generic notes and developer utilities are deferred until this loop works end-to-end.
