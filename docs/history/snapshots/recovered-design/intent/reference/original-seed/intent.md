# Intent Inventory

This document captures the intent behind each major part of the system. Each section is organized by the matter it belongs to and explains:

- what the matter is trying to accomplish,
- why it exists,
- what pressure or failure mode it answers,
- what success should look like.

---

## Matter: Intent as Source Material

### Intent
Treat human intent as the primary input to the system, while recognizing that intent is often partial, ambiguous, or inconsistent.

### Reasoning
Traditional software workflows force humans to translate intent into prematurely rigid artifacts. This causes loss of nuance, forgotten assumptions, and design drift. The system should preserve intent early, before it collapses into code or task tickets.

### Pressure Relieved
- premature formalization
- lossy translation from idea to implementation
- poor traceability from outcome back to original purpose

### Success Signals
- a reviewer can trace code and decisions back to the original motivating intent
- the system preserves ambiguity rather than hiding it
- changes in intent can invalidate downstream work cleanly

---

## Matter: Interpretation Layer

### Intent
Insert a machine-usable interpretation artifact between human intent and execution.

### Reasoning
Execution requires sharper boundaries than raw human intent usually provides. If the system does not formalize interpretation, the agent will silently invent it. Interpretation must therefore become explicit and reviewable.

### Pressure Relieved
- hidden assumptions
- silent scope creep
- "the model guessed wrong but nobody noticed when"

### Success Signals
- every execution task has a bounded interpretation
- assumptions and exclusions are visible
- humans can challenge interpretation before expensive work begins

---

## Matter: Orchestrator

### Intent
Centralize workflow control, lifecycle management, permissions, decomposition, and state transitions in a single governing layer.

### Reasoning
Without an orchestrator, multiple workers drift into overlapping or contradictory behaviors. The system needs one authority that can decide who is active, what they may do, what they own, and when they must stop.

### Pressure Relieved
- ungoverned agent autonomy
- duplicate work
- unclear state ownership
- unsafe tool usage

### Success Signals
- each worker has a known role, scope, and capability set
- task state survives restarts
- human intervention can pause or redirect work reliably

---

## Matter: Guru

### Intent
Provide a read-only fact oracle and context compiler that assembles the minimum viable working set for a task.

### Reasoning
Workers should not trawl the entire codebase or knowledge base ad hoc. They need curated context at multiple levels of detail. The Guru should compile context without becoming a second planner or hidden decision-maker.

### Pressure Relieved
- context-window bloat
- irrelevant source flooding
- accidental hallucination from poor retrieval

### Success Signals
- workers receive compact, relevant context bundles
- all included facts retain provenance
- the Guru does not mutate project state

---

## Matter: Task-Agent

### Intent
Use bounded, scoped implementation workers to execute work in small, reviewable units.

### Reasoning
A worker should be optimized for doing work, not for carrying total system responsibility. It should operate within explicit permissions, emit checkpoints, and rely on upstream interpretation and downstream validation.

### Pressure Relieved
- giant generalist agents with fuzzy responsibility
- hard-to-review long runs
- unsafe edits beyond intended scope

### Success Signals
- workers act within declared scope
- checkpoints support resume and handoff
- diffs, tests, and decisions remain inspectable

---

## Matter: Linter

### Intent
Validate output with a strong bias toward deterministic checks, using model-based semantic review only where necessary.

### Reasoning
A harness cannot trust generation alone. It needs validation that can fail clearly and explain why. Mechanical and policy checks should be preferred because they are easier to reason about and replay.

### Pressure Relieved
- trusting generated output too easily
- vague "looks good" judgments
- silent policy violations

### Success Signals
- lint failures are machine-actionable
- semantic checks are bounded and justified
- validations are tied to acceptance criteria and scope

---

## Matter: Chronicler

### Intent
Turn the session into durable artifacts: decision traces, results, knowledge candidates, and structured outcomes.

### Reasoning
Most of the value of a long task is lost if the result is only a final patch. The harness must preserve why it acted, what it learned, and what should or should not be reused later.

### Pressure Relieved
- disposable sessions
- loss of operational knowledge
- no durable trail for later review

### Success Signals
- important decisions survive beyond the session
- knowledge candidates are normalized and typed
- artifact history supports replay and audit

---

## Matter: Knowledge Layer

### Intent
Maintain a living memory that joins source truth, derived artifacts, and working task state while enforcing provenance and promotion rules.

### Reasoning
The system needs fast contextual recall, but indiscriminate memory makes future reasoning worse. The knowledge layer should be queryable, typed, and strict about what gets promoted.

### Pressure Relieved
- knowledge fragmentation
- stale or conflicting summaries
- inability to rehydrate tasks reliably

### Success Signals
- memory candidates can be traced to evidence
- stale knowledge can be invalidated or deprecated
- warm boot uses durable context rather than narrative guesswork

---

## Matter: Lifecycle and Handoff

### Intent
Treat agents as runtime entities with formal boot, orient, execute, checkpoint, handoff, finalize, and retire stages.

### Reasoning
Long-running workers accumulate unarticulated assumptions and context pressure. Successor bootstrapping must be a designed feature, not an emergency patch.

### Pressure Relieved
- context rot
- brittle long tasks
- invisible degradation
- ad hoc takeovers

### Success Signals
- cold boot and warm boot behave differently for good reason
- checkpoints are sufficient for continuation
- successors can verify, not merely inherit, previous state

---

## Matter: Theia Workbench

### Intent
Present the system as a structured workbench where humans supervise tasks, artifacts, decisions, and approvals rather than reading chaotic raw traces.

### Reasoning
A powerful harness still fails if the UI overwhelms or misleads the human operator. Theia should make work legible: what is happening, why, where risk lives, and where intervention matters.

### Pressure Relieved
- unreadable agent chatter
- poor supervision ergonomics
- low confidence in what the harness is doing

### Success Signals
- operators can see the work graph and status at a glance
- approvals attach to artifacts, not vague claims
- human corrections are injected cleanly into the workflow

---

## Matter: Acceptance Scenarios

### Intent
Drive early design through mock conversations and complete lifecycle scenarios instead of prematurely freezing data shapes.

### Reasoning
It is easier to invent a schema than to prove it is useful. Acceptance scenarios force the team to simulate real interactions and reveal what information must truly flow through the system.

### Pressure Relieved
- architecture-first overfitting
- elegant but unusable abstractions
- missing lifecycle edge cases

### Success Signals
- mock scenarios reveal required artifacts and events
- data models emerge from observed needs
- the design can be tested against realistic human-agent-harness conversations

---

## Matter: Human Governance

### Intent
Keep humans in control of promotion, redirection, and approval while still enabling meaningful automation.

### Reasoning
The goal is not to remove humans from software development. The goal is to remove mechanical burden while preserving reviewability, accountability, and correction.

### Pressure Relieved
- black-box autonomy
- irreversible hidden decisions
- low-trust automation

### Success Signals
- humans can interrupt or redirect at meaningful boundaries
- promotion of durable knowledge is governable
- the harness amplifies judgment rather than bypassing it
