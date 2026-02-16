---
status: UNREVIEWED
teams: []
roles:
  - agent
  - project-manager
  - architect
authors:
  - JamesXNelson
lastUpdated: 2026-02-16T00:00:00Z
verification:
  - "(manual) agent outputs only goal docs and does not propose code changes"
---

# Compliance agent (triage)

A compliance agent is a non-blocking auditor.

Purpose:
- Scan the current repository/doc state for a given feature.
- Create goal docs for any missing artifacts required by the feature’s intended lifecycle state.
- Stop.

This agent is explicitly not an enforcement mechanism.

## Inputs

- `feature-id`
- `targetLifecycle` (one of the lifecycle states)

Optional:
- current known spec path(s)
- current known ADR path(s)

## Outputs

Goal docs only:
- Create missing-work goals under `docs/goals/<feature-id>/`.
- Create a summary goal describing what was found and what was created.

Non-goals:
- No code changes.
- No automatic changes to certified docs.
- No running tasks/scripts.

## Behavior (minimal)

1. Locate feature docs (specs/plans/goals/ADRs) for `feature-id`.
2. Determine which artifacts are expected for `targetLifecycle`.
3. For each missing artifact, create a goal doc describing:
   - what is missing
   - why it matters
   - what “done” means
4. Emit a final summary goal linking to the created goals.

## Deferral note

Automation and enforcement (e.g., CI checks, required approvals, auto-routing) are deferred until a dedicated agent spec exists and is approved.
