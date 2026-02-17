---
status: DRAFT
teams: []
roles: []
authors:
  - JamesXNelson
lastUpdated: 2026-02-16T00:00:00Z
lifecycle: SPECCED
maturity: NONE
verification:
  - "(manual) Infra agent can follow steps to reach a working https endpoint"
---

# Hello-world behind Envoy Gateway with cert-manager DNS-01 (Cloud DNS)

## Outcome

Serve HTTPS for `conductor.wti.net` through Envoy Gateway with TLS issued by cert-manager via DNS-01 using Google Cloud DNS, routing to a placeholder backend.

## Assumptions / prerequisites

- GKE Autopilot cluster exists and kube credentials work.
- `ai/infra/tasks/050-cert-manager.sh` has installed cert-manager.
- `ai/infra/tasks/060-envoy-gateway.sh` has installed Envoy Gateway.
- A regional static external IP is reserved as `${GKE_CLUSTER_NAME}-gw-ip`.
- A Cloud DNS managed zone for `wti.net` exists.

## Approval gates (must be explicit)

1) Creating a GCP service account key JSON for DNS-01.
2) Creating the Kubernetes Secret containing that key.
3) Creating/updating the public DNS `A` record for `conductor.wti.net`.

## Files in this repo

Manifests (new):
- `ai/infra/manifests/cert-manager/10-clusterissuer-letsencrypt-dns01.yaml`
- `ai/infra/manifests/wti-ai/*.yaml`

Tasks (new):
- `ai/infra/tasks/055-clouddns-dns01-issuer.sh`
- `ai/infra/tasks/070-conductor-gateway-placeholder.sh`

## Execution spec (infra agent)

### 1) Install base infra (existing scripts)

Run:
- `ai/infra/bin/run-task.sh 010-apis.sh`
- `ai/infra/bin/run-task.sh 020-network.sh`
- `ai/infra/bin/run-task.sh 030-cluster-autopilot.sh`
- `ai/infra/bin/run-task.sh 040-static-ips.sh`
- `ai/infra/bin/run-task.sh 050-cert-manager.sh`
- `ai/infra/bin/run-task.sh 060-envoy-gateway.sh`

Record the reserved IP address:
- `${GKE_CLUSTER_NAME}-gw-ip`

### 2) Cloud DNS DNS-01 bootstrap (IAM)

Run:
- `ai/infra/bin/run-task.sh 055-clouddns-dns01-issuer.sh`

This ensures the service account exists and has Cloud DNS permissions.

### 3) Approval-gated: create SA key JSON and k8s Secret

Create a service account key JSON locally (do not commit) and create the Secret:
- Secret namespace: `cert-manager`
- Secret name: `clouddns-dns01-svc-acct`
- Secret key: `key.json`

Template reference:
- `ai/infra/manifests/_templates/cert-manager/secret-clouddns-dns01-svc-acct.yaml`

### 4) Configure ClusterIssuer manifest

Edit:
- `ai/infra/manifests/cert-manager/10-clusterissuer-letsencrypt-dns01.yaml`

Set:
- `spec.acme.email`
- `spec.acme.solvers[0].dns01.cloudDNS.project`

Initial testing should use Let's Encrypt staging.

### 5) Configure Gateway manifest (static IP)

Edit:
- `ai/infra/manifests/wti-ai/40-gateway-conductor.yaml`

Set:
- `spec.addresses[0].value` to the reserved static IP.

Confirm the correct GatewayClass name:
- If `kubectl get gatewayclass` does not show `envoy-gateway`, update `spec.gatewayClassName` accordingly.

### 6) Approval-gated: set public DNS A record

Create/update:
- `A conductor.wti.net -> <reserved static IP>`

### 7) Apply manifests

Run:
- `ai/infra/bin/run-task.sh 070-conductor-gateway-placeholder.sh`

### 8) Verification checklist (manual)

- GatewayClass / Gateway:
  - `kubectl get gatewayclass`
  - `kubectl get gateway -n wti-ai`
  - `kubectl describe gateway -n wti-ai conductor-gateway`

- HTTPRoute:
  - `kubectl get httproute -n wti-ai`
  - `kubectl describe httproute -n wti-ai conductor`

- cert-manager:
  - `kubectl get certificate -n wti-ai`
  - `kubectl describe certificate -n wti-ai conductor-wti-net`
  - `kubectl get order,challenge -A`

- DNS:
  - `dig A conductor.wti.net`

- HTTPS:
  - `curl -vk https://conductor.wti.net/`

## Rollback

Delete in reverse dependency order:

- `kubectl delete httproute -n wti-ai conductor`
- `kubectl delete gateway -n wti-ai conductor-gateway`
- `kubectl delete certificate -n wti-ai conductor-wti-net`
- `kubectl delete deployment,service -n wti-ai conductor-placeholder`

If needed:
- `kubectl delete clusterissuer letsencrypt-dns01`
- `kubectl -n cert-manager delete secret clouddns-dns01-svc-acct`
