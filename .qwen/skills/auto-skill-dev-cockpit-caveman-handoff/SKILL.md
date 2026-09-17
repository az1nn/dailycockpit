---
name: auto-skill-dev-cockpit-caveman-handoff
description: >-
  Produce a compact, SHA-bound, durable handoff for Dev Cockpit after material
  implementation or verification work. Reconstruct canonical state, invalidate
  stale evidence, classify completion, persist durable decisions, and emit a
  delta-only CAVEMAN HANDOFF that survives chat loss without replacing Git,
  Spec Kit, tests, CI, ADRs, or the Architecture Baseline as sources of truth.
version: 1.0.0
project: dev-cockpit
---

# Dev Cockpit Caveman Handoff

## Purpose

Use this skill to end a material Dev Cockpit work session with a handoff that a new agent/session can execute immediately without relying on conversation memory.

The handoff is **not** a project summary and **not** a replacement for canonical artifacts. It is a compressed transfer of only the state required to continue safely.

## Mandatory lifecycle

For material work, follow this lifecycle:

```text
implement
  -> verify
  -> classify
  -> promote/persist durable state
  -> caveman handoff
```

Do not generate a final handoff before verification/classification unless the session is being interrupted. In that case classify truthfully as incomplete or not verified.

## When this skill is mandatory

Run this skill after any of the following:

- a material implementation task or feature slice;
- completion of a technical spike;
- changes to architecture boundaries or invariants;
- Spec Kit stage transitions that materially alter implementation state;
- verification/test/CI work that changes confidence in completion;
- PR freeze or readiness review;
- a semantic boundary where the next work should happen in a fresh session;
- context/window pressure that risks losing operational state;
- a discovered process drift, stale PASS, or mismatch between canonical artifacts and implementation.

Do not run it for trivial edits that do not affect continuation state.

# Canonical precedence

When sources disagree, use this order:

1. Git repository state at the current HEAD.
2. Architecture Baseline and accepted ADRs.
3. Spec Kit artifacts for the active feature: `spec.md`, `plan.md`, `tasks.md`, analysis/convergence outputs when present.
4. Executable evidence: tests, CI, native smoke/integration results, build output.
5. Issue/PR state and review comments.
6. Durable project docs.
7. Previous Caveman Handoff.
8. Chat/session memory.

**Canonical state always wins over the handoff.**

# Dev Cockpit architectural invariants

The handoff must preserve these invariants unless a newer canonical decision explicitly replaces them:

- The product is local-first.
- Markdown in the Workspace is canonical user/project data.
- SQLite is a derived local index/cache and must not silently become source of truth.
- Tauri 2 is the application shell/boundary baseline.
- No mandatory application backend may be introduced casually.
- BYOK/provider credentials belong behind `SecretStore`; Stronghold is an implementation candidate, not the architecture contract until its spike is accepted.
- Git belongs behind the native `GitService` boundary; do not silently promote `isomorphic-git`, `git2-rs`, or `gix` to a final architecture decision without canonical evidence.
- OAuth is provider- and platform-aware; desktop and Android callback behavior must not be assumed equivalent.
- AI changes to canonical files should flow through explicit patch/review semantics rather than invisible mutation.
- Architecture Baseline defines framework/system constraints; feature `spec.md` remains WHAT/WHY oriented. Stack and implementation choices belong in `plan.md` and ADRs.
- A decision marked `Proposed / Requires Spike` is **not accepted architecture** until the spike evidence and resulting decision are persisted canonically.

# Required early spikes

Until canonically completed/replaced, track these spike IDs explicitly when relevant:

```text
S001 Android Workspace Storage
S002 Secret Store
S003 Native Git Engine
S004 OAuth Callbacks
```

A handoff must not mark a dependent feature VERIFIED_COMPLETE if a required unresolved spike still blocks its acceptance criteria.

# Spec Kit sequence awareness

The baseline feature sequence is:

```text
001 workspace-foundation
002 markdown-notes
003 local-index-and-search
004 command-palette
005 secret-store
006 ai-provider-core
007 ai-context
008 ai-patch-workflow
009 developer-utilities
010 git-local
011 git-remote-auth
012 markdown-tasks
013 calendar-core
014 google-calendar
```

This list is sequencing context, not permission to infer work is complete.

For an active feature, reconstruct the actual lifecycle from repository evidence. Respect the project convention that `analyze` follows `tasks` before implementation and `converge` is used after implementation to compare implementation against spec/plan/tasks and append remaining gaps.

# Verification rules

## HEAD-bound evidence

Every PASS claim must be tied to the exact Git HEAD for which it was observed.

If HEAD changes after a PASS-producing command, that evidence is stale unless the changed files are provably irrelevant to that gate. Default to rerunning the gate.

Never write:

```text
Tests: PASS
```

without enough context to establish what ran and against which HEAD.

Prefer:

```text
HEAD: abc1234
unit: PASS — pnpm test
renderer: PASS — pnpm test:e2e
native-desktop: PASS — pnpm test:tauri
android-smoke: NOT RUN — emulator unavailable
```

## CI state

- `queued`, `waiting`, `pending`, `in_progress`, and equivalent states are never PASS.
- A previous green run on another SHA is historical evidence, not proof for the current HEAD.
- If CI was rerun, record the run associated with the current HEAD.

## Human gates

Never infer a human approval from implementation evidence.

Examples that must remain explicit when used by the project:

- Design Gate
- Architecture decision acceptance
- Merge Gate
- Manual Android/device validation
- UX acceptance

Use `APPROVED`, `REJECTED`, `PENDING`, or `NOT REQUIRED` only when evidence supports that exact state.

# Testing expectations by surface

Record only gates that exist for the active work, but preserve the architecture baseline distinctions:

- renderer/browser behavior: Playwright or project-equivalent tests;
- native desktop/Tauri behavior: WebdriverIO + Tauri service or current canonical equivalent;
- Android-native behavior: emulator/device smoke/integration testing when the feature touches Android/native storage/auth/secrets;
- Rust/native boundaries: unit/integration checks appropriate to `GitService`, `SecretStore`, filesystem, OAuth callback handling, or other native capabilities.

Do not treat browser-only tests as sufficient evidence for a native boundary.

# Reconstruction procedure

Before writing the handoff, reconstruct the current state from durable sources.

## 1. Git identity

Capture:

- repository;
- branch;
- worktree when non-default/relevant;
- exact HEAD SHA;
- base branch/base SHA when known;
- dirty/clean status;
- uncommitted files that matter.

## 2. Work identity

Capture when available:

- issue;
- PR;
- spike ID or feature/spec ID;
- task IDs;
- current lifecycle stage.

## 3. Canonical artifacts

Locate the specific files governing the work:

- Architecture Baseline section(s);
- ADR(s);
- `spec.md`;
- `plan.md`;
- `tasks.md`;
- convergence/analyze output;
- code/tests/docs changed.

## 4. Audit issue -> spec -> plan -> tasks -> code -> verification

Identify mismatches such as:

- implemented behavior absent from spec/plan;
- task marked done but acceptance not verified;
- code contradicting an invariant;
- dependency on an unresolved spike;
- stale test/CI evidence;
- undocumented architecture decision;
- TODO or temporary workflow left behind;
- human gate assumed rather than recorded.

## 5. Promote durable decisions before compression

If the session discovered a durable fact, decision, limitation, or architecture change, persist it in the canonical location before the handoff whenever possible.

Examples:

- ADR for accepted implementation choice;
- updated `plan.md` for implementation detail;
- task acceptance state;
- spike result and decision;
- regression test;
- architecture documentation;
- issue/PR comment containing idempotent continuation state.

Do not use the Caveman Handoff as the only storage location for durable project knowledge.

# Completion classification

Choose exactly one:

## VERIFIED_COMPLETE

Use only when:

- implementation for the claimed scope is complete;
- relevant acceptance criteria are satisfied;
- required automated/native/manual gates are PASS/APPROVED for the current HEAD;
- no required unresolved spike blocks the scope;
- canonical docs/tasks reflect the state;
- no known process drift invalidates completion.

## IMPLEMENTED_NOT_VERIFIED

Use when implementation is materially complete but one or more required verification gates are not current, not run, pending, or unavailable.

## INCOMPLETE

Use when implementation, acceptance criteria, spike work, documentation, or required fixes are still unfinished.

## PROCESS_DRIFT

Use when the workflow state itself is unreliable or violates project process, for example:

- work continued against the wrong branch/PR;
- a new workstream reused an old PR when a new branch/spec/PR was required;
- canonical artifacts and code disagree materially;
- completion was declared from stale evidence;
- a required Spec Kit stage was skipped without canonical justification;
- an architecture hypothesis was treated as an accepted decision without spike/ADR evidence.

`PROCESS_DRIFT` takes precedence over optimistic completion language until corrected.

# New workstream rule

A materially new workstream should start from the canonical base using:

- a new branch;
- a new Spec Kit feature/spec when applicable;
- a new PR;
- fresh verification evidence.

Do not silently continue unrelated work on the previous PR merely because the previous handoff exists.

# Caveman compression rules

The handoff must be **delta-only**.

Target size: approximately **250-700 tokens**.

Include only facts needed to resume safely:

- identity: repo/branch/HEAD/base/PR/issue/spec/spike;
- classification;
- current objective/scope;
- what changed materially;
- gates with current SHA-bound status;
- invariants/decisions that constrain the next action;
- blockers/risks;
- one concrete `NEXT` action;
- minimal revalidation/bootstrap commands or steps.

Do not copy:

- long reasoning;
- full test logs;
- whole specs;
- repeated architecture prose;
- historical details already in canonical docs;
- speculative future plans;
- generic encouragement.

# Required output format

Emit exactly one compact artifact using this structure:

```text
CAVEMAN HANDOFF v1 — DEV COCKPIT

STATE
repo: <owner/repo>
branch: <branch>
base: <base branch>@<sha-or-unknown>
HEAD: <sha>
work: <issue/pr/spec/spike/task IDs>
class: VERIFIED_COMPLETE | IMPLEMENTED_NOT_VERIFIED | INCOMPLETE | PROCESS_DRIFT

NOW
<1-3 lines: current objective and actual state>

DELTA
- <material change 1>
- <material change 2>
- <material change 3>

GATES @ <HEAD>
- <gate>: PASS | FAIL | PENDING | NOT RUN | NOT REQUIRED — <minimal evidence>
- <gate>: ...

INVARIANTS
- <only constraints that next session must actively remember>

BLOCKERS
- <none OR concrete blockers/risks/stale evidence>

NEXT
<one atomic executable next action>

BOOT
1. <minimal command/read step to re-establish canonical state>
2. <revalidate HEAD/branch/PR/spec>
3. <execute NEXT; do not trust previous PASS if HEAD changed>
```

# Lint rules

Reject/regenerate the handoff if any of the following is true:

- HEAD is missing or ambiguous;
- PASS appears without a current-HEAD basis;
- queued/pending CI is described as PASS;
- a human approval is inferred;
- `NEXT` is vague (`continue`, `finish`, `review later`, `proceed`);
- the handoff repeats canonical docs instead of transferring delta state;
- a `Proposed / Requires Spike` decision is described as final;
- Markdown/SQLite source-of-truth roles are reversed;
- browser tests are used as sole proof for native Android/Tauri behavior;
- the classification contradicts blockers/gates;
- a new workstream is being routed into an old unrelated PR without explicit canonical justification.

# NEXT quality rule

`NEXT` must be a single atomic action that can be started immediately by a fresh session.

Good:

```text
NEXT
Run S003 benchmark against git2-rs and gix using the spike acceptance matrix, persist the result in the spike doc, and do not update the GitService ADR until the evidence is recorded.
```

Bad:

```text
NEXT
Continue the project.
```

# Example

```text
CAVEMAN HANDOFF v1 — DEV COCKPIT

STATE
repo: az1nn/dev-cockpit
branch: feat/001-workspace-foundation
base: master@1d2c3b4
HEAD: 8fa01cd
work: spec 001 / PR #12 / TASK-001-04
class: IMPLEMENTED_NOT_VERIFIED

NOW
Workspace foundation persists Markdown canonically and rebuilds the derived SQLite index. Desktop behavior is implemented; Android storage acceptance is still blocked by S001 evidence.

DELTA
- Added WorkspaceService boundary and canonical Markdown writes.
- Added index rebuild path; SQLite remains outside Workspace.
- Added renderer tests for open/edit/reindex flow.

GATES @ 8fa01cd
- unit: PASS — pnpm test
- renderer-e2e: PASS — pnpm test:e2e
- native-desktop: PASS — pnpm test:tauri
- android-storage: NOT RUN — S001 device matrix pending
- CI: PENDING — current HEAD run not complete

INVARIANTS
- Markdown is canonical; SQLite is derived only.
- Do not accept Android filesystem parity before S001 is persisted.

BLOCKERS
- S001 Android Workspace Storage not accepted.
- Current-HEAD CI not green yet.

NEXT
Execute S001 on the defined Android emulator/device matrix and persist the observed storage/permission behavior before changing feature acceptance state.

BOOT
1. git status && git rev-parse HEAD
2. Read Architecture Baseline + spec 001 + S001 + PR #12 checks.
3. Execute NEXT; rerun affected gates if HEAD changes.
```

# Final principle

The purpose of Caveman Handoff is not to make the next agent *feel informed*. It is to make the next agent **operationally safe** after total chat loss.

When in doubt: persist truth canonically, distrust stale evidence, keep the handoff small, and make `NEXT` executable.
