---
status: DRAFT
teams: []
roles: []
authors:
  - JamesXNelson
lastUpdated: 2026-02-16T00:00:00Z
lifecycle: TRIAGE
maturity: NONE
verification:
  - "(manual) Backlog items have acceptance criteria and owners/questions are explicit"
---

# Setup infra (triage)

## Context / current reality

Dev infra is now built via Terraform:
- `infra/terraform/envs/dev/`

Legacy bash scaffolding remains but is not the authoritative dev path:
- `ai/infra/README.md`
- `ai/infra/tasks/*.sh`

## Dev goal

Deliver a single reviewed and repeatable Terraform plan that provisions dev from scratch with zero manual steps and results in a working HTTPS endpoint:
- `https://conductor-dev.wti.net/`

Authoritative plan:
- `docs/plans/kube-infra.md`

## Open questions (with owner)

- Cloud DNS delegation status for `wti.net` (is `wti-net` authoritative for public DNS?) — owner: TBD
- GatewayClass name for Envoy Gateway chart in this cluster — owner: infra agent
- Allowlist enforcement mechanism for `mcp.wti.net` / `conductor-dev.wti.net` (Gateway policy vs Cloud Armor vs other) — owner: TBD

## Backlog items (prioritized)

### P0 — Hello-world behind Envoy Gateway with TLS (DNS-01)

Why it matters:
- Proves edge routing + TLS termination + cert automation with the selected stack.

Acceptance criteria:
- `A conductor-dev.wti.net` points to `${GKE_CLUSTER_NAME}-gw-ip`.
- cert-manager issues a certificate for `conductor-dev.wti.net` via DNS-01 Cloud DNS and `Certificate` is `Ready=True`.
- Envoy Gateway `Gateway` listens on 443 and terminates TLS using the secret.
- `HTTPRoute` forwards `/` to a placeholder Service.
- `curl -vk https://conductor-dev.wti.net/` returns the placeholder payload.

Dependencies:
- Static IP reserved.
- Cloud DNS zone exists.
- DNS permissions + credentials secret created.

Suggested implementation home:
- Manifests: `ai/infra/manifests/`
- Tasks: `ai/infra/tasks/055-...` and `070-...`
- Runbook: `docs/plans/kube-infra.md`

### P1 — Allowlist enforcement

Why it matters:
- Reduces blast radius for exposed tool endpoints and admin surfaces.

Acceptance criteria:
- Enforced allowlist at edge for `mcp.wti.net` and home IP-only for `demo.wti.net` + `conductor-dev.wti.net`.
- Documented source of truth and update mechanism for OpenAI CIDRs.

Dependencies:
- Decide mechanism (Gateway policy vs Cloud Armor).

Suggested implementation home:
- Docs + plan under `docs/plans/infra/`.

### P1 — Workspace storage (RWX) and repo-sync

Why it matters:
- Enables the intended 1-writer/many-readers repo access pattern.

Acceptance criteria:
- RWX volume provisioned (Filestore CSI) mounted at `/opt/workspace`.
- repo-sync pod updates workspace; MCP mounts read-only.

Dependencies:
- Storage decision + sizing.

## Promotion criteria

Promote an item into `docs/goals/<...>.md` when:
- owner is assigned
- acceptance criteria are stable
- approach is chosen (even if details are deferred)
- a concrete plan/runbook location is identified
