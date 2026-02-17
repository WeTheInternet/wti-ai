#!/usr/bin/env bash
set -Eeuo pipefail
__BIN_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
__INFRA_DIR="$(cd -- "${__BIN_DIR}/.." && pwd)"
source "${__INFRA_DIR}/lib/wti-gcloud.sh"

usage() {
  cat <<'EOF'
Usage:
  ./bin/run-all.sh <env>
  WTI_ENV=<env> ./bin/run-all.sh

Env mapping files:
  ai/infra/env/<env>.env
EOF
}

ENV_NAME="${1:-${WTI_ENV:-}}"
if [[ -z "${ENV_NAME}" ]]; then
  usage
  _die "Missing env. Provide <env> or set WTI_ENV"
fi

ENV_FILE="${__INFRA_DIR}/env/${ENV_NAME}.env"
[[ -f "${ENV_FILE}" ]] || _die "No such env mapping file: ${ENV_FILE}"

set -a
source "${ENV_FILE}"
set +a

validate_var GOOGLE_PROJECT_ID "Missing GOOGLE_PROJECT_ID in ${ENV_FILE}"
validate_var GKE_REGION "Missing GKE_REGION in ${ENV_FILE}"
validate_var GKE_ZONE "Missing GKE_ZONE in ${ENV_FILE}"
validate_var GKE_CLUSTER_NAME "Missing GKE_CLUSTER_NAME in ${ENV_FILE}"
validate_var KUBE_CONTEXT "Missing KUBE_CONTEXT in ${ENV_FILE}"
validate_var KUBE_NAMESPACE "Missing KUBE_NAMESPACE in ${ENV_FILE}"
validate_var DNS_ZONE "Missing DNS_ZONE in ${ENV_FILE}"
validate_var TERRAFORM_ENV_DIR "Missing TERRAFORM_ENV_DIR in ${ENV_FILE}"

_log "Env: ${ENV_NAME} (${ENV_FILE})"
_log "Terraform env dir: ${TERRAFORM_ENV_DIR}"
_log "Suggested Terraform (not run):"
_log "  (cd ai/infra && terraform -chdir=${TERRAFORM_ENV_DIR} init)"
_log "  (cd ai/infra && terraform -chdir=${TERRAFORM_ENV_DIR} workspace select ${ENV_NAME} || terraform -chdir=${TERRAFORM_ENV_DIR} workspace new ${ENV_NAME})"
_log "  (cd ai/infra && terraform -chdir=${TERRAFORM_ENV_DIR} plan)"

tasks=(
  "010-apis.sh"
  "020-network.sh"
  "030-cluster-autopilot.sh"
  "040-static-ips.sh"
  "050-cert-manager.sh"
  "055-clouddns-dns01-issuer.sh"
  "060-envoy-gateway.sh"
  "070-conductor-gateway-placeholder.sh"
)

for t in "${tasks[@]}"; do
  "${__BIN_DIR}/run-task.sh" "$t"
done
