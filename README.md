# Daily Cockpit

Daily Cockpit is a project-centric, local-first AI development cockpit for Android and desktop.

The MVP #1 replaces the daily context switch between an AI chat and GitHub with one workspace where the active project, specs, Git state, GitHub state and agent tools share the same context.

## MVP #1

- Project-centric workspace shell
- AI/agent panel with explicit tool events
- Workspace, Git and GitHub capability contracts
- Mutation approval boundary before patches, commits, pushes or merges
- Spec Kit as the development workflow
- React + Vite renderer
- Tauri 2 application shell for desktop and Android

## Architecture

```text
Project
  |-- Markdown / Specs
  |-- Workspace
  |-- Git
  |-- GitHub
  `-- Agent Runtime
        |-- read tools
        `-- mutation tools -> explicit approval
```

Markdown, Git and code remain canonical. Derived indexes and AI context never become the source of truth.

See [`docs/architecture.md`](docs/architecture.md) and [`specs/001-project-agent-github-mvp/`](specs/001-project-agent-github-mvp/).

## Development

Requirements: Node.js, Rust and the Tauri platform prerequisites.

```bash
npm install
npm run dev
```

Desktop Tauri:

```bash
npm run tauri -- dev
```

Android bootstrap (once per checkout/environment):

```bash
npm run tauri -- android init
npm run tauri -- android dev
```

## Current status

This first implementation establishes the product shell and capability boundaries. Native workspace/Git, SecretStore/OpenAI and GitHub authentication are the next vertical slices tracked by the Spec Kit tasks.
