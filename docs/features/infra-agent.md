---
status: DRAFT
teams: []
roles:
  - agent
authors:
  - JamesXNelson
lastUpdated: 2026-02-16T00:00:00Z
lifecycle: TRIAGE
maturity: NONE
verification:
  - "(manual) A human can describe the agent modes, transitions, and artifacts"
  - "(manual) A developer can implement the first mode (coder) without re-interpreting requirements"
---

# Infra Agent (`@Infra`) feature (draft)

## Goal

Provide a single `@Infra` agent that can operate as a full DevOps team by switching between explicit modes (design → implement → review → test), producing click-to-send, approval-gated operations that set up and maintain `ai/infra` and cluster infrastructure.

Primary near-term outcome:
- Implement only **Coder mode** first, so `@Infra` can finish wiring and executing the infra setup tasks safely.

## Non-goals

- Do not require `conductor` pre-processing in v0 (but keep the integration point explicit).
- Do not run cloud commands without explicit human approval.
- Do not build a full UI workflow engine in v0.

## Users

- Primary user: repository owner/operator (human) running an infra bootstrap.

## Key concept: modes = hats

`@Infra` is one agent with multiple hats. Each hat is a **mode** with different outputs and different standards of evidence.

### Mode overview

1) **Design mode**
   - Output: architecture decisions, constraints, runbook outline, manifest/task shapes.
   - Artifacts: links to docs, proposed manifests/task edits, risk/assumption list.

2) **Implement mode**
   - Output: patches (manifests/scripts/docs), with minimal narrative.
   - Artifacts: file diffs and new files, with clear ordering.

3) **Review mode**
   - Output: structured review of proposed changes.
   - Checks: safety, idempotency, secrets hygiene, least privilege, rollback.

4) **Test mode**
   - Output: verification plan and “ready-to-send” commands.
   - Checks: smoke tests, status checks (`kubectl get/describe`), curl probes, negative tests.

### Mode transitions

- Default sequence: **design → implement → review → test**.
- “Next mode” should be explicit and user-controlled.
- Mode can be re-entered (e.g. implement → review → implement) until acceptance criteria are met.

## Delegation model (ideal Theia bot team)

In the ideal UI, `@Infra` delegates to specialized Theia bots. These are logical roles; they may map to separate agents or separate prompts.

- **Architect bot** (design mode)
  - Produces: end-state diagrams, resource inventory, API versions, assumptions.

- **Coder bot** (implement mode)
  - Produces: patches to `ai/infra/` scripts/manifests/docs.

- **Reviewer bot** (review mode)
  - Produces: safety/idempotency review, secrets review, blast-radius review.

- **Tester bot** (test mode)
  - Produces: verification checklist, command sequences, expected outputs.

### Delegation constraints

- Delegation must be traceable: each delegated job has an input prompt and an output artifact list.
- Delegation must be approval-gated: outputs become “ready to send” operations.

## UX concept: “ready to send” operations

`@Infra` produces operation blocks that are not executed automatically.

Each operation block includes:
- Title
- Mode
- Risk level (LOW/MED/HIGH)
- Preconditions
- Commands (or file edits) to run
- Expected outputs
- Rollback

Operations should be grouped into:
- **Safe local operations** (e.g. generating manifests, editing docs)
- **Cluster operations** (kubectl apply)
- **Cloud operations** (gcloud, IAM)
- **External operations** (DNS changes)

## v0 scope (what to implement right away)

### v0.1: Coder mode only

Coder mode behaviors:
- Reads repo reality (scripts, manifests, docs).
- Produces patches to:
  - hook scripts into a canonical entry script (e.g. `01-init-gcloud.sh` if/when it exists)
  - normalize helpers/utilities used across tasks
  - ensure tasks are idempotent-ish and log to `ai/infra/logs/`
- Produces a minimal runbook under `docs/plans/infra/` that matches the scripts.

Coder mode deliverable standard:
- “Patch complete” definition:
  - files exist
  - paths referenced by scripts exist
  - shellcheck-style obvious errors avoided (even if shellcheck is not wired)
  - no secrets committed

### v0.2: Add Review + Test modes (next)

- Review mode: threat model + secrets hygiene.
- Test mode: produce kubectl/curl sequences with expected states.

## Artifacts and canonical docs

- `MASTER_PLAN.md` remains high-level.
- Canonical infra execution docs live under `docs/plans/infra/`.
- `docs/0_triage/goals/setup-infra.md` is the intake backlog for infra.

## Conductor integration (future)

`conductor` should eventually:
- pre-process human intent into a structured job request
- maintain durable state (mode, artifacts, approvals)
- enforce approval gates

But v0 does not require conductor involvement.

## Acceptance criteria (for this feature doc)

- [ ] Modes and transitions are explicitly defined.
- [ ] Delegation roles are explicitly defined.
- [ ] “Ready to send” operations are defined with required fields.
- [ ] v0 scope is clearly limited to coder mode.

## Open questions

- How are modes represented in UI (tabs, stepper, buttons)?
- Should “ready to send” blocks be serialized (YAML/JSON) for conductor later?
- Do we need a repo-local DSL for ops blocks (to make them machine-readable)?
