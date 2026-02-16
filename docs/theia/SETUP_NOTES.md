# Theia AI Setup Notes (WTI)

## Key settings you surfaced
- **OpenAI Official: Use Response API**
  - Prefer ON for official OpenAI models; it uses the newer Responses API.
- **Orchestrator: Excluded Agents**
  - Controls which internal Theia agents the Orchestrator is allowed to delegate to.
- **Prompt Templates**
  - Task context storage directory: `ai/prompts/task-contexts`
  - Workspace template directories: `.prompts`
- **Skills**
  - Add `ai/skills` to Skill Directories
- **SCANOSS**
  - Optional; keep OFF until you explicitly want code-snippet analysis off-box.

## WTI recommendation
Use Theia’s Orchestrator/Agents as optional helpers, but keep `conductor.wti.net`
as the authoritative dispatcher so your workflow is IDE-agnostic.

## Links
- End-user AI features & provider setup: https://theia-ide.org/docs/user_ai/
- Tool-builder docs (custom rendering, agents): https://theia-ide.org/docs/theia_ai/
- Orchestrator blog: https://eclipsesource.com/blogs/2024/09/30/theia-ai-sneak-preview-orchestrator/
