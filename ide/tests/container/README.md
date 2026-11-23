# Reusable local IDE validation

Run from the repository root in a normal terminal with rootless Podman:

```bash
bash ide/tests/container/build.sh
bash ide/tests/container/test.sh
```

The first command retains a local Ubuntu 24.04 amd64 image with checksum-verified
Node 24.22.3, pnpm 9.15.5, native compilation prerequisites and Chromium matching
the exact Playwright version in `ide/pnpm-lock.yaml`. Later test runs reuse that
image. The recipe, container runner and locked Playwright version determine its
tag. Rebuild after changing any of those inputs. Ubuntu packages and the base tag
can change upstream; this is a repeatable recipe, not a bit-reproducible image.
Each run records the actual local image ID.

Host prerequisites: rootless Podman, Bash, Git, Python 3, `sha256sum`, and ordinary
Unix file utilities. Builds need network access to official Ubuntu, Node, npm and
Playwright sources. No host package installation or security-setting changes are
performed. If the execution environment blocks Podman, use a supported normal
terminal; the scripts do not bypass that restriction.

`test.sh` snapshots Git-known, non-ignored files under `ide/`, including working
changes and new files. Deleted files are skipped; symlinks require manual review.
The archive is mounted read-only. Only the run’s `artifacts/` subdirectory is mounted writable. The host keeps the
source archive and provenance files in its parent directory. No home, credentials, container socket, host networking or published
ports are used. The container is root inside a rootless user namespace, not host
root. The IDE binds to container loopback through the smoke-test fixture.

Every test gets fresh project dependencies and native builds inside the same
Ubuntu image. Host `node_modules` are excluded. This intentionally avoids sharing
mutable dependency directories between runs; the expensive OS/browser toolchain
remains cached in the image. The container is removed after completion, while
logs, source checksum, image ID, exit status and Playwright failure artifacts stay
under `${XDG_STATE_HOME:-$HOME/.local/state}/wti-ai/`, separate from the checkout
and `/tmp`. Both build and test commands create a timestamped directory and record
stdout/stderr starting before preflight checks, start/end times and the real exit
code. Test runs also record Git HEAD, working status and the exact source archive
checksum. Browser output is retained under `artifacts/test-results/`. If the state directory cannot be
created, the command fails before validation. A missing `exit-code.txt` means the
run did not finalize (for example, a power loss); it is not a passing result.

The smoke test verifies the workbench, chat view and the registered Infra agent's
configuration details using a temporary profile. It enables AI UI only in that
profile, supplies no model credentials and sends no prompts. The build downloads the pinned Markdown preview extension from Open VSX.

The November 23 UTC validation of commit `88a47d53` completed the frozen
install, native module checks, Infra compile, Markdown-enabled IDE build and
all four Playwright cases. A focused browser check opened a Markdown file and
verified its heading in the rendered preview webview. See PR #3 for the latest
validated head and lifecycle regression results.

## Explore the GUI locally

From the repository root:

```bash
bash ide/tests/container/gui.sh
```

After the build/startup output, open http://localhost:1771. Markdown preview uses a
webview subdomain of `localhost`. This reuses the existing
image (no apt run), but installs and builds a fresh snapshot of the current IDE
source. Separately, the GUI mounts the **entire checkout** writable at
`/workspace` so editor saves persist. This mount includes ignored files such as
`.env` and `.env.*`. Remove repository-local credentials or launch from a clean
checkout before starting the GUI. The host home directory is outside the mount.
The launcher leaves the shared checkout’s SELinux labels untouched. GUI access
on an SELinux-enforcing host depends on its existing mount permissions and
labels. The GUI has been validated on Ubuntu with SELinux disabled.

The GUI opens a container-local copy of the workspace configuration with
`/workspace` as its only folder, preserving the checked-in watcher and search
exclusions. Build output, dependencies and GUI preferences stay in the
disposable container. Restart after editing IDE implementation to build a new
snapshot. The server listens on all container interfaces. The host port is
published only on IPv4 loopback. This is a personal local server, without login.

Ctrl+C stops the foreground process; if needed, `podman stop wti-ai-gui` stops
that named container from another terminal. Logs use the same durable state
location as tests. A second launch while it is running fails instead of replacing
it. The launcher passed shell syntax and controlled invocation checks. The owner
confirmed that the GUI starts; broader interactive behavior remains exploratory.
