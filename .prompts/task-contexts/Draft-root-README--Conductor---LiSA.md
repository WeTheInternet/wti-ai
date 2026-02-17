id: 9fe38bfc-e68f-4711-8dec-553543b803eb
sessionId: d4c2b6c4-abe8-4b48-94e5-9a7bf7a6f34b
date: '2026-02-17T06:45:55.858Z'
label: >-
  Draft root README: Conductor + LiSA loop + multi-agent workflow, startup, and
  features table prompt
---
# Root README (to add at repository root)

## Goal
Create a root `README.md` that quickly explains the WTI agentic development platform vision and *current reality*, including:
- What is implemented today vs planned (explicitly)
- A practical “quick start” for the Theia IDE + env-file secret loading
- The Conductor / LiSA loop orchestration model and agent personalities (including a non-working internet-connected **Guru**)
- A lightweight mechanism to translate `docs/features/*` into a features table in the README (as a prompt/slash command)
- How agents collaborate across lifecycle phases to grow features safely ("triage to production")

## Design
- **Single source of truth**: align with existing repo docs and trust rules:
  - `AGENTS.md` (operating rules, approval gates)
  - `PURPOSE.md` (repo router)
  - `docs/README.md` + `docs/PURPOSE.md` (docs taxonomy)
  - `docs/goals/conductor-lisa-loops.md` (explicit goal to describe orchestration as a state machine and avoid “Ralph loops”)
  - `docs/theia/WTI_IDE_WORKFLOW.md` + `ide/run.sh` (actual implemented startup + env file loading)
  - `docs/5_certified/WTI_AI_GLOSSARY.md` (certified definitions: Theia/conductor/MCP/etc.)
- **Be explicit** in the README with two sections:
  1) **What exists now** (repo reality): Theia IDE workspace, env-file secret loading, docs system + trust model.
  2) **What’s planned** (vision): Quarkus `conductor`, MCP services, step-mode gating, long-lived contexts, multi-agent dispatch.
- **Machine + human friendly**: front-load the TL;DR and quickstart; then provide deeper “How it works” sections with clear headings.
- **No secret exfiltration**: Guru agent is internet-connected but explicitly disallowed from doing work with repo content; only answers general questions.

## Implementation Steps

### Step 1: Create `README.md` at repo root
- `README.md` (new file)
  - Title + one-paragraph vision (include the word **symphony**).
  - Link to authoritative routers:
    - `AGENTS.md`
    - `PURPOSE.md`
    - `docs/PURPOSE.md`
    - `docs/theia/WTI_IDE_WORKFLOW.md`
  - Section: **What’s implemented today** (grounded in repo reality)
    - Docs taxonomy + trust model (CERTIFIED vs DRAFT/UNREVIEWED)
    - Theia IDE build/run scripts in `ide/`
    - Implemented env-file secret loading via `WTI_AI_ENV_FILES` (cite `ide/run.sh` behavior)
  - Section: **What’s planned / in progress**
    - Quarkus `conductor` orchestration service (from `MASTER_PLAN.md` + glossary)
    - MCP tool services and least-privilege filesystem/rg endpoints
    - Step Mode (plan → approve → execute)
    - Long-lived curated contexts + pre-canned MCP responses to avoid “Ralph loops”
  - Section: **Quick start (quick & dirty)**
    - Reference the canonical workflow in `docs/theia/WTI_IDE_WORKFLOW.md`.
    - Provide minimal commands (Node version note, `cd ide && ./build.sh && ./run.sh`).
    - Provide the requested secure env-file workflow:
      - `mkdir -p -m 700 ~/.wti/.secure/env`
      - `printf '%s' "$OPENAI_API_KEY" > ~/.wti/.secure/env/OPENAI_API_KEY` (or editor-safe method)
      - `chmod 600 ~/.wti/.secure/env/OPENAI_API_KEY`
      - `export WTI_AI_ENV_FILES=~/.wti/.secure/env` in shell rc
    - Emphasize: env var name = filename, value = file contents (as implemented in `ide/run.sh`).
  - Section: **LiSA loops (Conductor orchestration model)**
    - Describe phases: Locate → investigate → Solve → Assess.
    - Explain the purpose: avoid low-signal repetition (“Ralph loops”) by using explicit state + durable artifacts.
    - Mention explicit goal doc: `docs/goals/conductor-lisa-loops.md`.
  - Section: **Agent personalities + responsibilities**
    - Conductor (orchestrator; state machine; approval gates)
    - Scout/Navigator (read-only context retrieval)
    - Planner (creates task context / plan)
    - Coder (only agent allowed to edit)
    - Reviewer/Validator (checks, tests, acceptance criteria)
    - Tester (verification strategy)
    - Compliance/Safety (optional; ensures trust rules and no secret leakage)
    - **Guru** (internet-connected Q&A only; never given repo secrets; never executes tasks; no exfil)
  - Section: **Collaborative feature growth: from triage to production**
    - Map to lifecycle/maturity concepts (reference triage doc: `docs/0_triage/workflow/feature-lifecycle-and-maturity.md`, with a note it’s UNREVIEWED)
    - Provide a recommended lifecycle with artifacts:
      - Triage → Goal doc
      - Spec → `docs/specs/*`
      - ADR (if needed) → `docs/adr/*`
      - Plan → `docs/plans/*` or task context
      - Implement → PR/patch
      - Verify → tests/diagnostics
      - Certify docs → upgrade status to CERTIFIED when reviewed
    - Emphasize role-based reading and trust routing (reference `docs/0_triage/workflow/role-based-reading-and-trust.md` as non-authoritative guidance).
  - Section: **Features table generation from `docs/features/`**
    - Since this is “planned”, include a *prompt/slash command* that a human can run in ChatGPT or in the IDE to generate a Markdown table summarizing each doc:
      - columns: Feature, Status, Goal, Lifecycle/Maturity (if present), Links
    - Clearly label it as “planned / manual for now”.
  - Section: **Glossary & links**
    - Link to `docs/5_certified/WTI_AI_GLOSSARY.md` (CERTIFIED).
    - Link to `MASTER_PLAN.md` for infra roadmap context.

### Step 2: Ensure README claims match repo reality
- Cross-check every “implemented” claim against:
  - `docs/theia/WTI_IDE_WORKFLOW.md`
  - `ide/run.sh` (WTI_AI_ENV_FILES behavior)
  - `AGENTS.md` trust/approval gates
  - `docs/README.md` + `docs/PURPOSE.md` doc taxonomy
- Anything not already real must be labeled “planned” or “vision”.

### Step 3: (Optional follow-up goal) add automation for features table
- Create a future goal doc (or update an existing goals doc) proposing a script to generate the features table automatically.
- For now, README contains only the manual prompt/slash command.

## Reference Examples (source material to mirror)
- `docs/theia/WTI_IDE_WORKFLOW.md` — canonical build/run instructions and env-file loading behavior
- `ide/run.sh:8-15` — actual `WTI_AI_ENV_FILES` implementation (filename → env var)
- `AGENTS.md` — trust model summary + approval gates
- `docs/README.md` — taxonomy and `status: CERTIFIED` authority rule
- `docs/goals/conductor-lisa-loops.md` — explicit goal to document orchestration as a state machine and avoid “Ralph loops”
- `docs/5_certified/WTI_AI_GLOSSARY.md` — certified terminology

## Verification
- Confirm `README.md` exists at repo root and links resolve.
- Manually sanity-check quickstart commands are consistent with `docs/theia/WTI_IDE_WORKFLOW.md`.
- Confirm the README explicitly separates:
  - implemented behaviors (Theia scripts, env-file loading, doc trust model)
  - planned system components (Quarkus conductor, MCP services, long-lived curated contexts)
- Confirm Guru agent is constrained to Q&A only and explicitly forbidden from handling secrets or performing repo work.
