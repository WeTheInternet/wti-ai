---
status: DRAFT
teams: []
roles: []
authors:
  - wti
lastUpdated: 2026-02-16T00:00:00Z
verification:
  - "(manual) Confirm task-context routing rules are explicit and unambiguous"
---

# .prompts/ PURPOSE

This folder contains prompt assets for Theia AI and other agents.

## Contents

- Prompt templates
  - Human-authored templates intended to be selected and run by users.

- Task contexts
  - Canonical location (when/if migrated): `.prompts/task-contexts/`
  - These files are generated working artifacts and are likely stale.

## Routing and safety rules (machine-readable)

- `task-contexts/**` are generated, non-authoritative working artifacts.
- Do not read, load, or process any task context unless the user explicitly requests it.
- If the user requests a task, prefer the user message as the source of truth; treat any task context as supplemental and potentially outdated.

## Governing entrypoint

- `AGENTS.md` is the governing entrypoint for agent operating rules.
