id: 7499b66e-01bd-475e-bb2c-feacba9c1fd2
sessionId: 2313f4b2-06fe-4fe8-ae67-df7765543627
date: '2026-02-16T15:08:31.276Z'
label: Repo Docs Lifecycle And Certified Workflow Setup
---
## Session Summary (for other AI agents)

### Role / constraints (from system + repo conventions)
- Acted as a **non-executing** assistant: only read files and proposed safe edits as patches; **no scripts were run** and **no cloud actions performed**.
- Established/used a docs trust model: only `docs/5_certified/` is authoritative; everything else is draft/unreviewed.

---

## Context discovered in repo
Key reference docs reviewed:
- `MASTER_PLAN.md`: WTI agentic dev platform plan (GKE Autopilot WIP cluster `wti-wip` in `us-west1`, cert-manager + Envoy Gateway, static IP `${GKE_CLUSTER_NAME}-gw-ip`, per-host TLS for `demo.wti.net`, `conductor.wti.net`, `mcp.wti.net`, later skeleton services: Theia demo, Quarkus conductor, MCP fs read-only).
- `docs/theia/SETUP_NOTES.md`: Theia AI settings notes and links:
  - https://theia-ide.org/docs/user_ai/
  - https://theia-ide.org/docs/theia_ai/
  - Orchestrator blog: https://eclipsesource.com/blogs/2024/09/30/theia-ai-sneak-preview-orchestrator/
- Infra scaffolding:
  - `ai/infra/README.md` + scripts under `ai/infra/bin/` and `ai/infra/tasks/`
  - Tasks include enabling APIs, VPC/subnet, Autopilot cluster, static IPs, cert-manager install, Envoy Gateway install.
  - Shared bash helpers in `ai/infra/lib/wti-gcloud.sh`.

---

## What was done in this session (changes proposed; user indicates most are applied)
### 1) Added agent entrypoint / workflow rules
- `AGENTS.md` (**applied**): Defines trust rules, approval gates (no running scripts/destructive commands without explicit user approval), and priorities:
  1. Documentation taxonomy + certification headers
  2. Infra acceptance criteria
  3. Improve `ai/infra` safety/repeatability (helpers, smoke test)
  4. Deploy hello-world behind Envoy Gateway with cert-manager DNS-01
- `CLAUDE.md` (**applied**): points to `AGENTS.md`.

### 2) Established documentation taxonomy + lifecycle
- `docs/README.md` (**applied**): Defines taxonomy and frontmatter statuses (`UNREVIEWED`, `DRAFT`, `CERTIFIED` only under `docs/5_certified/`).
- `docs/INDEX.md` (**applied**): Entry index linking to taxonomy PURPOSE docs and `docs/theia/SETUP_NOTES.md`.
- Added PURPOSE docs (all **applied**):
  - `docs/0_triage/PURPOSE.md`
  - `docs/adr/PURPOSE.md`
  - `docs/goals/PURPOSE.md`
  - `docs/plans/PURPOSE.md`
  - `docs/teams/PURPOSE.md`
  - `docs/features/PURPOSE.md`
  - `docs/status/PURPOSE.md`
- `docs/5_certified/PURPOSE.md` was proposed; user’s list marks it **stale** (needs re-check/reapply if desired).

### 3) Seeded a “certified” document
- `docs/5_certified/WTI_AI_GLOSSARY.md` (**applied**, `status: CERTIFIED`): Minimal glossary aligned to `MASTER_PLAN.md` terms (Theia, agent, MCP, Envoy Gateway, cert-manager, DNS-01, WIP cluster, Certified/Unreviewed definitions).

### 4) Triage move for Theia handoff prompt
- Created `docs/0_triage/HANDOFF_THEIA_AGENT.md` (**applied**, `status: UNREVIEWED`): Preserves original handoff prompt content (Theia setup steps requested, OpenAI provider/model config, MCP client config in Theia, extension panel requirements: streaming from `agent`, plan JSON with approve/deny, tool-call approval requests, partial results; constraints: Quarkus/Vert.x preferred, non-root `wti:1000`, `.aiignore`).
- Updated `docs/HANDOFF_THEIA_AGENT.md` (**applied**) to be a pointer to the triage copy.

### 5) Infra script cleanup
- Edited `ai/infra/tasks/060-envoy-gateway.sh` (**applied**): Removed a stray citation artifact from a log line:
  - From: `... IPAddress. citeturn0search6`
  - To: `... IPAddress.`

### 6) Added infra acceptance criteria doc (WIP)
- `docs/status/3_specced/INFRA_ACCEPTANCE_CRITERIA.md` (**applied**, `status: DRAFT`): Defines success criteria for WIP cluster:
  - DNS A records for `conductor.wti.net`, `demo.wti.net`, `mcp.wti.net` to Envoy Gateway external IP
  - TLS via Let’s Encrypt DNS-01 using Google Cloud DNS; ClusterIssuer/Issuer + SA creds secret
  - Gateway API resources: GatewayClass, Gateway (443), HTTPRoutes with host routing
  - Day-1 allowlist policy (HOME_IP)
  - DoD checklist includes `kubectl` checks and `curl -vk https://conductor.wti.net/`

---

## Decisions / requirements captured
- **Docs trust model**: only `docs/5_certified/` is authoritative; everything else is draft/unreviewed.
- **Approval gates**: do not run scripts or destructive commands without explicit user approval (codified in `AGENTS.md`).
- **Near-term infra target** (from existing docs): GKE Autopilot `wti-wip` in `us-west1`, Envoy Gateway + cert-manager, static IP `${GKE_CLUSTER_NAME}-gw-ip`, per-host TLS (no wildcards) for `demo.wti.net`, `conductor.wti.net`, `mcp.wti.net`.

---

## Open / pending work (explicitly not done)
- **Milestone 2 infra improvements** were mentioned as next steps but not implemented:
  - Migrate/standardize helpers (note: earlier idea referenced moving `ai/infra/lib/wti-gcloud.sh` to `ai/infra/bin/_wti-gcloud.sh`, but this was NOT done).
  - Add an infra **smoke test script** (e.g., `ai/infra/bin/smoke.sh`) and validation of env/tool contracts.
- **Hello-world deployment behind Envoy Gateway with cert-manager DNS-01**: not implemented; only acceptance criteria drafted.
- **Reapply or reconcile** `docs/5_certified/PURPOSE.md` (currently marked **stale** in the user-provided list).
- No additional Theia setup guide was produced beyond existing `docs/theia/SETUP_NOTES.md` and triaged handoff prompt.

---

## Changeset state (per user-provided statuses)
Applied:
- `AGENTS.md`, `CLAUDE.md`
- `docs/README.md`, `docs/INDEX.md`
- PURPOSE docs: `docs/0_triage/`, `docs/adr/`, `docs/goals/`, `docs/plans/`, `docs/teams/`, `docs/features/`, `docs/status/`
- `docs/5_certified/WTI_AI_GLOSSARY.md`
- `ai/infra/tasks/060-envoy-gateway.sh`
- `docs/status/3_specced/INFRA_ACCEPTANCE_CRITERIA.md`
- `docs/HANDOFF_THEIA_AGENT.md`, `docs/0_triage/HANDOFF_THEIA_AGENT.md`

Stale / unresolved:
- `docs/5_certified/PURPOSE.md` (needs review/reapplication if still desired)

---

## Pointers for continuation
- Start with `AGENTS.md` + `docs/INDEX.md`.
- For infra validation, use `docs/status/3_specced/INFRA_ACCEPTANCE_CRITERIA.md` as the checklist baseline.
- For Theia integration requirements, use `docs/0_triage/HANDOFF_THEIA_AGENT.md` + `docs/theia/SETUP_NOTES.md`.