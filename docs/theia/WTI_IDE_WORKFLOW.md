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
- `pnpm` (via corepack)

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

### Secret loading (Phase 1)

`./run.sh` supports loading secrets from a directory pointed to by `WTI_AI_ENV_FILES`.

Behavior:
- For each file in the directory:
  - env var name = file basename
  - env var value = file contents

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

## Known issues / callouts

- Shutdown noise: repeated "Unexpected SIGPIPE" messages referencing a `drivelist` vendor chunk.
- Sourcemaps in devtools may show 404s for `webpack:///src/...` or `ERR_UNKNOWN_URL_SCHEME`.
- Optional peer dependency warnings for `@theia/electron` during browser builds are expected.
