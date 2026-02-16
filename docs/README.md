---
status: DRAFT
owner: wti
reviewed-by: TBD
review-date: TBD
verification:
  - "(manual) Ensure docs follow taxonomy and headers"
changelog:
  - 2026-02-16: Initial draft
---

# Docs lifecycle (WTI-AI)

## Authoritative content
Only documents with frontmatter `status: CERTIFIED` are authoritative.

Folder location does not determine authority (including `docs/5_certified/`).

## Taxonomy
- `docs/agent/` — agent-only operating instructions
- `docs/specs/` — product feature specs (PM-style)
- `docs/adr/` — architecture decisions
- `docs/goals/` — goals docs
- `docs/plans/` — approved work plans/playbooks
- `docs/teams/` — team charters and role definitions
- `docs/features/` — legacy feature-specific specs/notes (keep for now)
- `docs/status/` — generated indexes only (non-authoritative)
- `docs/0_triage/` — unreviewed intake, raw notes, imports
- `docs/5_certified/` — legacy location containing some certified docs

## Status headers
Docs should start with YAML frontmatter. Use:
- `status: UNREVIEWED` for raw imports
- `status: DRAFT` for work-in-progress
- `status: CERTIFIED` for authoritative truth (not directory-dependent)
