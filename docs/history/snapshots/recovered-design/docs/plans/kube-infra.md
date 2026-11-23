---
status: DRAFT
teams: []
roles: []
authors:
  - JamesXNelson
lastUpdated: 2026-02-17T00:00:00Z
lifecycle: SPECCED
maturity: NONE
verification:
  - "(manual) Terraform plan provisions dev infra and kube addons with zero manual steps"
---

# Kube infra (dev build plan)

## Goal

Build the **dev** environment from scratch using Terraform.

Terraform is the source of truth for:
- GCP: APIs, VPC/subnet + secondary ranges, GKE Autopilot cluster, static IP, Cloud DNS zone + A record
- Kubernetes: cert-manager + Envoy Gateway + baseline manifests for `conductor.<domain>`

`ai/infra/` bash remains in the repo but is not the authoritative build path for dev.

## Environment standardization

The environment name is **dev**.

Do not use `wip` for the dev-from-scratch environment.

## Hard requirements (explicit flags)

Do not rely on any implicit/default configuration.

This policy is retained even though Terraform should minimize CLI usage.

### gcloud

All `gcloud` commands MUST specify:
- `--project "${GOOGLE_PROJECT_ID}"`

And, depending on what you are operating on:
- Cluster-wide/GKE operations: `--region "${GKE_REGION}"`
- GCE operations: `--zone "${GKE_ZONE}"`
- Cloud DNS operations: `--dns-zone "${DNS_ZONE}"`

### kubectl

All `kubectl` commands MUST specify:
- `--context "${KUBE_CONTEXT}"`

Namespaced operations MUST specify:
- `--namespace "${KUBE_NAMESPACE}"`

## How to build dev

### Prereqs

- Terraform >= 1.6
- `gcloud` authenticated for `${project_id}`
- `kubectl`

### 1) Configure inputs

Edit:
- `infra/terraform/envs/dev-foundation/terraform.tfvars`
- `infra/terraform/envs/dev-k8s/terraform.tfvars`

### 2) Init + plan + apply

Run from repo root:

1) Foundation:
- `terraform -chdir=infra/terraform/envs/dev-foundation init`
- `terraform -chdir=infra/terraform/envs/dev-foundation plan`
- `terraform -chdir=infra/terraform/envs/dev-foundation apply`

2) Kubernetes:
- `terraform -chdir=infra/terraform/envs/dev-k8s init`
- `terraform -chdir=infra/terraform/envs/dev-k8s plan`
- `terraform -chdir=infra/terraform/envs/dev-k8s apply`

## How to verify

Suggested checks (do not run automatically):

- `terraform -chdir=infra/terraform/envs/dev output`
- `kubectl get pods -n cert-manager`
- `kubectl get pods -n envoy-gateway-system`
- `kubectl get clusterissuer,issuer -A`
- `kubectl get certificate -A`
- `kubectl get gatewayclass`
- `kubectl get gateway -A`
- `kubectl get httproute -A`
- `dig +short conductor.<domain> A`
- `curl -vk https://conductor.<domain>/`

## Dev build (Terraform)

### 1) Inputs

Terraform dev inputs live at:
- `infra/terraform/envs/dev-foundation/terraform.tfvars`
- `infra/terraform/envs/dev-k8s/terraform.tfvars`

Defaults taken from repo:
- Project: `we-the-internet`
- Region/zone: `northamerica-northeast2` / `northamerica-northeast2-a`
- Cluster name: `wti-dev`
- DNS zone name: `wti-net`
- DNS domain: `wti.net`
- Hostname: `conductor-dev.wti.net`

### 2) Apply

Run Terraform in order:
- `infra/terraform/envs/dev-foundation/`
- `infra/terraform/envs/dev-k8s/`

Terraform provisions:
- Project services/APIs
- VPC + subnet + secondary ranges
- GKE Autopilot cluster
- Regional static IP for gateway
- Cloud DNS managed zone + `A conductor.<domain> -> <static ip>`
- cert-manager via Helm
- cert-manager DNS01 IAM via Workload Identity (no SA key JSON, no Secret)
- Envoy Gateway via Helm
- Placeholder app + Certificate + Gateway + HTTPRoute

### 3) Outputs

The env outputs include:
- `gateway_static_ip`
- `conductor_a_record`
- cluster endpoint/name

## Architecture notes

### cert-manager DNS01 (no manual secrets)

DNS01 is configured using GKE Workload Identity:
- A Google service account is created and granted `roles/dns.admin`.
- The cert-manager Kubernetes service account is annotated with `iam.gke.io/gcp-service-account`.
- An IAM binding grants `roles/iam.workloadIdentityUser` to `cert-manager/cert-manager`.

No service account key JSON is created.
No Kubernetes Secret is required for Cloud DNS credentials.

### State

Dev uses local state (`backend "local"`).

A GCS backend can be enabled later by editing:
- `infra/terraform/envs/dev-foundation/backend.tf`
- `infra/terraform/envs/dev-k8s/backend.tf`
