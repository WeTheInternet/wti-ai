---
status: DRAFT
teams: []
roles: []
authors:
  - JamesXNelson
lastUpdated: 2026-11-22T23:25:11Z
verification:
  - "(manual) Links resolve and directory purposes match repository reality"
---

# PURPOSE

Machine-readable repository map for agents.

Read as little as possible to complete the task. Prefer `PURPOSE.md` routers over loading large docs. Filter by frontmatter `teams` and `roles` when present, if you already understand wti-ai teams and roles; otherwise, assume your team and role are both 'agent'.

## Repository map

- `AGENTS.md`
  - Agent entrypoint and operating rules.

- `docs/`
  - Documentation taxonomy hub.
  - Start at `docs/PURPOSE.md`.

- `skills/`
  - Agent skill packs (reusable patterns and reference links).
  - Start at `skills/PURPOSE.md`.

- `ide/`
  - Active standalone Theia pnpm workspace: app in `ide/apps/wti-ide`, agents in `ide/agents/`.
  - Start at [the IDE workflow](docs/theia/WTI_IDE_WORKFLOW.md).

- `ai/`
  - Implementation/tooling spikes and runtime assets.
  - `ai/agents/infra` is a superseded Infra agent implementation; current IDE agent work belongs in `ide/agents/infra`.
  - Not a documentation authority hub.

- `.prompts/`
  - Local prompt assets.

## Current product direction

- [Delivery workflow](docs/specs/agent-workflow.md)
- [Reconciliation plan](docs/plans/docs-reconciliation.md)
- [Recoverable design sources](docs/history/PURPOSE.md)
