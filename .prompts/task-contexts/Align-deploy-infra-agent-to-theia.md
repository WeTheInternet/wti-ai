id: 55cdd1af-c70c-4d7a-9327-f850676afd57
sessionId: 66bf016b-ee9b-4ec7-bda8-18418add37e4
date: '2026-02-16T22:10:03.251Z'
label: Align deploy-infra-agent-to-theia.sh Default Theia Path to /opt/theia
---
## Summary of Current Chat Session

### Main coding objective
Align repo scripts and documentation for **building and manually installing a Theia agent package locally** (no publishing yet). Ensure the process does **not** assume a repo-local Theia checkout (e.g. `repos/theia`), and instead matches the repo’s durable runtime assumption that Theia runs from **`/opt/theia`**.

### Key requirements and constraints (authoritative from repo)
- `AGENTS.md` states durable runtime assumptions:
  - Theia is run from the command line in **`/opt/theia`**.
  - A `repos/theia` directory may exist only for IDE performance/source lookup; **do not reference `repos/theia` in product code, scripts, or non-workspace config**.
- No running scripts/tasks without explicit user approval (for humans/assistants; for coding agent, just implement changes as requested, don’t execute).
- The user has **no custom changes in their Theia fork** and wants a documented process that works with upstream Theia checkout/runtime.

### Current state (repo artifacts reviewed)
Relevant files:
- `AGENTS.md` — defines `/opt/theia` runtime default and forbids relying on `repos/theia`.
- `ai/agents/infra/theia-dev-report.md` — notes extension points in an external Theia checkout; no path assumptions for this repo.
- `ai/infra/bin/deploy-infra-agent-to-theia.sh` — **only script that assumes a Theia directory**.
  - Default Theia dir: `THEIA_DIR_DEFAULT="<repo-parent>/theia"` (currently inconsistent with `AGENTS.md`).
  - Supports override: `--theia-dir PATH` and `THEIA_DIR` env var.
  - Validates Theia checkout by requiring:
    - `${THEIA_DIR}/package.json`
    - `npm run -s build:browser` exists
  - Builds and packs agent from `ai/agents/infra`, then installs tarball into Theia via `npm install --save-dev <tgz>`, then `npm run build:browser`, optional `npm run download:plugins`.
- `ai/infra/bin/build-infra-agent.sh` — runs ensure-pnpm then `pnpm install` + `pnpm run build` in `ai/agents/infra`.
- `ai/infra/bin/watch-infra-agent.sh` — installs + `pnpm run watch`.
- `ai/infra/bin/ensure-pnpm.sh` — enforces Node 22.x, corepack, pnpm >= 9; includes note “Theia not compatible with Node 24”.
- `ai/infra/bin/run-all.sh` / `ai/infra/bin/run-task.sh` — unrelated to Theia directory assumptions.

### Expected end result
1) Script fix: `ai/infra/bin/deploy-infra-agent-to-theia.sh` should default to **`/opt/theia`** (not `<repo-parent>/theia`), consistent with `AGENTS.md`.
2) Documentation: Add a doc that explains a **documented process for creating Theia agents** focused on:
   - building the agent (`pnpm install`, `pnpm run build`)
   - packing into a `.tgz` via `pnpm pack`
   - manual install into local Theia at `/opt/theia` via `npm install ...tgz`, then `npm run build:browser`, optional `download:plugins`, then start Theia.
   - avoid referencing `repos/theia` as required.

### Proposed implementation approach (task steps)

#### Step 1 — Update deploy script default Theia directory
Modify:
- `ai/infra/bin/deploy-infra-agent-to-theia.sh`

Changes:
- Set `THEIA_DIR_DEFAULT="/opt/theia"` instead of `THEIA_DIR_DEFAULT="${__REPO_PARENT}/theia"`.
- Update `usage()` text to match new default (“default: /opt/theia”).
- Keep existing overrides intact:
  - `--theia-dir PATH`
  - `THEIA_DIR` env var behavior (`THEIA_DIR="${THEIA_DIR:-${THEIA_DIR_DEFAULT}}"`)
- Keep existing validation checks (`package.json`, `build:browser` script) unchanged.

#### Step 2 — Add documentation for local build + manual install
Create a new documentation page (location is currently ambiguous; see “Ambiguities”).
Document must include:
- Prereqs:
  - Node 22.x (explain Theia compatibility; reference `ai/infra/bin/ensure-pnpm.sh`)
  - corepack/pnpm >= 9
- Build steps (from this repo):
  - Use helper: `ai/infra/bin/build-infra-agent.sh`
  - Or manual: `cd ai/agents/infra && pnpm install && pnpm run build`
- Pack tarball:
  - `cd ai/agents/infra`
  - `pnpm pack --pack-destination dist`
  - artifact path pattern: `ai/agents/infra/dist/*.tgz`
- Install into Theia runtime:
  - default Theia dir: `/opt/theia`
  - commands:
    - `cd /opt/theia`
    - `npm install --no-audit --no-fund --save-dev /absolute/path/to/ai/agents/infra/dist/<pkg>.tgz`
    - `npm run build:browser`
    - optional: `npm run download:plugins`
    - start Theia (example can mirror script’s printed guidance; do not hardcode secrets)
- Verification checklist:
  - agent appears/mentionable (e.g. `@AgentName`), can respond
- Troubleshooting:
  - Node version mismatch (22 required; Node 24 unsupported per ensure script)
  - wrong Theia directory (missing `package.json` or `build:browser`)

#### Step 3 — Ensure docs/scripts do not reference `repos/theia`
- Confirm the new doc never instructs using `repos/theia`.
- Script change should not introduce any `repos/theia` references.

### Ambiguities / clarifications needed
- **Where should the new documentation live?**
  - No doc taxonomy/file path was specified in the chat. Need a target path, e.g. `docs/` and naming convention, and whether it requires frontmatter (status/certification headers).
- **Agent naming and how it’s discovered in UI**
  - The doc can be generic, but if there’s a canonical package name/agent id for `ai/agents/infra`, confirm expected mention name and how it registers. (Not required for the script change; only for “verification” section accuracy.)

### Relevant examples / patterns already in repo
- Installation/build workflow is already encoded in:
  - `ai/infra/bin/deploy-infra-agent-to-theia.sh`:
    - build agent at `ai/agents/infra`
    - `pnpm pack --pack-destination <dist>`
    - `npm install --save-dev <tgz>` inside Theia
    - `npm run build:browser`
    - optional `npm run download:plugins`
- Node/pnpm constraints for Theia development are enforced in:
  - `ai/infra/bin/ensure-pnpm.sh` (Node 22.x; pnpm >= 9; warning that Theia incompatible with Node 24)

### Deliverables (what to commit)
1) Patch to `ai/infra/bin/deploy-infra-agent-to-theia.sh` changing default Theia dir to `/opt/theia` and updating usage text.
2) New documentation file describing the build/pack/manual install process, referencing the scripts and default `/opt/theia`.