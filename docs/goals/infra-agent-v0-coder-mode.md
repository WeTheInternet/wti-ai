---
status: DRAFT
teams: []
roles: []
authors:
  - JamesXNelson
lastUpdated: 2026-02-16T00:00:00Z
lifecycle: CONFIRMED
maturity: NONE
verification:
  - "(manual) Acceptance criteria can be verified with the listed commands/observations"
---

# Infra Agent v0: Coder mode

## Goal

Implement the first usable version of `@Infra` as a single agent operating in **Coder mode**, capable of producing complete infra patches that wire `ai/infra` scripts into a single canonical init path and finish the hello-world / gateway / cert-manager setup.

## Why this matters

- Reduces infra setup time by turning ambiguous scaffolding into a repeatable, reviewable patch stream.
- Establishes the agent workflow patterns (approval gates, operations blocks) before adding more automation.

## Scope

### In-scope

- `@Infra` in coder mode produces patches to:
  - connect task scripts to a canonical entrypoint (e.g. `01-init-gcloud.sh` or equivalent)
  - normalize shared helpers used by `ai/infra/tasks/*.sh`
  - create/maintain k8s manifests layer needed for edge vertical slice
  - update docs/runbooks to match

### Out-of-scope

- UI implementation of mode buttons (only specify the behavior for now).
- Conductor pre-processing/enforcement.
- Automatically running infra operations.

## Acceptance Criteria

- [ ] There is a single canonical script entry path for infra initialization (name TBD), and existing tasks can be driven from it.
- [ ] Tasks are safe to re-run (best-effort idempotency) and do not assume missing files.
- [ ] Infra agent outputs are structured as approval-gated “ready-to-send” operations.

## Dependencies

- `docs/features/infra-agent.md`
- Existing `ai/infra/` scaffolding.

## Proposed approach

- Define a minimal “ops block” schema for coder-mode outputs (human-readable now, serializable later).
- For each missing infra linkage, generate a patch and pair it with an ops block.

## Implementation plan link(s)

- TBD (create under `docs/plans/infra/` when ready)

## Verification

- Manual review that:
  - scripts reference existing files
  - scripts do not commit secrets
  - docs point to a single execution path

## Rollback

- Revert the patch series (git).
