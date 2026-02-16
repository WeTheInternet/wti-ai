---
id: theia-dev
name: Theia Plugin & AI Development Helper
version: 0.1.0
description: >
  Guidance for developing and extending Eclipse Theia / Theia AI, including
  where to find official docs, how to add UI panels, and how to render custom
  interactive response parts.
tags:
  - theia
  - theia-ai
  - vscode-extension
  - plugin
triggers:
  - "theia extension"
  - "theia ai"
  - "custom response rendering"
  - "developing.md"
---

## When to use this skill
Use this skill when the user asks about:
- building Theia extensions / adding UI panels
- configuring Theia AI providers or MCP clients
- rendering interactive controls in chat
- Theia Orchestrator agent behavior

## Official docs & key references (start here)
- Theia AI end-user setup / provider configuration: https://theia-ide.org/docs/user_ai/
- Theia AI framework (tool builders): https://theia-ide.org/docs/theia_ai/
  - Look specifically for “Custom Response Part Rendering” and “Interactive AI Flows”.
- Theia core development quick start / native deps: https://github.com/eclipse-theia/theia/blob/master/doc/Developing.md#quick-start
- Orchestrator concept (agents delegate): https://eclipsesource.com/blogs/2024/09/30/theia-ai-sneak-preview-orchestrator/

## Suggested approach for this repo
- Treat `conductor.wti.net` as the authoritative workflow engine.
- Use Theia only as UI + client integration point.
- Prefer integrating `conductor` by:
  1) A Theia extension panel that calls `conductor` and streams results
  2) (later) optional integration as a first-class Theia AI agent if beneficial

## Practical UX pattern (edit/apply)
If you want IntelliJ-like “apply patch” UX:
- Prefer an in-IDE edit preview flow (Theia extension) over overlayfs.
- Return changes as unified diffs, show an apply/preview UI, then apply to workspace via Theia FS APIs.
