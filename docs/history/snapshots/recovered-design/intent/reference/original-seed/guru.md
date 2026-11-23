# Guru Role

## Purpose

The Guru is the read-only fact oracle and context compiler. It assembles the minimum useful working set for a task from authoritative and derived sources without becoming an unbounded planner or covert state mutator.

Its job is to make workers better informed, not more powerful.

---

## Responsibilities

The Guru should:
- gather relevant L0, L1, and L2 context
- resolve direct references
- compile bounded context bundles
- preserve provenance for included facts
- surface conflicts and ambiguities
- answer targeted fact-finding queries
- avoid changing project state

---

## The Guru is not

The Guru is not:
- the orchestrator,
- the implementer,
- the linter,
- a secret strategist that decides scope on its own,
- a writer of source code or task artifacts.

It is a context compiler and fact service.

---

## LOD compilation

A key Guru function is compiling context by level of detail.

### L0
System-wide invariants, safety rules, architectural laws, organizational constraints.

### L1
Domain rules, module conventions, subsystem knowledge, design patterns.

### L2
Immediate working set: files, functions, symbols, docs, tests, and task-adjacent artifacts.

An optional task-local scratch layer may exist during execution, but it should not be confused with durable knowledge.

---

## Retrieval behavior

The Guru should prefer:
- explicit references,
- direct links,
- structured joins,
- provenance-preserving summaries,
- graph or rule-aware neighborhood compilation.

Embeddings may help rank candidates, but they should not erase provenance or replace structured retrieval.

---

## Output shape

A useful Guru bundle might include:
- key facts
- source references
- conflicts or contradictions
- missing information
- recommended caution flags
- a compact rationale for inclusion

The bundle should be small enough to use and rich enough to trust.

---

## Risk controls

### Avoid hidden interpretation
The Guru should not quietly expand scope beyond the active interpretation.

### Avoid mutation
The Guru should remain read-only to preserve trust.

### Avoid summary drift
When compressing, the Guru must preserve whether a statement is source fact, inference, or unresolved tension.

---

## Early implementation advice

Start with a very conservative Guru:
- no mutation,
- explicit provenance,
- narrow query surface,
- small context bundles.

Only later should it become more ambitious in compilation sophistication.
