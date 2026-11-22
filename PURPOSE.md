---
status: DRAFT
teams: []
roles: []
authors:
  - JamesXNelson
lastUpdated: 2026-02-16T00:00:00Z
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
