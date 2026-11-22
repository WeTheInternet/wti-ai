#!/usr/bin/env bash
set -euo pipefail
validation_kind=build
source "$(dirname -- "${BASH_SOURCE[0]}")/logging.sh"
source "$(dirname -- "${BASH_SOURCE[0]}")/common.sh"
git -C "$repo_root" rev-parse HEAD > "$run_dir/source-head.txt"
printf '%s\n' "$image_tag" > "$run_dir/image-tag.txt"
require_rootless
build_context=$(mktemp -d)
cp "$container_dir/Containerfile" "$container_dir/run-in-container.sh" "$build_context/"
podman build --build-arg "PLAYWRIGHT_VERSION=$playwright_version" \
    --tag "$image_tag" --file "$build_context/Containerfile" "$build_context"
printf 'Reusable image: %s\n' "$image_tag"
