# Orchestrator

## Purpose

The Orchestrator is the governing control plane. It owns task state, lifecycle transitions, permission assignment, subtask decomposition, and coordination between specialized roles.

It should behave like a workflow engine with semantic awareness, not like a chat agent with extra tools.

---

## Primary responsibilities

The Orchestrator should:

- receive new intent and create task envelopes
- require or request interpretation artifacts
- assign workers and role identities
- compile or request context hydration
- manage lifecycle transitions
- enforce permissions and scope
- decide when to fork subtasks
- decide when to pause, retry, hand off, or retire work
- route work to validation and chronicling
- surface meaningful state to Theia

---

## What the Orchestrator should not become

The Orchestrator should not:
- secretly do all the thinking itself,
- mutate source truth casually,
- act as an unbounded retrieval engine,
- replace specialist roles,
- hide ambiguity from the human.

It coordinates. It does not absorb every responsibility.

---

## Task envelope

Every piece of work should begin with a task envelope. At minimum it should include:

- task identifier
- intent references
- interpretation reference
- role requested
- initial scope
- allowed tools
- stop conditions
- related artifacts
- current status
- approval requirements

The envelope is the portable unit of orchestration.

---

## Decomposition rules

The Orchestrator may split work into subtasks only when:
- the decomposition preserves clear ownership,
- conflict risk is acceptably low,
- dependency order is understood,
- merge expectations are explicit.

Useful subtask categories:
- research
- implementation
- validation
- merge
- memory curation

Not every task should be split.

---

## Permission model

Workers should receive permissions by phase and role.

Examples:
- Guru: read-only
- Task-Agent during hydration: read-only
- Task-Agent during execution: bounded write permission
- Linter: read and test only
- Chronicler: write structured artifacts, not source code

Permissions should also be scoped by file, repository area, or operation type.

---

## Invalidation handling

The Orchestrator should respond when:
- a human changes requirements,
- watched files change,
- interpretation is revised,
- promoted knowledge is superseded,
- another worker changes overlapping scope.

Possible actions:
- issue warning only
- block writes
- force rehydration
- require interpretation revision
- trigger successor handoff
- retire or merge subtasks

---

## Failure handling

The Orchestrator should model failure explicitly.

Examples:
- worker crash
- lint failure
- policy violation
- stale checkpoint
- merge conflict
- source drift during execution
- ambiguous interpretation needing human review

The key rule is that failure should produce structured outcomes, not mysterious silence.

---

## State persistence

The Orchestrator needs durable workflow state so tasks survive restarts. This can be implemented with Temporal or an equivalent state model, but runtime durability is only half the problem.

The other half is semantic continuity:
- which interpretation was active,
- which checkpoint is current,
- what assumptions were invalidated,
- which artifacts were approved.

Those semantic references must also survive.

---

## Suggested early implementation stance

In the first implementation pass, keep the Orchestrator narrow:
- single root task
- optional one-child specialist
- explicit manual approvals
- no uncontrolled swarms

Prove correctness of state management before adding more concurrency.
