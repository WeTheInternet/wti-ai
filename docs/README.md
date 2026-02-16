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
Only `docs/5_certified/` is authoritative.

## Taxonomy
- `docs/adr/` — architecture decisions
- `docs/goals/` — goals docs
- `docs/plans/` — approved work plans/playbooks
- `docs/teams/` — team charters and role definitions
- `docs/features/` — feature-specific specs
- `docs/status/` — generated indexes only (non-authoritative)
- `docs/0_triage/` — unreviewed intake, raw notes, imports
- `docs/5_certified/` — certified documents

## Status headers
Docs should start with YAML frontmatter. Use:
- `status: UNREVIEWED` for raw imports
- `status: DRAFT` for work-in-progress
- `status: CERTIFIED` only in `docs/5_certified/`
