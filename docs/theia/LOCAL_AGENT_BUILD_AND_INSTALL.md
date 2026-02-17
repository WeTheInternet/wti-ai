---
status: DRAFT
teams: []
roles: []
authors:
  - wti
lastUpdated: 2026-02-17T00:00:00Z
verification:
  - "(manual) Canonical workflow is referenced and legacy steps remain intact"
---

# Local build + manual install of WTI Theia agents (legacy)

This document describes a legacy workflow that manually packs agent tarballs and installs them into a separately-managed Theia runtime (often under `/opt/theia`).

Supported workflow:
- Build/run the WTI Theia browser IDE and agents together from the `ide/` pnpm workspace:
  - `docs/theia/WTI_IDE_WORKFLOW.md`

For normal development, you should not need to pack `.tgz` artifacts or install them into `/opt/theia`.

## Legacy workflow (not maintained)

This repo supports building agent packages locally and manually installing them into a local Theia runtime.

Durable runtime assumption: Theia is run from `/opt/theia`.

### Prerequisites

- Node.js 20.x
  - Theia is not compatible with Node 24.
- `corepack` enabled
- `pnpm` >= 9

Reference: `ai/infra/bin/ensure-pnpm.sh`.

### Build the infra agent

From the repo root:

Option A (helper script):

```bash
ai/infra/bin/build-infra-agent.sh
```

Option B (manual):

```bash
cd ai/agents/infra
pnpm install
pnpm run build
```

### Pack a tarball (.tgz)

```bash
cd ai/agents/infra
rm -rf dist
pnpm pack --pack-destination dist
ls -1 dist/*.tgz
```

The packed artifact will be under:

- `ai/agents/infra/dist/*.tgz`

### Install into a local Theia runtime

```bash
cd /opt/theia
npm install --no-audit --no-fund --save-dev /absolute/path/to/ai/agents/infra/dist/<package>.tgz
npm run build:browser
```

Optional (if your Theia setup uses downloaded plugins):

```bash
cd /opt/theia
npm run download:plugins
```

Start Theia (example):

```bash
cd /opt/theia
OPENAI_API_KEY=$(< ~/.config/openai/.gc) npm run start:browser
```

### Verification

- Theia starts successfully after `npm run build:browser`.
- The agent is available in the UI and can be invoked.

### Troubleshooting

#### Node version mismatch

- Use Node 22.x.
- If you are on Node 24, switch versions and reinstall dependencies.

#### Wrong Theia directory

If `/opt/theia` is not your Theia checkout/runtime, you may see errors like:

- missing `package.json`
- missing `build:browser` script

In that case, re-run with the correct path or use the deploy helper:

```bash
ai/infra/bin/deploy-infra-agent-to-theia.sh --theia-dir /path/to/theia
```
