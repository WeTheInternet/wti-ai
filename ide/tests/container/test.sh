#!/usr/bin/env bash
set -euo pipefail
validation_kind=test
source "$(dirname -- "${BASH_SOURCE[0]}")/logging.sh"
source "$(dirname -- "${BASH_SOURCE[0]}")/common.sh"
git -C "$repo_root" rev-parse HEAD > "$run_dir/source-head.txt"
git -C "$repo_root" status --short > "$run_dir/source-status.txt"
require_rootless
if ! podman image exists "$image_tag"; then
    echo 'Validation image is missing. Run: bash ide/tests/container/build.sh' >&2
    exit 1
fi

# Snapshot only Git-known, non-ignored IDE files, including uncommitted changes.
# Never copy node_modules, ignored credentials, other repositories or host home.
python3 "$container_dir/snapshot.py" "$repo_root" "$run_dir/source.tar"
sha256sum "$run_dir/source.tar" > "$run_dir/source.sha256"
image_id=$(podman image inspect "$image_tag" --format '{{.Id}}')
printf '%s\n' "$image_id" > "$run_dir/image-id.txt"
printf 'Results: %s\n' "$run_dir"
mkdir "$run_dir/artifacts"
podman run --rm --shm-size=1g \
    --volume "$run_dir/source.tar:/input/source.tar:ro" \
    --volume "$run_dir/artifacts:/results:rw" \
    "$image_id"
