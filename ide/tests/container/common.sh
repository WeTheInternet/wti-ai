#!/usr/bin/env bash
# Sourced by build.sh and test.sh. No Podman operations occur when sourced.
set -euo pipefail
container_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
ide_root=$(cd -- "$container_dir/../.." && pwd)
repo_root=$(git -C "$ide_root" rev-parse --show-toplevel)

playwright_version=$(python3 - "$ide_root/pnpm-lock.yaml" <<'PY'
import pathlib, re, sys
text = pathlib.Path(sys.argv[1]).read_text()
block = re.search(r'^  tests/playwright:\n(.*?)(?=^  \S|^\S|\Z)', text, re.M | re.S)
match = re.search(r"^      '@playwright/test':\n        specifier: [^\n]+\n        version: (\d+\.\d+\.\d+)\s*$", block[1] if block else '', re.M)
if not match:
    sys.exit('Cannot identify the exact Playwright version in pnpm-lock.yaml')
print(match[1])
PY
)
image_hash=$({ cat "$container_dir/Containerfile" "$container_dir/run-in-container.sh"; printf '%s\n' "$playwright_version"; } | sha256sum)
image_tag="localhost/wti-theia-validation:${image_hash:0:16}"

require_rootless() {
    if [[ $(podman info --format '{{.Host.Security.Rootless}}') != true ]]; then
        echo 'Rootless Podman is required; no privileged fallback is supported.' >&2
        exit 1
    fi
}
