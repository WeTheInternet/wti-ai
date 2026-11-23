# Delta from Original v1.1 Seed

## Purpose

This file records the largest conceptual changes between the original v1.1 seed pack and the current master snapshot.

## Major changes

### 1. Deliberation is now explicit

The seed strongly implied governance and judgment, but did not yet define a first-class deliberation model.

The master snapshot adds:
- matter
- proposal
- reason
- judgment
- decision
- branch summary
- graveyard/archive

### 2. Fast-path execution is explicitly preserved

The seed leaned toward governed structure. The new snapshot makes it explicit that simple software work should not be forced through maximal process.

The orchestrator must support:
- ask for clarity
- deliberate
- plan spec
- plan work
- just do it

### 3. Accepted intent is now a formal transition

The seed had interpretation and planning. The new snapshot adds a more concrete promotion step:

`candidate intent -> accepted intent -> goal/spec/work`

### 4. Authoritative state and chronological logs are separated more sharply

The seed already cared about provenance and promotion. The new snapshot makes the distinction more operational:

- logs may store the entire path
- authoritative documents store approved state
- graveyard/archive stores replaced material without polluting active truth

### 5. Worker replaces task-agent in spirit

The seed document `task-agent.md` is still preserved in reference, but the project discussion now leans toward `Worker` as the better user-facing name.

### 6. Critic / validator behavior expands beyond mechanical linting

The original `Linter` role remains useful, but the new picture includes:
- mechanical validation
- semantic criticism
- intent challenge
- assumption flagging

### 7. The system is now explicitly staged by document class

The new snapshot distinguishes:
- ideas
- candidate intents
- accepted intents
- goals
- specs
- work plans
- validated artifacts
- promoted knowledge
- archive/graveyard

### 8. Human shortcuts are a design requirement

The human must be able to:
- override most agent objections
- skip steps when expedience matters
- promote thoughts out-of-band
- request direct execution for trivial matters

### 9. Reconsideration is preserved, but intentionally under-specified

The user wants the system to support dirtying, rehydration, revisit, and branch revival, but does not want to prematurely freeze a rigid lifecycle for every deliberation branch.

### 10. Software-first priority is now explicit

The long-term architecture may apply to law/governance and then general ideas, but the immediate delivery target is software work.

## What did not change

The original seed's strongest ideas still stand:
- interpretation must exist
- auditability matters
- provenance matters
- memory is expensive
- context should be compiled
- explicit promotion beats silent mutation
- handoff should not be magical inheritance
