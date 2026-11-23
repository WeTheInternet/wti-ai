# Container-first WTI-AI IDE validation

1. Confirm the host is the intended personal MSI and the checkout is the assigned,
   isolated durable source. Read `AGENTS.md` and inspect Git HEAD and working
   status. Confirm the selected checkout contains `ide/tests/container/README.md`,
   `build.sh`, and `test.sh` in that directory. The
   [reviewed harness source](https://github.com/WeTheInternet/wti-ai/tree/2a6d673fca3378355b9d31eb1b1610042167ccb9/ide/tests/container)
   identifies the entrypoints and prerequisites. If the selected checkout lacks
   the harness, ask the execution owner for an approved compatible validation
   checkout that preserves the intended source snapshot. Until then report
   container validation as blocked for that checkout. Read its harness README
   and identify exactly what it will snapshot, including working changes.
2. Probe rootless Podman on the supported, authorized execution surface. The
   managed default exec sandbox can fail with
   `Failed to obtain podman configuration: set sticky bit on: chmod /run/user/1000/libpod: read-only file system`.
   This identifies a sandbox restriction. If the operation is already authorized
   and the tool supports approvals, request `exec_command` with
   `sandbox_permissions: require_escalated` and a narrow justification for the
   concrete command, checkout, and durable results path. Start with the minimum
   necessary probe, such as `podman info --format '{{.Host.Security.Rootless}}'`
   and, if needed, `podman images`. A true result confirms rootless operation on
   that host. Approval applies to the concrete action. The probe provides no
   validation receipt or permission for the harness run. If approval is rejected,
   stop that action, report the reason, and continue independent authorized work.
   If the surface has no approval mechanism, route the check to the verified MSI
   execution owner. Do not use chmod or sticky-bit workarounds, weaken security,
   use privileged mode, mount home or credentials, enable host networking, or
   route around an actual denial.
3. Reuse the matching local image and checked-in `ide/tests/container` harness.
   The verified toolchain uses Node 24.22.3, pnpm 9.15.5 and Chromium matched to
   Playwright in the checkout. Let the current harness determine the tag and check
   the actual image ID. Build with its supported command if the matching image is
   missing and building is authorized. Changes to the runner or locked Playwright
   input can change the tag while Podman still reuses cached apt and toolchain
   layers. Keep that cache and start with fresh project dependencies inside the
   container. Keep host `node_modules` out of the run.
4. Separate scripts-disabled lockfile refresh from validation. A lockfile-only
   operation with `--lockfile-only --ignore-scripts` records dependency resolution.
   For validation, follow the harness's frozen install, authorized lifecycle
   scripts, native loading, Infra compilation, IDE bundles, and project Playwright
   cases. Read the current harness for the exact commands and prerequisites.
   On an authorized host-only capability probe, a previously available Node can
   live under `~/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`
   even when absent from PATH. Verify the file and version before relying on it.
5. Keep the run receipt in the harness's durable
   `${XDG_STATE_HOME:-$HOME/.local/state}/wti-ai/` directory. Record the exact
   command, cwd and relevant non-secret environment, Git HEAD and working status,
   source snapshot SHA-256, actual image ID, stdout/stderr, final exit status and
   browser artifacts. A missing final exit code leaves the run unverified.
   Compare the snapshot and test selections to the change under review before
   reporting validation. Label a result for an older snapshot as baseline evidence.
