#!/bin/bash
set -euxo pipefail
cd "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
corepack enable >/dev/null 2>&1 || true
pnpm install || {
    echo "pnpm not available; updating npm via nvm"
    nvm use || {
        echo "neither pnpm nor nvm available; cannot build"
        exit 1
    }
}
pnpm -r --filter "./agents/**" run build
pnpm --filter @wti/wti-ide run build
