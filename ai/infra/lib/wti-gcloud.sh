#!/usr/bin/env bash
set -Eeuo pipefail

__INFRA_LIB_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
__INFRA_DIR="$(cd -- "${__INFRA_LIB_DIR}/.." && pwd)"

LOG_DIR="${__INFRA_DIR}/logs"
mkdir -p "${LOG_DIR}"

_ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
_log() { echo "[$(_ts)] $*"; }
_die() { echo "ERROR: $*" >&2; exit 1; }

start_task_log() {
  local name="${1:-task}"
  local logfile="${LOG_DIR}/${name}.log"
  exec > >(tee -a "${logfile}") 2>&1
  _log "Log: ${logfile}"
}

validate_var() {
  local var="${1:-}"; shift || true
  local msg="${1:-}"; shift || true
  [[ -n "${var}" ]] || _die "validate_var: missing var name"
  [[ -n "${!var:-}" ]] || _die "${msg:-Missing required env var: ${var}}"
}

ensure_gcloud_project() {
  validate_var GOOGLE_PROJECT_ID "Set GOOGLE_PROJECT_ID"
}

ensure_gcloud_region() {
  validate_var GKE_REGION "Set GKE_REGION (e.g. northamerica-northeast2)"
}

ensure_gcloud_zone() {
  validate_var GKE_ZONE "Set GKE_ZONE (e.g. northamerica-northeast2-a)"
}

ensure_gcloud_dns_zone() {
  validate_var DNS_ZONE "Set DNS_ZONE (Cloud DNS managed zone name)"
}

ensure_kube_context() {
  validate_var KUBE_CONTEXT "Set KUBE_CONTEXT (kubectl context name)"
}

ensure_kube_namespace() {
  validate_var KUBE_NAMESPACE "Set KUBE_NAMESPACE"
}

_gc_project() {
  ensure_gcloud_project
  gcloud --quiet --project "${GOOGLE_PROJECT_ID}" "$@"
}

_gc_region() {
  ensure_gcloud_project
  ensure_gcloud_region
  gcloud --quiet --project "${GOOGLE_PROJECT_ID}" --region "${GKE_REGION}" "$@"
}

_gc_zone() {
  ensure_gcloud_project
  ensure_gcloud_zone
  gcloud --quiet --project "${GOOGLE_PROJECT_ID}" --zone "${GKE_ZONE}" "$@"
}

_gc_dns() {
  ensure_gcloud_project
  ensure_gcloud_dns_zone
  gcloud --quiet --project "${GOOGLE_PROJECT_ID}" --dns-zone "${DNS_ZONE}" "$@"
}

_helm() {
  helm "$@"
}

_k8() {
  ensure_kube_context
  kubectl --context "${KUBE_CONTEXT}" "$@"
}

_k8n() {
  ensure_kube_context
  ensure_kube_namespace
  kubectl --context "${KUBE_CONTEXT}" --namespace "${KUBE_NAMESPACE}" "$@"
}

gcloud_resource_exists() {
  _gc_project "$@" >/dev/null 2>&1
}

ensure_gcloud() {
  local label="$1"; shift
  local -a describe_cmd=("$1"); shift
  local -a create_cmd=()

  while [[ "$#" -gt 0 ]]; do
    if [[ "$1" == "--" ]]; then
      shift
      create_cmd=("$@");
      break
    fi
    describe_cmd+=("$1")
    shift
  done

  if gcloud_resource_exists "${describe_cmd[@]}"; then
    _log "Exists: ${label}"
    return 0
  fi

  _log "Creating: ${label}"
  _gc_project "${create_cmd[@]}"
}

ensure_kube_credentials() {
  validate_var GKE_CLUSTER_NAME "Set GKE_CLUSTER_NAME"
  ensure_gcloud_project
  ensure_gcloud_region

  _gc_project container clusters get-credentials "${GKE_CLUSTER_NAME}" --region "${GKE_REGION}"

  ensure_kube_context
}
