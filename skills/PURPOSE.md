---
status: DRAFT
teams: []
roles:
  - agent
authors:
  - JamesXNelson
lastUpdated: 2026-02-16T00:00:00Z
verification:
  - "(manual) Skills are reusable and not mixed with product specs"
---

# PURPOSE

Agent skill packs.

Skills are reusable guidance and reference material that can be applied across tasks.

Place:
- stable reference links
- repeatable patterns and conventions

Do not place:
- product feature requirements (use `docs/specs/`)
- raw imports (use `docs/0_triage/`)

The standalone [handoff-mail plugin](../plugins/agent-handoff-mail/README.md) lives
under `plugins/` so its archive and skill can be installed without the IDE. Its
canonical skill is nested there; do not maintain a second copy under this router.

