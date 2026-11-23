# WTI Agentic Development Platform

WTI-AI aims to turn intent into delivered, verified software using **LISA — Locate, Investigate, Solve, Assess**:

**Receive intent → discuss → create spec → deliver spec to workers → create and execute implementation → verify → report.**

Conductor works with The Human to refine intent, requirements and specs and establish feature leads. Each feature lead owns implementation and delivery, doing the work directly or coordinating specialists; spec changes return to Conductor. The lead also decides what knowledge from the feature should persist, with Historian as an optional recording helper. The default is continued authorized work; The Human can select manual stop-on-ambiguity behavior per scope. The role direction is decided; detailed implementation contracts remain DRAFT and do not change repository operating permissions.

## Start here

- [AGENTS.md](AGENTS.md) — repository operating rules and permission gates.
- [Conductor/LISA goal](docs/goals/conductor-lisa-loops.md) — purpose and durable workflow intent.
- [Feature delivery workflow](docs/specs/agent-workflow.md) — stages, ownership, autonomy and verification.
- [Project knowledge](docs/specs/project-knowledge.md) — Chronicler, lead-selected knowledge and authorized Historian recording.
- [Operator supervision](docs/specs/operator-supervision.md) — progress, evidence, steering and continuity.
- [Reconciliation plan](docs/plans/docs-reconciliation.md) — exact changes, current owners, pending choices and completion checks.
- [Preserved design sources](docs/history/INDEX.md) — source snapshots and unresolved/deferred ideas.

## Current work and evidence

Theia's active build/run workspace is `ide/`. Use [the existing IDE workflow](docs/theia/WTI_IDE_WORKFLOW.md) and its prerequisites; this docs proposal makes no dependency or migration claim. Secret loading behavior is documented there and implemented in [ide/run.sh](ide/run.sh).

The existing Graph preview is fixture-backed, with no demonstrated active ledger ingestion. CLI Adapter now owns a separate, explicitly configured read-only Git-ledger-to-Graph slice; the initial source is a dedicated localhost bare Git repository with one agent-written status branch. CLI Adapter is proving two local pushes and explicit refresh; completion is not claimed here. CLI adapter research owns Graph integration, Lab owns portable UI/fixtures and Triage provides the communication relay. Reported tests and remaining gaps are recorded separately in [operator supervision](docs/specs/operator-supervision.md#evidence-currently-available).

The harness is intended to work independently of its GUI. GKE/Quarkus deployment designs remain recoverable options in [the roadmap router](MASTER_PLAN.md); this workflow does not require choosing the deployment stack first.

## LISA activities

1. **Locate** — find the relevant sources.
2. **Investigate** — examine evidence and constraints.
3. **Solve** — carry out bounded work.
4. **Assess** — verify, record outcomes and choose the next action.

These activities support the delivery flow without prescribing a fixed GUI layout.

### Current evaluation and next panel slice

Conductor and LISA remain active design work. Generated prompts continue to inform that design and prompt assembly. Task-context reading and authority follow [the prompt router](./.prompts/PURPOSE.md) and [AGENTS.md](./AGENTS.md).

System reports that both the Codex and LISA arms passed clean and delayed reload in the tiny synthetic comparison. Wrong builds were rejected before scoring. This was one comparison in a fixed order, with different cache usage between arms. The results establish success for the exercised checks under those conditions. Relative performance and the broader orchestration design require further evidence.

The team's next Theia panel direction starts with synthetic fixtures. A separate supervision panel should make run state and supporting evidence inspectable. Proposed checks focus on observable panel behavior.

- Show the responsible agent, next action, and any blocking condition.
- Let the operator open the evidence supporting the displayed result.
- Exercise clean and delayed reload against an identified fixture/build.
- Make fixture-derived state and results visibly attributable to that fixture.

Live execution and control behavior need separate evaluation. The synthetic comparison leaves multi-agent coordination, interruption, retry safety and knowledge promotion unverified. Further comparisons with a plain CLI workflow should assess useful operator visibility alongside delivery quality, latency and coordination effort.

## Documentation authority

Only `status: CERTIFIED` establishes repository document authority. Location, generated status and the word “current” do not certify a proposal. See [the docs system](docs/features/doc-system-spec.md) and [documentation router](docs/PURPOSE.md). Direct user instructions continue to govern within system and permission limits.

Generated prompts remain active design and workflow evidence. Follow [their router](.prompts/PURPOSE.md) for reading boundaries; a preserved task context is not an instruction to execute its old task.
