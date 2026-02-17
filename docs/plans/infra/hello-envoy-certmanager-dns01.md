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

## Authority / trust

This document is `status: DRAFT` and is not authoritative.

## Assumptions / prerequisites

- GKE Autopilot cluster exists and kube credentials work.
- `ai/infra/tasks/050-cert-manager.sh` has installed cert-manager.
- `ai/infra/tasks/060-envoy-gateway.sh` has installed Envoy Gateway.
- A zonal/regionally-scoped static external IP is reserved as `${GKE_CLUSTER_NAME}-gw-ip`.
- A Cloud DNS managed zone for `wti.net` exists.

## Required parameters (no defaults)

All commands below must be run with explicit parameters.

Environment templates:

```bash
export GOOGLE_PROJECT_ID="<gcp-project-id>"
export GKE_ZONE="<gcp-zone>"                       # e.g. northamerica-northeast2-a
export GKE_CLUSTER_NAME="<cluster-name>"            # e.g. wti-wip

export KUBE_CONTEXT="<kubectl-context-name>"         # e.g. gke_${GOOGLE_PROJECT_ID}_${GKE_ZONE}_${GKE_CLUSTER_NAME}
export KUBE_NAMESPACE="wti-ai"                       # for namespaced kubectl commands
```

Notes:
- Any `gcloud ...` examples must include `--project` and `--zone`.
- Any `kubectl ...` examples must include `--context` and `--namespace` (or be explicitly cluster-scoped like `-A`).

## Approval gates (must be explicit)

1) Creating a GCP service account key JSON for DNS-01.
2) Creating the Kubernetes Secret containing that key.
3) Creating/updating the public DNS `A` record for `conductor.wti.net`.

## Files in this repo

Manifests:
- `ai/infra/manifests/cert-manager/10-clusterissuer-letsencrypt-dns01.yaml`
- `ai/infra/manifests/wti-ai/*.yaml`

Tasks:
- `ai/infra/tasks/055-clouddns-dns01-issuer.sh`
- `ai/infra/tasks/070-conductor-gateway-placeholder.sh`

## Execution spec (infra agent)

### 1) Install base infra (existing scripts)

Run:

```bash
cd ai/infra

./bin/run-task.sh 010-apis.sh
./bin/run-task.sh 020-network.sh
./bin/run-task.sh 030-cluster-autopilot.sh
./bin/run-task.sh 040-static-ips.sh
./bin/run-task.sh 050-cert-manager.sh
./bin/run-task.sh 060-envoy-gateway.sh
```

Record the reserved IP address:
- `${GKE_CLUSTER_NAME}-gw-ip`

### 2) Cloud DNS DNS-01 bootstrap (IAM)

Run:

```bash
cd ai/infra
./bin/run-task.sh 055-clouddns-dns01-issuer.sh
```

### 3) Approval-gated: create SA key JSON and k8s Secret

Create a service account key JSON locally (do not commit) and create the Secret:
- Secret namespace: `cert-manager`
- Secret name: `clouddns-dns01-svc-acct`
- Secret key: `key.json`

Command templates:

```bash
cd ai/infra
mkdir -p ./secrets

gcloud iam service-accounts keys create ./secrets/clouddns-dns01-key.json \
  --project "${GOOGLE_PROJECT_ID}" \
  --zone "${GKE_ZONE}" \
  --iam-account "cert-manager-dns01@${GOOGLE_PROJECT_ID}.iam.gserviceaccount.com"

kubectl --context "${KUBE_CONTEXT}" --namespace cert-manager create secret generic clouddns-dns01-svc-acct \
  --from-file=key.json=./secrets/clouddns-dns01-key.json
```

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

```bash
kubectl --context "${KUBE_CONTEXT}" get gatewayclass
```

If the installed GatewayClass is not `envoy-gateway`, update `spec.gatewayClassName` accordingly.

### 6) Approval-gated: set public DNS A record

Create/update:
- `A conductor.wti.net -> <reserved static IP>`

### 7) Apply manifests

Run:

```bash
cd ai/infra
./bin/run-task.sh 070-conductor-gateway-placeholder.sh
```

### 8) Verification checklist (manual)

GatewayClass / Gateway:

```bash
kubectl --context "${KUBE_CONTEXT}" get gatewayclass
kubectl --context "${KUBE_CONTEXT}" --namespace "${KUBE_NAMESPACE}" get gateway
kubectl --context "${KUBE_CONTEXT}" --namespace "${KUBE_NAMESPACE}" describe gateway conductor-gateway
```

HTTPRoute:

```bash
kubectl --context "${KUBE_CONTEXT}" --namespace "${KUBE_NAMESPACE}" get httproute
kubectl --context "${KUBE_CONTEXT}" --namespace "${KUBE_NAMESPACE}" describe httproute conductor
```

cert-manager:

```bash
kubectl --context "${KUBE_CONTEXT}" --namespace "${KUBE_NAMESPACE}" get certificate
kubectl --context "${KUBE_CONTEXT}" --namespace "${KUBE_NAMESPACE}" describe certificate conductor-wti-net
kubectl --context "${KUBE_CONTEXT}" get order,challenge -A
```

DNS:

```bash
dig A conductor.wti.net
```

HTTPS:

```bash
curl -vk https://conductor.wti.net/
```

## Rollback

Delete in reverse dependency order:

```bash
kubectl --context "${KUBE_CONTEXT}" --namespace "${KUBE_NAMESPACE}" delete httproute conductor
kubectl --context "${KUBE_CONTEXT}" --namespace "${KUBE_NAMESPACE}" delete gateway conductor-gateway
kubectl --context "${KUBE_CONTEXT}" --namespace "${KUBE_NAMESPACE}" delete certificate conductor-wti-net
kubectl --context "${KUBE_CONTEXT}" --namespace "${KUBE_NAMESPACE}" delete deployment,service conductor-placeholder

kubectl --context "${KUBE_CONTEXT}" delete clusterissuer letsencrypt-dns01
kubectl --context "${KUBE_CONTEXT}" --namespace cert-manager delete secret clouddns-dns01-svc-acct
```
