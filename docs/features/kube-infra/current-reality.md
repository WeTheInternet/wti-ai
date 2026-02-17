---
status: DRAFT
teams: []
roles: []
authors:
  - JamesXNelson
lastUpdated: 2026-02-17T00:00:00Z
verification:
  - "(manual) Describes current scripts as legacy and Terraform as source of truth for dev"
---

# Current reality: Terraform-first dev build

Dev infra is provisioned by Terraform:
- `infra/terraform/envs/dev/`

The legacy bash scaffolding remains in the repo:
- `ai/infra/tasks/*.sh`
- `ai/infra/manifests/**`

For dev, treat those scripts/manifests as reference only.

## Explicit flags policy

This policy remains in effect for any manual inspection commands.

### gcloud

- Cluster-wide operations use `--region "${GKE_REGION}"`.
- GCE operations use `--zone "${GKE_ZONE}"`.
- Cloud DNS operations use `--dns-zone "${DNS_ZONE}"`.
- All `gcloud` commands include `--project "${GOOGLE_PROJECT_ID}"`.

### kubectl

- Always include `--context "${KUBE_CONTEXT}"`.
- Always include `--namespace "${KUBE_NAMESPACE}"` for namespaced operations.
- Use `-A` only when explicitly listing across namespaces.
