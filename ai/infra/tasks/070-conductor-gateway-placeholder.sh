#!/usr/bin/env bash
set -Eeuo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)/lib/wti-gcloud.sh"
start_task_log "070-conductor-gateway-placeholder"

ensure_kube_credentials

MANIFESTS_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)/manifests"

_log "Applying manifests (cert-manager ClusterIssuer)"
_k8 apply -f "${MANIFESTS_DIR}/cert-manager/10-clusterissuer-letsencrypt-dns01.yaml"

_log "Applying manifests (wti-ai namespace + placeholder + cert + gateway + route)"
_k8 apply -f "${MANIFESTS_DIR}/wti-ai/00-namespace.yaml"
_k8 apply -f "${MANIFESTS_DIR}/wti-ai/10-placeholder-deployment.yaml"
_k8 apply -f "${MANIFESTS_DIR}/wti-ai/20-placeholder-service.yaml"
_k8 apply -f "${MANIFESTS_DIR}/wti-ai/30-certificate-conductor.yaml"
_k8 apply -f "${MANIFESTS_DIR}/wti-ai/40-gateway-conductor.yaml"
_k8 apply -f "${MANIFESTS_DIR}/wti-ai/50-httproute-conductor.yaml"

cat <<EOF

VERIFICATION (run manually):

1) Confirm GatewayClass name and that Gateway is programmed:
   kubectl get gatewayclass
   kubectl get gateway -n wti-ai
   kubectl describe gateway -n wti-ai conductor-gateway

2) Confirm HTTPRoute accepted:
   kubectl get httproute -n wti-ai
   kubectl describe httproute -n wti-ai conductor

3) Confirm cert issuance:
   kubectl get certificate -n wti-ai
   kubectl describe certificate -n wti-ai conductor-wti-net
   kubectl get order,challenge -A

4) Confirm DNS A record for conductor.wti.net points at the reserved static IP.

5) Test:
   curl -vk https://conductor.wti.net/

EOF
