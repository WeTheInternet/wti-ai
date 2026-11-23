#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
corepack enable >/dev/null 2>&1 || true
pnpm install
# Populate generated exports before either TypeScript or Theia starts watching.
pnpm --filter @wti/agent-graph run build
WTI_AGENT_GRAPH_PREBUILT=1 pnpm -r --parallel \
  --filter @wti/agent-graph \
  --filter "./agents/**" \
  --filter @wti/wti-ide \
  run watch
