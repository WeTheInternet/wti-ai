# Acceptance Scenarios for the Next Phase

## Purpose

The next design pass should be driven by acceptance scenarios rather than frozen schema.

These scenarios should prove that the system can build a knowledge base and then use that knowledge base to build software.

## Priority scenario families

### 1. Knowledge-base bootstrap

A human uploads or pastes project materials and asks the system to turn them into:
- ideas
- accepted intents
- goals
- specs
- known facts
- open questions

Acceptance criteria:
- authoritative versus non-authoritative material is kept distinct
- promotion is explicit
- the result is usable later by workers

### 2. Fast-path trivial software change

Human:
"Make the OK button green."

Acceptance criteria:
- system does not force unnecessary deliberation
- accepted intent is still captured
- a bounded worker task is created
- result is validated and linked back to intent

### 3. Ambiguous product request

Human:
"Improve navigation."

Acceptance criteria:
- orchestrator proposes multiple routes
- accepted intent is not faked prematurely
- human can choose clarifying path, deliberation path, or spec path

### 4. Intent challenge

Human request contains a shaky premise.

Acceptance criteria:
- critic/validator raises a concise challenge
- user may continue anyway
- the challenge is preserved in trace
- active intent reflects the actual chosen path

### 5. Deliberation with branching reasons

A matter has at least two proposals and several reasons for/against.

Acceptance criteria:
- branches remain legible
- reasons can receive judgments
- a summary can replace thread noise
- dissent remains discoverable

### 6. Spec builder from accepted intent

Acceptance criteria:
- spec binds intent to implementation
- requirements and acceptance criteria are explicit
- assumptions are visible
- open questions are preserved

### 7. Worker interruption due to impossible assumption

Acceptance criteria:
- worker pauses rather than inventing
- system routes back to clarification or deliberation
- replacement summary/spec can be committed
- work can resume later with new context

### 8. Verification and reflection

Acceptance criteria:
- validator can reject implementation against spec
- human can choose repair, spec revision, or deliberate again
- the decision is linked across panes

### 9. Graveyard and supersession

Acceptance criteria:
- replaced intent/spec/decision is archived
- active truth stays clean
- deep digging still finds the historical path

### 10. Rehydration after context rot

Acceptance criteria:
- a new session can recover enough from committed docs and logs
- revived work does not assume old context blindly
- new branch discussion can replace old branch discussion cleanly

## Rule for scenario writing

Each scenario should remain:
- concrete
- testable
- human-observable
- not over-bound to one storage implementation
