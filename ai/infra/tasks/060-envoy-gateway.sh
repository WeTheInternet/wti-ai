#!/usr/bin/env bash
set -Eeuo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)/lib/wti-gcloud.sh"
start_task_log "060-envoy-gateway"

ensure_kube_credentials

_log "Installing Envoy Gateway (Helm)"
_helm repo add envoyproxy https://gateway.envoyproxy.io >/dev/null 2>&1 || true
_helm repo update >/dev/null

if _k8 get ns envoy-gateway-system >/dev/null 2>&1; then
  _log "Namespace envoy-gateway-system already exists"
else
  _k8 create ns envoy-gateway-system
fi

if _helm status envoy-gateway -n envoy-gateway-system >/dev/null 2>&1; then
  _log "Envoy Gateway already installed"
else
  _helm install envoy-gateway envoyproxy/gateway-helm \
    --namespace envoy-gateway-system
fi

_log "NOTE: To bind a reserved static IP, set Gateway.spec.addresses to an IPAddress."
_log "We will add Gateway + HTTPRoutes manifests in a later task once services exist."
