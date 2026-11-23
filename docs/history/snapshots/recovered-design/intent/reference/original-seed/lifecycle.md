# Agent Lifecycle

## Purpose

Agents are runtime workers, not immortal chat sessions. This document defines the lifecycle that lets workers boot, work, degrade, hand off, finalize, and retire in a controlled way.

The lifecycle is what makes long-running work survivable.

---

## Core States

1. **Provision**
2. **Hydrate**
3. **Orient**
4. **Execute**
5. **Checkpoint**
6. **Degrade Monitor**
7. **Handoff or Rehydrate**
8. **Finalize**
9. **Retire**

The orchestrator owns state transitions.

---

## 1. Provision

The worker is created with:
- role identity
- task envelope
- permission profile
- initial resource limits
- execution scope

At this stage, the worker should not yet mutate project state.

### Goal
Create a worker with clear identity and bounded capability.

---

## 2. Hydrate

The worker builds its initial context window.

### Cold boot
A cold boot loads from durable, authoritative sources:
- task envelope
- interpretation artifact
- relevant L0, L1, and L2 context
- current source snapshots
- current knowledge rows with provenance

### Warm boot
A warm boot loads all of the above plus:
- predecessor checkpoint package
- transfer memo
- delta report since predecessor checkpoint
- stale assumption candidates

### Goal
Construct a working set that is explicit, bounded, and current enough to begin.

---

## 3. Orient

The worker emits a structured local understanding:
- task summary
- current assumptions
- intended first steps
- known unknowns
- confidence estimate

This is not private monologue. It is a structured operational orientation.

### Goal
Confirm the worker understands the task before doing expensive work.

---

## 4. Execute

The worker performs bounded work, ideally in transactional units:
- inspect files
- propose or apply changes
- run tests
- record decisions
- refresh local state when needed

Execution should be constrained by file scope, tool permissions, and current interpretation.

### Goal
Make measurable progress while preserving inspectability and recovery.

---

## 5. Checkpoint

The worker periodically emits a resumable checkpoint with:
- files touched
- decisions taken
- unresolved risks
- current assumptions
- next recommended action
- confidence
- candidate knowledge items

This is not final memory promotion. It is operational continuity state.

### Goal
Support recovery, review, and successor bootstrapping.

---

## 6. Degrade Monitor

The system should observe whether the worker is approaching context rot.

Possible signals:
- growing token pressure
- repeated re-reading of the same sources
- too many unresolved assumptions
- contradiction count rising
- long duration without checkpoint compression
- uncertainty rising
- source context changing underneath the worker

### Goal
Detect when continuing with the same worker is less safe than rehydration or handoff.

---

## 7. Handoff or Rehydrate

When degradation or invalidation is high enough, the orchestrator may:
- rehydrate the same worker from durable sources, or
- provision a successor worker and perform warm boot handoff.

The successor must verify predecessor state against current truth, not merely inherit it.

### Goal
Preserve continuity without trusting decayed context.

---

## 8. Finalize

When the worker stops, it emits:
- result summary
- artifact references
- unresolved issues
- review hints
- knowledge candidates
- discard recommendations

Finalize is where the worker says what happened, what matters, and what should not be kept.

### Goal
Close the task legibly and prepare for chronicling.

---

## 9. Retire

The worker is frozen or destroyed. It should not remain an active hidden state container after retirement.

### Goal
Prevent ghost state and accidental resurrection of stale context.

---

## Lifecycle transitions

Not every task needs every transition, but the model should support them.

- Provision → Hydrate → Orient → Execute is the normal startup path.
- Execute → Checkpoint → Execute may happen many times.
- Execute → Degrade Monitor → Handoff handles context rot.
- Execute → Finalize → Retire is the normal completion path.
- Any major context invalidation may force a return to Hydrate or a new successor.

---

## Cold boot versus warm boot

This distinction matters.

### Cold boot
Use when:
- the task is new,
- no predecessor exists,
- prior state is untrusted,
- authoritative context is sufficient.

### Warm boot
Use when:
- a predecessor has done valuable task-local work,
- the task is long-running,
- checkpointed continuity matters,
- redoing all orientation would be wasteful.

Warm boot is not "resume chat memory." It is verified continuation from a checkpoint package.

---

## Lifecycle risk notes

### Danger: treating warm boot as inheritance
A successor that trusts predecessor beliefs without verification will accumulate hidden errors.

### Danger: skipping checkpoint structure
If checkpoints are narrative blobs, the system will struggle to rehydrate reliably.

### Danger: no retirement discipline
Workers that linger as hidden mutable state will eventually conflict with the orchestrator's view of reality.
