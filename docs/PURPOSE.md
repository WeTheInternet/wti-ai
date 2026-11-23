---
status: DRAFT
teams: []
roles: []
authors:
  - JamesXNelson
lastUpdated: 2026-11-23T00:24:36Z
verification:
  - "(manual) Subdirectory PURPOSE.md files exist for all major doc areas"
---

# PURPOSE

Machine-readable documentation taxonomy hub.

Authority is determined by frontmatter only:
- `status: CERTIFIED` is authoritative.
- Folder location is not authoritative.

Generated/index content is not authoritative unless it is explicitly `status: CERTIFIED`.

## Navigate

- `0_triage/` — intake and raw imports (non-authoritative by default)
  - `0_triage/PURPOSE.md`

- `agent/` — agent-only operating instructions and conventions
  - `agent/PURPOSE.md`

- `specs/` — product feature specifications (PM-style)
  - `specs/PURPOSE.md`

- `adr/` — architecture decision records
  - `adr/PURPOSE.md`

- `goals/` — goal documents
  - `goals/PURPOSE.md`

- `plans/` — work plans and playbooks
  - `plans/PURPOSE.md`

- `teams/` — team charters and roles
  - `teams/PURPOSE.md`

- `features/` — feature-specific specs and notes of mixed maturity
  - `features/PURPOSE.md`

- `status/` — generated indexes only (non-authoritative)
  - `status/PURPOSE.md`

- `theia/` — Theia integration notes


## Current design and source history

- [Conductor/LISA goal](goals/conductor-lisa-loops.md)
- [Delivery workflow](specs/agent-workflow.md)
- [Project knowledge](specs/project-knowledge.md)
- [Operator supervision](specs/operator-supervision.md)
- [Reconciliation plan](plans/docs-reconciliation.md)
- [Recoverable history](history/PURPOSE.md)
