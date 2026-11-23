---
status: DRAFT
teams: []
roles: []
authors:
  - JamesXNelson
lastUpdated: 2026-02-17T00:00:00Z
lifecycle: TRIAGE
maturity: NONE
verification:
  - "(manual) Dev infra can be created from scratch via Terraform and verified via the checklist"
---

# Kube infra dev — acceptance + verification checklist

This checklist defines acceptance criteria and suggested verification steps for the **dev** environment built from Terraform.

Source of truth build plan:
- `docs/plans/kube-infra.md`

Terraform root modules:
- `infra/terraform/envs/dev-foundation/`
- `infra/terraform/envs/dev-k8s/`

## Acceptance criteria

### Terraform
- [ ] `terraform init` succeeds for `infra/terraform/envs/dev-foundation/`.
- [ ] `terraform plan` succeeds for `infra/terraform/envs/dev-foundation/`.
- [ ] `terraform apply` succeeds for `infra/terraform/envs/dev-foundation/`.
- [ ] `terraform init` succeeds for `infra/terraform/envs/dev-k8s/`.
- [ ] `terraform plan` succeeds for `infra/terraform/envs/dev-k8s/`.
- [ ] `terraform apply` succeeds for `infra/terraform/envs/dev-k8s/`.

### Cluster ready
- [ ] GKE Autopilot cluster exists and is reachable.
- [ ] `kubectl` access works with the expected context.

### cert-manager ready
- [ ] cert-manager components are installed and Ready.

### Issuer ready
- [ ] The ACME ClusterIssuer/Issuer is created.
- [ ] Issuer reports Ready.

### Certificate issued
- [ ] A `Certificate` for `conductor-dev.<domain>` exists.
- [ ] `Certificate` becomes Ready and a TLS secret exists.

### Gateway programmed
- [ ] Envoy Gateway components are installed and Ready.
- [ ] GatewayClass exists and is Accepted.
- [ ] Gateway exists and is Programmed.

### Route accepted
- [ ] HTTPRoute exists and is Accepted.

### DNS resolves
- [ ] `A conductor-dev.<domain>` resolves to the gateway static IP.

### HTTPS serves expected payload
- [ ] `https://conductor-dev.<domain>/` returns the expected placeholder payload.

## Suggested verification steps (do not run automatically)

### Terraform
- `terraform -chdir=infra/terraform/envs/dev-foundation init`
- `terraform -chdir=infra/terraform/envs/dev-foundation plan`
- `terraform -chdir=infra/terraform/envs/dev-foundation apply`
- `terraform -chdir=infra/terraform/envs/dev-k8s init`
- `terraform -chdir=infra/terraform/envs/dev-k8s plan`
- `terraform -chdir=infra/terraform/envs/dev-k8s apply`

### Cluster access
- `kubectl config get-contexts`
- `kubectl --context "${KUBE_CONTEXT}" get nodes`

### cert-manager
- `kubectl --context "${KUBE_CONTEXT}" get pods -n cert-manager`
- `kubectl --context "${KUBE_CONTEXT}" get crds | grep cert-manager`

### Issuer + Certificate
- `kubectl --context "${KUBE_CONTEXT}" get clusterissuer,issuer -A`
- `kubectl --context "${KUBE_CONTEXT}" describe clusterissuer <name>`
- `kubectl --context "${KUBE_CONTEXT}" get certificate -A`
- `kubectl --context "${KUBE_CONTEXT}" describe certificate <name>`

### Gateway API
- `kubectl --context "${KUBE_CONTEXT}" get gatewayclass`
- `kubectl --context "${KUBE_CONTEXT}" get gateway -A`
- `kubectl --context "${KUBE_CONTEXT}" describe gateway -n <ns> <name>`
- `kubectl --context "${KUBE_CONTEXT}" get httproute -A`
- `kubectl --context "${KUBE_CONTEXT}" describe httproute -n <ns> <name>`

### DNS + HTTPS
- `dig +short conductor-dev.<domain> A`
- `curl -vk https://conductor-dev.<domain>/`
