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
- `docs/plans/` — work plans/playbooks; approval recorded separately
- `docs/teams/` — team charters and role definitions
- `docs/features/` — feature-specific specs/notes of mixed maturity
- `docs/status/` — generated indexes only (non-authoritative)
- `docs/0_triage/` — unreviewed intake, raw notes, imports
- `docs/5_certified/` — legacy location containing some certified docs

## Status headers
Docs should start with YAML frontmatter. Use:
- `status: UNREVIEWED` for raw imports
- `status: DRAFT` for work-in-progress
- `status: CERTIFIED` for authoritative truth (not directory-dependent)

## Current design and recoverable history

- [Current delivery draft](specs/agent-workflow.md) and [reconciliation plan](plans/docs-reconciliation.md).
- [Recoverable source history](history/PURPOSE.md) preserves source versions, useful dissent and decision provenance.

`docs/trash/` remains deletion staging, outside default reading. It is not the recoverable design archive. A snapshot is not a rejection decision, and folder placement does not grant authority or approval.
