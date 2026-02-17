id: 63835db5-05b4-4419-a838-634c94d999ba
sessionId: 615f18dd-8a78-4ec0-ad77-4c951c7f37af
date: '2026-02-17T03:04:47.383Z'
label: Standalone Ide Workspace Docs Update
---
## Summary of Current Chat Session

### 1) Main Coding Objective and Requirements
Update repository documentation to make the **canonical** way to build/run the WTI Theia browser IDE be the standalone **`ide/` pnpm workspace** (Node 20, pnpm via corepack). Scrub/stop emphasizing the legacy “manual Theia in `/opt/theia` + pack/install agent tgz” workflow, without deleting historical content.

Key requirement from user: **“scrub all the old theia / infra agent build goop and replace it with ‘now we build it all together from `ide/`’.”**

Authority/trust rules:
- Only docs with frontmatter `status: CERTIFIED` are authoritative; current touched docs are DRAFT/no-frontmatter, so updates should include frontmatter and remain `status: DRAFT` unless user later certifies.
- Do not run commands; propose doc changes only.
- Keep boundary rule: do not reference `repos/theia` in product scripts/config; docs may mention only in limited context (workspace excludes) but not as canonical workflow.

### 2) Repo Reality (Must Match Docs)
Artifacts read and must match documentation:

**IDE workspace structure**
- `ide/` contains: `.nvmrc`, `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, scripts:
  - `ide/build.sh`
  - `ide/run.sh`
  - `ide/watch.sh`
  - `ide/test.sh`
  - `ide/clean.sh`
- Workspace packages:
  - `ide/apps/wti-ide/package.json` (`@wti/wti-ide`)
  - `ide/agents/infra/package.json` (`@wti/infra-agent`, built via `theiaext`)
  - `ide/tests/playwright/package.json` (`@wti/tests-playwright`)

**Node/pnpm constraints**
- `ide/package.json#engines.node`: `>=20 <21`
- `ide/package.json#pnpm.overrides`: pins all `@theia/*` to `1.68.2`
- `ide/package.json#pnpm.onlyBuiltDependencies` allowlist:
  - `@parcel/watcher`
  - `@vscode/ripgrep`
  - `drivelist`
  - `esbuild`
  - `keytar`
  - `node-pty`

**Script behaviors**
- `ide/build.sh`: `pnpm install` then builds agents then app.
- `ide/run.sh`:
  - default port `1771`, override `WTI_IDE_PORT`
  - loads secrets from `WTI_AI_ENV_FILES` directory: for each file, env var = basename, value = file contents
  - starts app: `pnpm --filter @wti/wti-ide run start -- --port "$PORT"`
- `ide/watch.sh`: installs then runs `watch` in parallel for agents + app.
- `ide/test.sh`: sets `WTI_IDE_TEST_PORT` default `1337`; installs, builds, runs Playwright.
- `ide/clean.sh`: deletes all `node_modules`, `dist`, `lib`, `src-gen` under `ide/`; removes `ide/pnpm-lock.yaml` and `ide/pnpm-workspace.yaml.lock`.

**Current problematic/legacy docs**
- `docs/theia/LOCAL_AGENT_BUILD_AND_INSTALL.md` currently assumes `/opt/theia` and Node 22 and manual packing/install.
- `AGENTS.md` has “durable assumption: Theia run from `/opt/theia`” which now conflicts with new `ide/` truth.

### 3) Proposed Approach / Task Steps (Implementation Plan)
Implement documentation updates as diffs:

#### Step A — Add a docs router for Theia
Create `docs/theia/PURPOSE.md` as a routing hub:
- Links canonical workflow doc.
- Marks legacy `/opt/theia` doc as historical.

#### Step B — Add canonical “build everything from ide/” doc
Create `docs/theia/WTI_IDE_WORKFLOW.md`:
- Node 20 + corepack/pnpm prerequisites.
- Explicit `cd ide` and run scripts:
  - `./build.sh`
  - `./run.sh` (port 1771 default; `WTI_IDE_PORT`)
  - `./watch.sh` (rebuild behavior; may need browser refresh)
  - `./test.sh` (Playwright; default port 1337 via `WTI_IDE_TEST_PORT`)
  - `./clean.sh` (exact deletion list)
- Describe layout:
  - `ide/apps/wti-ide`
  - `ide/agents/*`
  - `ide/tests/playwright`
- Document Phase 1 secret handling:
  - `WTI_AI_ENV_FILES` dir; file-per-env-var; avoids long-lived shell exports
- Include “Known issues/backlog callouts” section (as noted in earlier requirements):
  - Shutdown noise: repeated “Unexpected SIGPIPE” referencing drivelist vendor chunk
  - Sourcemap issue in devtools: `webpack:///src/...` 404 / `ERR_UNKNOWN_URL_SCHEME`
  - Optional peer dep warning: `@theia/electron` skipped in browser builds is a non-issue

Use YAML frontmatter with `status: DRAFT`, authors, lastUpdated, etc.

#### Step C — Scrub legacy agent build doc but keep history
Edit `docs/theia/LOCAL_AGENT_BUILD_AND_INSTALL.md`:
- Add YAML frontmatter (`status: DRAFT`, etc.).
- Add prominent banner at top:
  - “Legacy doc; supported workflow is `docs/theia/WTI_IDE_WORKFLOW.md`”
  - State: WTI agents are built/consumed from `ide/` workspace; no manual tgz installs needed for normal dev.
- Demote existing `/opt/theia` content to a “Legacy workflow (not maintained)” section.
- Update Node mismatch guidance to mention Node 20 for supported flow.
- Keep old instructions intact under legacy heading (do not delete history).

#### Step D — Align durable assumptions in agent entry doc
Edit `AGENTS.md`:
- Replace durable runtime assumption “Theia run from `/opt/theia`” with:
  - Canonical: “WTI Theia browser IDE is built/run from `ide/` pnpm workspace.”
  - Explicitly: “Legacy/manual `/opt/theia` setups not maintained.”
- Keep the `repos/theia` note unchanged (may exist for indexing/source lookup only; no product references).

#### Step E — Small alignment in setup notes (optional but recommended)
Edit `docs/theia/SETUP_NOTES.md`:
- Add one line near top: “Canonical build/run workflow: `docs/theia/WTI_IDE_WORKFLOW.md`.”

### 4) Ambiguities / Items to Clarify Later
- Whether the new canonical docs should be marked `status: CERTIFIED` immediately; current plan uses `status: DRAFT` for safety.
- Watch-mode reload specifics: Theia watch rebuilds bundles; unclear if server live-reloads or requires manual refresh—doc currently says “may need refresh”; confirm later if desired.
- Playwright harness specifics (how it starts IDE and waits) were part of earlier broader requirements, but user’s latest emphasis is mainly “scrub old goop.” If expanding later, inspect `ide/tests/playwright` test code to document readiness/cleanup precisely.

### 5) Relevant Examples / Correct Implementation Patterns
- Follow existing repo doc-system conventions: add YAML frontmatter with `status`, `authors`, `lastUpdated`, `verification`.
- Ensure all port/env var references match scripts:
  - Run port: `WTI_IDE_PORT` default `1771` (`ide/run.sh`)
  - Test port: `WTI_IDE_TEST_PORT` default `1337` (`ide/test.sh`)
  - Secret files: `WTI_AI_ENV_FILES` directory loader (`ide/run.sh`)

---

## Concrete Patch Set (As Provided in Chat)

### Create: `docs/theia/PURPOSE.md`
Add router linking `docs/theia/WTI_IDE_WORKFLOW.md` and listing `LOCAL_AGENT_BUILD_AND_INSTALL.md` as legacy.

### Create: `docs/theia/WTI_IDE_WORKFLOW.md`
Canonical workflow doc as described above.

### Edit: `docs/theia/LOCAL_AGENT_BUILD_AND_INSTALL.md`
Add frontmatter, canonical banner + supported workflow section; reframe `/opt/theia` content as “Legacy (not maintained)”.

### Edit: `AGENTS.md`
Update “Runtime assumptions (durable)” section: canonicalize `ide/`, deprecate `/opt/theia`.

### Edit (optional): `docs/theia/SETUP_NOTES.md`
Add pointer to canonical workflow doc.

These edits were already drafted as diffs in the prior assistant message; implement them verbatim, updating timestamps consistently.