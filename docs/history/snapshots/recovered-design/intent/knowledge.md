# Knowledge Layer

## Purpose

The knowledge layer stores durable, structured material that the system may rely on beyond a single conversation or agent session.

The key challenge is that not all stored material is the same kind of thing.

## Knowledge classes

The project already clearly distinguishes at least these broad classes.

### L0 facts / source truth

These are explicit facts or governing constraints accepted by a human.

Examples:
- active project decisions
- accepted constraints
- committed product truths
- laws or policy, in later domains

L0 knowledge is special.
Agents may propose it, but humans commit it.

### Decisions

A decision is not merely a fact; it is a chosen resolution made under some consensus model.

A decision may later be superseded, but it remains important precedent.

### Accepted intent and goals

These are not timeless truths, but they are authoritative active direction.

### Specs and acceptance criteria

These bind intent to implementation.

### Work plans and tasks

These are operational and often more ephemeral, but still important for trace.

### Deliberation materials

These include:
- matters
- proposals
- reasons
- judgments
- branch summaries

Not all of these belong in active truth retrieval equally.

### Logs and raw chronology

These are valuable for archaeology and rehydration, but should not automatically behave like trusted truth.

### Graveyard / deprecated material

Deprecated or superseded material should remain discoverable, but not active by default.

## Facts, beliefs, assumptions, and proposals

The project likely needs to distinguish more than just "facts" and "not facts."

A useful early set is:
- fact
- assumption
- belief
- proposal
- decision
- constraint
- precedent
- artifact
- observation
- summary
- archival trace

Not all of these need fully separate storage tables on day one.
But conceptually, they should not be confused.

## Explicit promotion

Promotion to durable knowledge should remain explicit for now.

This means:
- logs can record almost everything
- authoritative knowledge is committed intentionally
- branch summaries are promoted deliberately
- facts are human-approved
- superseded material is archived, not silently discarded

## Conflict and invalidation

Knowledge objects should be linkable enough that the system can later notice:
- this summary depends on that decision
- this spec depends on that accepted fact
- this branch used a now-replaced assumption

Do not overfit the invalidation engine immediately.

Useful near-term behavior:
- mark downstream things as potentially dirty
- surface the warning to the human or orchestrator
- allow targeted re-evaluation

## Graveyard discipline

The graveyard is important.

It is where:
- replaced intent
- deprecated knowledge
- superseded specs
- abandoned deliberation branches
- rejected proposals worth remembering

can go without polluting active retrieval.

This supports:
- archaeology
- reconsideration
- auditability
- safe forgetting

## Retrieval rule

By default, downstream consumers should receive:
- current active truth
- approved summaries
- currently relevant constraints

They should only receive graveyard material or deep dispute history when:
- explicitly requested
- conflict detected
- branch revival needed
- precedent digging requested

## Working rule

The knowledge layer should preserve the path to truth without confusing the path with truth itself.
