id: f6ac38e3-f4fa-4a06-8c61-5660d026a863
sessionId: bc45c0bf-d7b5-4f4b-8582-3d8e0fe7b37d
date: '2026-02-16T18:00:26.827Z'
label: >-
  Rescue Lost Workflow Goals: Lifecycle, Maturity, Roles, and Force-State
  Backfill (Triage Docs)
---
# Rescue Lost Workflow Goals: Lifecycle, Maturity, Roles, and Force-State Backfill (Triage Docs)

## Goal
Recover and formalize (at **triage** level) the previously-described workflow concepts that were lost: feature lifecycle, maturity, roles-based reading behavior, and a `/force-state` queue-jump mechanism that creates backfill goals. Produce a concrete doc set that Coder can add to the repo without overengineering policy.

## Design (critical review + proposed minimal model)

### Why the old workflow got lost
The repo currently has:
- A **trust model** (UNREVIEWED/DRAFT/CERTIFIED) via YAML frontmatter.
- A **taxonomy** (docs/goals, docs/specs, docs/plans, docs/teams…).

But it lacks:
- A **feature/work lifecycle** state machine.
- A **maturity** dimension for implementation reality.
- A **queue-jump** mechanism that leaves backfill artifacts.

Without these, agents can’t answer “what should I do next?” without reading too much.

### Proposed minimal lifecycle field
Add `lifecycle` to frontmatter for feature/spec/plan docs.

State names (minimal, per user):
- `TRIAGE`
- `CONFIRMED`
- `SPECCED`
- `APPROVED`
- `IMPLEMENTING` (preferred over IN_PROGRESS)
- `COMPLETE`
- `DEPRECATED`

Notes:
- **Trust status** (`status: UNREVIEWED|DRAFT|CERTIFIED`) is orthogonal.
- A document can be `status: CERTIFIED` and still have a `lifecycle` meaning “this is the current certified spec for an implementing feature”.

### Proposed minimal maturity field
Add `maturity` to frontmatter where it’s relevant (implementation notes, feature rollups, release notes). Prefer the short name `maturity`.

Recommended values (triage-level; adjust later):
- `NONE` (default)
- `SPIKE`
- `RUNNABLE`
- `DEPLOYABLE`
- `TESTED`
- `DOCUMENTED`
- `PRODUCTION`

Rule of thumb:
- Architects/planners primarily follow **specs and ADRs**, not spikes.
- Coders/testers must respect the **current approved spec**, but are allowed to consult implementation notes when in `IMPLEMENTING`.

### Roles and “interests”
Roles you want to support via frontmatter `roles` filtering:
- `architect`, `designer`, `coder`, `tester`, `design-reviewer`, `code-reviewer`, `project-manager`, `cto`

At triage level we will:
- define what each role *prefers to read first*
- define what each role *should avoid by default* (e.g., triage docs)

We will **not** define a hard `agentPolicy` enforcement system yet; capture it as a future idea only.

### Queue-jump mechanism (slash command)
Define a slash-command concept:
- `/force-state <feature-id> <NEW_STATE>`

Behavior:
- If required artifacts for NEW_STATE are missing, create goals under `docs/goals/<feature-id>/` to fill gaps (e.g., `write-spec.md`, `define-acceptance-criteria.md`, `create-adr-XXXX.md`).
- Create/assign a “compliance agent” goal: scan current repo/doc state for the feature, generate missing-work goals, and stop.

### “Degrading” beyond CERTIFIED
We will not implement a generic “degrade trust” rule. Instead:
- If a CERTIFIED doc is wrong, create a **goal** to correct it.
- Design review may mark CERTIFIED docs `DEPRECATED` and replace via a new doc/feature.

### Provenance stamping for approval
When a spec/plan becomes `APPROVED`, add:
- `approvedSha: <git short sha>`
- `approvedBy: <human or bot id>`

Timestamp is optional; can be derived from git history.

---

## Implementation Steps (docs only; triage-level)

### Step 1: Add triage doc — Feature lifecycle + maturity
Create:
- `docs/0_triage/workflow/feature-lifecycle-and-maturity.md`

Include:
- rationale for `lifecycle` and `maturity`
- state definitions (what it means to be in each)
- minimal artifact expectations per state (best-effort; explicitly “triage draft”)
- how roles should interpret maturity vs spec authority

Frontmatter:
- `status: UNREVIEWED`
- `roles: [architect, project-manager, cto]` (and `agent` if you use it)
- `authors: [JamesXNelson]`


### Step 2: Add triage doc — Roles-based reading rules
Create:
- `docs/0_triage/workflow/role-based-reading-and-trust.md`

Include:
- each role and what to read first (AGENTS.md, PURPOSE routers, ADRs, specs, plans, goals)
- explicit instruction: triage docs are **not** searched by default; only planners/architects consume triage as intake
- guidance on how to create “goals to fix certified docs” rather than silently degrading trust


### Step 3: Add goals triage doc — `/force-state` queue jumping
Create:
- `docs/goals/workflow/force-state-queue-jump.md`

Include:
- definition of queue-jumping as a sanctioned escape hatch
- `/force-state` command syntax and intent
- required outputs: auto-created backfill goals under `docs/goals/<feature-id>/`
- examples of missing-artifact goal names (write spec, add acceptance criteria, draft ADR)


### Step 4: Add triage doc — “Compliance agent” concept
Create:
- `docs/0_triage/agents/compliance-agent.md`

Include:
- purpose: non-blocking auditor that creates goals for missing compliance with the lifecycle stage
- inputs: feature-id, current lifecycle state
- outputs: goal docs only (no code changes)
- explicitly defer enforcement/policy automation until after agent spec exists


### Step 5: Add triage doc — Future idea capture (channels / teams / resumable context)
Create:
- `docs/0_triage/goals/multi-agent-channels-and-context-reset.md`

Include:
- channel concept, resumable vs short-lived contexts
- reset button concept
- deferral note: captured for later; no near-term implementation commitment


### Step 6: Update routers for discoverability
Update these router docs to link the new docs (don’t move existing content yet):
- `docs/0_triage/PURPOSE.md` — add a “workflow/” and “agents/” section linking to new docs
- `docs/goals/PURPOSE.md` — link to the `/force-state` goal doc

---

## Reference Examples (existing patterns to follow)
- `docs/0_triage/WTI_AI_DOCS_SPEC.md` — defines required frontmatter keys and status meanings.
- `AGENTS.md` — defines repo trust and search rules; should remain the operational entrypoint.
- `docs/PURPOSE.md` + `PURPOSE.md` (repo root) — router pattern to minimize reading.

---

## Verification
- Check that new docs have YAML frontmatter matching `docs/0_triage/WTI_AI_DOCS_SPEC.md` expectations.
- Ensure router links resolve:
  - `AGENTS.md` → `PURPOSE.md` → `docs/PURPOSE.md` → new triage docs
- Ensure no policy automation was introduced beyond documentation.
