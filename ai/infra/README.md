# ai/infra starter

This is a bash-first, idempotent-ish scaffolding for provisioning a **GKE Autopilot** cluster and base addons.

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

# required
export GOOGLE_PROJECT_ID="we-the-internet"
export GKE_ZONE="northamerica-northeast2-a"
export GKE_CLUSTER_NAME="wti-wip"
export ADMIN_IP_CIDR="67.225.49.153/32"

# required for kubectl commands used by tasks
export KUBE_CONTEXT="gke_${GOOGLE_PROJECT_ID}_${GKE_ZONE}_${GKE_CLUSTER_NAME}"

# optional (defaults shown)
export GKE_NETWORK_NAME="wti-ai-net"
export GKE_SUBNET_NAME="wti-ai-subnet"
export GKE_SUBNET_CIDR="10.44.0.0/24"
export GKE_PODS_RANGE_NAME="pods"
export GKE_PODS_CIDR="10.44.8.0/21"
export GKE_SERVICES_RANGE_NAME="services"
export GKE_SERVICES_CIDR="10.44.4.0/23"

# Run tasks (safe to re-run; each task does best-effort "check then create")
./bin/run-all.sh
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
