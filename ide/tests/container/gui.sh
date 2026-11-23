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
python3 "$container_dir/snapshot.py" "$repo_root" "$run_dir/source.tar"
sha256sum "$run_dir/source.tar" > "$run_dir/source.sha256"
image_id=$(podman image inspect "$image_tag" --format '{{.Id}}')
printf '%s\n' "$image_id" > "$run_dir/image-id.txt"
printf 'After startup, open http://localhost:1771. Ctrl+C stops the GUI.\n'
printf 'Editable workspace: %s (shown as /workspace inside the IDE)\n' "$repo_root"
podman run --rm --name wti-ai-gui --init --shm-size=1g \
    --publish 127.0.0.1:1771:1771 \
    --volume "$run_dir/source.tar:/input/source.tar:ro" \
    --volume "$repo_root:/workspace:rw" \
    --entrypoint bash "$image_id" -c '
set -euo pipefail
tar -xf /input/source.tar -C /work
mkdir -p "$THEIA_CONFIG_DIR"
pnpm install --frozen-lockfile --registry=https://registry.npmjs.org
pnpm --filter @wti/infra-agent run build
pnpm --filter @wti/wti-ide run build
workspace_file=/work/wti-ai.theia-workspace
python3 - "$workspace_file" <<"PY"
import json
import sys
from pathlib import Path

workspace = json.loads(Path("/workspace/wti-ai.theia-workspace").read_text())
workspace["folders"] = [{"path": "/workspace"}]
Path(sys.argv[1]).write_text(json.dumps(workspace))
PY
exec pnpm --filter @wti/wti-ide exec theia start "$workspace_file" --plugins=local-dir:plugins --hostname 0.0.0.0 --port 1771
'
