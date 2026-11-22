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
python3 - "$repo_root" "$run_dir/source.tar" <<'PY'
import pathlib, subprocess, sys, tarfile
root = pathlib.Path(sys.argv[1])
paths = subprocess.check_output(['git', '-C', str(root), 'ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', 'ide/']).split(b'\0')
with tarfile.open(sys.argv[2], 'w') as archive:
    for name in sorted(set(paths)):
        if not name:
            continue
        relative = pathlib.Path(name.decode())
        source = root / relative
        if source.is_symlink():
            sys.exit(f'Symlink requires explicit review before container inclusion: {relative}')
        if source.is_file():
            archive.add(source, arcname=str(relative.relative_to('ide')), recursive=False)
PY
sha256sum "$run_dir/source.tar" > "$run_dir/source.sha256"
podman image inspect "$image_tag" --format '{{.Id}}' > "$run_dir/image-id.txt"
printf 'Results: %s\n' "$run_dir"
podman run --rm --shm-size=1g \
    --volume "$run_dir/source.tar:/input/source.tar:ro" \
    --volume "$run_dir:/results:rw" \
    "$image_tag"
