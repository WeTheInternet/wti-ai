#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
corepack enable >/dev/null 2>&1 || true

export WTI_IDE_TEST_PORT="${WTI_IDE_TEST_PORT:-1337}"

pnpm install
pnpm run build
pnpm --filter @wti/tests-playwright run test
