#!/usr/bin/env bash
set -Eeuo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)/lib/wti-gcloud.sh"
start_task_log "030-cluster-autopilot"

ensure_gcloud_context

validate_var ADMIN_IP_CIDR "Set ADMIN_IP_CIDR (e.g. 67.225.49.153/32) to lock down control-plane access"
validate_var GKE_CLUSTER_NAME "Set GKE_CLUSTER_NAME (e.g. wti-wip)"

GKE_NETWORK_NAME="${GKE_NETWORK_NAME:-wti-ai-net}"
GKE_SUBNET_NAME="${GKE_SUBNET_NAME:-wti-ai-subnet}"
GKE_PODS_RANGE_NAME="${GKE_PODS_RANGE_NAME:-pods}"
GKE_SERVICES_RANGE_NAME="${GKE_SERVICES_RANGE_NAME:-services}"

if gcloud_resource_exists container clusters describe "$GKE_CLUSTER_NAME" --region "$GKE_REGION"; then
  _log "Exists: Autopilot cluster $GKE_CLUSTER_NAME"
  exit 0
fi

_log "Creating Autopilot cluster $GKE_CLUSTER_NAME in $GKE_REGION"
# Notes:
# - master authorized networks is supported on GKE (including Autopilot) and is a key best practice. citeturn0search1
_gc container clusters create-auto "$GKE_CLUSTER_NAME" \
  --region "$GKE_REGION" \
  --network "$GKE_NETWORK_NAME" \
  --subnetwork "$GKE_SUBNET_NAME" \
  --cluster-secondary-range-name "$GKE_PODS_RANGE_NAME" \
  --services-secondary-range-name "$GKE_SERVICES_RANGE_NAME" \
  --enable-master-authorized-networks \
  --master-authorized-networks "$ADMIN_IP_CIDR"

ensure_kube_credentials
_log "Cluster ready"
