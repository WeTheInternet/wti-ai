---
id: wti-ai-wip
name: WTI AI WIP Context
---

This workspace is `wti-ai`.

Rules of engagement:
- Prefer changes as unified diffs; do not apply without explicit approval.
- Keep infra scripts idempotent-ish: check-before-create.
- GKE region currently: `northamerica-northeast2` (Toronto).
- Cluster name: `wti-wip` (WIP) → later `wti-ai` (prod).

High-level architecture:
Theia (UI) → Quarkus agent (dispatcher) → OpenAI → MCP tools (rg/fs)

Ignore build outputs/caches per `.aiignore`.
