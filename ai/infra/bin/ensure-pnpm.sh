#!/usr/bin/env bash
set -Eeuo pipefail

__BIN_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
__REPO_ROOT="$(cd -- "${__BIN_DIR}/../../.." && pwd)"

PNPM_MIN_MAJOR=9

if ! command -v node >/dev/null 2>&1; then
  echo "node not found. Install Node LTS 22 and retry." >&2
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "${NODE_MAJOR}" -ne 22 ]]; then
  echo "Unsupported Node version: $(node -v). Expected Node 22.x (Theia is not compatible with Node 24)." >&2
  echo "If you use nvm: run 'nvm use' from the repo root (see .nvmrc)." >&2
  exit 1
fi

if ! command -v corepack >/dev/null 2>&1; then
  echo "corepack not found. Use a Node distribution that includes corepack (Node 16+)." >&2
  exit 1
fi

corepack enable >/dev/null 2>&1 || true

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Activating pnpm via corepack..." >&2
  corepack prepare pnpm@latest --activate
fi

PNPM_VERSION="$(pnpm -v)"
PNPM_MAJOR="${PNPM_VERSION%%.*}"

if [[ -z "${PNPM_MAJOR}" || "${PNPM_MAJOR}" -lt "${PNPM_MIN_MAJOR}" ]]; then
  echo "Unsupported pnpm version: ${PNPM_VERSION}. Expected pnpm >= ${PNPM_MIN_MAJOR}." >&2
  echo "To install via corepack: corepack prepare pnpm@latest --activate" >&2
  exit 1
fi

