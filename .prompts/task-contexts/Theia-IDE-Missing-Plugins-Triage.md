id: 725efc26-0546-4ddc-9b6c-fd993843a0a7
sessionId: 192963b0-74e9-406d-a953-453e8eacd5d2
date: '2026-02-17T04:56:17.327Z'
label: Theia IDE Missing Plugins Triage & Dependency Additions
---
## Summary for Coding Agent

### 1) Objective
Upgrade the current Theia **browser app** from “super vanilla” to a **rich IDE experience** with:
- “All the goodies” UX: theming (dark theme by default), keymaps, messages, mini-browser, status bar, enhanced search, Git/SCM, tasks/debug (optional but expected).
- A “superset” of **Theia AI** capabilities to match/improve the current AI Chat experience the user has now, and to support future custom agents/workflows:
  - AI Chat UX (already present via `@theia/ai-chat`)
  - Tool/function calling ecosystem, agent/workflow orchestration (if Theia provides separate packages)
  - Foundations for approval gates / human-in-the-loop control (at least ensure needed packages and extension points are present)
  - Tight integration with **direct OpenAI** (no custom gateway needed now)
- Enable **VS Code extension support** and **bundled VSIX** mechanism so the product can later include:
  - `redhat.java`, Gradle/Groovy, Docker, Kubernetes, Bash, themes/icons, etc.
- Context: User will do **Option A** initially: run language servers/tools alongside the Theia backend in k8s later (even if builds happen externally). For now running locally; k8s soon. Electron later (browser can’t reliably override Ctrl+W).

### 2) Current State (artifacts)
- App package: `ide/apps/wti-ide/package.json` is minimal; currently includes core/editor/filesystem/navigator/terminal/preferences/workspace + `@theia/ai-core` and `@theia/ai-chat`.
- Root: `ide/package.json` pins `@theia/*` to `1.68.2` via pnpm overrides; Node engine >=20 <21.
- The vanilla experience is expected due to missing Theia extension packages and lack of VS Code extension support.

### 3) Requirements (explicit)
1. Add Theia “niceties” packages:
   - keymaps, messages, mini-browser, statusbar
   - theming (dark theme default)
   - Git + SCM
   - richer search (search-in-workspace)
   - “all the goodies” generally expected in an IDE
2. Add “enough AI plugin goodness” to provide at minimum the same experience as current AI chat; prefer **more rather than less** one time.
   - Support future multi-agent workflow: Architect, Coder, Reviewer, Tester will be “workhorses”
   - Need ability to add approval requirements yes/no so agents can be unleashed later
   - Direct OpenAI is fine for now; service-layer orchestration later
3. Enable VS Code extension loading + bundling mechanism (so later can ship redhat.java etc.).
4. Browser app focus now; Kubernetes later; Electron later.

### 4) Proposed Implementation Approach (task steps)

#### Step A — Add Theia IDE UX extensions (dependencies)
Edit: `ide/apps/wti-ide/package.json` and add dependencies (version pinned by root override to 1.68.2):

Recommended baseline:
- UI/UX:
  - `@theia/theme`
  - `@theia/keymaps`
  - `@theia/messages`
  - `@theia/mini-browser`
  - `@theia/statusbar`
- Productivity:
  - `@theia/search-in-workspace` (in addition to existing `@theia/file-search`)
  - `@theia/bulk-edit` (if available in 1.68.2)
  - (Optional if available) `@theia/callhierarchy`, `@theia/typehierarchy`
- Git:
  - `@theia/git`
  - `@theia/scm`
- Optional but commonly desired:
  - `@theia/task`
  - `@theia/debug`

Notes:
- Some names may differ by Theia version. If any package is missing in 1.68.2, pick the correct equivalent or skip with a comment.

After adding deps:
- Run `pnpm -r install` from `ide/` and rebuild (`pnpm --filter @wti/wti-ide run build` or `start`).

#### Step B — Make it non-vanilla by default (dark theme & sane defaults)
Implement default preferences so first launch is dark and feels like an IDE.

Where/how depends on current app structure. Look for a “default preferences” mechanism in the app (common options):
- A default preferences JSON file bundled by the application and read by Theia.
- A frontend module contribution that sets defaults programmatically.
- A `preference` override in configuration files.

Action:
- Find existing pattern in repo (search for “defaultPreferences”, “preferences”, “frontendApplicationConfig”, etc. under `ide/apps/wti-ide/`).
- Set defaults for:
  - `workbench.colorTheme` (or Theia equivalent)
  - editor tab behavior defaults as desired (optional)
- Ensure theme package is included so dark theme actually exists.

#### Step C — Enable VS Code extension support + bundled VSIX directory
Goal: later allow bundling `redhat.java`, Docker, k8s, bash, theme/icon extensions.

Actions:
1. Add the Theia packages needed for VS Code extension support for Theia `1.68.2`.
   - The exact package names/mechanism can vary (classic Theia plugin system vs VS Code extension host).
   - Inspect Theia docs for 1.68.x or existing repo patterns. Search in workspace for “plugin-ext”, “vscode”, “vsix”, “extensions-dir”.
2. Add runtime configuration for an extensions directory, e.g.:
   - `ide/apps/wti-ide/extensions/` or `ide/apps/wti-ide/plugins/`
3. Add build scripts to download/install VSIX into that directory.
   - Create an install script like `pnpm run extensions:install` that downloads specific VSIX files.
   - Ensure build copies these into the final build output (may require updating webpack copy config in `ide/apps/wti-ide/gen-webpack.config.js` if needed).
4. Don’t fully solve Java LS now, but make sure extension support is functional so it can be tested with a small extension (e.g. a theme VSIX).

#### Step D — AI: include full Theia AI ecosystem packages (1.68.2) & OpenAI config
In `ide/apps/wti-ide/package.json`:
- Keep: `@theia/ai-core`, `@theia/ai-chat`
- Add: **all additional `@theia/ai-*` packages available in 1.68.2** that are intended for app inclusion (tooling, agents, provider integrations, context, etc.).

How:
- Use pnpm search / registry inspection to list `@theia/ai-*` packages at 1.68.2.
- Add them conservatively but “prefer more over less” as requested.

Configuration:
- Ensure OpenAI provider wiring exists and is configurable via env vars/preferences (API key, model).
- Confirm AI chat panel appears and can respond with OpenAI key configured.

Approval gates foundation:
- If Theia AI includes confirmation/approval modules, include them.
- If not, ensure there’s a clear integration point for later (e.g., tool execution hooks or centralized “tool invocation” service that can be wrapped). At minimum, do not block future gating; keep code structured for policy injection.

#### Step E — Verification checklist
After changes:
- UI: status bar, keymaps, messages, mini-browser visible; Git/SCM view present; search-in-workspace present; dark theme available by default.
- AI: AI Chat works and matches current experience; additional AI features visible if provided by packages.
- VS Code extension host: can load at least one bundled VSIX (theme/icon) successfully.

### 5) Ambiguities / Clarifications Needed Later
- Exact list of `@theia/ai-*` packages available in 1.68.2 and which are “app-bundle safe” (some might be internal). Decide based on Theia docs/monorepo package descriptions.
- “Approval gates”: user wants yes/no approvals eventually. Not fully specified whether approvals are per-tool, per-plan-step, or both. For now just ensure the AI/tooling architecture can support gating.
- VS Code extension mechanism: confirm which Theia extension host approach is appropriate for this repo’s Theia 1.68.2 setup.

### 6) Relevant Implementation Notes / Examples
- The current minimal dependency set is why everything feels missing. Theia is compositional: adding `@theia/git` + `@theia/scm` typically enables SCM UI; adding `@theia/theme` enables built-in themes and theming commands; `@theia/statusbar` enables status bar.
- Browser limitation: Ctrl+W cannot reliably be overridden in web apps (so don’t attempt to “fix” that now; Electron later is the real solution).

### 7) Files/Paths to Modify (unique identifiers)
- Primary:
  - `ide/apps/wti-ide/package.json` (add Theia UX deps, AI deps, scripts)
- Possibly:
  - `ide/apps/wti-ide/gen-webpack.config.js` (ensure extensions/plugins dir copied to build)
  - Any existing app config/default preferences files under `ide/apps/wti-ide/` (to set default dark theme)
- Root constraints:
  - `ide/package.json` (already pins `@theia/*` to `1.68.2`; do not change unless required)

