---
name: auto-skill-dev-cockpit-caveman-handoff
description: >-
  Create a short, SHA-bound handoff after material Dev Cockpit work so a fresh
  session can continue safely from repository truth, not chat memory.
version: 1.2.0
project: dev-cockpit
---

# Dev Cockpit Caveman Handoff

Use after material implementation, spike, verification, architecture, or Spec Kit work.
Skip for trivial edits.

## Core rule

Canonical state wins over chat and previous handoffs.

Precedence:

1. current Git HEAD
2. Architecture Baseline / accepted ADRs
3. active Spec Kit artifacts
4. tests / CI / native validation
5. PR / issue state
6. previous handoff
7. chat memory

## Before handoff

Run this sequence:

```text
verify -> classify -> persist durable decisions -> handoff
```

Capture:

- repo, branch, HEAD, base, PR/issue/spec/spike IDs
- material delta only
- current verification for this HEAD
- blockers
- one executable NEXT action

If HEAD changed after a PASS, treat that PASS as stale unless clearly unaffected.
Pending/queued CI is never PASS.
Never infer human approval.

## Merge authority

The operator is authorized to resolve merge conflicts and complete merges without asking for an additional confirmation.

Before any merge:

- reconcile the current base, PR head, mergeability, review state, required checks, and repository-defined validation gates;
- resolve conflicts in favor of canonical repository truth and the active spec/ADR constraints, not stale chat context;
- after conflict resolution or any other content change, treat prior CI as stale and require the mandatory gates to pass again on the resulting HEAD;
- do not bypass explicit mandatory human, device, security, release, or acceptance gates merely because GitHub technically permits the merge;
- once the current HEAD satisfies all mandatory gates and no blocker remains, merge without asking for another confirmation;
- use a HEAD-bound merge where supported so the merge is rejected if the branch moves after verification.

A merge conflict is a repairable condition, not a reason to stop development. A failed mandatory gate remains a blocker until corrected or explicitly reclassified by canonical repository policy.

## Dev Cockpit invariants

Keep only what constrains continuation:

- local-first
- Markdown in Workspace is canonical
- SQLite is derived only
- Tauri/native behavior needs native evidence; browser tests alone are insufficient
- `SecretStore` and `GitService` are architecture boundaries; implementation candidates are not final decisions without evidence
- OAuth is platform/provider-aware
- `Proposed / Requires Spike` is not accepted architecture
- `spec.md` stays WHAT/WHY; implementation detail belongs in `plan.md` / ADRs

Relevant early spikes:

```text
S001 Android Workspace Storage
S002 Secret Store
S003 Native Git Engine
S004 OAuth Callbacks
```

Do not mark dependent work complete while a required spike is unresolved.

## Classification

Choose exactly one:

- `VERIFIED_COMPLETE` — scope complete and required gates PASS/APPROVED for current HEAD.
- `IMPLEMENTED_NOT_VERIFIED` — implemented, but required evidence is missing/stale/pending.
- `INCOMPLETE` — implementation, acceptance, docs, or spike work remains.
- `PROCESS_DRIFT` — branch/PR/spec/process state is unreliable or canonical artifacts disagree.

## New workstream rule

Materially new work starts from canonical base with a new branch and, when applicable, a new spec and PR. Do not reuse an unrelated PR.

## Output

Keep the handoff around 150-350 tokens unless extra detail is required for safety.

```text
CAVEMAN HANDOFF — DEV COCKPIT

STATE
repo: <owner/repo>
branch: <branch>
HEAD: <sha>
work: <PR/issue/spec/spike/task>
class: <classification>

NOW
<actual current state in 1-2 lines>

DELTA
- <only material changes>

GATES @ <HEAD>
- <gate>: PASS | FAIL | PENDING | NOT RUN | NOT REQUIRED

BLOCKERS
- <none or concrete blockers>

NEXT
<one atomic executable action>

BOOT
<minimal command/read step needed to resume safely>
```

## Reject the handoff if

- HEAD is missing
- PASS is not tied to current HEAD
- pending CI is called PASS
- approval is inferred
- `NEXT` is vague
- unresolved spike-dependent work is called complete
- the handoff repeats project history or long architecture prose
- canonical docs and implementation disagree without `PROCESS_DRIFT`

## Principle

Persist durable truth in Git/specs/ADRs/tests. The handoff only carries the smallest safe continuation delta.
