#!/usr/bin/env bash
set -Eeuo pipefail

__BIN_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
__REPO_ROOT="$(cd -- "${__BIN_DIR}/../../.." && pwd)"

"${__BIN_DIR}/ensure-pnpm.sh"

cd "${__REPO_ROOT}/ai/agents/infra"

pnpm install
pnpm run build
