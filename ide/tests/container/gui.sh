#!/usr/bin/env bash
set -euo pipefail
validation_kind=gui
source "$(dirname -- "${BASH_SOURCE[0]}")/logging.sh"
source "$(dirname -- "${BASH_SOURCE[0]}")/common.sh"
git -C "$repo_root" rev-parse HEAD > "$run_dir/source-head.txt"
git -C "$repo_root" status --short > "$run_dir/source-status.txt"
require_rootless
if ! podman image exists "$image_tag"; then
    echo 'Image missing. Run: bash ide/tests/container/build.sh' >&2
    exit 1
fi
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
printf 'After startup, open http://127.0.0.1:1771 . Ctrl+C stops the GUI.\n'
printf 'Editable workspace: %s (shown as /workspace inside the IDE)\n' "$repo_root"
podman run --rm --name wti-ai-gui --init --shm-size=1g \
    --publish 127.0.0.1:1771:1771 \
    --volume "$run_dir/source.tar:/input/source.tar:ro" \
    --volume "$repo_root:/workspace:rw" \
    --entrypoint bash "$image_tag" -c '
set -euo pipefail
tar -xf /input/source.tar -C /work
mkdir -p "$THEIA_CONFIG_DIR"
pnpm install --frozen-lockfile --registry=https://registry.npmjs.org
pnpm --filter @wti/infra-agent run build
pnpm --filter @wti/wti-ide run build
exec pnpm --filter @wti/wti-ide exec theia start /workspace --hostname 0.0.0.0 --port 1771
'
