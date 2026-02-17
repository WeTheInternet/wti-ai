#!/usr/bin/env bash
set -Eeuo pipefail
__BIN_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
__INFRA_DIR="$(cd -- "${__BIN_DIR}/.." && pwd)"
source "${__INFRA_DIR}/lib/wti-gcloud.sh"

task="${1:-}"
[[ -n "$task" ]] || _die "Usage: $0 <task-script-name>"
script="${__INFRA_DIR}/tasks/${task}"
[[ -f "$script" ]] || _die "No such task: ${task} (expected ${script})"

start_task_log "${task}"
_log "Running task: ${task}"
bash "$script"
