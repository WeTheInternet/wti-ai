---
status: DRAFT
teams: []
roles: []
authors:
  - JamesXNelson
lastUpdated: 2026-02-16T00:00:00Z
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

- `features/` — legacy feature specs/notes (keep for now)
  - `features/PURPOSE.md`

- `status/` — generated indexes only (non-authoritative)
  - `status/PURPOSE.md`

- `theia/` — Theia integration notes

- `trash/` — staging area for deletions (ignored by agents)
  - `trash/PURPOSE.md`
