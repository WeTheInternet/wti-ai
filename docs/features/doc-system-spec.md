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

# Docs system spec (draft)

Machine-oriented specification for repository documentation metadata, authority, and navigation.

## Non-negotiable vs best-effort

Non-negotiable:
- Only documents with `status: CERTIFIED` are authoritative.

Best-effort (may be missing, incomplete, or incorrect):
- `teams`, `roles`, `verification`
- `lifecycle`, `maturity`, `approvedSha`, `approvedBy`
- Any routing metadata used for discovery

No enforcement yet:
- Missing or inconsistent metadata must not block work.
- When metadata gaps materially increase uncertainty or risk, create a goal to correct docs rather than enforcing a hard stop.

## Three orthogonal axes

The documentation system uses three independent dimensions:

1) Trust / authority (`status`)
- Determines whether a doc can be treated as authoritative truth.

2) Feature/work phase (`lifecycle`)
- Best-effort statement of where the work is in its lifecycle.

3) Implementation reality (`maturity`)
- Best-effort statement of how real/operational the implementation is.

## Required frontmatter schema

All documentation intended for agent consumption should begin with YAML frontmatter containing these required keys:

- `status` (string)
- `teams` (list of strings; empty list means global)
- `roles` (list of strings; empty list means global)
- `authors` (list of strings; include `JamesXNelson`)
- `lastUpdated` (string; ISO-8601 UTC with seconds resolution, e.g. `2026-02-16T15:08:31Z`)

## Optional frontmatter keys

Optional-but-encouraged:
- `verification` (string or list) describing how an agent/human can validate claims.

Optional (best-effort) lifecycle keys:
- `lifecycle` (string)
  - Allowed values:
    - `TRIAGE`
    - `CONFIRMED`
    - `SPECCED`
    - `APPROVED`
    - `IMPLEMENTING`
    - `COMPLETE`
    - `DEPRECATED`

- `maturity` (string)
  - Recommended values:
    - `NONE` (default)
    - `SPIKE`
    - `RUNNABLE`
    - `DEPLOYABLE`
    - `TESTED`
    - `DOCUMENTED`
    - `PRODUCTION`

Approval metadata (expected when `lifecycle: APPROVED`, and remains relevant in later lifecycle states):
- `approvedSha` (string; git short sha)
- `approvedBy` (string; human or bot id)

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

## Routing principle (read routers first)

Read routers first, then drill down.

Preferred order:
1. `AGENTS.md`
2. `PURPOSE.md` (repo root)
3. `docs/PURPOSE.md`
4. Directory routers (`docs/*/PURPOSE.md`)

See also:
- `docs/0_triage/workflow/role-based-reading-and-trust.md`

## Triage rules

- `docs/0_triage/` is intake only and non-authoritative by default.
- Content should be promoted out of triage into appropriate directories when refined.

## Teams / roles filtering

Interpretation guidance for agents:
- If `teams` is non-empty, prefer loading the doc only when the task aligns with one of those teams.
- If `roles` is non-empty, prefer loading the doc only when the agent is acting in one of those roles.
- If both are empty lists, treat the doc as globally applicable.
