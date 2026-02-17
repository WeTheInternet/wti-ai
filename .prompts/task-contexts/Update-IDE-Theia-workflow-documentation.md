id: 1b952037-9507-4d74-bda1-3cd967c4c972
sessionId: 615f18dd-8a78-4ec0-ad77-4c951c7f37af
date: '2026-02-17T03:02:03.685Z'
label: >-
  Update IDE/Theia workflow documentation for standalone `ide/` pnpm workspace +
  agents + Playwright
---
# Update IDE/Theia workflow documentation for standalone `ide/` pnpm workspace + agents + Playwright

## Goal
Make the **canonical** documentation match the new reality: the browser-based WTI IDE is built/run/tested from the standalone `ide/` pnpm workspace (Node 20, Theia from npm `@theia/*@1.68.2`), with WTI agents built as standalone Theia extensions (via `theiaext`) and a Playwright harness.

## Design
- Treat **authority** as frontmatter-driven:
  - These edits will likely remain `status: DRAFT` unless/ until you certify them.
  - Avoid contradicting any existing `status: CERTIFIED` docs (none found in the files we read; most are DRAFT/no-frontmatter).
- Establish a single canonical entry doc for dev workflows, and update older Theia docs to:
  - point to the canonical `ide/` workflow
  - mark `/opt/theia` as **legacy / non-goal** for WTI IDE dev
  - keep history (do not delete old instructions), but clearly deprecate them.
- Keep repo boundaries intact:
  - Do **not** introduce product script/config references to `repos/theia`.
  - In docs, mention `repos/theia` only in the context already allowed by `AGENTS.md` (workspace excludes/indexing overload), and keep it non-canonical.

## Implementation Steps

### Step 1: Add canonical “How to use the WTI IDE” doc
Create:
- `docs/theia/WTI_IDE_WORKFLOW.md`

Content to include (must match current scripts under `ide/`):
- **Prereqs**:
  - Node **20.x** (match `ide/package.json#engines`: `>=20 <21`)
  - `corepack enable` / pnpm via corepack (match `ide/build.sh`, etc.)
- **Canonical commands** (from `ide/` directory):
  - `./build.sh`
    - runs `pnpm install`
    - builds agents: `pnpm -r --filter "./agents/**" run build`
    - builds app: `pnpm --filter @wti/wti-ide run build`
  - `./run.sh`
    - default port **1771**; override via `WTI_IDE_PORT`
    - secret/env file loader: `WTI_AI_ENV_FILES` directory (file-per-env-var)
    - starts via: `pnpm --filter @wti/wti-ide run start -- --port "$PORT"`
  - `./watch.sh`
    - installs deps then runs `pnpm -r --parallel --filter "./agents/**" --filter @wti/wti-ide run watch`
    - document expected behavior: webpack rebuilds; browser needs refresh (Theia dev server is restarted? if not, state “rebuilds assets; refresh may be required”).
  - `./test.sh`
    - Playwright default IDE port **1337** via `WTI_IDE_TEST_PORT` (exported)
    - runs `pnpm install`, `pnpm run build`, then `pnpm --filter @wti/tests-playwright run test`
  - `./clean.sh`
    - verbose deletion; document exactly what it deletes:
      - all `node_modules`, `dist`, `lib`, `src-gen`
      - `ide/pnpm-lock.yaml`
      - `ide/pnpm-workspace.yaml.lock`
    - warning: this affects the entire `ide/` workspace.
- **Workspace layout** (match on-disk structure):
  - `ide/apps/wti-ide` (Theia browser app)
  - `ide/agents/*` (standalone Theia extensions, built with `theiaext`)
  - `ide/tests/playwright` (Playwright harness)
- **Secrets/env handling (Phase 1)**:
  - `WTI_AI_ENV_FILES=/path/to/dir`
  - each file name is env var key, file contents are the value (e.g. `OPENAI_API_KEY`)
  - rationale: avoid long-lived shell env; secrets only injected into the spawned process
  - cautions: ensure directory permissions; don’t commit; newlines handling (file content includes newline—call out that files should ideally contain just the value; trailing newline usually ok but can break some tokens).
- **Known issues / backlog callouts**:
  - shutdown noise: repeated `Unexpected SIGPIPE` mentioning drivelist vendor chunk
  - devtools sourcemaps: `webpack:///src/...` 404 / `ERR_UNKNOWN_URL_SCHEME`
  - optional peer dep warning: `@theia/electron` skipped in browser builds (non-issue)

### Step 2: Document `pnpm.onlyBuiltDependencies` policy + current allowlist
Update (or create if you prefer a dedicated doc):
- Create: `docs/theia/PNPM_ONLY_BUILT_DEPENDENCIES.md`

Include:
- What `pnpm.onlyBuiltDependencies` does and why we use it (security/supply-chain hardening; deterministic install; prevent arbitrary postinstall builds).
- Where it is configured:
  - `ide/package.json#pnpm.onlyBuiltDependencies`
- **Current allowlist** (must match `ide/package.json`):
  - `@parcel/watcher`
  - `@vscode/ripgrep`
  - `drivelist`
  - `esbuild`
  - `keytar`
  - `node-pty`
- Rationale per item (brief, practical):
  - which ones provide native `.node` binaries used by Theia/runtime
  - e.g. `node-pty` for terminal, `keytar` optional but common, `@parcel/watcher` filesystem watching, `@vscode/ripgrep` search, `drivelist` drive enumeration (even if noisy on shutdown), `esbuild` build tooling.
- How to extend allowlist:
  - symptom-driven: install/build fails due to blocked native build
  - add package name under `pnpm.onlyBuiltDependencies` in `ide/package.json`
  - reinstall
- Troubleshooting recipe when a native `.node` is missing:
  - identify the missing module from stack trace (`Cannot find module ... .node`)
  - map to the owning npm package
  - ensure it’s in `onlyBuiltDependencies`
  - clean/reinstall (doc-only steps; do not instruct to run destructive commands beyond pointing at `ide/clean.sh`).

### Step 3: Record required application deps (Theia + build-time loaders)
Update canonical workflow doc (Step 1) with a “Dependencies” section, and also add a focused doc:
- Create: `docs/theia/WTI_IDE_DEPENDENCIES.md`

Document what is required **and where it lives**:
- Direct deps of `ide/apps/wti-ide/package.json`:
  - Theia packages pinned to `1.68.2` (and enforced via `ide/package.json#pnpm.overrides`)
  - `@theia/monaco-editor-core` required at `1.96.302` (explicitly called out as Theia/Monaco requirement)
  - `@vscode/ripgrep` (and note it’s also in onlyBuiltDependencies)
  - `@wti/infra-agent` workspace dependency (agent package)
- Build-time/dev deps required by Theia webpack build in this setup:
  - `css-loader`, `style-loader`, `source-map-loader`, `umd-compat-loader`, `node-loader`
  - `reflect-metadata`
- Clarify “workspace-wide concerns”:
  - the `pnpm.overrides` in `ide/package.json` pins all `@theia/*` versions
  - `pnpm.onlyBuiltDependencies` is enforced at the workspace root

### Step 4: Playwright harness documentation
Create:
- `docs/theia/WTI_IDE_PLAYWRIGHT_HARNESS.md`

Document based on `ide/test.sh` + Playwright package:
- How tests start the IDE:
  - `ide/test.sh` sets `WTI_IDE_TEST_PORT` (default `1337`)
  - `@wti/tests-playwright` is responsible for starting the app and waiting for readiness (call out that the harness uses `wait-on`; link to code once Coder confirms exact file path under `ide/tests/playwright`).
- Headless vs UI:
  - `pnpm --filter @wti/tests-playwright run test` (headless default)
  - `pnpm --filter @wti/tests-playwright run test:ui`
- Port usage and avoiding conflicts:
  - don’t run `./run.sh` on same port as tests
  - if dev server is running, set `WTI_IDE_TEST_PORT` to a different port.

### Step 5: Align conflicting statements (AGENTS + older Theia docs) without breaking boundaries
Edit to remove “durable assumption” conflicts and route to the canonical doc.

1) `AGENTS.md`
- Update “Runtime assumptions (durable)” to:
  - make `ide/` the canonical Theia runtime for this repo
  - demote `/opt/theia` to legacy/non-goal, retained for history
  - keep the `repos/theia` workspace-excludes note intact

Proposed text shape:
- Durable:
  - “WTI IDE is run from the `ide/` pnpm workspace (browser Theia app).”
  - “`/opt/theia` legacy/manual setups are not maintained (do not update docs/scripts to depend on them).”
  - “`repos/theia` may exist only for IDE performance/source lookup; never referenced by product code/scripts.”

2) `docs/theia/LOCAL_AGENT_BUILD_AND_INSTALL.md`
- Keep file (history), but add frontmatter and a prominent banner:
  - “This doc describes the legacy `/opt/theia` workflow; for the supported workflow, see `docs/theia/WTI_IDE_WORKFLOW.md`.”
- Update prereqs to Node 20 (not 22) or clearly separate “legacy prereqs” vs “current prereqs”; prefer aligning to Node 20 across the repo.
- Add a new “Current (supported) workflow” section:
  - build/install agents via `ide/` workspace (agents are already part of the workspace; no manual tarball install needed for normal dev)
  - if you still need a tarball for external install, point to `pnpm pack` within `ide/agents/<agent>` (Coder to confirm exact pack output conventions).

3) `docs/goals/theia-packaging-fix.md`
- This doc currently references `repos/theia/...` as the package location.
- Update scope to reflect the new implemented architecture:
  - The infra agent is now `ide/agents/infra` built by `theiaext`
  - The app consumes it via workspace dependency `@wti/infra-agent: workspace:*`
  - Remove/replace `repos/theia/...` path references.

4) `docs/theia/SETUP_NOTES.md`
- Add a short “WTI IDE app” section at top linking to canonical workflow doc and noting browser-only scope.

5) `docs/theia/REPO_BOUNDARIES.md`
- Optionally add boundary entry for `ide/**` (if you want roles guidance), but do not add if it would conflict with your current boundary policy. (If added, keep it permissive.)

### Step 6: Add/Update routers so new docs are discoverable
Update:
- `docs/theia/` directory currently lacks a `PURPOSE.md` router. Create it:
  - `docs/theia/PURPOSE.md`
  - Link to `WTI_IDE_WORKFLOW.md`, `WTI_IDE_DEPENDENCIES.md`, `PNPM_ONLY_BUILT_DEPENDENCIES.md`, `WTI_IDE_PLAYWRIGHT_HARNESS.md`
  - Mark legacy docs (`LOCAL_AGENT_BUILD_AND_INSTALL.md`) as historical.

Also update:
- `docs/PURPOSE.md` to mention `docs/theia/` has a router (once created) and that it contains the canonical IDE workflow.

## Reference Examples
(Repo reality used to ground doc claims)
- `ide/package.json`:
  - Node engine pin: `>=20 <21`
  - `pnpm.overrides` pins `@theia/*` to `1.68.2`
  - `pnpm.onlyBuiltDependencies` allowlist: `@parcel/watcher`, `@vscode/ripgrep`, `drivelist`, `esbuild`, `keytar`, `node-pty`
- `ide/run.sh`:
  - default port `1771`, override `WTI_IDE_PORT`
  - `WTI_AI_ENV_FILES` file-per-env-var loading
- `ide/test.sh`:
  - default test port `1337`, override `WTI_IDE_TEST_PORT`
- `ide/apps/wti-ide/package.json`:
  - required webpack loaders + `reflect-metadata`
  - `@theia/monaco-editor-core@1.96.302`
- `ide/agents/infra/package.json`:
  - `theiaext build/watch` scripts (standalone agent extension)

## Verification (doc-only)
- Links resolve:
  - `docs/theia/PURPOSE.md` routes to the new canonical docs.
- No remaining references in docs that claim `/opt/theia` is the durable/canonical workflow (except explicitly marked legacy sections).
- Node version consistency:
  - docs state Node 20 for the supported `ide/` workflow.
- Script parity:
  - documented ports/env vars match `ide/*.sh` exactly.
- Policy parity:
  - documented `onlyBuiltDependencies` allowlist matches `ide/package.json` exactly.
