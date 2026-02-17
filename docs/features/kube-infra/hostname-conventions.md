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
  - "(manual) Conductor hostname matches environment"
---

# Kube infra hostnames

## Convention

Conductor hostnames are environment-suffixed for non-prod:

- dev: `conductor-dev.wti.net`
- uat: `conductor-uat.wti.net`
- prod (future): `conductor.wti.net`

Terraform inputs:
- `conductor_hostname` in `infra/terraform/envs/<env>-foundation/terraform.tfvars`
- `conductor_hostname` in `infra/terraform/envs/<env>-k8s/terraform.tfvars`
