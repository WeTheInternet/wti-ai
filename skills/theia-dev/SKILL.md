---
id: theia-dev
name: Theia Plugin & AI Development Helper
version: 0.2.0
description: >
  Repo-specific guidance for developing and extending Eclipse Theia / Theia AI in this workspace,
  including active workspace routing and reference notes for registering chat agents, adding modes, and contributing UI.
tags:
  - theia
  - theia-ai
  - plugin
  - inversify
triggers:
  - "theia extension"
  - "theia ai"
  - "chat agent"
  - "agent registration"
  - "ai-chat-ui"
---

## Repo boundary policy (must follow)

- Build and run Theia from the standalone `ide/` workspace; see [the canonical workflow](../../docs/theia/WTI_IDE_WORKFLOW.md) for prerequisites and commands.
- Follow [AGENTS.md](../../AGENTS.md), including explicit approval before running workspace tasks/scripts.
- If a `repos/theia/**` directory exists in this repo, it is for IDE-performance purposes (workspace excludes) and for source lookup only.
  - Do not reference `repos/theia` in code/config/scripts.
  - Only inspect/modify it when the user explicitly requests.
- Active WTI agent implementations live in `ide/agents/**`; the app is `ide/apps/wti-ide`. `ai/agents/infra` is a superseded Infra agent implementation.

The older boundary markers remain in [ai/agents/WTI-ROLES.md](../../ai/agents/WTI-ROLES.md); use `AGENTS.md` for current runtime routing. These notes do not expand task authorization.

## How to use this skill

When you need to extend Theia AI in this repo:

1. Inspect only the minimum set of files needed to locate the relevant extension point.
2. Record exact file paths and symbols you used.
3. Prefer implementing new WTI-specific logic outside the Theia checkout unless the integration requires upstream wiring.

Copy/paste prompt for safe inspection:

```text
You are operating under repo boundary rules.
- Prefer WTI agent changes under `ide/agents/**` and documentation under `docs/**`.
- Theia is built and run from `ide/`; follow AGENTS.md approval gates.
- Do not reference `repos/theia` in code/config/scripts.
When you reference Theia extension points, include exact file paths and the symbol names you relied on.
```

## Active registration and upstream reference notes

The checked-in registration example is `ide/agents/infra/src/browser/frontend-module.ts`, which binds `InfraAgent` to itself, `Agent`, and `ChatAgent`. Its package declares the frontend module in `ide/agents/infra/package.json`; the app depends on `@wti/infra-agent` in `ide/apps/wti-ide/package.json`.

The paths below are retained from the earlier `repos/theia/**` inspection. Its revision was not recorded here; these notes are source-lookup leads, not verification against the current dependency pin. Check symbols against the selected version before using them. Main currently pins Theia 1.68.2; the separate unmerged 1.77.0 migration is not established by this skill, and no upgrade procedure is certified here.

### 1) Register a new ChatAgent (DI bindings)

Upstream reference module from the earlier inspection (WTI registration belongs in `ide/agents/`):

- `repos/theia/packages/ai-ide/src/browser/frontend-module.ts`

Existing pattern:

- `bind(MyAgent).toSelf().inSingletonScope();`
- `bind(Agent).toService(MyAgent);`
- `bind(ChatAgent).toService(MyAgent);`

Example agents already registered there:

- `ArchitectAgent`
- `CoderAgent`
- `OrchestratorChatAgent`
- `UniversalChatAgent`

Another example module in a separate package:

- `repos/theia/packages/ai-claude-code/src/browser/claude-code-frontend-module.ts`
  - registers `ClaudeCodeChatAgent` with `Agent` and `ChatAgent`.

### 2) Agent handle / mention syntax

The mention leader is `@`:

- `repos/theia/packages/ai-chat/src/common/parsed-chat-request.ts`
  - `export const chatAgentLeader = '@';`

This is the basis for `@Infra`, `@Coder`, etc.

### 3) Add modes to a chat agent

Modes are part of the `ChatAgent` interface:

- `repos/theia/packages/ai-chat/src/common/chat-agents.ts`
  - `export interface ChatMode { id: string; name: string; isDefault?: boolean }`
  - `export interface ChatAgent ... { modes?: ChatMode[] }`

If you want mode-driven prompt variants, use:

- `repos/theia/packages/ai-ide/src/browser/mode-aware-chat-agent.ts`
  - `AbstractModeAwareChatAgent`
  - reads `request.request.modeId`
  - maps mode ids to prompt variants in a `PromptVariantSet`.

### 4) Delegate from one agent to another

Concrete delegation pattern:

- `repos/theia/packages/ai-ide/src/common/orchestrator-chat-agent.ts`
  - `request.response.overrideAgentId(delegatedToAgent);`
  - `const agent = this.chatAgentService.getAgent(delegatedToAgent);`
  - `await agent.invoke(originalRequest);`

### 5) Send chat requests programmatically (UI)

Chat UI submits via `ChatService.sendRequest`.

- `repos/theia/packages/ai-chat-ui/src/browser/chat-view-widget.tsx`
  - `protected async onQuery(query?: string | ChatRequest, modeId?: string)`
  - `this.chatService.sendRequest(this.chatSession.id, requestWithVariables)`

Another usage (retry):

- `repos/theia/packages/ai-chat-ui/src/browser/ai-chat-ui-contribution.ts`
  - `await this.chatService.sendRequest(node.sessionId, request.request);`

## Checklist: adding a new agent in this repo

- [ ] Implement a `ChatAgent` class (often by extending `AbstractStreamParsingChatAgent` or `AbstractModeAwareChatAgent`).
- [ ] Assign `id` and `name` (these drive selection and `@Name` mentions).
- [ ] If needed, define `modes` (or use prompt-variant-based modes via `AbstractModeAwareChatAgent`).
- [ ] Bind the agent in its WTI extension frontend module under `ide/agents/` as singleton and to both `Agent` and `ChatAgent`; follow `ide/agents/infra/src/browser/frontend-module.ts`. Check the package’s `theiaExtensions` entry and the app dependency registration.
- [ ] If you add UI, follow `ai-chat-ui` patterns (`AbstractViewContribution`, `WidgetFactory`, commands).
- [ ] Document exact file paths/symbols in a short report to prevent drift.
