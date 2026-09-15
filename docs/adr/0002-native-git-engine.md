# ADR 0002: Use git2 for the initial native Git read adapter

- Status: Accepted for desktop read slice; Android re-evaluation required
- Date: 2026-09-15

## Context

Daily Cockpit needs real local Git status/diff without giving the renderer shell access. The architecture already defines `GitService` as the boundary, so the native engine is replaceable.

The practical candidates for the first native adapter are `git2` (libgit2 bindings), `gix` (pure-Rust Git implementation) and invoking the Git CLI.

## Evidence

- Current `git2` documentation exposes `Repository` plus direct status/diff primitives and the current crate line is 0.21.x.
- Current `gix` documentation exposes a broader pure-Rust repository abstraction and a trust model; the current crate line is 0.87.x.
- A Git CLI adapter would require subprocess authority and an installed executable, which is undesirable for the product boundary and is especially weak as a future Android foundation.

## Decision

Use `git2` for the first read-only native adapter and compile it without default network features. The adapter implements only repository open, branch/origin inspection, status and diff.

`git2` is not exposed above the Tauri/native layer. `GitService` remains the product contract.

## Why this slice chooses git2

- The required status/diff API is small and direct.
- It avoids renderer shell access and does not depend on an external Git executable.
- It lets Wave 2 prove the product contract with minimal engine-specific code.
- Keeping network features disabled matches the read-only local scope and limits unnecessary surface area.

## Why gix is not rejected

`gix` is attractive for a local-first cross-platform product because it is Rust-native and includes an explicit repository trust model. It may become preferable for Android, binary/toolchain constraints or later Git operations. This ADR therefore deliberately scopes the decision to the desktop read path.

Before Android hardening or mutation support, compare at least:

- Android cross-compilation reliability
- binary-size impact
- build complexity
- status/diff behavioral parity on representative repositories
- credential/network needs for future fetch/push

## Consequences

- Native status/diff can ship now behind the existing port.
- No shell execution capability is introduced.
- The application acquires a libgit2-based native dependency.
- Android must not be declared solved by this decision; the engine remains replaceable at `GitService`.
