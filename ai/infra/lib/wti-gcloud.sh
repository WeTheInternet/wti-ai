#!/usr/bin/env bash
set -Eeuo pipefail

# ---------- Paths (cwd-agnostic) ----------
__SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
__INFRA_DIR="$(cd -- "${__SCRIPT_DIR}/.." && pwd)"
LOG_DIR="${LOG_DIR:-${__INFRA_DIR}/logs}"
BIN_DIR="${BIN_DIR:-${__INFRA_DIR}/bin}"
AI_ROOT_DIR="${AI_ROOT_DIR:-$(cd -- "${__INFRA_DIR}/../.." && pwd)}"

mkdir -p "$LOG_DIR"

# ---------- Logging ----------
_ts() { date +"%Y-%m-%dT%H:%M:%S%z"; }
_caller() { caller 1 | awk '{print $1 ":" $2}'; } # line:function
_log()  { echo "[$(_ts)] [INFO]  $(_caller)  $*" >&2; }
_warn() { echo "[$(_ts)] [WARN]  $(_caller)  $*" >&2; }
_die()  { echo "[$(_ts)] [ERROR] $(_caller)  $*" >&2; exit 1; }

# ---------- Debug / trace ----------
enable_xtrace() {
  export PS4='+ ${BASH_SOURCE}:${LINENO}:${FUNCNAME[0]}() '
  set -x
}

# ---------- Traps ----------
_on_err() {
  local ec=$?
  _die "Command failed (exit=$ec): ${BASH_COMMAND}"
}
trap _on_err ERR

# ---------- Validation ----------
validate_var() {
  local var_name="$1"
  local msg="${2:-Missing required variable: $var_name}"
  [[ -n "${!var_name:-}" ]] || _die "$msg"
}

# ---------- Command helpers ----------
_need() {
  command -v "$1" >/dev/null 2>&1 || _die "Missing required command: $1"
}

_gc() {
  _need gcloud
  gcloud --quiet "$@"
}

_k8() {
  _need kubectl
  kubectl "$@"
}

_helm() {
  _need helm
  helm "$@"
}

# ---------- GCloud context ----------
ensure_gcloud_context() {
  validate_var GOOGLE_PROJECT_ID "Set GOOGLE_PROJECT_ID (e.g. we-the-internet)"
  _gc config set project "$GOOGLE_PROJECT_ID" >/dev/null
  # Region is used by many commands; keep separate var names to avoid collisions
  validate_var GKE_REGION "Set GKE_REGION (e.g. us-west1, northamerica-northeast2)"
}

ensure_kube_credentials() {
  validate_var GKE_CLUSTER_NAME "Set GKE_CLUSTER_NAME (e.g. wti-wip)"
  ensure_gcloud_context
  _log "Fetching kube credentials for cluster=$GKE_CLUSTER_NAME region=$GKE_REGION"
  _gc container clusters get-credentials "$GKE_CLUSTER_NAME" --region "$GKE_REGION" >/dev/null
  # quick sanity
  _k8 version --client >/dev/null
}

# ---------- Idempotent-ish patterns ----------
gcloud_resource_exists() {
  # Usage: gcloud_resource_exists "compute networks describe ..." (args after gcloud)
  _gc "$@" >/dev/null 2>&1
}

ensure_gcloud() {
  # Usage: ensure_gcloud "<desc>" <exists_cmd...> -- <create_cmd...>
  local desc="$1"; shift
  local sep="--"
  local exists=()
  while [[ "$#" -gt 0 && "$1" != "$sep" ]]; do exists+=("$1"); shift; done
  [[ "${1:-}" == "$sep" ]] || _die "ensure_gcloud: missing -- separator for $desc"
  shift
  local create=("$@")

  if gcloud_resource_exists "${exists[@]}"; then
    _log "Exists: $desc"
  else
    _log "Creating: $desc"
    _gc "${create[@]}"
  fi
}

# ---------- Logging redirection per-task ----------
start_task_log() {
  local task_name="$1"
  local log_file="${LOG_DIR}/$(date +%Y%m%d_%H%M%S)_${task_name}.log"
  _log "Logging to $log_file"
  exec > >(tee -a "$log_file") 2>&1
}
