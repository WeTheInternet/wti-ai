id: 16378726-b455-4a28-8a5c-8d5b221d85a1
sessionId: bc45c0bf-d7b5-4f4b-8582-3d8e0fe7b37d
date: '2026-02-16T18:27:07.471Z'
label: 'Add .prompts/PURPOSE.md guidance: task contexts are stale unless requested'
---
# .prompts/PURPOSE.md guidance update

## Goal
Make it explicit (machine-readable) that Theia working contexts / task contexts are **generated and likely stale**, and should **only** be processed when the user explicitly requests.

## Implementation Steps
1) Create `.prompts/PURPOSE.md` with YAML frontmatter and clear routing:
   - Explain `.prompts/` contains prompt assets (templates + task contexts).
   - Declare that `.prompts/task-contexts/**` are generated working artifacts.
   - Add rule: agents must not read/process task contexts unless user asks.
   - Link to `AGENTS.md` as the governing entrypoint.

2) (If/when you migrate task contexts to `.prompts/task-contexts/`)
   - Add a short note that `task-contexts/` is the canonical location.

## Verification
- Confirm `.prompts/PURPOSE.md` exists.
- Confirm it clearly states “do not process task contexts unless requested.”
