---
status: UNREVIEWED
teams: []
roles:
  - architect
  - project-manager
  - cto
authors:
  - JamesXNelson
lastUpdated: 2026-02-16T00:00:00Z
verification:
  - "(manual) lifecycle and maturity fields appear in relevant docs and are used consistently"
---

# Feature lifecycle and maturity (triage)

This repo already has a **trust** model (`status: UNREVIEWED|DRAFT|CERTIFIED|DEPRECATED`) and a documentation taxonomy (`docs/specs`, `docs/plans`, `docs/goals`, `docs/adr`, etc.).

What was missing (and is reintroduced here at triage level) is:
- a **feature/work lifecycle** state machine (what phase is this feature/spec/plan in?)
- a **maturity** dimension for implementation reality (how real/operational is it today?)

These are intentionally minimal and non-enforced. They exist to let humans and agents answer “what should I do next?” with fewer reads.

## Two orthogonal dimensions

### 1) Trust / authority (`status`)
- **Only `status: CERTIFIED` is authoritative.**
- `status` says whether a document can be treated as truth.

### 2) Lifecycle (`lifecycle`)
`lifecycle` is a best-effort statement of what phase a feature/spec/plan is currently in.

Add `lifecycle` to frontmatter for feature/spec/plan docs.

Allowed values (minimal):
- `TRIAGE`
- `CONFIRMED`
- `SPECCED`
- `APPROVED`
- `IMPLEMENTING`
- `COMPLETE`
- `DEPRECATED`

Notes:
- `status` and `lifecycle` are orthogonal.
- A doc may be `status: CERTIFIED` and `lifecycle: IMPLEMENTING` (the certified spec for an in-flight implementation).
- `lifecycle` is about *the work*, not about whether the doc is correct.

### 3) Maturity (`maturity`)
`maturity` is a best-effort statement of how real the implementation is.

Add `maturity` to frontmatter where it’s relevant (implementation notes, feature rollups, release notes, “what’s shipped” summaries).

Recommended values (triage level):
- `NONE` (default)
- `SPIKE`
- `RUNNABLE`
- `DEPLOYABLE`
- `TESTED`
- `DOCUMENTED`
- `PRODUCTION`

Notes:
- `maturity` is not a trust signal.
- A highly mature system can still have incorrect docs, and vice versa.

## Lifecycle state definitions (minimal)

### `TRIAGE`
Meaning:
- Idea capture and intake.
- Goal is to decide if this is worth confirming.

Typical artifacts (best effort):
- A small goal doc describing the problem and desired outcome.

### `CONFIRMED`
Meaning:
- The problem and intent are accepted.
- We intend to produce a real spec.

Typical artifacts:
- A goal doc with scope boundaries.
- Initial acceptance criteria (can be rough).

### `SPECCED`
Meaning:
- A primary spec exists and is coherent.

Typical artifacts:
- A spec doc (may still be `status: DRAFT`).
- Acceptance criteria in the spec or linked goal.
- If there are architectural choices, an ADR draft.

### `APPROVED`
Meaning:
- The spec is accepted as the current intended design.

Expected frontmatter additions when a spec/plan is approved:
- `approvedSha: <git short sha>`
- `approvedBy: <human or bot id>`

Typical artifacts:
- Approved spec (ideally `status: CERTIFIED`, but the lifecycle signal is separate).
- Any required ADRs are present (at least drafted; ideally certified).

### `IMPLEMENTING`
Meaning:
- Implementation is actively underway against the approved spec.

Typical artifacts:
- Implementation notes (optional).
- A plan/playbook may exist for sequencing.
- Tests may be partial.

Reading guidance:
- Implementers should treat the **current approved spec** as primary.
- Implementation notes are allowed as supplemental context.

### `COMPLETE`
Meaning:
- Implementation is done relative to the approved spec.
- Follow-up may still exist (hardening, docs, rollout), which should be captured as separate goals.

Typical artifacts:
- Updated spec and/or release notes.
- Operational notes.

### `DEPRECATED`
Meaning:
- Feature is no longer intended for new work.
- Kept for history and migration references.

Typical artifacts:
- Deprecation notice and replacement link.

## Minimal artifact expectations by lifecycle (triage guidance)

This table is guidance only.

- `TRIAGE`: goal stub exists
- `CONFIRMED`: scope + rough acceptance criteria exists
- `SPECCED`: spec exists; acceptance criteria present; ADRs drafted if needed
- `APPROVED`: spec marked approved (`approvedSha`, `approvedBy`); ADRs exist
- `IMPLEMENTING`: implementation plan/notes may exist; coding can proceed against approved spec
- `COMPLETE`: implementation evidence exists (tests, docs, deployment notes) and open follow-ups are goals
- `DEPRECATED`: replacement/migration path linked

## How roles should interpret lifecycle vs maturity

- Lifecycle answers: “what phase is this work in?”
- Maturity answers: “how real is the implementation today?”
- Trust (`status`) answers: “is this doc authoritative?”

Rule of thumb:
- Architects/planners prioritize **specs + ADRs** over spikes.
- Coders/testers prioritize the **current approved spec**.
- Maturity is useful for deciding whether to harden, test, document, or deploy.
