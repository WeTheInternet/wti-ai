# Theia-dev report (repo-verified)

This report captures concrete extension points discovered in the external Theia checkout for registering chat agents, defining modes, and triggering chat submissions.

## Boundary note

All paths in this report refer to the external Theia checkout (restricted to the `theia-dev` role).

---

## 1) Chat agent registration / DI binding

**Registering a new chat agent** is done via inversify bindings.

Primary registration module:

- `packages/ai-ide/src/browser/frontend-module.ts`

Pattern used by existing agents:

- bind the concrete class to self (singleton)
- bind `Agent` to service
- bind `ChatAgent` to service

Also see another package example:

- `packages/ai-claude-code/src/browser/claude-code-frontend-module.ts`
  - binds `ClaudeCodeChatAgent` to `Agent` and `ChatAgent`

---

## 2) Agent handles / mention syntax

Chat agent mention leader:

- `packages/ai-chat/src/common/parsed-chat-request.ts`
  - `export const chatAgentLeader = '@';`

This indicates `@AgentName` is parsed as an agent reference.

---

## 3) Modes support in chat agents

Chat agent mode model:

- `packages/ai-chat/src/common/chat-agents.ts`
  - `export interface ChatMode { id: string; name: string; isDefault?: boolean }`
  - `export interface ChatAgent ... { modes?: ChatMode[] }`

Mode-aware prompt selection helper:

- `packages/ai-ide/src/browser/mode-aware-chat-agent.ts`
  - `AbstractModeAwareChatAgent` supports `modeId` on requests and maps modes to prompt variants.

---

## 4) Delegation mechanics (agent-to-agent)

The orchestrator delegates by overriding the agent id on the response:

- `packages/ai-ide/src/common/orchestrator-chat-agent.ts`
  - `request.response.overrideAgentId(delegatedToAgent);`
  - then retrieves the agent via `ChatAgentService` and calls `agent.invoke(originalRequest)`.

This provides a concrete pattern for implementing an agent that “delegates” to another agent.

---

## 5) Chat UI: sending a request programmatically

The chat view sends requests through `ChatService.sendRequest`.

- `packages/ai-chat-ui/src/browser/chat-view-widget.tsx`
  - `protected async onQuery(query?: string | ChatRequest, modeId?: string): Promise<void>`
  - builds `ChatRequest` (with optional `modeId`)
  - calls `this.chatService.sendRequest(this.chatSession.id, requestWithVariables)`

A retry path also demonstrates re-sending a request:

- `packages/ai-chat-ui/src/browser/ai-chat-ui-contribution.ts`
  - `await this.chatService.sendRequest(node.sessionId, request.request);`

Implication: a helper UI can send a message by obtaining `ChatService` and an active session id, then calling `sendRequest`.

---

## 6) Minimal UI contribution points

Chat view contribution class:

- `packages/ai-chat-ui/src/browser/ai-chat-ui-contribution.ts`
  - registers commands and opens the Chat view (`AbstractViewContribution<ChatViewWidget>`)

A new helper view could follow the same `AbstractViewContribution` + `WidgetFactory` pattern.
