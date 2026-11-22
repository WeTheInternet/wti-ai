# Knowledge Layer and Living Memory

## Purpose

The Knowledge layer supports context compilation, warm boot continuity, and durable project memory while preserving provenance and keeping a strong bias toward discard.

This layer is not a free-form scrapbook. It is a governed memory system.

---

## Core idea

The system needs access to several categories of knowledge:

- durable source truth
- derived summaries
- active task state
- approved decisions
- reusable facts
- superseded or deprecated items

These categories should remain distinguishable.

---

## Suggested knowledge classes

### Source truth
Checked-in files, approved documents, direct human instructions, authoritative configuration.

### Derived truth
Joins, summaries, retrieval bundles, extracted facts, interpretations.

### Working state
Task-local checkpoints, hypotheses, in-progress assumptions, unresolved questions.

### Promoted knowledge
Reusable facts or rules approved for future reuse.

### Deprecated knowledge
Items superseded by newer truth or explicitly invalidated.

---

## Provenance rule

Every significant item should retain enough provenance to answer:
- where did this come from,
- when was it produced,
- under what interpretation,
- whether it was approved,
- what it depends on,
- whether it is still current.

Without provenance, the memory system will become untrustworthy.

---

## Promotion policy

Promotion should be a controlled step, not a side effect of shutdown.

### Candidate sources
- worker finalize output
- chronicler normalization
- human annotations
- validated extraction pipelines

### Candidate destinations
- discard
- task-only retention
- session-local note
- project knowledge
- human-review queue

### Promotion criteria
Promote only when the item is:
- durable,
- reusable,
- well-anchored,
- not merely stylistic or transient,
- unlikely to mislead future runs out of context.

---

## Why discard bias matters

Most task-local observations do not deserve long-term reuse. Saving too much creates:
- stale memory,
- noisy retrieval,
- authority confusion,
- reinforcement of weak summaries,
- degraded warm boot quality.

The system should prefer to forget rather than to remember badly.

---

## Deephaven role

A Deephaven-backed layer can provide:
- real-time ingestion from watched sources
- joins across intent, decisions, artifacts, and active tasks
- neighborhood queries for context compilation
- invalidation signals when related rows change

This makes memory queryable and dynamic without requiring every worker to discover structure ad hoc.

---

## Practical table directions

A future implementation likely needs tables or entities equivalent to:
- intent nodes
- relationship edges
- active tasks
- checkpoints
- decision traces
- knowledge candidates
- promoted facts
- invalidations
- artifact references

The exact schema should be driven by acceptance scenarios rather than frozen too early.

---

## Retrieval and joins

The Knowledge layer should support context compilation by query, not only by embedding similarity.

Useful retrieval modes:
- direct reference resolution
- graph neighborhood
- rule-based joins by task domain
- recent invalidations
- file ownership adjacency
- embeddings as a sidecar ranking aid

Semantic similarity is useful, but it should not become the only retrieval logic.

---

## Invalidation

Knowledge can become stale because:
- a source file changed
- interpretation changed
- a prior assumption was disproven
- a policy was updated
- a promoted fact was superseded

Invalidation events should be first-class citizens. Memory that cannot be invalidated is eventually harmful.

---

## Human governance

Humans should be able to:
- approve or reject promotion
- mark knowledge as stale
- reclassify an item
- add a corrective note
- view provenance before trusting a promoted fact

That keeps the knowledge base from becoming self-authoring folklore.

---

## One hard rule

**No summary should silently become a fact.**

If the system infers or summarizes something, that status must remain visible unless and until it is explicitly promoted.
