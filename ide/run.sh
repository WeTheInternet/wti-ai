#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
corepack enable >/dev/null 2>&1 || true

PORT="${WTI_IDE_PORT:-1771}"

if [[ -n "${WTI_AI_ENV_FILES:-}" && -d "${WTI_AI_ENV_FILES}" ]]; then
  while IFS= read -r -d '' f; do
    k="$(basename "$f")"
    v="$(cat "$f")"
    export "$k=$v"
  done < <(find "$WTI_AI_ENV_FILES" -maxdepth 1 -type f -print0)
fi

pnpm --filter @wti/wti-ide exec theia start --mode development --hostname 0.0.0.0 --port "$PORT"
