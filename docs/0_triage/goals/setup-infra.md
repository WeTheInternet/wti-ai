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

What exists now:
- `ai/infra/tasks/010-apis.sh`
- `ai/infra/tasks/020-network.sh`
- `ai/infra/tasks/030-cluster-autopilot.sh`
- `ai/infra/tasks/040-static-ips.sh` (reserves `${GKE_CLUSTER_NAME}-gw-ip`)
- `ai/infra/tasks/050-cert-manager.sh`
- `ai/infra/tasks/055-clouddns-dns01-issuer.sh`
- `ai/infra/tasks/060-envoy-gateway.sh` (installs Envoy Gateway but does not create Gateway/HTTPRoute)
- `ai/infra/tasks/070-conductor-gateway-placeholder.sh`

What is missing for the Phase 0 edge vertical slice:
- Cloud DNS details for `wti.net` (zone name, project, delegation status)
- A single reviewed and repeatable path that makes `https://conductor.wti.net` serve a payload

Reference plan/runbook (non-authoritative):
- `docs/plans/infra/hello-envoy-certmanager-dns01.md`

## Open questions (with owner)

- Managed zone details for `wti.net` (zone name, project, delegation status) — owner: TBD
- Credential strategy: SA key JSON now vs Workload Identity now — owner: TBD
- GatewayClass name in the installed Envoy Gateway chart (confirm via `kubectl get gatewayclass`) — owner: infra agent
- Allowlist enforcement mechanism for `mcp.wti.net` / `conductor.wti.net` (Gateway policy vs Cloud Armor vs other) — owner: TBD

## Backlog items (prioritized)

### P0 — Hello-world behind Envoy Gateway with TLS (DNS-01)

Why it matters:
- Proves edge routing + TLS termination + cert automation with the selected stack.

Acceptance criteria:
- `A conductor.wti.net` points to `${GKE_CLUSTER_NAME}-gw-ip`.
- cert-manager issues a certificate for `conductor.wti.net` via DNS-01 Cloud DNS and `Certificate` is `Ready=True`.
- Envoy Gateway `Gateway` listens on 443 and terminates TLS using the secret.
- `HTTPRoute` forwards `/` to a placeholder Service.
- `curl -vk https://conductor.wti.net/` returns the placeholder payload.

Dependencies:
- Static IP reserved.
- Cloud DNS zone exists.
- DNS permissions + credentials secret created.

Suggested implementation home:
- Manifests: `ai/infra/manifests/`
- Tasks: `ai/infra/tasks/055-...` and `070-...`
- Runbook: `docs/plans/infra/hello-envoy-certmanager-dns01.md`

### P1 — Allowlist enforcement

Why it matters:
- Reduces blast radius for exposed tool endpoints and admin surfaces.

Acceptance criteria:
- Enforced allowlist at edge for `mcp.wti.net` and home IP-only for `demo.wti.net` + `conductor.wti.net`.
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
