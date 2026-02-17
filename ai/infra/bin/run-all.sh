#!/usr/bin/env bash
set -Eeuo pipefail
__BIN_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
__INFRA_DIR="$(cd -- "${__BIN_DIR}/.." && pwd)"
source "${__INFRA_DIR}/lib/wti-gcloud.sh"

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
