# Intent Compiler v1.1 Seed Plan

## Purpose

This document is the top-level map for the **Intent Compiler**: an autonomous, human-governed software development harness that treats **human intent** as the primary source material and treats code, tests, documentation, and decisions as compiled artifacts.

Version 1.1 sharpens the original concept in four ways:

1. It inserts an explicit **Interpretation** layer between raw human intent and execution.
2. It defines a formal **agent lifecycle** with cold boot, warm boot, checkpointing, handoff, and retirement.
3. It treats long-term memory as a **promotion problem**, not a dumping ground.
4. It reframes agent observability around **decision traces and artifacts**, not raw thought streams.

## Core Thesis

A useful agent harness is not a swarm of clever chats. It is a disciplined pipeline that:

- receives intent,
- interprets it into bounded executable work,
- hydrates the minimum viable context,
- executes with explicit permissions,
- validates mechanically and semantically,
- records reviewable decisions,
- promotes only durable knowledge.

The system should behave more like a **compiler toolchain with supervised workers** than like a free-form assistant.

## Design Principles

### 1. Intent is primary, but intent is not enough
Human intent must be preserved, but it is usually incomplete. The system must not silently fill gaps without recording its interpretation.

### 2. Auditability beats invisible autonomy
Every significant decision should resolve to an artifact, event, or approval point that a human can inspect later.

### 3. Provenance beats convenience
A derived summary is not the same thing as a source fact. The system should preserve the difference.

### 4. Memory is expensive
Long-term memory must be curated. Default to discard unless something is durable, reusable, and well-anchored.

### 5. Context is compiled, not accumulated
The working set for an agent should be assembled from explicit layers and recalculated when invalidated.

### 6. Parallelism is earned
Only split work when the orchestrator can prove that the sub-work has acceptable conflict risk.

---

## Document Map

This seed pack is intentionally split into small, navigable documents.

### Foundation
- [`intent.md`](./intent.md): why each part of the system exists, and what pressure it is meant to relieve.
- [`ideas.md`](./ideas.md): important loose details, design notes, warnings, and future hooks.
- [`scenarios.md`](./scenarios.md): a placeholder scaffold for future acceptance scenarios written as mock conversations.

### Pipeline and runtime
- [`interpretation.md`](./interpretation.md): how raw human intent becomes a bounded executable interpretation.
- [`lifecycle.md`](./lifecycle.md): the full agent lifecycle, including cold boot, warm boot, checkpointing, and shutdown.
- [`orchestrator.md`](./orchestrator.md): workflow control, task decomposition, permissions, and failure handling.
- [`knowledge.md`](./knowledge.md): living memory, Deephaven-backed joins, provenance, and promotion policy.
- [`handoff.md`](./handoff.md): successor bootstrapping, transfer bundles, and context-rot handling.

### Specialized roles
- [`guru.md`](./guru.md): the read-only fact oracle and context compiler.
- [`task-agent.md`](./task-agent.md): bounded implementation worker behavior.
- [`linter.md`](./linter.md): deterministic and semantic validation.
- [`chronicler.md`](./chronicler.md): artifact serialization, decision packaging, and knowledge candidate normalization.

### Human operating surface
- [`theia.md`](./theia.md): how the system should appear inside Theia, including orchestrator chat, task graph, traces, and approvals.

---

## System Overview

The v1.1 system has the following top-level flow:

1. **Human intent arrives** through chat, files, edits, or direct instructions.
2. The **Orchestrator** creates a task envelope and requests an **Interpretation** artifact.
3. The **Guru** compiles a context bundle from authoritative sources at multiple levels of detail.
4. A **Task-Agent** cold boots or warm boots into the task, executes bounded work, and emits checkpoints.
5. The **Linter** validates the output mechanically, policy-wise, and semantically.
6. The **Chronicler** records decision traces, artifacts, outcomes, and memory candidates.
7. The **Knowledge layer** decides what to discard, attach to the task, promote, or send for human review.
8. The **Theia UI** exposes the process as a reviewable task graph with artifacts and decision traces.
9. If context rots or scope changes, the **handoff protocol** rehydrates the task into a successor worker.

---

## What Changed from the Original v1.0 Direction

The following clarifications are now considered part of the architecture, not optional refinements:

### Interpretation is first-class
The system does not go straight from "intent" to "execution." It must produce a machine-usable interpretation artifact that states scope, assumptions, exclusions, constraints, and acceptance conditions.

### Lifecycle is formal
Agents do not merely "start" and "stop." They move through a runtime lifecycle that supports reliable hydration, degradation monitoring, successor handoff, and retirement.

### Trace replaces monologue
The system should surface structured decisions, evidence, risks, and confidence rather than unbounded internal prose.

### Promotion is explicit
Knowledge promotion is a controlled act. Shutdown produces candidates, not permanent truths.

### Truth is typed
Source facts, human assertions, summaries, hypotheses, inferred claims, test results, and approved decisions must remain distinguishable.

---

## Minimum Viable Implementation Strategy

This seed pack assumes the architecture should be built in stages.

### Stage 1: Single-worker spine
Goal: prove the contracts before proving parallelism.

Build:
- task envelope
- interpretation artifact
- context bundle
- single task-agent lifecycle
- checkpoint package
- linter contract
- chronicler output
- Theia review surfaces for artifacts and decisions

Do not build:
- open-ended swarms
- aggressive long-term memory
- broad autonomous decomposition

### Stage 2: Warm boot and handoff
Goal: make long-running tasks survivable.

Build:
- checkpoint verification
- transfer bundle
- stale assumption detection
- successor rehydration
- context invalidation handling

### Stage 3: Specialist roles
Goal: introduce role separation without chaos.

Build:
- Guru as context compiler
- Linter as deterministic judge plus bounded semantic checker
- Chronicler as artifact normalizer

### Stage 4: Selective concurrency
Goal: parallelize only where structure supports it.

Build:
- conflict graph
- subtask dependency model
- merge nodes
- scoped write ownership

---

## Architectural Warnings

### 1. Memory poisoning
If the system saves every summary, future runs will become harder, not easier.

### 2. Authority confusion
If files, embeddings, summaries, and agent beliefs are all treated as equal truth, the system will drift.

### 3. UI dishonesty
If the UI exposes raw "thinking" instead of structured trace data, operators will be overwhelmed by noise and false confidence.

### 4. Handoff theater
If successor agents inherit vague narrative summaries instead of verifiable checkpoint bundles, warm booting will be unreliable.

### 5. Parallel merge pain
If the orchestrator spawns workers without conflict discipline, parallelism will create more integration work than it saves.

---

## Suggested Next Use of This Pack

The next clean session should not begin by locking in a database schema or prompt format. It should begin by building **acceptance scenarios** that exercise the harness across a realistic software lifecycle.

Recommended next move:

1. Load this pack into a fresh session.
2. Use [`scenarios.md`](./scenarios.md) as the starting point.
3. Write mock conversations showing:
   - how a human expresses incomplete intent,
   - how the orchestrator asks or infers,
   - how the Guru compiles context,
   - how the Task-Agent proposes or executes,
   - how the harness validates and records,
   - how memory candidates are promoted or rejected.

Those scenarios should drive the first data models, not the other way around.

---

## Closing Position

The Intent Compiler should be treated as a **governed build system for human intent**, not as a magical AI teammate. The more the architecture resembles a disciplined toolchain with explicit artifacts, scoped workers, and human-reviewable state transitions, the more likely it is to become useful, debuggable, and trustworthy.
