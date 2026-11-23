# Guru and Context Compilation

## Purpose

Guru compiles just-in-time context for other agents and interfaces.

There is a lot riding on Guru, so its job needs to be disciplined.

## Core responsibility

Guru should provide the smallest context package that is sufficient for the current task.

It should not dump every related conversation or every nearby graph node into the consumer's context window.

## Important tension

The user explicitly wants:
- rich knowledge
- full recoverability
- graph-aware retrieval
- deliberation history when needed

But also fears:
- context-window drowning
- giant thread dumps
- summary drift
- invalid downstream ideas
- overfitting the implementation too early

That tension is real.
Guru exists to manage it.

## Recommended retrieval stance

Prefer staged compilation over raw bulk retrieval:

1. retrieve the active authoritative objects first
2. retrieve the current branch summary next
3. retrieve only the directly relevant supporting detail
4. expose deeper history as optional drill-down
5. pull graveyard/archive only when explicitly needed

This is much safer than:
- large N-hop dumps
- full-AST retrieval for everything
- naive thread expansion

## Summary caches

The project likely wants cacheable summary layers.

Examples:
- active matter summary
- branch-resolution summary
- accepted-intent summary
- spec summary
- constraint summary
- relevant precedent summary

These summaries should be approved or promoted, not silently regenerated as if they were stable truth.

## What belongs at Guru versus harness level

A useful division is:

### Harness / orchestrator level
- routing
- approval gating
- transition control
- dirty-state propagation events

### Guru level
- context compilation
- relevant retrieval
- level-of-detail shaping
- conflict surfacing
- prompt-fragment construction

This keeps Guru from becoming a second orchestrator.

## Relationship to Deephaven / graph storage

A graph-backed, bi-temporal store may be a strong substrate.

But the physical retrieval layer should not dictate the conceptual model too early.

In particular:
- do not equate the prompt compiler with the storage schema
- do not assume N-hop graph retrieval is the primary UX primitive
- do not assume full ASTs belong in most compiled contexts
- do not assume every invalidation must eagerly cascade in real time

The storage engine can be powerful without forcing the user experience to feel like query algebra.

## On the "mountain of tiny Gradle tasks" intuition

The user's instinct here is understandable:
- invalidate downstream summaries
- rerun affected reasoning
- keep things incremental

That is conceptually close to a build graph.

The danger is implementation overkill too early.

A better near-term stance is:
- preserve dependency links
- allow dirty marking
- re-evaluate on demand or on periodic review
- avoid building a full reactive distributed build engine before the core workflow exists

So the instinct is good.
The implementation impulse should remain restrained.

## Working rule

Guru should be powerful, but boring:
- minimal
- reproducible
- drill-down friendly
- hard to poison
