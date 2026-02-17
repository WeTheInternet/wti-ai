---
id: d8e98724-1940-4097-925f-dfcf2a188e57
sessionId: bba55ca2-7fae-4442-aa53-3e40fa3fa1fb
date: '2026-02-16T21:24:04.625Z'
label: Theia Infra Agent Build Steps
---
## Summary (for coding agent)

### Objective
Implement a repo-standard “build → pack → deploy into a running Theia checkout” workflow for the **WTI Infra agent** (a Theia extension) so developers running Theia from an external checkout can easily build and install the agent using the repo’s existing tooling under `ai/infra/bin`.

User runs Theia via `npm install && npm run build:browser && npm run download:plugins` then `OPENAI_API_KEY=$(< ~/.config/openai/.gc) npm run start:browser` from a Theia repo. Theia is run from the command line in `/opt/theia` using `npm browser:run` Any `repos/theia` directory within this repo (if present) is lookup-only for agents and must not be referenced in code/config/scripts.

### Current State / Relevant Artifacts
- Infra agent extension package:
  - `ai/agents/infra/package.json` (pins `"packageManager": "pnpm@9.15.5"`)
  - `ai/agents/infra/src/browser/infra-agent.ts`
  - `ai/agents/infra/src/browser/frontend-module.ts`
- Existing tooling:
  - `ai/infra/bin/ensure-pnpm.sh` enforces Node **22.x**, corepack, pnpm major >= 9
  - `ai/infra/bin/build-infra-agent.sh` builds `ai/agents/infra`
  - `ai/infra/bin/watch-infra-agent.sh` watches `ai/agents/infra`
- Constraint: Theia used for runtime is external (`/opt/theia`).

### Requirements
1. Add a new deploy script under `ai/infra/bin/` that:
   - Builds the infra agent using existing tooling expectations (`ensure-pnpm.sh`, Node 22, corepack/pnpm).
   - Packs the built extension into a `.tgz` (via `pnpm pack`) to a deterministic location.
   - Installs that package into the target Theia repo (default should use `/opt/theia`, but allow overriding to any absolute path).
   - Triggers a Theia rebuild (`npm run build:browser`), and optionally mentions `npm run download:plugins` without forcing it by default (plugins download can be slow).
   - Prints clear “next steps” to start Theia (including user’s OPENAI_API_KEY pattern).
2. Update documentation so the canonical “build/deploy” instructions refer to these scripts:
   - Update `ai/agents/infra/README.md` (and optionally `ai/infra/README.md` if appropriate).
3. Must fail fast with clear errors if target Theia directory or `package.json` is missing.
4. Use repo-root resolution patterns consistent with existing scripts (compute `__BIN_DIR`, `__REPO_ROOT`).
5. Do not attempt to change pnpm pinning; treat pnpm 9.15.5 as intentional and supported baseline.

### Proposed Implementation Approach (Task Steps)
1. **Create** `ai/infra/bin/deploy-infra-agent-to-theia.sh`
   - Bash script header: `#!/usr/bin/env bash` and `set -Eeuo pipefail`
   - Resolve:
     - `__BIN_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"`
     - `__REPO_ROOT="$(cd -- "${__BIN_DIR}/../../.." && pwd)"`
   - Accept args:
     - `THEIA_DIR="${1:-/opt/theia}"` (default to `/opt/theia`)
   - Validate:
     - `[[ -d "${THEIA_DIR}" ]]` and `[[ -f "${THEIA_DIR}/package.json" ]]` else exit with message.
   - Run pnpm guard:
     - `"${__BIN_DIR}/ensure-pnpm.sh"`
   - Build extension:
     - `cd "${__REPO_ROOT}/ai/agents/infra"`
     - `pnpm install`
     - `pnpm run build`
   - Pack extension:
     - Ensure output dir exists and is clean, e.g.:
       - `DIST_DIR="${__REPO_ROOT}/ai/agents/infra/dist"`
       - `rm -rf "${DIST_DIR}" && mkdir -p "${DIST_DIR}"`
     - `pnpm pack --pack-destination "${DIST_DIR}"`
     - Capture the generated tgz path robustly, e.g.:
       - `TGZ="$(ls -1t "${DIST_DIR}"/*.tgz | head -n 1)"`
       - validate file exists
   - Install into Theia repo:
     - `cd "${THEIA_DIR}"`
     - `npm install --no-audit --no-fund --save-dev "${TGZ}"`
       - Note: if Theia requires runtime dependency rather than devDependency, document rationale; but default to `--save-dev` to reduce impact.
   - Rebuild Theia:
     - `npm run build:browser`
     - Do **not** automatically run `download:plugins` unless a flag is provided (optional enhancement).
   - Print final instructions:
     - remind how to start: `OPENAI_API_KEY=$(< ~/.config/openai/.gc) npm run start:browser`
     - mention leading space trick is fine (don’t implement in script, just print).
2. **Optional enhancements** (only if simple):
   - Add `--with-plugins` flag to also run `npm run download:plugins`.
   - Add `--start` flag to run `npm run start:browser` (probably not desired because of env var handling).
   - Add a `watch-and-deploy` variant later; not required now.
3. **Docs update**
   - Edit `ai/agents/infra/README.md`:
     - “Build only”: `./ai/infra/bin/build-infra-agent.sh`
     - “Deploy into Theia checkout”: `./ai/infra/bin/deploy-infra-agent-to-theia.sh` (defaults to `/opt/theia`)
     - Override example: `./ai/infra/bin/deploy-infra-agent-to-theia.sh /some/other/theia` (absolute path)
     - Explain it packs to `ai/agents/infra/dist/*.tgz` and installs into the target repo.
4. Ensure scripts are executable (`chmod +x`) if repo convention requires (or rely on invoking with `bash ...`).

### Ambiguities / Items to Clarify (but proceed with sensible defaults)
- Whether the target Theia repo expects the extension as a runtime dependency (`--save`) vs dev dependency (`--save-dev`). Default to `--save-dev`; mention in comments/docs how to change if needed.
- Exact package in Theia repo that should receive the dependency: assume installing at `${THEIA_DIR}` is correct because user described “standard theia repo using package.json for build tasks”. If Theia uses a monorepo with workspace packages, might need installing into a specific package; keep script simple, but add an error message if `npm run build:browser` is missing.

### Relevant Examples / Patterns to Follow
- Follow path resolution and pnpm enforcement patterns used by:
  - `ai/infra/bin/build-infra-agent.sh`
  - `ai/infra/bin/watch-infra-agent.sh`
  - `ai/infra/bin/ensure-pnpm.sh` (Node 22 + corepack)
- Packaging command: `pnpm pack --pack-destination <dir>` executed from `ai/agents/infra`.

### Acceptance Criteria
- Running `./ai/infra/bin/deploy-infra-agent-to-theia.sh`:
  - builds agent successfully,
  - creates a `.tgz` under `ai/agents/infra/dist/`,
  - installs it into the configured Theia checkout via `npm install`,
  - runs `npm run build:browser` in that repo,
  - outputs clear next steps to run `npm run start:browser` with OPENAI_API_KEY.