# Theia Workbench Vision

## Purpose

Theia is the human-facing command center for the Intent Compiler. It should make agentic work legible and governable without drowning the operator in raw trace noise.

The UI should center on tasks, artifacts, decisions, and approvals.

---

## Top-level experience

A human should feel like they are supervising a live build pipeline for intent, not reading an endless scroll of chat messages.

The main surfaces should reveal:
- what work exists,
- which workers are active,
- what state each task is in,
- what artifacts were produced,
- where approval or correction is needed,
- what changed recently,
- what the system believes and why.

---

## Proposed main surfaces

### 1. Orchestrator chat
This is the natural language control plane.

The human interacts with the orchestrator here to:
- introduce intent,
- review decomposition,
- redirect work,
- approve interpretation revisions,
- respond to blockers,
- ask for summaries.

The main chat should stay high-signal and not be flooded with every worker event.

---

### 2. Task graph pane
Show active and completed work as a tree or DAG.

Each node should display:
- task name
- role
- status
- confidence
- active interpretation version
- touched artifacts
- whether human input is needed

This is more scalable than pure chat tabs when multiple workers exist.

---

### 3. Decision trace pane
Selecting a task should show structured trace information:
- latest orientation
- key decisions
- evidence used
- file and tool actions
- lint outcomes
- unresolved risks
- checkpoint history
- memory candidates

This should be filterable and readable. It is not a dump of raw monologue.

---

### 4. Artifact pane
Humans should review concrete artifacts:
- diffs
- interpretation documents
- lint results
- test outputs
- handoff packages
- promoted knowledge candidates

Approvals should attach to artifacts or revisions wherever possible.

---

### 5. Interrupt and guidance pane
The human should be able to:
- approve and continue
- pause
- stop
- reject assumption
- constrain scope
- request reinterpretation
- add corrective fact
- require human review on promotion

This is the practical human-in-the-loop layer.

---

## Threads versus lanes

The system may expose worker "threads," but typed **lanes** may communicate the work model better.

Possible lanes:
- interpretation
- research
- implementation
- validation
- merge
- memory curation

A lane groups work by function, while task nodes show actual execution units.

---

## Handoff visibility

When a successor replaces a predecessor, Theia should show:
- why handoff happened
- what changed
- what assumptions were marked stale
- whether the successor agreed with predecessor understanding
- which checkpoint became active

Warm boot should feel observable, not mysterious.

---

## Desirable operator experience

A good operator session should let a human answer these questions quickly:
- what is the system doing right now,
- why is it doing that,
- what changed since I last looked,
- what is blocked,
- where do I need to intervene,
- what would happen if I approved the next step,
- what knowledge is being proposed for retention.

---

## Avoid these UI traps

### Raw thinking overload
Huge monologue panes create noise and false confidence.

### Chat-only control
Once multiple tasks exist, chat alone becomes a poor coordination surface.

### Hidden promotions
Knowledge promotions should never happen invisibly.

### Status opacity
If a task graph node does not clearly show whether it is active, blocked, invalidated, or retired, operators will not trust the system.

---

## Early implementation advice

Build the smallest useful workbench:
- orchestrator chat
- task graph
- artifact pane
- decision trace
- approval controls

Do not try to render every possible detail on day one. Legibility matters more than maximal visibility.
