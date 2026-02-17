id: cd092dcb-1d82-4669-9fb6-5c32a18acb87
sessionId: 08d479e2-c312-4d6b-9e7e-1105d41df040
date: '2026-02-17T02:34:53.577Z'
label: >-
  Create ide/ pnpm workspace + wti-ide (Theia browser app) + agents + Playwright
  harness
---
# Create `ide/` pnpm workspace + `wti-ide` (Theia browser app) + agents + Playwright harness

## Goal
Stand up a new standalone frontend “repo root” under `ide/` containing a pnpm workspace that builds and runs a browser-based Theia IDE app (`wti-ide`) from npm-published `@theia/*@1.68.2`, plus WTI agent extensions (starting with Infra) and a Playwright test harness.

Non-goals:
- Do **not** migrate/maintain the existing “junky/manual” Theia setup. Leave it untouched.
- Do **not** reuse `ai/infra/bin/*` build scripts (only gcloud scripts remain in `ai/infra/bin`).

Constraints / preferences baked in:
- Treat `ide/` as a standalone JS app root.
- Node: start with **Node 20** (LTS) for best compatibility with Theia toolchain.
- Use pnpm workspaces; prefer **`pnpm.onlyBuiltDependencies`** to require prebuilts / reduce native builds.
- Theia version pinned to **1.68.2**, and we “follow Theia’s dependencies” (avoid mixing versions).
- Default dev port: **1771**. Tests should use a separate configurable port.
- Add env/secret handling concept: read env vars from files in a `WTI_AI_ENV_FILES` directory (and minimize keeping secrets in process env where possible).

## Design

### Workspace structure
- `ide/` is its own pnpm workspace root with:
  - `apps/wti-ide`: Theia browser app package.
  - `agents/*`: Theia extension packages (frontend and/or backend).
  - `tests/playwright`: Playwright E2E harness.
  - Optional `packages/*` for shared code (only create when needed).

### Theia application composition
- Build the browser app via `@theia/cli` (npm package) without a Theia source checkout.
- Keep the app package responsible for selecting which `@theia/*` extensions are included.
- Link WTI agents as dependencies via `workspace:*`.

### Agents as Theia extensions
- Each agent is a standalone Theia extension package using `@theia/cli`’s `theiaext` tooling.
- Start with `@wti/infra-agent` moved from `ai/agents/infra` (slash-and-burn permitted): keep only what is needed to compile/build as a Theia extension.

### Frontend vs backend extension restart behavior
- Frontend changes typically require a browser reload (or rebuild) but not restarting the backend server.
- Backend changes require restarting the Theia backend process.
- When using `theia build --watch`, the frontend bundle can rebuild on change; you may still need to refresh the browser.

### Secrets / API keys
- Phase 1 (simple, works everywhere):
  - `ide/run.sh` and `ide/test.sh` load secrets from files under `WTI_AI_ENV_FILES` into environment variables just for the spawned process.
- Phase 2 (reduce env exposure):
  - Provide a backend-only Theia extension (e.g. `@wti/secrets`) that reads secrets directly from disk at runtime and exposes them to `@theia/ai-*` via configuration or service injection. This avoids putting secrets into the environment.
  - Because Theia AI integrations may still read from env, we keep Phase 1 as fallback.

### Ports
- Dev default: 1771.
- Test default: 1337 (or random free port). Use `WTI_IDE_PORT`/`WTI_IDE_TEST_PORT`.

### pnpm native build minimization
- Set `pnpm.onlyBuiltDependencies` at `ide/package.json` so only explicitly allowed native deps can run build scripts.
- Maintain an allowlist as we discover required native dependencies.

## Proposed directory layout

```txt
ide/
  .nvmrc
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json

  build.sh
  run.sh
  watch.sh
  test.sh

  apps/
    wti-ide/
      package.json
      README.md
      (optional) theia.config.json
      (optional) src/
        backend/
        frontend/

  agents/
    infra/
      package.json
      tsconfig.json
      src/
        browser/
          frontend-module.ts
          ...
      resources/

  packages/
    (reserved for shared libs)

  tests/
    playwright/
      package.json
      playwright.config.ts
      fixtures/
        start-theia.ts
      tests/
        smoke.spec.ts
```

## pnpm workspace configuration

### `ide/pnpm-workspace.yaml`
```yaml
packages:
  - "apps/*"
  - "agents/*"
  - "packages/*"
  - "tests/*"
```

### Root `ide/package.json` (key parts)
- Pins Theia version.
- Enforces Node 20.
- Uses `onlyBuiltDependencies` allowlist.

```json
{
  "name": "@wti/ide-root",
  "private": true,
  "packageManager": "pnpm@9.15.5",
  "engines": { "node": ">=20 <21" },
  "scripts": {
    "build": "pnpm -r --workspace-concurrency=4 run build",
    "watch": "pnpm -r --parallel run watch",
    "start": "pnpm --filter @wti/wti-ide run start",
    "test": "pnpm --filter @wti/tests-playwright run test"
  },
  "pnpm": {
    "overrides": {
      "@theia/*": "1.68.2"
    },
    "onlyBuiltDependencies": [
      "@parcel/watcher",
      "esbuild",
      "keytar",
      "node-pty"
    ]
  }
}
```

Notes:
- The allowlist will be adjusted after the first install based on what Theia actually needs in browser mode. Keep it minimal; add only when pnpm install complains.

### `ide/.nvmrc`
```txt
20
```

## Theia app package

### `ide/apps/wti-ide/package.json` (example)
```json
{
  "name": "@wti/wti-ide",
  "private": true,
  "version": "0.0.0",
  "packageManager": "pnpm@9.15.5",
  "dependencies": {
    "@theia/core": "1.68.2",
    "@theia/browser": "1.68.2",

    "@theia/filesystem": "1.68.2",
    "@theia/navigator": "1.68.2",
    "@theia/editor": "1.68.2",
    "@theia/monaco": "1.68.2",
    "@theia/terminal": "1.68.2",
    "@theia/process": "1.68.2",

    "@theia/ai-core": "1.68.2",
    "@theia/ai-chat": "1.68.2",

    "@wti/infra-agent": "workspace:*"
  },
  "devDependencies": {
    "@theia/cli": "1.68.2",
    "typescript": "^5.9.0"
  },
  "scripts": {
    "build": "theia build --mode development",
    "build:prod": "theia build --mode production",
    "start": "theia start --mode development --hostname 0.0.0.0 --port 1771",
    "watch": "theia build --watch --mode development"
  }
}
```

Port overrides:
- Support `WTI_IDE_PORT` by changing script to: `--port ${WTI_IDE_PORT:-1771}` (implemented in shell wrappers rather than JSON for portability).

## Agents

### `ide/agents/infra`
- Move code from `ai/agents/infra` into `ide/agents/infra`.
- Keep package name `@wti/infra-agent`.
- Keep `theiaExtensions` pointing at compiled output.

`ide/agents/infra/package.json` should be based on the existing one, but pin exact Theia versions (or rely on root override).

```json
{
  "name": "@wti/infra-agent",
  "private": true,
  "version": "0.1.0",
  "description": "WTI Infra chat agent for Eclipse Theia (standalone extension package).",
  "keywords": ["theia-extension", "theia-ai", "chat-agent"],
  "dependencies": {
    "@theia/ai-chat": "1.68.2",
    "@theia/ai-core": "1.68.2",
    "@theia/core": "1.68.2"
  },
  "devDependencies": {
    "@theia/cli": "1.68.2",
    "typescript": "^5.9.0"
  },
  "theiaExtensions": [
    { "frontend": "lib/browser/frontend-module" }
  ],
  "files": ["lib", "src"],
  "scripts": {
    "build": "theiaext build",
    "clean": "theiaext clean",
    "compile": "theiaext compile",
    "lint": "theiaext lint",
    "watch": "theiaext watch"
  }
}
```

Optional next step:
- Add backend module if/when we implement secrets provider or other server-side features.

## Top-level executable scripts (required)

All scripts must be executable (`chmod +x`). All scripts must work when run from the `ide/` directory.

### `ide/build.sh`
- Installs workspace deps.
- Builds agents first, then app.

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
corepack enable >/dev/null 2>&1 || true
pnpm install
pnpm -r --filter "./agents/**" run build
pnpm --filter @wti/wti-ide run build
```

### `ide/watch.sh`
- Watches agents + app build.

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
corepack enable >/dev/null 2>&1 || true
pnpm install
pnpm -r --parallel \
  --filter "./agents/**" \
  --filter @wti/wti-ide \
  run watch
```

### `ide/run.sh`
- Loads env files from `WTI_AI_ENV_FILES` (Phase 1 secret handling).
- Starts Theia on port 1771 by default, but allows override.

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
corepack enable >/dev/null 2>&1 || true

PORT="${WTI_IDE_PORT:-1771}"

# Load env vars from files: each file name is the env var name; contents are the value.
# Example: $WTI_AI_ENV_FILES/OPENAI_API_KEY contains the key.
if [[ -n "${WTI_AI_ENV_FILES:-}" && -d "${WTI_AI_ENV_FILES}" ]]; then
  while IFS= read -r -d '' f; do
    k="$(basename "$f")"
    v="$(cat "$f")"
    export "$k=$v"
  done < <(find "$WTI_AI_ENV_FILES" -maxdepth 1 -type f -print0)
fi

pnpm --filter @wti/wti-ide run start -- --port "$PORT"
```

(If `theia start` doesn’t accept `-- --port`, keep port config entirely in the app script and have `run.sh` set `WTI_IDE_PORT` and the app uses a small Node wrapper; Coder can adjust after verifying Theia CLI behavior.)

### `ide/test.sh`
- Uses a separate port (default 1337) so tests don’t fight with dev.

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
corepack enable >/dev/null 2>&1 || true

export WTI_IDE_TEST_PORT="${WTI_IDE_TEST_PORT:-1337}"

pnpm install
pnpm run build
pnpm --filter @wti/tests-playwright run test
```

## Playwright test harness

### `ide/tests/playwright/package.json`
```json
{
  "name": "@wti/tests-playwright",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui"
  },
  "devDependencies": {
    "@playwright/test": "^1.50.0",
    "wait-on": "^7.2.0",
    "typescript": "^5.9.0"
  }
}
```

### `ide/tests/playwright/fixtures/start-theia.ts` (behavior)
- Spawn `pnpm --filter @wti/wti-ide run start` with `WTI_IDE_PORT=$WTI_IDE_TEST_PORT`.
- Wait for `http://127.0.0.1:$PORT`.
- Ensure cleanup.

### `ide/tests/playwright/tests/smoke.spec.ts` (initial tests)
- Loads the app.
- Verifies key UI shells exist.
- Opens AI Chat view and asserts that `@Infra` agent is present (selector text may differ; implement robust selector strategy).

## Slash-and-burn migration steps (as requested)
1. Delete `ai/agents/infra/pnpm-lock.yaml` and stop treating that folder as an installable unit.
2. Move `ai/agents/infra` → `ide/agents/infra`.
3. Delete any leftover unused agent scaffolding in `ai/agents/` that is no longer relevant.
4. Update docs AFTER implementation (Coder should generate a prompt to Architect listing doc updates needed).

## Verification

From repo root:
1. `cd ide`
2. `./build.sh`
3. `./run.sh`
   - open http://localhost:1771
   - verify Theia loads
   - verify AI Chat loads and Infra agent is present

E2E:
1. `cd ide`
2. `./test.sh`

Dev loop:
1. `cd ide`
2. `./watch.sh` (in one terminal)
3. `./run.sh` (in another terminal)

## Reference examples in current repo (to reuse patterns)
- Existing Theia extension packaging pattern:
  - `ai/agents/infra/package.json` (uses `theiaext` scripts and `theiaExtensions` metadata)

## Risks / gotchas
- `pnpm.onlyBuiltDependencies` allowlist may need iteration if Theia (or dependencies) require building native modules even for browser mode.
- Theia CLI flags can vary slightly; adjust scripts after first run to match `@theia/cli@1.68.2`.
- Secrets: Phase 1 loads secrets into env, which you’d prefer to avoid. Phase 2 backend secrets provider will require integration work with `@theia/ai-*` configuration pathways.
