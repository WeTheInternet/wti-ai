#!/usr/bin/env bash
set -Eeuo pipefail

__BIN_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
__REPO_ROOT="$(cd -- "${__BIN_DIR}/../../.." && pwd)"
__REPO_PARENT="$(dirname -- "${__REPO_ROOT}")"

log() {
  echo "[deploy-infra-agent] $*" >&2
}

usage() {
  cat >&2 <<'USAGE'
Usage:
  deploy-infra-agent-to-theia.sh [--theia-dir PATH] [--with-plugins]

Options:
  --theia-dir PATH  Path to a Theia checkout (default: ${__REPO_ROOT}/theia)
  --with-plugins    Also runs "npm run download:plugins" in the Theia checkout
USAGE
}

WITH_PLUGINS=0
THEIA_DIR_DEFAULT="${__REPO_PARENT}/theia"
THEIA_DIR="${THEIA_DIR:-${THEIA_DIR_DEFAULT}}"

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --help|-h)
      usage
      exit 0
      ;;
    --with-plugins)
      WITH_PLUGINS=1
      shift
      ;;
    --theia-dir)
      if [[ -z "${2:-}" ]]; then
        echo "Missing value for --theia-dir" >&2
        usage
        exit 1
      fi
      THEIA_DIR="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

log "repo root: ${__REPO_ROOT}"
log "theia dir: ${THEIA_DIR}"

if [[ ! -d "${THEIA_DIR}" ]]; then
  echo "Theia dir not found: ${THEIA_DIR}" >&2
  exit 1
fi

if [[ ! -f "${THEIA_DIR}/package.json" ]]; then
  echo "Theia dir does not look like a Theia checkout (missing package.json): ${THEIA_DIR}" >&2
  exit 1
fi

if ! (cd "${THEIA_DIR}" && npm run -s build:browser >/dev/null 2>&1); then
  echo "Theia checkout does not have an npm script 'build:browser': ${THEIA_DIR}" >&2
  exit 1
fi

log "ensuring pnpm (node/corepack/pnpm versions)"
"${__BIN_DIR}/ensure-pnpm.sh"

log "building infra agent"
cd "${__REPO_ROOT}/ai/agents/infra"

log "pnpm install (ai/agents/infra)"
pnpm install

log "pnpm run build (ai/agents/infra)"
pnpm run build

DIST_DIR="${__REPO_ROOT}/ai/agents/infra/dist"
log "packing infra agent -> ${DIST_DIR}"
rm -rf "${DIST_DIR}"
mkdir -p "${DIST_DIR}"

pnpm pack --pack-destination "${DIST_DIR}" >/dev/null

TGZ="$(ls -1t "${DIST_DIR}"/*.tgz 2>/dev/null | head -n 1 || true)"
if [[ -z "${TGZ}" || ! -f "${TGZ}" ]]; then
  echo "Failed to find packed tgz under: ${DIST_DIR}" >&2
  exit 1
fi

log "packed: ${TGZ}"

cd "${THEIA_DIR}"

log "npm install (theia): ${TGZ}"
npm install --no-audit --no-fund --save-dev "${TGZ}"

log "npm run build:browser (theia)"
npm run build:browser

if [[ "${WITH_PLUGINS}" -eq 1 ]]; then
  log "npm run download:plugins (theia)"
  npm run download:plugins
fi

cat <<EOF

Infra agent deployed into:
  ${THEIA_DIR}

Packed artifact:
  ${TGZ}

Next steps:
  cd "${THEIA_DIR}"
  OPENAI_API_KEY=\$(< ~/.config/openai/.gc) npm run start:browser

EOF
