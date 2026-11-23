# ai/infra

This directory contains optional bash helpers for provisioning a GKE Autopilot cluster and addons.

Terraform is the authoritative path for building dev:
- `infra/terraform/envs/dev/`

## Quick start

### Prereqs: Node + pnpm

- Use Node LTS 22 (Theia is not compatible with Node 24).
- Enable pnpm via corepack.

```bash
cd ai/infra

./bin/ensure-pnpm.sh
```

```bash
cd ai/infra

# required per-run operator input
export ADMIN_IP_CIDR="67.225.49.153/32"

./bin/run-all.sh dev
```

## Environment mapping

`./bin/run-all.sh <env>` loads its configuration from `ai/infra/env/<env>.env`.

For dev builds, prefer Terraform (`infra/terraform/envs/dev/`).

The mapping file provides explicit values (no reliance on shell defaults), including:
- `GOOGLE_PROJECT_ID`, `GKE_REGION`, `GKE_ZONE`, `GKE_CLUSTER_NAME`
- `KUBE_CONTEXT`, `KUBE_NAMESPACE`
- `DNS_ZONE`
- network/subnet CIDRs
- `TERRAFORM_ENV_DIR` (printed/suggested; Terraform is not executed)

Override any value by exporting it before running `./bin/run-all.sh`.

Example override:

```bash
cd ai/infra

export ADMIN_IP_CIDR="67.225.49.153/32"
export DNS_ZONE="wti-net"

./bin/run-all.sh dev
```

## Tasks

- `010-apis.sh` – enable required APIs
- `020-network.sh` – create VPC + subnet + secondary ranges
- `030-cluster-autopilot.sh` – create Autopilot cluster with master authorized networks
- `040-static-ips.sh` – reserve static external IPs (regional)
- `050-cert-manager.sh` – install cert-manager via Helm
- `055-clouddns-dns01-issuer.sh` – prepare Cloud DNS DNS-01 service account + IAM binding
- `060-envoy-gateway.sh` – install Envoy Gateway via Helm
- `070-conductor-gateway-placeholder.sh` – apply placeholder + Gateway API manifests for conductor.wti.net

Logs go to `ai/infra/logs/` (gitignored).
