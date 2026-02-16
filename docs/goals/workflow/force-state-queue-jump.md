---
status: UNREVIEWED
teams: []
roles:
  - project-manager
  - architect
  - cto
  - agent
authors:
  - JamesXNelson
lastUpdated: 2026-02-16T00:00:00Z
verification:
  - "(manual) examples result in creation of goal docs under docs/goals/<feature-id>/"
---

# /force-state queue-jump (goal)

Queue-jumping is a sanctioned escape hatch: it allows moving a feature to a desired lifecycle state even if the usual prerequisite artifacts are missing.

The key requirement: **queue-jumping must leave backfill artifacts** so the missing work is visible, trackable, and can be completed later.

## Command

`/force-state <feature-id> <NEW_STATE>`

Where:
- `<feature-id>` is the stable feature identifier used in docs paths.
- `<NEW_STATE>` is one of the lifecycle states.

## Intent

- Unblock execution when there is urgency.
- Make missing process work explicit by creating goals.

This does not change the trust model:
- `status: CERTIFIED` remains the only authority signal.

## Required outputs

When `/force-state` is invoked:
1. Determine which artifacts are normally expected for `<NEW_STATE>`.
2. If artifacts are missing, create goal docs under:
   - `docs/goals/<feature-id>/`
3. Create one additional goal:
   - a “compliance agent” scan goal that enumerates missing artifacts and stops.

## Backfill goal naming examples

Goal docs created under `docs/goals/<feature-id>/` should be small and unambiguous. Example names:
- `write-spec.md`
- `define-acceptance-criteria.md`
- `draft-adr-XXXX.md`
- `create-implementation-plan.md`
- `document-rollout-and-rollback.md`

## Example

Request:

`/force-state payments-api APPROVED`

If missing, create:
- `docs/goals/payments-api/write-spec.md`
- `docs/goals/payments-api/define-acceptance-criteria.md`
- `docs/goals/payments-api/draft-adr-0001.md`
- `docs/goals/payments-api/run-compliance-agent.md`

The goal docs capture the missing work; the feature can proceed while the backfill is queued.
