#!/usr/bin/env bash
set -Eeuo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)/lib/wti-gcloud.sh"
start_task_log "020-network"

ensure_gcloud_context

# Network defaults (override via env)
GKE_NETWORK_NAME="${GKE_NETWORK_NAME:-wti-ai-net}"
GKE_SUBNET_NAME="${GKE_SUBNET_NAME:-wti-ai-subnet}"

# Primary range (nodes)
GKE_SUBNET_CIDR="${GKE_SUBNET_CIDR:-10.44.0.0/24}"

# Secondary ranges
GKE_PODS_RANGE_NAME="${GKE_PODS_RANGE_NAME:-pods}"
GKE_PODS_CIDR="${GKE_PODS_CIDR:-10.44.8.0/21}"          # 2048 pod IPs

GKE_SERVICES_RANGE_NAME="${GKE_SERVICES_RANGE_NAME:-services}"
GKE_SERVICES_CIDR="${GKE_SERVICES_CIDR:-10.44.4.0/23}"  # 512 service IPs

_log "Ensuring VPC network $GKE_NETWORK_NAME"
ensure_gcloud "VPC network $GKE_NETWORK_NAME" \
  compute networks describe "$GKE_NETWORK_NAME" \
  -- \
  compute networks create "$GKE_NETWORK_NAME" --subnet-mode=custom

_log "Ensuring subnet $GKE_SUBNET_NAME in $GKE_REGION ($GKE_SUBNET_CIDR)"
if gcloud_resource_exists compute networks subnets describe "$GKE_SUBNET_NAME" --region "$GKE_REGION"; then
  _log "Exists: subnet $GKE_SUBNET_NAME"
else
  _log "Creating: subnet $GKE_SUBNET_NAME with secondary ranges (pods/services)"
  _gc compute networks subnets create "$GKE_SUBNET_NAME" \
    --network "$GKE_NETWORK_NAME" \
    --region "$GKE_REGION" \
    --range "$GKE_SUBNET_CIDR" \
    --secondary-range "${GKE_PODS_RANGE_NAME}=${GKE_PODS_CIDR},${GKE_SERVICES_RANGE_NAME}=${GKE_SERVICES_CIDR}"
fi

_log "Network ready"
