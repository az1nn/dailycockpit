# ADR 0001: Make Project + Agent + GitHub the first MVP loop

- Status: Accepted
- Date: 2026-09-11

## Context

The daily workflow currently switches between an AI conversation and GitHub. The broader product concept also contains notes, calendar and utilities, but those do not prove the differentiating workflow.

## Decision

MVP #1 is the project-centric development loop:

```text
project context -> agent reasoning/tools -> workspace/Git -> GitHub -> reviewed mutation
```

The application will expose these domains through capability contracts and keep mutating operations behind explicit review/approval.

## Consequences

- Notes/calendar/utilities are postponed.
- Android UX is designed from the start, but native capability parity is evidence-driven.
- GitHub and AI are integrations, not embedded consumer applications.
- The first releases may have incomplete native adapters while preserving final domain boundaries.
