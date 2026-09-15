# Implementation Plan: Project + Agent + GitHub MVP

## Technical context

- Renderer: React 19 + TypeScript + Vite 8
- Application shell: Tauri 2
- Targets: desktop first for native validation, Android as primary mobile target
- Canonical data: local workspace files, Markdown and Git
- AI: provider adapter/BYOK in a later slice of this feature
- Git: native `GitService` adapter; engine choice remains spike-driven
- GitHub: provider adapter with scoped authentication
- Secrets: `SecretStore` abstraction; implementation remains spike-driven

Current dependency versions are pinned in `package.json` / `src-tauri/Cargo.toml` so Foundation is reproducible.

## Constitution check

- Project-centric context: PASS
- Local-first canonical sources: PASS
- Explicit mutation boundary: PASS
- Ports/adapters boundary: PASS
- Mobile-first semantics: PASS; native parity still requires spikes
- Reversible AI actions: PASS at event/contract level

## Architecture

```text
React UI
  |
  +-- ProjectContext
  |
  +-- AgentRuntime -------- AI Provider (next slice)
  |       |
  |       +-- WorkspaceService -- native adapter
  |       +-- GitService ------- native adapter
  |       `-- GitHubService ---- remote adapter
  |
Tauri 2 boundary
  +-- filesystem / storage
  +-- Git engine
  `-- SecretStore
```

## Delivery slices

1. **Foundation** — responsive product shell, ProjectContext, capability contracts, demo AgentRuntime, Spec Kit constitution and CI.
2. **Native project context** — workspace selection/storage spike and real Git status/diff behind adapters.
3. **SecretStore + AI provider** — BYOK, streaming agent loop and structured tool planning.
4. **GitHub read path** — authentication, repository metadata, PR list/detail/checks.
5. **Patch workflow** — inspectable patch generation, diff review and explicit approval/apply.
6. **Git/GitHub mutations** — commit, push and PR operations with confirmation and audit events.
7. **Android hardening** — emulator/device smoke tests, lifecycle/storage/auth validation.

## Design constraints

- UI imports capability interfaces, not Rust/native implementations.
- No API key is stored in local Markdown, frontend state persistence or logs.
- The AgentRuntime cannot bypass the mutation approval model.
- Web support may use reduced adapters; it does not define the native capability baseline.
