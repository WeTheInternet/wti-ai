---
status: UNREVIEWED
teams: []
roles:
  - agent
authors:
  - JamesXNelson
lastUpdated: 2026-02-16T00:00:00Z
lifecycle: TRIAGE
maturity: NONE
verification:
  - "(manual) Document does not introduce enforcement"
---

# Godmode and constraint overrides (triage note)

## Context

Sometimes a task requires temporarily relaxing normal agent constraints (reading scope limits, refusal to edit broad areas, etc.) in order to rapidly converge on a working patch.

This repo currently has multiple constraint sources:
- agent operating rules (`AGENTS.md`)
- doc trust rules (`docs/features/doc-system-spec.md`)
- task-scoped autonomy rules (system/developer instructions)

## Implemented command

A chat slash command is available in the Theia IDE:

- `/godmode` (toggles)
- `/godmode on` (enables)
- `/godmode off` (disables)
- `/godmode status` (prints current status)

### Scope and persistence

Godmode is persisted per browser session via `window.sessionStorage`.

- Closing/reloading the browser clears the state.
- It is not persisted per-workspace.

This is the smallest scope consistent with current patterns in this repo (no existing workspace-scoped chat state store).

## Behavior

When godmode is ON:
- A `Godmode: ON` marker is injected into the Infra agent prompt context.
- Infra may choose to relax default conservatism and allow broader refactors or faster iteration.
- Hard safety rules still apply.

When godmode is OFF:
- A `Godmode: OFF` marker is injected into the Infra agent prompt context.

## Suggested structure (future)

- Override is time-bounded and recorded in chat.
- Override is scoped (what is relaxed, what is still enforced).
- Override always produces a follow-up backlog item to encode the learning as a reusable skill.

## Follow-up backlog idea

Create a skill doc under `skills/` for:
- “constraint conflict detection”
- “how to propose rule updates safely"
