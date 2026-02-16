#!/usr/bin/env bash
set -Eeuo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)/lib/wti-gcloud.sh"
start_task_log "040-static-ips"

ensure_gcloud_context
validate_var GKE_CLUSTER_NAME "Set GKE_CLUSTER_NAME (e.g. wti-wip)"

# Reserve static external IP(s) with names derived from cluster name.
# You can add more later (demo/agent), but we start with the Envoy Gateway LB.
GW_IP_NAME="${GW_IP_NAME:-${GKE_CLUSTER_NAME}-gw-ip}"

ensure_gcloud "Static external IP ${GW_IP_NAME} (regional)" \
  compute addresses describe "$GW_IP_NAME" --region "$GKE_REGION" \
  -- \
  compute addresses create "$GW_IP_NAME" --region "$GKE_REGION"

GW_IP_ADDR="$(_gc compute addresses describe "$GW_IP_NAME" --region "$GKE_REGION" --format='value(address)')"
_log "Reserved $GW_IP_NAME = $GW_IP_ADDR"
