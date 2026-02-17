---
id: theia-dev
name: Theia Plugin & AI Development Helper
version: 0.2.0
description: >
  Repo-specific guidance for developing and extending Eclipse Theia / Theia AI in this workspace,
  including verified extension points for registering chat agents, adding modes, and contributing UI.
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

- Theia is run from the command line in `/opt/theia`.
- If a `repos/theia/**` directory exists in this repo, it is for IDE-performance purposes (workspace excludes) and for source lookup only.
  - Do not reference `repos/theia` in code/config/scripts.
  - Only inspect/modify it when the user explicitly requests.
- `ai/agents/**` is intended for WTI agent implementations and is safe for agent work.

Boundary markers are declared via `WTI-ROLES.md`.

## How to use this skill

When you need to extend Theia AI in this repo:

1. Inspect only the minimum set of files needed to locate the relevant extension point.
2. Record exact file paths and symbols you used.
3. Prefer implementing new WTI-specific logic outside the Theia checkout unless the integration requires upstream wiring.

Copy/paste prompt for safe inspection:

```text
You are operating under repo boundary rules.
- Prefer changes under `ai/**` and `docs/**`.
- Theia is run from `/opt/theia`.
- Do not reference `repos/theia` in code/config/scripts.
When you reference Theia extension points, include exact file paths and the symbol names you relied on.
```

## In this repo: verified extension points

All paths below were verified in `repos/theia/**`.

### 1) Register a new ChatAgent (DI bindings)

Primary module used to register IDE agents:

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
- [ ] Bind the agent in `repos/theia/packages/ai-ide/src/browser/frontend-module.ts` as singleton and to both `Agent` and `ChatAgent`.
- [ ] If you add UI, follow `ai-chat-ui` patterns (`AbstractViewContribution`, `WidgetFactory`, commands).
- [ ] Document exact file paths/symbols in a short report to prevent drift.
