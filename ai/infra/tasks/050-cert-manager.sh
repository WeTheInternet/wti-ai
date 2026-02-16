#!/usr/bin/env bash
set -Eeuo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)/lib/wti-gcloud.sh"
start_task_log "050-cert-manager"

ensure_kube_credentials

_log "Installing cert-manager (Helm)"
_helm repo add jetstack https://charts.jetstack.io >/dev/null 2>&1 || true
_helm repo update >/dev/null

if _k8 get ns cert-manager >/dev/null 2>&1; then
  _log "Namespace cert-manager already exists"
else
  _k8 create ns cert-manager
fi

if _helm status cert-manager -n cert-manager >/dev/null 2>&1; then
  _log "cert-manager already installed"
else
  _helm install cert-manager jetstack/cert-manager \
    --namespace cert-manager \
    --set crds.enabled=true
fi
