id: 767a07bf-6325-4578-a290-78a838175e72
sessionId: 98070ad1-4dee-4977-bc60-3bd2d9b1228f
date: '2026-02-17T04:32:29.539Z'
label: >-
  Conductor: MCP-backed “@Guru” internet-enabled escalation agent (triage + goal
  docs)
---
# Conductor: MCP-backed “@Guru” internet-enabled escalation agent (triage + goal docs)

## Goal
Add a documented feature to the Conductor module: an explicit escalation path to a special agent `@Guru` that forwards a user’s request to an internet-enabled ChatGPT, then returns the answer back into the Conductor workflow.

This is meant to reduce wasted time on problems where the public internet has an obvious answer ("5 minutes online vs 5 hours offline").

## Design
### Core concept
- Introduce a **named agent persona**: `@Guru`.
- `@Guru` is **not** a code-executing worker. It is a **bridge**:
  - takes a question/context
  - forwards it to ChatGPT with browsing/internet enabled
  - returns the response with sources/links
- Conductor treats `@Guru` like a bounded, auditable tool call:
  - explicit invocation (`@Guru ...`)
  - request/response stored as artifacts
  - optional approval gate depending on org policy

### Where MCP fits
Because Conductor itself shouldn’t directly embed “internet browsing” logic, we introduce an **MCP server/tool** that represents the “Guru Bridge”.
- Conductor → tool call → **MCP `guru` server** → ChatGPT (internet-enabled) → response
- This keeps the same architectural pattern as other tools in `MASTER_PLAN.md`: Conductor owns orchestration; MCP provides capabilities.

### Safety / policy
- Default: **Step Mode** friendly.
- Guardrails to document (even if not implemented immediately):
  - Redact secrets before sending to `@Guru`.
  - Limit payload size; include only necessary logs/snippets.
  - Require explicit user consent when sending proprietary code externally.
  - Require `@Guru` to return links/sources and a confidence note.

### Output format (for reliable downstream use)
Document a canonical response schema (markdown is fine initially):
- Summary
- Key steps / fix
- Links (sources)
- Assumptions / environment
- Suggested next experiments

## Implementation Steps (Docs-first)

### Step 1: Add a TRIAGE doc describing the problem + intent
- Create `docs/0_triage/goals/conductor-guru-agent.md`
  - Problem statement: repeated local-only failure vs quick online fix
  - Scope: Conductor feature + MCP tool boundary
  - Non-goals: not building full browsing into Conductor; not auto-posting private code
  - Open questions (see below)
  - Acceptance criteria for promotion to a goal doc

### Step 2: Add a GOAL doc (promotion target)
- Create `docs/goals/conductor-guru-agent.md`
  - Lifecycle metadata aligned with existing goal docs (see `docs/goals/conductor-lisa-loops.md`)
  - Clear acceptance criteria for “v0” and “v1”:
    - v0: Conductor can explicitly route to `@Guru` via MCP and store artifacts
    - v1: policy gates + redaction + structured output

### Step 3: Update master/architecture docs to include `@Guru`
- Update `MASTER_PLAN.md`
  - Add `@Guru` as a tool/agent path under the control flow section
  - Add security notes: explicit consent + allowlist + logging

### Step 4: Add a lightweight runbook for triage escalation
- Create `docs/plans/conductor/guru-escalation-runbook.md`
  - When to use `@Guru` (criteria)
  - What to include in a prompt (error logs, exact versions, minimal repro)
  - What NOT to include (secrets, private keys, proprietary code chunks)
  - How to record results back into repo docs/issues

## Open Questions (need owner decisions)
1) **Which internet-enabled surface?**
   - ChatGPT web (human-in-the-loop) vs API-based browsing provider.
2) **Auth model for the bridge**
   - Does MCP server hold credentials? Is it user-scoped?
3) **Data handling policy**
   - Are we allowed to send code? If yes, what limits? If no, how do we summarize safely?
4) **Where does this run?**
   - Inside cluster (preferred) vs external service.

## Reference Examples
- Architecture and separation of responsibilities:
  - `MASTER_PLAN.md` (Conductor ↔ MCP pattern; tool endpoints like `mcp.wti.net/fs`)
- Goal-doc style and lifecycle metadata:
  - `docs/goals/conductor-lisa-loops.md`
- Triage backlog style:
  - `docs/0_triage/goals/setup-infra.md`

## Verification
Docs-only verification:
- `docs/0_triage/goals/conductor-guru-agent.md` exists and has explicit open questions + acceptance criteria.
- `docs/goals/conductor-guru-agent.md` exists and matches the goal-doc metadata conventions.
- `MASTER_PLAN.md` mentions `@Guru` and the MCP bridge at a high level.
- Runbook exists at `docs/plans/conductor/guru-escalation-runbook.md`.
