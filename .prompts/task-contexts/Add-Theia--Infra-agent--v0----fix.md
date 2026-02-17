id: 8e2f4933-6bf2-475b-837e-650d466faf9d
sessionId: 3cda3097-9cd0-4d3c-b3ef-e4aa19454352
date: '2026-02-16T20:01:53.358Z'
label: Add Theia @Infra agent (v0) + fix theia-dev skill + repo boundary rules
---
# Add Theia `@Infra` agent (v0) + improve `theia-dev` skill + repo boundary rules

## Goal
Deliver the first usable Theia-integrated `@Infra` agent with explicit modes and a refine/delegate loop (coder mode functional first), while also upgrading `skills/theia-dev` to include concrete, repo-verified extension points and adding a repo-boundary policy so only theia-dev work touches `repos/theia`.

## Design

### Key constraints (from request)
- **No commands run** in this planning context.
- **No invented APIs**: all Theia extension points must be discovered by reading code in `repos/theia`.
- v0 scope: **Coder mode must be implementable**; other modes may route/stub but must be visible.
- `@Infra` should:
  1) present explicit modes (design/implement/review/test)
  2) delegate to default Theia agents by generating **ready-to-send prompts/ops blocks**
  3) provide a “Next mode” refine loop (human iterates until click-to-send)
- v0 is **Theia-only** (no conductor pre-processing yet), but keep future conductor integration in mind.

### Repo boundary / safety policy
- Introduce a simple “role boundary marker” file: **`WTI-ROLES.md`**.
- Semantics:
  - If a directory contains `WTI-ROLES.md`, agents should treat it as an allowlist for inspection/modification.
  - If absent, default to least-privilege (don’t assume it’s safe to inspect large/vendor trees).
- For v0, define these boundaries:
  - `repos/theia/**` → **allowed roles: `theia-dev` only** (contains upstream/forked Theia implementation details).
  - `ai/agents/**` → allowed for implementing WTI agents/extensions.
- This plan will add the marker file(s) and a short doc explaining how to extend the policy.

### Agent naming/handles convention
- Use **Title-case agent names** to match Theia defaults (e.g. `Architect`).
- New agent will be registered as:
  - Display name: `Infra`
  - Handle/mention: `@Infra` (Title-case)

### Where the Theia extension will live
- Per user instruction: create extension code under `ai/agents/infra/` (not root `packages/`).
- Actual packaging/build strategy will be chosen after inspecting `repos/theia`.
  - Option A: Add a new Theia package under `repos/theia/packages/*` that is sourced from (or symlinked to) `ai/agents/infra`.
  - Option B: Keep code in `ai/agents/infra` and adjust `repos/theia` build to include it (via workspace config).

### UX scope (vertical slice)
- Minimal UI contribution (either):
  - A chat agent/persona `@Infra` available in the default chat window, OR
  - A simple panel (command palette opens “Infra Agent” widget)
- Panel/chat UI must expose mode selector and generate “ready-to-send” delegations.
- “Next mode” in v0: **agent refines/explains options** for delegation (does not execute anything).

### Output format for delegations
- Generate a structured “ops/prompt block” that is:
  - human readable
  - copy/paste or click-to-send
  - includes: Title, Mode, Target agent, Risk, Preconditions, Prompt/Steps, Expected outputs, Rollback.
- Keep schema stable so conductor can parse later.

## Implementation Steps (Coder task list)

### 1) Backfill `repos/theia` symlink feature + boundary marker policy
**Inspect**
- Workspace `repos/theia` (ensure it exists in repo) and root docs.

**Change**
- Add `repos/theia/WTI-ROLES.md` that explicitly states:
  - Allowed roles: `theia-dev` only
  - Directory purpose: upstream/forked Theia source
  - Prohibited: other agents should not read/modify without explicit user approval
- Add `ai/agents/WTI-ROLES.md` to mark it as safe for agent implementation code.
- Add a brief doc: `docs/theia/REPO_BOUNDARIES.md` describing the policy and how to extend it.

**Acceptance criteria**
- Boundary markers exist and clearly constrain access.

**Rollback**
- Delete the marker files and doc.

---

### 2) Create `ai/agents/infra/` scaffold (agent + extension package skeleton)
**Inspect**
- `ai/` structure, existing prompts conventions in `ai/prompts/`.

**Change**
- Create:
  - `ai/agents/infra/README.md` (what it is, how it’s built into Theia)
  - `ai/agents/infra/package.json` (Theia extension package metadata **only after** confirming structure in `repos/theia`)
  - `ai/agents/infra/src/` (empty placeholders until Theia APIs are identified)
  - `ai/agents/infra/resources/` (icons/labels optional)

**Acceptance criteria**
- Directory exists with clear ownership and an integration note.

**Rollback**
- Remove `ai/agents/infra/`.

---

### 3) Theia-dev investigation: locate the real extension points for (a) agent/persona registration and (b) chat integration
**Inspect (in `repos/theia/**`)**
- Find where Theia AI agents/personas are defined/registered.
  - Search for terms like: `Agent`, `Orchestrator`, `ChatAgent`, `PromptTemplate`, `excludedAgents`, `theia-ai`.
- Find how chat input/send is implemented.
  - Look for services or commands that submit a chat request.

**Change**
- Create a report doc in THIS repo:
  - `ai/agents/infra/theia-dev-report.md`
  - Include exact file paths + key symbols + brief notes.
- Update `skills/theia-dev/SKILL.md` with concrete, repo-verified pointers (see Task 4).

**Acceptance criteria**
- Report includes:
  - Where to register a new agent/persona
  - Where UI contributions live (commands/widgets)
  - How to programmatically prefill/send a prompt to chat (or best available fallback)

**Rollback**
- Remove the report doc and revert skill changes.

---

### 4) Fix/upgrade `skills/theia-dev` into a “properly formatted skill” with actionable, repo-specific instructions
**Inspect**
- `skills/theia-dev/SKILL.md`
- The newly produced `ai/agents/infra/theia-dev-report.md`

**Change**
- Expand `skills/theia-dev/SKILL.md` to include:
  - “In this org” section with:
    - `repos/theia` boundary rule
    - exact registration points (file paths, classes, DI modules)
    - UI contribution recipe (commands + widget)
    - Chat integration recipe (insert text / send)
  - A short “How to use this skill” section (copy-pastable prompt to instruct an agent to inspect `repos/theia` safely)
  - A checklist for adding a new agent.

**Acceptance criteria**
- Another context/agent can follow the skill and find the exact extension points without re-searching.

**Rollback**
- Revert `skills/theia-dev/SKILL.md`.

---

### 5) Implement `@Infra` agent registration (minimal) in Theia (coder mode functional, others stub)
**Inspect**
- The registration points found in Task 3.

**Change**
- In `repos/theia` (as needed) add an agent/persona named `Infra`:
  - Display name: `Infra`
  - Mention/selector handle: `@Infra`
  - Modes exposed: `design`, `implement`, `review`, `test`
  - For v0:
    - `implement` delegates to default `coder` agent via generated prompt
    - other modes either delegate or stub with a message

**Acceptance criteria**
- `@Infra` appears in the default chat agent selector or mention syntax.

**Rollback**
- Remove the registration entry / revert changes in `repos/theia`.

---

### 6) Implement the mode+refine+delegation behavior (prompt generator) for `@Infra`
**Inspect**
- Any existing agent implementations and prompt templating patterns in `repos/theia`.

**Change**
- Add a small state machine for `@Infra`:
  - State: current mode, last generated prompt, user “task intent” input.
  - “Generate ready-to-send prompt” produces:
    - operations/prompt block with required fields
    - target agent based on mode (architect/coder/reviewer/tester)
  - “Next mode” refines:
    - explains what the next specialist agent will do
    - proposes 1–3 delegation options
    - regenerates a ready-to-send block

**Acceptance criteria**
- In chat, a user can:
  - select mode
  - request a delegation prompt
  - iterate “Next mode” to refine without executing

**Rollback**
- Revert behavior implementation; keep only registration.

---

### 7) Add minimal UI affordance (command palette) to open an “Infra Agent” helper view (optional but recommended)
**Inspect**
- Theia UI contribution patterns in `repos/theia`.

**Change**
- Add command: `Infra: Open Helper`
- Add a simple widget/view that:
  - shows mode selector
  - shows generated block
  - has buttons: Generate / Next mode / Copy / Send (Send only if supported)

**Acceptance criteria**
- Command opens view; view can generate/copy ready-to-send delegation prompts.

**Rollback**
- Revert widget and command contributions.

---

### 8) Chat integration: implement “click-to-send” (or documented fallback)
**Inspect**
- Chat submission APIs/commands in `repos/theia`.

**Change**
- Implement one:
  - Preferred: “Send” button in helper view inserts prompt and triggers submit.
  - Fallback: copy-to-clipboard + open chat view + paste instructions.

**Acceptance criteria**
- A user can go from generated block to a submitted message with minimal friction.

**Rollback**
- Remove direct-send; keep copy-to-clipboard.

---

### 9) Add docs/specs to prevent rot and guide future conductor integration
**Inspect**
- `docs/features/infra-agent.md`
- `docs/goals/infra-agent-v0-coder-mode.md`

**Change**
- Add `docs/plans/theia/infra-agent-v0.md`:
  - what shipped in v0
  - how modes map to delegation prompts
  - what’s stubbed
  - future conductor integration hooks (where to intercept / serialize ops blocks)

**Acceptance criteria**
- v0 behavior is clearly documented and traceable to code.

**Rollback**
- Delete the plan doc.

## Reference Examples (to fill in during Task 3)
- `repos/theia/...` (agent registration example)
- `repos/theia/...` (chat send example)
- `repos/theia/...` (widget/command contribution example)

## Verification (repo-local)
- Manual verification steps (no command execution required in this context):
  - Confirm `WTI-ROLES.md` markers exist.
  - Confirm `@Infra` is registered and visible (per Theia UI).
  - Confirm generated prompts include mode, risk, rollback, and target agent.
  - Confirm send/copy flow works.

## Open Questions / Risks
- `repos/theia` build integration: how to include code living under `ai/agents/infra`.
- Theia AI API stability: whether agent registration + chat submission are public extension APIs vs internal.
- Delegation syntax (“special delegate-to-agent syntax”) must be found in `repos/theia` or official docs.
- If direct chat submission API is not exposed, we may need to rely on copy-to-clipboard for v0.