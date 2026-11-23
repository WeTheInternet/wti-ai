# Intent Compiler Master Snapshot (2026-03-28)

## Purpose

This pack is the current working master for the Intent Compiler project after the original v1.1 seed was re-read and extended with new direction from live design conversation.

It is intentionally opinionated enough to preserve progress, but still loose enough to allow the next mock software-design pass to teach us what the structure really needs.

The immediate delivery priority is:

1. software-first workflow
2. law-like / governance workflow second
3. general idea deliberation third

The system should be designed so it can grow into the latter two without compromising the first.

## Updated core thesis

The original seed treated the system primarily as a governed harness that compiles intent into work artifacts.

That remains true, but the new picture is broader:

- human prompts enter through a conductor
- the conductor first clarifies intent enough to create or update an authoritative intent document
- once intent is clear enough, the system can route into deliberation, specification, research, work planning, implementation, or direct bounded execution
- deliberation is available at any point, but is not mandatory for trivial work
- all conversation may be logged chronologically as non-authoritative trace
- structured threads and documents capture the authoritative or review-worthy state
- pure agentic work is only safe when the active intent/spec/work is sufficiently resolved for that session's approval model

The system is therefore not just:

`intent -> interpretation -> execution`

It is closer to:

`candidate intent -> accepted intent -> deliberation/specification/work -> validation -> promotion -> knowledge`

with the ability to re-enter deliberation from any later stage.

## High-level pipeline

### 1. Seed prompt / candidate intent

A human starts with a request, idea, complaint, goal, matter, or direct command.

Examples:
- "make me this widget"
- "should we switch the app from blue to green?"
- "help me formalize what this product is supposed to do"
- "find out whether assumption X is actually true"

The system should not assume all of these need the same amount of structure.

### 2. Interpretation and intent clarification

The conductor interprets the human request and produces enough structure to either:
- ask for more clarity
- propose a plan
- propose multiple forward paths
- go directly into bounded execution

A core requirement now is that the conductor should always try to clarify the request enough that an **intent document** can be created or updated and committed.

### 3. Accepted intent

Once the human approves the current framing, the intent becomes accepted for this working context.

Accepted intent is not the same as a finished spec. It is the authoritative statement of what is currently being pursued.

Accepted intent may later be reopened, superseded, or sent into deliberation.

### 4. Deliberation or fast-path routing

From accepted intent, the conductor may route to one or more of:
- deliberation
- research
- spec building
- work planning
- direct bounded work

The crucial update is that **deliberation is optional for easy work**. A user who says "make the OK button green" should not be dragged through a sixteen-page policy exercise.

### 5. Spec and acceptance criteria

When the work is non-trivial, the spec binds intent to implementation.

The spec should define:
- scope
- requirements
- acceptance criteria
- constraints
- known assumptions
- dependencies
- open questions
- validation expectations

### 6. Work plan and worker tasks

A work plan breaks a spec into bounded tasks.

Workers execute bounded tasks, not vague wishes.

### 7. Validation and reflection

Validation checks whether the artifacts satisfy the currently approved spec and policy.

Reflection considers whether the spec itself needs revision or whether new knowledge was discovered during implementation.

### 8. Promotion and knowledge

Important outputs may be promoted into the knowledge layer, but promotion should remain explicit until experience proves where automation is safe.

## Two parallel record systems

The project now clearly wants two different recording modes.

### A. Non-authoritative chronological record

This is the full event stream:
- prompt history
- conversation turns
- agent comments
- deliberation discussion
- failed proposals
- abandoned branches
- intermediate drafts
- questions asked and answered

This record is useful for rehydration, auditing, and later archaeological review.

It is not automatically "truth."

### B. Authoritative structured state

This includes:
- accepted intent
- committed facts
- approved specs
- approved work plans
- decisions
- promoted summaries
- validated artifacts
- active constraints

This is the state that downstream agents should trust by default.

## Deliberation is now first-class, but not universal

The v1.1 seed had strong support for interpretation, governance, and trace, but did not yet fully model how a human or agent moves from fuzzy thought to justified decision before work begins.

The master snapshot adds a first-class deliberation model:

- matter
- proposal
- reason
- judgment
- decision
- summary
- graveyard/archive

This model is available when needed, but the conductor should still be able to fast-path trivial work.

## Human authority and shortcuts

The system should remain human-governed.

For now:
- any human may decide
- all final decisions remain human-gated
- agents may raise concerns, challenge framing, and ask clarifying questions
- the human may override most agent objections
- the human may skip steps when expedience matters more than thoroughness

The main exception is illegal/immoral behavior, which should not be normalized as overridable.

The system therefore needs explicit support for:
- "just do it"
- "ask me one question, then continue"
- "show me options"
- "plan first"
- "send this to deliberation"
- "promote this side thought into an idea"
- "commit this thought to disk"
- "archive this line of reasoning"

## Naming shifts

Two likely naming improvements emerged in discussion:

- `Task-Agent` is probably better named **Worker**
- `Linter` may remain a mechanical validator while a broader human-facing name like **Validator** or **Critic** sits above it

The system does not have to lock this down immediately, but the distinction matters:
- workers do bounded work
- validators/critics challenge, check, and protect quality
- deliberators argue, synthesize, and probe

## Immediate design priorities

### Priority 1: capture the project itself

Before rich execution, the system should be able to help build and maintain the knowledge base for this very project.

### Priority 2: software-delivery flow

The first practical end-to-end workflow should be:

`build knowledge base -> refine intent -> build spec -> build work plan -> execute work -> validate -> reflect`

### Priority 3: preserve path-to-truth without poisoning truth

The user explicitly wants:
- authoritative truth documents
- archival history
- discoverable prior arguments
- a graveyard for replaced or deprecated material
- the ability to dig deeper only when needed

## Document map

- `intent.md` — candidate intent, accepted intent, goals, specs, and promotion
- `deliberation.md` — matter/proposal/reason/judgment/decision model
- `conductor.md` — entrypoint behavior and routing options
- `threaded-chat-view.md` — threaded chat bubble view, selection model, and interaction panel behavior
- `goals/conductor-threaded-intent-surface.md` — goal and v0 acceptance criteria for the threaded intent surface
- `implementation-engines.md` — finalize intent gate and engine concept
- `worker.md` — bounded execution role
- `validator.md` — validation and criticism
- `guru.md` — context compilation and retrieval discipline
- `knowledge.md` — classes of knowledge and promotion rules
- `chronicler.md` — recording and commit discipline
- `lifecycle.md` — session lifecycle, pause, resume, dirtying, and rehydration
- `theia.md` — UI surfaces by stage
- `scenarios.md` — next acceptance scenarios
- `retrieval-notes.md` — critique of early Deephaven retrieval ideas
- `wti-notes.md` — provisional WTI usage notes
- `ideas.md` — loose but important design ideas
- `open-questions.md` — unresolved questions intentionally preserved
- `delta-from-seed.md` — what changed since the original seed

## Working stance

This pack should be treated as the current master seed, not final law.

The next phase should use these docs to drive a mock software-development lifecycle, with the expectation that acceptance scenarios will reveal where the model is too loose, too rigid, or simply wrong.
