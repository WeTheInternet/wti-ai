---
status: DRAFT
teams: []
roles:
  - agent
authors:
  - JamesXNelson
lastUpdated: 2026-02-16T00:00:00Z
verification:
  - "(manual) Frontmatter schema matches agent parsing expectations"
---

# WTI AI Docs Spec (Draft)

Machine-oriented specification for repository documentation metadata, authority, and navigation.

## Required frontmatter schema

All documentation intended for agent consumption should begin with YAML frontmatter containing these required keys:

- `status` (string)
- `teams` (list of strings; empty list means global)
- `roles` (list of strings; empty list means global)
- `authors` (list of strings; include `JamesXNelson`)
- `lastUpdated` (string; ISO-8601 UTC with seconds resolution, e.g. `2026-02-16T15:08:31Z`)

Optional-but-encouraged:
- `verification` (string or list) describing how an agent/human can validate claims.

## Status values and meaning

Minimum supported statuses:
- `UNREVIEWED` — raw imports, scratch notes
- `DRAFT` — work in progress; not authoritative
- `CERTIFIED` — authoritative truth for agents
- `DEPRECATED` — retained for history; not authoritative

## Authority rules

- Only documents with `status: CERTIFIED` are authoritative.
- Directory names do not determine authority.
- Generated or index content is not authoritative unless it is explicitly `status: CERTIFIED`.

## Directory router rules

- Any directory that serves as a hub for instructions/docs/specs should have a `PURPOSE.md`.
- A `PURPOSE.md` should:
  - define what belongs / what does not
  - route to next reads via links
  - state authority expectations (CERTIFIED semantics)

## Triage rules

- `docs/0_triage/` is intake only and non-authoritative by default.
- Content should be promoted out of triage into appropriate directories when refined.

## Teams / roles filtering

Interpretation guidance for agents:
- If `teams` is non-empty, prefer loading the doc only when the task aligns with one of those teams.
- If `roles` is non-empty, prefer loading the doc only when the agent is acting in one of those roles.
- If both are empty lists, treat the doc as globally applicable.
