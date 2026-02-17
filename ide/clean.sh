#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

find . -name node_modules -type d -prune -exec rm -rfv {} +
find . -name dist -type d -prune -exec rm -rfv {} +
find . -name lib -type d -prune -exec rm -rfv {} +
find . -name src-gen -type d -prune -exec rm -rfv {} +
rm -fv pnpm-lock.yaml
rm -fv pnpm-workspace.yaml.lock
