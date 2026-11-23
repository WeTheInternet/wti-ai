# Task-Agent Role

## Purpose

The Task-Agent is the bounded implementation worker. It uses the interpretation artifact and compiled context bundle to perform concrete work: code edits, tests, documentation changes, or other task-scoped actions.

It is optimized for execution, not for owning total system truth.

---

## Responsibilities

The Task-Agent should:
- orient against the current interpretation
- act within declared scope
- make incremental progress
- emit checkpoints
- run or request validation steps
- surface uncertainty rather than bury it
- stop when permissions, scope, or confidence no longer justify continuing

---

## Expected inputs

A Task-Agent should begin with:
- task envelope
- interpretation reference
- current context bundle
- permission profile
- active workspace snapshot
- stop conditions

A warm-booted successor should also get:
- predecessor checkpoint
- handoff notes
- invalidation deltas

---

## Output expectations

A Task-Agent should produce:
- diffs or proposed diffs
- tests or test runs
- decision trace events
- checkpoints
- unresolved risks
- final summary on completion

The value is not only in the final patch, but in the preserved path.

---

## Guardrails

### Scope guardrail
The worker should not modify files outside its declared working set unless the orchestrator expands scope.

### Permission guardrail
The worker should not use tools or operations outside its assigned capability profile.

### Confidence guardrail
If uncertainty becomes too high, the worker should checkpoint and seek rehydration or human guidance rather than bluff.

### Interpretation guardrail
The worker should not silently reinterpret the task in the middle of execution.

---

## Local planning

The Task-Agent may create a local work plan, but this plan should remain subordinate to the active interpretation. Local plans are execution tactics, not task truth.

---

## Good behavior pattern

A healthy Task-Agent loop looks like:
1. restate current objective,
2. inspect needed sources,
3. make one bounded change,
4. validate locally,
5. checkpoint,
6. continue or escalate.

This is slower than reckless autonomy, but much easier to trust.

---

## Common failure modes

### Freewheeling implementation
The worker "just fixes a few nearby things" and scope expands invisibly.

### Narrative-only progress
The worker sounds productive but produces few artifacts.

### Assumption burial
The worker relies on shaky beliefs but does not checkpoint them.

### Overwork without compression
The worker performs many tool actions without updating checkpoint state, making successor recovery difficult.

---

## Early implementation advice

Start with one Task-Agent at a time and strict scope boundaries. Prove that a single worker can complete bounded work cleanly before introducing multiple concurrent implementation workers.
