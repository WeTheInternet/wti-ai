id: 26c62721-4173-4243-adfc-eb9034eaf329
sessionId: 6ff53f46-6489-4127-bc33-4081b037120b
date: '2026-02-17T05:48:33.537Z'
label: Theia UI Styling Issues and Infra Agent Errors
---
## Summary of Current Chat Session

### Context
- User has a Theia-based app `wti-ide` running. The `@wti/infra-agent` appears in the UI, but the UI is “barebones/broken” (e.g., missing nice AI UX like “Ask the Theia IDE AI”, and editor cursor/caret issues). `@Infra` prompts also “mess up”.
- The immediate coding request is **not** to debug runtime issues, but to **add missing Theia packages** to the app so the richer UI/integrations are available.
- The app package being modified is **`ide/apps/wti-ide/package.json`** (this is the running application package in the repo).
- Current app uses **Theia 1.68.2** across dependencies (do not mix with 1.68.0). User provided a reference list from a working setup using 1.68.0, but this repo’s app should remain on **1.68.2**.

### Main Coding Objective
Update `ide/apps/wti-ide/package.json` to include additional Theia dependencies (AI IDE integrations and some core UX packages) that are present in the user’s working Theia setup but missing from the current “barebones broken” one.

### Requirements
1. **Add these dependencies** (if not already present) to `ide/apps/wti-ide/package.json` with version **`1.68.2`**:
   - `@theia/ai-ide`
   - `@theia/ai-editor`
   - `@theia/ai-terminal`
   - `@theia/ai-code-completion`
   - `@theia/ai-history`
   - `@theia/toolbar`
   - `@theia/getting-started`
   - `@theia/scm-extra`
   - `@theia/terminal-manager`
   - `@theia/vsx-registry`
2. **Keep existing dependencies unchanged**, especially:
   - `@theia/ai-chat`, `@theia/ai-chat-ui`, `@theia/ai-core`, `@theia/ai-core-ui`, `@theia/ai-mcp`, `@theia/ai-mcp-ui`, `@theia/ai-openai`
   - `@wti/infra-agent` (workspace dependency currently set to `workspace:*` in repo; do not remove)
3. **Avoid version mixing**: ensure all `@theia/*` remain **1.68.2** in this app.

### Relevant Repo Artifacts
- Application package.json to edit: `ide/apps/wti-ide/package.json`
- Webpack customization exists but not part of this requested change: `ide/apps/wti-ide/webpack.config.js`

### Proposed Implementation Approach (Task Steps)
1. Open `ide/apps/wti-ide/package.json`.
2. Under `"dependencies"`, add the 10 packages listed above, each pinned to `"1.68.2"`, only if missing.
3. Ensure JSON formatting remains valid and consistent with current style.
4. Do **not** remove or downgrade any existing packages.
5. After editing, run install/build commands (agent can suggest, but implementation is just code change):
   - `pnpm install`
   - `pnpm --filter @wti/wti-ide build` (or `watch`)
   - `pnpm --filter @wti/wti-ide start`
6. If peer dependency issues appear, resolve by aligning to **1.68.2** (do not introduce 1.68.0).

### Ambiguities / Follow-ups (for later, not required to complete the coding task)
- The underlying “no cursor” and “@Infra prompt breaks” issues might persist even after dependency additions; not requested to fix now.
- User’s working reference includes many additional packages (anthropic/google/ollama/etc). Only the 10 packages above were explicitly requested for addition in this task.

### Example / Guidance
- Keep versions consistent with existing `@theia/*` entries in `ide/apps/wti-ide/package.json` (currently 1.68.2). Do not add 1.68.0 versions from the reference list.