# Intent, Goals, and Promotion

## Purpose

This document describes how raw human input becomes accepted intent, then later becomes goals, specs, work plans, and artifacts.

## Core model

The system should distinguish at least the following layers:

1. **Idea**
   - a loose thought, maybe important, maybe not yet actionable
   - may live in conversation, notes, or an ideas area
   - not automatically authoritative

2. **Candidate intent**
   - a user request or interpreted request under active clarification
   - close enough to discuss and refine
   - not yet committed as the current authoritative direction

3. **Accepted intent**
   - the currently approved statement of what is being pursued
   - authoritative for this working context
   - may still be incomplete as a spec

4. **Goal**
   - a meaningful objective derived from accepted intent
   - often stable enough to drive one or more specs

5. **Spec**
   - the binding document that connects intent to implementation
   - defines acceptance criteria, constraints, and required outcomes

6. **Work plan**
   - a decomposition of a spec into bounded tasks

7. **Artifact**
   - the actual output of execution: code, docs, tests, data, decisions, etc.

## First rule: always clarify toward an intent document

The orchestrator should always begin by trying to clarify the human's request enough that an **intent document** can be created or updated and committed.

This does not mean the orchestrator must force a huge ceremony.

It means that even a small task should ideally produce some authoritative statement of what is currently being asked.

Examples:
- "Make the OK button green." -> accepted intent may be one short paragraph
- "Rethink our navigation model." -> accepted intent may require a much richer intent document

## Candidate intent versus accepted intent

### Candidate intent

Candidate intent is what the system is currently trying to understand.

It may include:
- raw request
- interpreted meaning
- alternative framings
- clarifying questions
- possible misunderstandings
- possible challenge notices

### Accepted intent

Accepted intent is what the human has approved as the current working truth for the next step.

Accepted intent should be concise and authoritative.

It should describe:
- what is being pursued
- why, if important
- what is in scope
- what is intentionally out of scope, if relevant
- what degree of certainty or looseness is accepted

## Accepted intent is not the same as a full spec

Accepted intent may be enough for:
- direct bounded execution
- a spec-writing phase
- research
- deliberation

The system should not overfit by requiring a full formal spec before any action is possible.

## Promotion paths

The main promotion paths currently envisioned are:

- idea -> candidate intent
- candidate intent -> accepted intent
- accepted intent -> goal
- goal -> spec
- spec -> work plan
- work plan -> worker tasks
- artifact -> validation
- validated result -> promoted knowledge

The human should also be able to promote out-of-band thoughts directly into:
- ideas
- goals
- facts
- constraints
- open questions

## Skip-step behavior

The user explicitly wants expedience to remain possible.

Therefore the system must allow:
- accepted intent -> direct worker task
- accepted intent -> direct artifact update
- idea -> accepted intent (very fast path)
- accepted intent -> work plan with no formal deliberation
- accepted intent -> "just do it"

This should be visible and deliberate, not hidden.

## Intent challenge

Agents should be allowed to say:

- this may be underspecified
- this may solve the wrong problem
- this may rest on a false assumption
- this may be cheaper to solve another way
- this may conflict with previous accepted intent or spec

But intent challenge should usually yield one of:
- one or two focused clarification questions
- alternative forward options
- a suggested better framing

It should not trap the user in endless paternalistic objections.

## Recommended minimal fields for accepted intent

The exact schema should stay flexible for now, but a minimal accepted intent likely wants:

- title
- statement of intent
- initiating human
- current scope
- current desired outcome
- related matter(s), if any
- active assumptions
- current route
- status
- supersedes / superseded-by links
- timestamp / commit identity

## Graveyard and supersession

When accepted intent is replaced, the old intent should not silently vanish.

It should be:
- archived
- linked forward to its replacement
- discoverable for deep review
- excluded from ordinary active truth retrieval

The active knowledge base should show the current truth.
The graveyard should preserve the path that led there.

## Working rule

For now, the system should optimize for:
- preserving enough structure to continue later
- not forcing excessive ceremony
- keeping software work moving
