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

## Proposal

Introduce an explicit, approval-gated override concept that can be invoked per-session:

- `/godmode` (or equivalent UI toggle)
  - expands reading scope to all relevant specs
  - allows broader refactors when necessary
  - still preserves hard safety gates:
    - do not exfiltrate secrets
    - do not run cloud operations without explicit approval

## Suggested structure

- Override is time-bounded and recorded in chat.
- Override is scoped (what is relaxed, what is still enforced).
- Override always produces a follow-up backlog item to encode the learning as a reusable skill.

## Follow-up backlog idea

Create a skill doc under `skills/` for:
- “constraint conflict detection”
- “how to propose rule updates safely”

