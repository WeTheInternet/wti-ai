id: 8e8c7c97-93a9-4f87-be1b-0e92b29afb14
sessionId: a0e7b78e-1276-404e-9e40-e6cbfd3b522c
date: '2026-02-16T22:49:21.699Z'
label: Troubleshooting Missing @Infra Agent in Theia Autocomplete
---
## Summary of Current Chat Session (for Coding Agent)

### 1) Objective
Make the new Theia chat agent **`@Infra`** appear in the Theia chat popup autocomplete / agent picker when running Theia locally (user runs Theia via a `.theia-workspace` and starts Theia with a browser start script, e.g. `npm run start:browser` / “run locally w/ npm run:browser”).

The `@Infra` extension is already built and installed, but it does not show up in the UI, implying it is **not being loaded into the running frontend application bundle** (most likely missing from the application’s dependency graph / generated `src-gen` frontend bootstrap).

### 2) Current State / Evidence
#### Agent extension package (in wti-ai repo)
- Extension package lives at: `ai/agents/infra/`
- It is a standalone Theia extension:
  - `ai/agents/infra/package.json` includes:
    - `"name": "@wti/infra-agent"`
    - `"theiaExtensions": [{ "frontend": "lib/browser/frontend-module" }]`
- It registers a `ChatAgent` via DI:
  - `ai/agents/infra/src/browser/frontend-module.ts` binds `InfraAgent` and binds it to both `Agent` and `ChatAgent`.
- `InfraAgent` details:
  - File: `ai/agents/infra/src/browser/infra-agent.ts`
  - `id = 'Infra'`, `name = 'Infra'`
  - Provides chat modes (design/implement/review/test)
  - Should be mentionable as `@Infra` once loaded.

#### Installed artifact in the running Theia environment
- Tarball exists on disk:
  - `/opt/wti-ai/ai/agents/infra/dist/wti-infra-agent-0.1.0.tgz`
- Theia monorepo root (in the mirror tree) has a dependency:
  - `repos/theia/package.json` includes:
    - `"@wti/infra-agent": "file:../wti-ai/ai/agents/infra/dist/wti-infra-agent-0.1.0.tgz"`
  - Matching entries exist in `repos/theia/package-lock.json`.
- User confirmed the installed compiled module exists:
  - `/opt/wti-ai/repos/theia/node_modules/@wti/infra-agent/lib/browser/frontend-module.js`
  - It correctly loads and binds `InfraAgent` as `ChatAgent`.

#### Why it still doesn’t appear
- The running Theia app is the browser example (per startup logs):
  - Script run chain (from logs): `cd examples/browser && npm run start` then `theia start ...`
- The generated frontend bootstrap for the browser example (mirror tree) is:
  - `repos/theia/examples/browser/src-gen/frontend/index.js`
- That file includes many `import('@theia/...')` loads but **does not import**:
  - `@wti/infra-agent/lib/browser/frontend-module`
- Therefore, even if `@wti/infra-agent` is installed in node_modules, it will not be loaded unless it is part of the application’s dependency graph and included by the Theia build that generates `src-gen/frontend/index.js`.

### 3) Main Requirement
Ensure the **actual running application package** (the one started by the user, apparently `examples/browser`) includes `@wti/infra-agent` as a dependency so Theia build includes it in the frontend bundle, leading to `@Infra` showing up in the agent selection / autocomplete.

### 4) Proposed Implementation Approach (Task Steps)
1. **Identify the application package being started**
   - Based on logs, it is `examples/browser` (Theia Browser Example).
   - In the mirror tree this corresponds to:
     - `repos/theia/examples/browser/package.json`
   - However, user claims “there is no examples/browser/package.json” in their runtime tree; this is likely a path mismatch between:
     - mirror tree (`/opt/wti-ai/repos/theia`) vs
     - actual runtime tree (`/opt/theia`) or another checkout.
   - Action: Confirm which repository root is actually used when running `npm run start:browser`.

2. **Add `@wti/infra-agent` to the correct app package.json**
   - If using the monorepo layout shown in mirror:
     - Edit: `repos/theia/examples/browser/package.json`
     - Add to `"dependencies"`:
       - `"@wti/infra-agent": "file:../../../wti-ai/ai/agents/infra/dist/wti-infra-agent-0.1.0.tgz"`
       - (Path is relative to `repos/theia/examples/browser/`; verify relative path based on actual filesystem.)
   - If the runtime tree differs (e.g. `/opt/theia`):
     - Find the equivalent application package.json that is built and started.
     - Add the dependency there instead.

3. **Rebuild the browser application bundle**
   - Run the app’s build/bundle process so `src-gen/frontend/index.js` is regenerated and includes `@wti/infra-agent`.
   - In the monorepo, typical commands (user must approve running):
     - From monorepo root: `npm install` (if needed) and then `npm run build:browser` or `cd examples/browser && npm run build` / `npm run bundle`
     - Then restart: `npm run start:browser` (or `cd examples/browser && npm run start`)

4. **Verify `@wti/infra-agent` is loaded**
   - After rebuild, check the generated frontend entrypoint includes the extension:
     - File: `.../examples/browser/src-gen/frontend/index.js`
     - Ensure it contains an import line for:
       - `@wti/infra-agent/lib/browser/frontend-module` (or equivalent path generated by Theia’s builder).
   - In the UI, verify `@Infra` appears in:
     - chat agent picker / mention autocomplete.
   - Optional: add a one-time debug log in the chat UI where agents are listed to confirm `Infra` is present:
     - Candidate file in Theia sources: `repos/theia/packages/ai-chat-ui/src/browser/ai-chat-ui-contribution.ts` (it calls `chatAgentService.getAgents()` during selection).

### 5) Ambiguities / Needs Clarification
- **Path mismatch / repo confusion**: user asserts there is no `examples/browser/package.json` in their runtime environment, yet logs indicate the start script `cd examples/browser`.
  - Need to determine the real filesystem location of the monorepo root used at runtime (e.g. `/opt/theia` vs `/opt/wti-ai/repos/theia`).
- The dependency currently is only present in the monorepo root `package.json` (`repos/theia/package.json`). That is likely insufficient; it must be present in the actual application package. Confirm where the dependency is most appropriate in the user’s runtime tree.

### 6) Relevant Correct Implementation Example
- The `@wti/infra-agent` package is already correctly authored for Theia extension loading:
  - It declares `"theiaExtensions": [{ "frontend": "lib/browser/frontend-module" }]` in `ai/agents/infra/package.json`
  - It exports a default `ContainerModule` in `ai/agents/infra/src/browser/frontend-module.ts` that binds `ChatAgent`.
- Therefore the fix is not in agent code; it is in **application bundling/wiring** so the frontend loads the module.

### 7) Constraints / Repo Rules
- User note (from repo docs): `repos/theia` can be used for source lookup, but should not be referenced in product code/output; keep changes scoped to correct places.
- Do not run commands without explicit user approval.1