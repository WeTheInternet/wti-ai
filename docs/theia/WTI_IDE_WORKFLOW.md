---
status: DRAFT
teams: []
roles: []
authors:
  - wti
lastUpdated: 2026-02-17T00:00:00Z
verification:
  - "(manual) Run ./build.sh and ./run.sh from ide/ on Node 20"
---

# WTI Theia Browser IDE workflow (canonical)

The supported way to build and run the WTI Theia browser IDE is from the standalone `ide/` pnpm workspace.

## Prerequisites

- Node.js 20.x (see `ide/.nvmrc`)
- `corepack` enabled
- `pnpm` 9.15.5 (via corepack; see `ide/package.json`)

The checked-in app and agent dependencies pin Theia **1.68.2**. Separate, unmerged 1.77.0 migration work is not the baseline for these instructions. This document is not an upgrade procedure.

Follow [AGENTS.md](../../AGENTS.md): workspace tasks/scripts require explicit user approval.

## Workspace layout

- App:
  - `ide/apps/wti-ide` (`@wti/wti-ide`)
- Agents:
  - `ide/agents/*` (e.g. `@wti/infra-agent`)
- Tests:
  - `ide/tests/playwright` (`@wti/tests-playwright`)

## Install + build

From repo root:

```bash
cd ide
./build.sh
```

Notes:
- Installs dependencies via `pnpm install`.
- Builds agents, then builds the browser IDE app.

## Run the IDE

From `ide/`:

```bash
./run.sh
```

Port:
- Default: `1771`
- Override with `WTI_IDE_PORT`

`run.sh` starts Theia in development mode with `--hostname 0.0.0.0` (all IPv4 interfaces). `http://localhost:1771` is a local access URL, not a loopback-only binding; network reachability also depends on host/network controls.

### Secret loading (Phase 1)

`./run.sh` supports loading secrets from a directory pointed to by `WTI_AI_ENV_FILES`.

Behavior:
- For each regular file directly in the directory:
  - env var name = file basename
  - env var value = file contents (shell command substitution strips trailing newlines)

These variables are exported into the IDE process environment and can be inherited by child processes. File permissions protect files at rest; this loader does not isolate credentials or limit which child receives them. Load only variables intended for this process tree.

Example:

```bash
export WTI_AI_ENV_FILES="$HOME/.config/wti-ai/env"
ls -1 "$WTI_AI_ENV_FILES"
# OPENAI_API_KEY
# ANTHROPIC_API_KEY

cd ide
./run.sh
```

## Watch mode

From `ide/`:

```bash
./watch.sh
```

Notes:
- Runs watch builds for agents and the IDE app in parallel.
- Browser refresh may be required after rebuilds.

## Tests (Playwright)

From `ide/`:

```bash
./test.sh
```

Port:
- Default: `1337`
- Override with `WTI_IDE_TEST_PORT`

## Clean

From `ide/`:

```bash
./clean.sh
```

This removes build outputs and dependency folders under `ide/`, including:
- `**/node_modules`
- `**/dist`
- `**/lib`
- `**/src-gen`
- `ide/pnpm-lock.yaml`
- `ide/pnpm-workspace.yaml.lock`

`ide/pnpm-lock.yaml` is tracked. Cleaning deletes it and creates a tracked deletion; a subsequent install can resolve a different dependency graph. Preserve or restore the intended lockfile before reinstalling when reproducibility is required.

## Known issues / callouts

- Shutdown noise: repeated "Unexpected SIGPIPE" messages referencing a `drivelist` vendor chunk.
- Sourcemaps in devtools may show 404s for `webpack:///src/...` or `ERR_UNKNOWN_URL_SCHEME`.
- Optional peer dependency warnings for `@theia/electron` during browser builds are expected.
