---
status: DRAFT
owner: wti
reviewed-by: TBD
review-date: TBD
verification:
  - "(manual) Checklist used to validate a fresh cluster"
changelog:
  - 2026-02-16: Initial draft
---

# Infra Acceptance Criteria (WIP)

## Scope
Bring up a GKE Autopilot WIP cluster with Envoy Gateway + cert-manager, and prove HTTPS routing to at least one hello-world service.

## DNS prerequisites
- Domains/hosts (no wildcard certs):
  - `conductor.wti.net`
  - `demo.wti.net`
  - `mcp.wti.net`
- DNS A records:
  - Point each hostname to the reserved external IP for the Envoy Gateway listener.

## TLS issuance
- Use Let’s Encrypt with **DNS-01** validation.
- DNS provider: **Google Cloud DNS**.
- cert-manager configuration includes:
  - a ClusterIssuer or Issuer configured for CloudDNS DNS-01
  - Kubernetes Secret containing CloudDNS service account credentials

## Gateway routing
- Envoy Gateway installed via Helm.
- Gateway API resources present:
  - `GatewayClass` available
  - `Gateway` with listener(s) for 443
  - `HTTPRoute` rules for host-based routing

## Access policy (day 1)
- `conductor.wti.net` restricted to HOME_IP allowlist.
- `demo.wti.net` restricted to HOME_IP allowlist.
- `mcp.wti.net` restricted to HOME_IP allowlist.

## Observability (minimal)
- Logs retrievable via `kubectl logs`.
- Readiness checks pass for:
  - cert-manager components
  - envoy-gateway components

## Definition of Done
- [ ] `kubectl get pods -A | grep cert-manager` shows Running/Ready pods
- [ ] `kubectl get pods -A | grep envoy-gateway` shows Running/Ready pods
- [ ] `kubectl get gatewayclass` shows an Envoy Gateway GatewayClass
- [ ] DNS A records exist for `conductor.wti.net`, `demo.wti.net`, `mcp.wti.net`
- [ ] A certificate is issued for at least one hostname using DNS-01
- [ ] `curl -vk https://conductor.wti.net/` returns expected hello response
