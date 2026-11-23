#!/usr/bin/env bash
set -euo pipefail
finish() {
    result=$?
    trap - EXIT
    if [[ -d /work/tests/playwright/test-results ]]; then
        cp -a /work/tests/playwright/test-results /results/ || true
    fi
    printf '%s\n' "$result" > /results/exit-code.txt
    exit "$result"
}
trap finish EXIT
tar -xf /input/source.tar -C /work
mkdir -p "$THEIA_CONFIG_DIR"
node --version
pnpm --version
pnpm install --frozen-lockfile --registry=https://registry.npmjs.org
node -e "require('drivelist'); require('node-pty'); require('@parcel/watcher'); console.log('Native modules loaded successfully')"
pnpm --filter agent-graph test
pnpm --filter @wti/agent-graph test
pnpm --filter @wti/infra-agent... run build
pnpm --filter @wti/wti-ide run build
pnpm --filter @wti/tests-playwright run test
