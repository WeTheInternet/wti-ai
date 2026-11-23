# Deliberation Layer

## Purpose

Deliberation handles matters that are not yet resolved enough to become stable intent, stable spec, or stable decision.

It exists because many important choices should not be collapsed into a single yes/no moment.

At the same time, deliberation must not become mandatory sludge for trivial work.

## Deliberation is optional, but always available

The orchestrator should be able to route a request directly to work when the matter is simple and the human wants velocity.

However, any of the following should be able to re-enter deliberation:
- accepted intent
- goal
- spec
- work plan
- implementation concern
- validation dispute
- policy dispute
- new evidence
- strong objection

## Core concepts

### Matter

A matter is a high-level thing that stands on its own.

Examples:
- "Should the widget use green or blue?"
- "How should agent override work?"
- "What knowledge classes belong in L0?"
- "Should this architecture remain single-page or become multi-page?"

A reply to a matter is usually a child of that matter, but an especially important reply may be elevated into its own matter with a linkback.

### Proposal

A proposal is a concrete candidate answer to a matter.

A matter may have many proposals.
Proposals may refine, supersede, or oppose one another.

### Reason

A reason is a claim for, against, or otherwise relevant to a proposal, a matter, or another reason.

A reason is not limited to a binary stance. It may be:
- for
- against
- caution
- suggestion
- condition
- unrelated note
- evidence request
- reframing prompt

### Judgment

A judgment is an assessment by a human or agent.

Judgment should support both lightweight and richer use:
- thumbs down
- comment only
- thumbs up

Internally, this likely expands to:
- stance
- weight/strength
- comment
- conditions
- confidence
- role/authority context

The exact schema should stay flexible.

### Decision

A decision records the chosen current outcome of a branch or matter.

A decision may still preserve:
- unresolved objections
- residual risk
- dissent
- conditions
- low confidence
- re-open suggestions

### Summary

A resolved branch should generate a summary that captures the reasons that actually mattered.

The summary should replace noise for ordinary readers, while linking to the full branch history for deep review.

### Graveyard/archive

Replaced, rejected, or superseded material should remain available, but should not pollute current truth retrieval.

## Threaded conversation model

The user wants deliberation to feel like a human-natural threaded conversation.

This is a very good fit.

The graph may be richer than a chat thread, but a thread is still a good primary surface because humans understand:
- replying
- disagreeing
- suggesting
- quoting
- branching
- resolving

The likely design is:
- graph underneath
- thread-like rendering on top
- summary nodes for branch resolution

## Reason types and tags

The system should ship with default reason types, but should not be rigid.

Strong defaults likely include:
- empirical
- logical
- normative
- pragmatic
- strategic
- experiential
- institutional
- aesthetic

Extra tags should be allowed freely.

Examples:
- time pressure
- developer pain
- legal risk
- market timing
- migration cost
- emotional salience
- operator fatigue

User-defined tags may not get full system semantics immediately, but they should still be indexed and preserved.

## Facts versus deliberations

The project direction is clear here:

- deliberation objects are not automatically facts
- committed facts are special
- facts belong to an explicit human-approved knowledge tier
- agents may propose facts
- humans may simply assert facts when they choose

The system should still allow an agent to object:
"I think X is false because Z."

But if the active consensus model for this domain allows the human to set X as true, the system should be able to continue with that assumption.

## Human and agent participation

Both humans and agents should be able to contribute to the thought graph.

Likely useful deliberator stances include:
- advocate
- opponent
- critic
- mediator
- dreamer
- expert
- product user
- developer
- project manager

Implementation can begin with only one or two of these, but the idea matters.

A practical rule is:
- agents may contribute arguments and judgments
- humans gate final decisions for now
- some agent spin-offs may pause automatically until a human reviews the thread

## Intent challenge inside deliberation

A specialized critic-like agent should be able to raise a structured challenge such as:
- wrong problem
- wrong scope
- false premise
- better nearby alternative
- hidden tradeoff
- conflict with accepted intent or current law

The human should then be able to:
- accept the challenge
- reject it
- partially adopt it
- request one clarifying question only
- continue anyway

## Authority and weighting

For now:
- humans decide
- agents advise
- agent judgments influence other agent reasoning
- humans can override most agent objections

Later, the model may include:
- differing authority levels
- role-specific weight
- delegated trust
- consensus models by domain
- vote-for or follow-trust systems

These should remain future-facing, not frozen now.

## Branch resolution

The exact branch lifecycle should remain intentionally loose for now.

Still, some practical states are already implied:
- open
- active
- waiting for human
- summarized
- decided
- superseded
- archived

The important rule is not the exact enum.
The important rule is that branches should be able to:
- stay alive
- be summarized
- be reopened
- be superseded
- remain discoverable

## Working rule

Deliberation exists to make hard things legible without making easy things slow.

That tradeoff should drive every design choice here.
