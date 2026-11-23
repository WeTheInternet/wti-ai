# WTI Agentic Development Platform (WTI-AI)

WTI-AI bridges the gap between a “smart internet agent” and a **local, project-aware IDE** by turning vague ideas into an explicit, reviewable workflow: clarify intent → produce a plan → create durable artifacts → implement safely → verify.

The core metaphor is a multi-agent **symphony**: a set of specialized AI “voices” that contribute their parts, while a **Conductor** orchestrates the work into a coherent chorus of user-approved workflow automation.

Start here:
- [`AGENTS.md`](./AGENTS.md) — operating rules + approval gates
- [`PURPOSE.md`](./PURPOSE.md) — repo router
- [`docs/PURPOSE.md`](./docs/PURPOSE.md) — docs taxonomy router
- [`docs/theia/WTI_IDE_WORKFLOW.md`](./docs/theia/WTI_IDE_WORKFLOW.md) — canonical IDE workflow

---

## TL;DR

- **What exists now:** a Theia browser IDE workflow under `ide/`, env-file secret loading via `WTI_AI_ENV_FILES`, and a docs system with explicit trust routing (`status: CERTIFIED` is the only authoritative truth).
- **What’s planned:** a Quarkus `conductor` control plane, MCP tool services (least-privilege filesystem + ripgrep), and Step Mode (plan → approve → execute) to scale from “careful human oversight” toward “safe automation”.

---

## The sales pitch: from “crazy idea” to “shipped reality”

Using AI effectively requires careful, focused expression of intent. WTI-AI is designed to make that practical inside your real repository:

1. You describe a goal (often ambiguous).
2. The system helps you refine it into an **actionable plan**.
3. Agents produce and maintain **durable artifacts** (goals/specs/plans/ADRs/tests) so progress compounds instead of resetting each chat.
4. You approve changes at the right level:
   - early: more docs/spec changes, fewer code changes
   - later: more code diffs, fewer doc diffs
5. Over time, as artifacts and behavior become trustworthy, you automate more of the workflow—with less oversight and more design intervention.
6. When a feature's requirements change or something breaks, the stored decisions and the reasons for making them become invaluable.
7. When a reviewer, human or otherwise, points out a problem, new goals and features can be started, spec's updated and tests entirely automated.
---

## Feature lifecycle (how work matures)

A typical WTI feature matures through stages. The key idea is deliberate progression from intent → clarity → implementation → verification.

Recommended lifecycle (artifacts):

1. **Triage** → capture the intent as a goal (`docs/goals/*`)
2. **Spec** → define behavior and acceptance criteria (`docs/specs/*`)
3. **ADR (if needed)** → record architecture decisions (`docs/adr/*`)
4. **Plan** → sequence work and gates (`docs/plans/*`) or a task context
5. **Implement** → small, reviewable diffs
6. **Verify** → tests/diagnostics (run only with approval gates)
7. **Certify docs** → promote key docs to `status: CERTIFIED` when reviewed

Note: there are triage-level guidance docs (non-authoritative):
- [`docs/0_triage/workflow/feature-lifecycle-and-maturity.md`](./docs/0_triage/workflow/feature-lifecycle-and-maturity.md) (`status: UNREVIEWED`)
- [`docs/0_triage/workflow/role-based-reading-and-trust.md`](./docs/0_triage/workflow/role-based-reading-and-trust.md) (`status: UNREVIEWED`)

---

## How the symphony works: Conductor + agent voices

In the intended model:

- The **Conductor** listens to your request, asks specialist agents for help, and proposes a structured plan.
- As you refine your request, agents improve the recorded spec and plan, with explicit approval.
- As the feature matures, your approvals shift from “lots of documentation diffs” toward “mostly code + tests”.
- The end state is repeatable: tests pass, the feature is complete, and docs are upgraded to certified truth.

---

## Agent personalities + responsibilities

These are the intended “personalities” in the platform model. Some are already reflected in how work is performed in this repo (especially the rules), even if the full multi-agent runtime is not yet implemented.

- **Conductor** (planned): orchestrator and state machine; owns dispatch, transitions, and approval gates.
- **Scout / Navigator**: read-only context retrieval; finds relevant routers/docs/code.
- **Planner**: produces a plan/task context with acceptance criteria.
- **Coder**: proposes code/doc changes as small diffs.
- **Reviewer / Validator**: checks diffs against rules, acceptance criteria, and repo reality.
- **Tester**: defines and runs verification strategy (tests/diagnostics) when approved.
- **Compliance / Safety** (optional): enforces trust rules and prevents secret leakage.
- **Guru** (internet-connected; unable to write repo content):
  - Q&A only for general knowledge.
  - Never receives repo secrets.
  - Never executes tasks.
  - Must not be used to process or summarize private repo content.

---

## What’s implemented today (repo reality)

### 1) Theia IDE build/run scripts (`ide/`)

A Theia browser IDE workspace is built and run from the standalone `ide/` pnpm workspace.

- Canonical workflow: [`docs/theia/WTI_IDE_WORKFLOW.md`](./docs/theia/WTI_IDE_WORKFLOW.md)
- Helper scripts live in `ide/` (e.g. `build.sh`, `run.sh`, `watch.sh`, `test.sh`, `clean.sh`).

### 2) Secret loading via env-file directory (`WTI_AI_ENV_FILES`)

`ide/run.sh` supports loading secrets from a directory pointed to by `WTI_AI_ENV_FILES`.

Behavior (as implemented):
- For each file in the directory:
  - env var name = file basename
  - env var value = file contents

Source of truth: [`ide/run.sh`](./ide/run.sh)

### 3) Documentation taxonomy + trust model

This repo treats documentation as a first-class system.

- **Authority is determined by frontmatter**:
  - Only documents with `status: CERTIFIED` are authoritative.
  - Folder location is **not** authoritative (including `docs/5_certified/`).
- Taxonomy hubs:
  - [`docs/README.md`](./docs/README.md) — taxonomy + status header rules
  - [`docs/PURPOSE.md`](./docs/PURPOSE.md) — router for doc areas
- Operating rules and safety gates:
  - [`AGENTS.md`](./AGENTS.md)

---

## What’s planned / in progress (vision)

These items are referenced in docs and plans, but are not fully implemented in this repo yet.

### `conductor` (Quarkus orchestration control plane)

A Quarkus service intended to own planning, step mode, and multi-agent orchestration.

- Roadmap context: [`MASTER_PLAN.md`](./MASTER_PLAN.md)
- Certified term definition: [`docs/5_certified/WTI_AI_GLOSSARY.md`](./docs/5_certified/WTI_AI_GLOSSARY.md)

### MCP tool services (least privilege)

Planned MCP services provide tools like `rg` and filesystem reads with least-privilege boundaries.

- Roadmap context: [`MASTER_PLAN.md`](./MASTER_PLAN.md)
- Certified term definition: [`docs/5_certified/WTI_AI_GLOSSARY.md`](./docs/5_certified/WTI_AI_GLOSSARY.md)

### Step Mode gating (plan → approve → execute)

Default safety model (planned): the system produces a plan, a human approves it, then the system executes bounded steps.

- Safety/approval gating rules today: [`AGENTS.md`](./AGENTS.md)
- Roadmap context: [`MASTER_PLAN.md`](./MASTER_PLAN.md)

### Long-lived curated contexts + durable artifacts (avoid “Ralph loops”)

Planned: curate durable artifacts (plans, decisions, outcomes) and re-use them across loop iterations to prevent low-signal repetition.

- Goal doc: [`docs/goals/conductor-lisa-loops.md`](./docs/goals/conductor-lisa-loops.md)

---

## Quick start (quick & dirty)

Canonical instructions live in [`docs/theia/WTI_IDE_WORKFLOW.md`](./docs/theia/WTI_IDE_WORKFLOW.md). This section is the minimum.

### Prereqs

- Node.js **20.x** (see `ide/.nvmrc`)
- `corepack` enabled (the scripts handle this best-effort)

### Build + run

```bash
cd ide
./build.sh
./run.sh
```

- Default port: `1771`
- Override: `WTI_IDE_PORT=1771` (or any port)

### Secure env-file workflow (recommended)

Create a private directory of secret files:

```bash
mkdir -p -m 700 ~/.wti/.secure/env
```

Put secrets in files, one per environment variable.

Example for `OPENAI_API_KEY`:

```bash
printf '%s' "$OPENAI_API_KEY" > ~/.wti/.secure/env/OPENAI_API_KEY
chmod 600 ~/.wti/.secure/env/OPENAI_API_KEY
```

Point the IDE runner at that directory (e.g., in your shell rc):

```bash
export WTI_AI_ENV_FILES=~/.wti/.secure/env
```

---

## LiSA loops (Conductor orchestration model)

WTI’s intended orchestration loop is a deliberate state machine—**LiSA loops**—to prevent accidental, repetitive, low-signal “Ralph loops”.

Phases:

1. **Locate** — identify the correct sources of truth (routers, certified docs, code).
2. **Investigate** — gather evidence and constraints; confirm repo reality.
3. **Solve** — implement bounded changes with explicit steps and artifacts.
4. **Assess** — verify outcomes (tests/diagnostics), update docs, decide next transition.

Design goal reference:
- [`docs/goals/conductor-lisa-loops.md`](./docs/goals/conductor-lisa-loops.md)

---

## Features table generation from `docs/features/` (manual for now)

`docs/features/` is a legacy area (see [`docs/PURPOSE.md`](./docs/PURPOSE.md)). A lightweight, manual approach is to generate a README table by prompting an agent to summarize each doc.

### Slash command / prompt

Copy/paste this into your IDE chat (or ChatGPT) to generate a Markdown table:

```text
/features-table

Read: docs/features/* (only the first ~200 lines of each file unless it’s shorter).
Output: a single Markdown table with columns:
- Feature
- Status (from frontmatter status: ...)
- Goal (1 sentence)
- Lifecycle/Maturity (from frontmatter if present; else blank)
- Links (relative links)

Rules:
- Do not invent status/lifecycle/maturity if not present.
- If a doc is missing frontmatter, mark Status as "(missing)".
- Keep Goal factual; if unclear, write "(unclear)".
```

Planned follow-up: add a small script to generate/refresh this table automatically.

---

## Glossary & roadmap links

- Certified glossary: [`docs/5_certified/WTI_AI_GLOSSARY.md`](./docs/5_certified/WTI_AI_GLOSSARY.md)
- Infra/product roadmap context: [`MASTER_PLAN.md`](./MASTER_PLAN.md)
