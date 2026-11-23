# Acceptance Scenario Seed

## Purpose

This file is a scaffold for the next phase of the project: defining acceptance scenarios as mock conversations between the human, the harness, and the agent roles.

These scenarios should drive the shape of the system rather than being forced to fit a preselected schema.

For now, this file only establishes the intended format and the kinds of questions the scenarios should answer.

---

## Why scenarios come next

The architecture now has enough structure to support realistic simulation. Before freezing schemas, tables, or prompt contracts too aggressively, the next clean session should exercise the system end-to-end through concrete examples.

That will reveal:
- which artifacts truly matter,
- what events must exist,
- where ambiguity appears,
- how human corrections enter the system,
- what warm boot continuity actually requires.

---

## Scenario format

Each scenario should be written as a mock conversation and should identify speakers clearly.

Suggested speakers:
- **Human**
- **Orchestrator**
- **Guru**
- **Task-Agent**
- **Linter**
- **Chronicler**
- **Harness/System** for environmental events or status changes

Not every scenario needs every speaker.

---

## Suggested structure per scenario

### Scenario title
A short descriptive name.

### Intent under test
What human purpose or behavior this scenario is meant to exercise.

### Preconditions
What state the project or system is already in.

### Mock conversation
A sequence of speaker-tagged messages.

### Expected artifacts
What interpretation, checkpoints, diffs, lint results, approvals, or memory candidates should be produced.

### Acceptance criteria
What the harness must do correctly for the scenario to pass.

### Edge cases revealed
What design questions the scenario surfaced.

---

## Scenario families to build next

### 1. Incomplete human request
The human gives a fuzzy goal. The system must interpret without overcommitting.

### 2. Straightforward bounded implementation
A clean task proceeds through interpretation, execution, validation, and chronicling.

### 3. Human correction mid-task
A worker is moving in the wrong direction and receives a correction.

### 4. Scope expansion discovery
Execution reveals hidden coupling. The system must revise interpretation rather than silently expanding.

### 5. Warm boot takeover
A successor continues a long-running task from a predecessor checkpoint.

### 6. Knowledge promotion dispute
The system proposes a memory item and the human rejects or edits it.

### 7. Parallel subtask coordination
Two workers operate on related pieces of work and require merge governance.

### 8. Validation failure and retry
The linter fails a task and the harness routes the issue back through the pipeline.

---

## Important rule for next phase

Do not start by forcing these scenarios into a rigid storage schema. Use the scenarios to discover:
- required fields,
- recurring event types,
- approval boundaries,
- provenance needs,
- common failure transitions.

The schema should emerge from repeated scenario pressure.

---

## Minimal placeholder template

```md
## Scenario: <name>

### Intent under test
...

### Preconditions
...

### Mock conversation
**Human:** ...
**Orchestrator:** ...
**Guru:** ...
**Task-Agent:** ...
**Linter:** ...
**Chronicler:** ...

### Expected artifacts
- interpretation
- checkpoint
- diff
- lint result
- memory candidate

### Acceptance criteria
- ...

### Edge cases revealed
- ...
```

---

## Next-session guidance

When this seed pack is loaded into a clean session, start here after reading `main.md` and `intent.md`.

The goal is to simulate the **complete software development lifecycle** as experienced by the human and as operationalized by the harness. The mock conversations should reveal the queries, joins, artifacts, and transitions the system would need in order to support that lifecycle faithfully.
