id: 09c0b38f-8710-4033-9241-6922230bbc56
sessionId: 4ccdf8a9-7224-438e-9f9e-8c90b64a92a5
date: '2026-02-17T04:18:02.838Z'
label: 'Theia IDE UI Crash: Missing PreferenceProvider Binding & Broken Sourcemaps'
---
## Summary

The IDE (Theia app under `ide/apps/wti-ide`) builds and starts, but the UI is broken. Root cause of the current failure path is **missing build tooling for an internal Theia extension (“agent”) package**:

- `@wti/infra-agent` build fails because the `theiaext` CLI is not found:
  - Error: `sh: 1: theiaext: not found`
  - Command: `theiaext build` (from `ide/agents/infra` package)
- Because the agent never builds, the IDE build warns it cannot resolve:
  - `@wti/infra-agent/lib/browser/frontend-module`
  - This is referenced by the generated Theia frontend entry file at:
    - `ide/apps/wti-ide/src-gen/frontend/index.js` (`await load(container, import('@wti/infra-agent/lib/browser/frontend-module'));`)

Additionally, there was confusion about global vs local `theia` CLIs; root-level `pnpm exec theia` fails because `@theia/cli` is a devDependency of the app package (`ide/apps/wti-ide/package.json`), not the workspace root (`ide/package.json`). Correct usage is `pnpm --filter @wti/wti-ide exec theia ...`. However, the immediate blocker is `theiaext` missing for agent builds.

Sourcemaps: when build is run, `.js.map` files exist; earlier issues were due to running the wrong CLI/build artifacts. Do not patch generators yet; first fix build wiring/tooling.

## Main coding objective

Make the build/run workflow robust so:

1. **Agents (especially `@wti/infra-agent`) build successfully** before the IDE build.
2. The IDE build can resolve and load `@wti/infra-agent/lib/browser/frontend-module` without warnings.
3. Scripts use **local binaries via `pnpm exec`** to avoid PATH/global tool issues.
4. Keep pnpm wiring; align with current scripts:
   - `ide/build.sh` already builds agents first then the IDE.
   - `ide/run.sh` starts the IDE but does not build agents; keep as-is unless hardening is needed.

## Requirements / constraints

- Do **not** start patching Theia generator code yet.
- Keep pnpm (workspace is `ide/` with `pnpm-workspace.yaml`).
- Ensure scripts build agents first (already done in `ide/build.sh`, but currently fails).
- Prefer minimal changes and no new test harness; user will run existing `ide/test.sh` if needed.
- Optional hardening: make run/start more explicit to avoid invoking non-local CLIs.
- Existing artifacts already added to agent context (for reference):
  - `ide/build.sh`
  - `ide/run.sh`
  - `ide/apps/wti-ide/package.json`
  - `ide/apps/wti-ide/src-gen/frontend/index.js`

## Proposed approach (task steps)

### Step 1 — Fix `theiaext` availability for agent builds
1. Open and inspect: `ide/agents/infra/package.json`.
2. Identify how the package expects to build (script currently calls `theiaext build`).
3. Ensure the binary is invoked via pnpm local resolution:
   - Change the build script to:
     - `"build": "pnpm exec theiaext build"`
   - This avoids relying on PATH.

### Step 2 — Add the missing dependency that provides `theiaext`
1. Determine which package provides the `theiaext` executable in this repo’s ecosystem.
   - Likely candidates: `@theia/cli` or Theia extension tooling packages (depends on how `theiaext` is provided).
2. Add that package as a `devDependency` in `ide/agents/infra/package.json` (and any other agent packages that use `theiaext`).
3. Keep versions consistent with repo’s Theia override in `ide/package.json`:
   - `ide/package.json` contains:
     - `pnpm.overrides["@theia/*"] = "1.68.2"`

### Step 3 — Ensure the agent outputs the module path the IDE imports
1. After successful agent build, verify the output exists at:
   - `ide/agents/infra/lib/browser/frontend-module.(js|ts)`
2. Ensure the published package layout supports importing:
   - `@wti/infra-agent/lib/browser/frontend-module`
3. If output path differs, fix either:
   - the agent build config to generate `lib/browser/frontend-module`, or
   - the IDE import/module load path (in the app config that drives generation; last resort).

### Step 4 — Verify the IDE build no longer warns
1. Run/build flow expectation (manual verification):
   - `pnpm --filter @wti/infra-agent run build` should succeed.
   - `pnpm --filter @wti/wti-ide run build` should no longer show:
     - `Can't resolve '@wti/infra-agent/lib/browser/frontend-module'`

### Step 5 (optional hardening) — Ensure local CLI usage
- In `ide/run.sh`, consider switching the start invocation to explicitly use the app’s local CLI:
  - Current: `pnpm --filter @wti/wti-ide run start -- --port "$PORT"`
  - Hardening option: `pnpm --filter @wti/wti-ide exec theia start ...`
- Not strictly required if `run start` works, but reduces global CLI confusion.

## Ambiguities / needs clarification

1. **Which dependency provides `theiaext`** in this codebase?  
   - Must be discovered by inspecting `ide/agents/infra/package.json` and/or searching installed binaries after `pnpm install`.
2. **Expected output structure** of the agent build:
   - Confirm whether agent build should generate `lib/browser/frontend-module` or something else.
3. Whether any other agents besides `ide/agents/infra` require the same tooling fix.

## Relevant examples / patterns

- Prefer local binary execution:
  - Replace `theiaext build` → `pnpm exec theiaext build`
  - Replace `theia start ...` → `pnpm --filter @wti/wti-ide exec theia start ...` (optional)
- The IDE’s generated frontend entry loads the agent module:
  - File: `ide/apps/wti-ide/src-gen/frontend/index.js`
  - Statement: `await load(container, import('@wti/infra-agent/lib/browser/frontend-module'));`
  - Therefore, the agent must build and publish that path.

## Files to modify / inspect

- Must inspect/likely modify:
  - `ide/agents/infra/package.json` (not yet provided in chat; required for implementation)
- Optional modifications:
  - `ide/run.sh` (hardening)
  - possibly other `ide/agents/*/package.json` if they also use `theiaext`

## Expected outcome

After changes:
- `theiaext` is available and agent builds succeed.
- IDE build resolves `@wti/infra-agent/lib/browser/frontend-module`.
- Theia UI should progress past the missing-module failure mode (may expose further UI issues, but this removes the current build-time/runtime blocker).