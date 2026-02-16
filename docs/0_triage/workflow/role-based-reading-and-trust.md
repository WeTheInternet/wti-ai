---
status: UNREVIEWED
teams: []
roles:
  - architect
  - designer
  - coder
  - tester
  - design-reviewer
  - code-reviewer
  - project-manager
  - cto
authors:
  - JamesXNelson
lastUpdated: 2026-02-16T00:00:00Z
verification:
  - "(manual) role reading guidance does not conflict with AGENTS.md trust rules"
---

# Role-based reading and trust (triage)

This doc captures triage-level guidance for how different roles should navigate the repo’s documentation without over-reading.

## Non-negotiable trust rule
- Only `status: CERTIFIED` is authoritative.
- If a `status: CERTIFIED` doc is wrong, do not silently treat it as untrusted. Create a goal to fix it.

## Routing principle
Read routers first, then drill down.

Preferred order:
1. `AGENTS.md`
2. `PURPOSE.md` (repo root)
3. `docs/PURPOSE.md`
4. Directory routers (`docs/*/PURPOSE.md`)

## Triage docs are not default search targets
`docs/0_triage/` is intake only.

Guidance:
- Agents and implementers should not search triage content by default.
- Planners/architects may consult triage docs as intake, then promote/refine content into the main taxonomy.

## What each role should read first

### `architect`
Read first:
- `docs/adr/` (ADRs)
- `docs/specs/` (specs)
- `docs/plans/` (plans/playbooks)

Avoid by default:
- Triage dumps and spikes unless explicitly requested.

### `designer`
Read first:
- Relevant specs (and any design assets referenced from specs)
- Any design review notes in the relevant plan/spec

Avoid by default:
- Implementation notes unless they contain user-facing constraints.

### `project-manager`
Read first:
- Goals (`docs/goals/`)
- Plans (`docs/plans/`)
- Certified specs/ADRs for scope confirmation

Avoid by default:
- Deep implementation notes.

### `cto`
Read first:
- Certified ADRs and specs
- High-level plans and goals

Avoid by default:
- Raw triage and spikes unless auditing process quality.

### `coder`
Read first:
- The current approved/certified spec for the feature
- Relevant ADRs
- The plan/playbook if sequencing matters

Avoid by default:
- Triage content.

Allowed supplemental reads:
- Implementation notes, but only as supplements to the approved spec when `lifecycle: IMPLEMENTING`.

### `tester`
Read first:
- Acceptance criteria (in spec or linked goal)
- The current approved/certified spec
- Any test strategy notes in plans

Avoid by default:
- Spikes and raw implementation notes.

### `design-reviewer`
Read first:
- The spec (especially UX/API surface and user flows)
- Any referenced design artifacts

Avoid by default:
- Code-level implementation details unless necessary for feasibility review.

### `code-reviewer`
Read first:
- The current approved/certified spec
- Relevant ADRs
- The plan/playbook (if present)

Avoid by default:
- Raw triage.

## Fixing certified docs

If a certified doc is incorrect:
- Create a goal describing what is wrong and the intended correction.
- Update the certified doc through the normal review flow.

Do not:
- Treat certified docs as “soft truth” or “probably wrong”.
- Introduce an automatic “degrade trust” mechanism.
