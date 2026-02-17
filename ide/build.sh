#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
corepack enable >/dev/null 2>&1 || true
pnpm install
pnpm -r --filter "./agents/**" run build
pnpm --filter @wti/wti-ide run build
