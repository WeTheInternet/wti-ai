# Terraform infra

This directory contains Terraform code to build the **dev** GKE environment from scratch.

## Layout

- `infra/terraform/envs/dev-foundation/` — dev foundation (GCP only)
- `infra/terraform/envs/dev-k8s/` — dev Kubernetes add-ons + baseline manifests
- `infra/terraform/modules/` — reusable modules

## Bootstrap permissions

If Terraform fails with permission errors (for example `iam.serviceAccounts.create`), you can use the bootstrap helper to verify your gcloud identity and (optionally) grant your user enough IAM in the target project.

From repo root:

```bash
export GOOGLE_PROJECT_ID=we-the-internet
export GCLOUD_ACCOUNT=you@example.com

# Verify account + show whether roles are present
./ai/infra/bin/bootstrap-terraform-gcp.sh check

# Grant roles to your user (or set TARGET_PRINCIPAL=serviceAccount:...)
./ai/infra/bin/bootstrap-terraform-gcp.sh apply

# Revoke roles it added (best-effort)
./ai/infra/bin/bootstrap-terraform-gcp.sh revoke
```

## End-to-end usage (dev)

### 1) Configure inputs

Edit:
- `infra/terraform/envs/dev-foundation/terraform.tfvars`
- `infra/terraform/envs/dev-k8s/terraform.tfvars`

### 2) Init + plan + apply

From repo root:

1) Foundation:
- `terraform -chdir=infra/terraform/envs/dev-foundation init`
- `terraform -chdir=infra/terraform/envs/dev-foundation plan`
- `terraform -chdir=infra/terraform/envs/dev-foundation apply`

2) Kubernetes:
- `terraform -chdir=infra/terraform/envs/dev-k8s init`
- `terraform -chdir=infra/terraform/envs/dev-k8s plan`
- `terraform -chdir=infra/terraform/envs/dev-k8s apply`

### 3) Outputs

- `terraform -chdir=infra/terraform/envs/dev-foundation output`
- `terraform -chdir=infra/terraform/envs/dev-k8s output`

### 4) Suggested verification

- `kubectl get pods -n cert-manager`
- `kubectl get pods -n envoy-gateway-system`
- `kubectl get clusterissuer,issuer -A`
- `kubectl get certificate -A`
- `kubectl get gatewayclass`
- `kubectl get gateway -A`
- `kubectl get httproute -A`
- `dig +short conductor.<domain> A`
- `curl -vk https://conductor.<domain>/`

## State

Dev uses local state by default.

A GCS backend is intentionally easy to enable later by replacing the local backend blocks in:
- `envs/dev-foundation/backend.tf`
- `envs/dev-k8s/backend.tf`
