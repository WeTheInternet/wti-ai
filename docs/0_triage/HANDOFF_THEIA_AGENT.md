---
status: UNREVIEWED
owner: wti
reviewed-by: TBD
review-date: TBD
verification:
  - "(manual) Source preserved from original handoff"
changelog:
  - 2026-02-16: Moved from docs/HANDOFF_THEIA_AGENT.md
---

# Handoff Prompt for Theia AI Chat (OpenAI provider)

Paste this into Theia AI Chat.

---

You are assisting with setting up an agentic development environment inside Theia.

## Project context
- Workspace/repo: `wti-ai` (opened in Theia).
- We build under `/ai` first.
- Later, additional repositories are mounted under `/repos` based on `ai/config/repos.yaml`:
  - WeTheInternet:xapi
  - WeTheInternet:wti-ui
  - JamesXNelson:wti (private; treat as present but inaccessible publicly)
  - WeTheInternet:theia (special: contributors may use their own forks)

## Near-term goals (WIP)
1) Stand up GKE Autopilot cluster `wti-wip` in `us-west1`.
2) Install cert-manager and Envoy Gateway (Gateway API ingress).
3) Reserve static regional IP `${GKE_CLUSTER_NAME}-gw-ip`.
4) Prepare per-host TLS (no wildcard): `demo.wti.net`, `conductor.wti.net`, `mcp.wti.net`.
5) Deploy skeleton services later:
   - Theia (demo)
   - Quarkus `conductor` control plane (prompt parser + step-mode + orchestration)
   - MCP `/fs` (ripgrep search + file_get over `/opt/workspace`, read-only)

## What I need from you
- Concrete Theia setup steps:
  - which experimental flags to enable
  - where/how to set OpenAI provider, API key, model
  - how to configure MCP servers as a client in Theia
- Links/sections in Theia docs for the above.
- How to create a Theia extension panel that:
  - streams responses from `conductor`
  - shows PLAN JSON + approve/deny buttons
  - displays tool-call approval requests and partial results

## Constraints
- Backend: Quarkus/Vert.x preferred; avoid Spring dependencies.
- Containers: non-root (`wti:1000`).
- Ignore build outputs/caches: `.aiignore`.
