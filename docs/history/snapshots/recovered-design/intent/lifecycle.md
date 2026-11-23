# Lifecycle, Pause, Rehydrate, and Dirtying

## Purpose

This document extends the original lifecycle idea with stronger emphasis on:
- pause for human help
- context loss
- rehydration
- branch revival
- dirty downstream state

## Core rule

Agents should ask rather than make things up.

That is true across:
- orchestrator
- deliberators
- workers
- validators
- guru-like retrieval roles

## Useful lifecycle moments

The exact lifecycle should remain flexible, but the following moments are already clearly needed:

- provision
- hydrate
- orient
- execute
- pause for human
- checkpoint
- summarize
- handoff
- retire
- revive/re-evaluate later

## Pause for human is healthy

Any agent should be able to stop and say:
- I need clarification
- I found a contradiction
- the spec looks impossible
- this assumption changed
- I think this belongs back in deliberation

This should be treated as correct behavior.

## Context loss and revival

The user correctly emphasized that agents lose context when shut down.

Therefore the system should support later revival via:
- full chronological logs
- authoritative summaries
- branch summaries
- current knowledge state
- replacement/supersession history

A "conversation reviver" role may later be useful:
- reread the relevant history
- compare it to current knowledge
- propose which deliberators or workers should re-engage

This is a promising direction, but should remain lightweight for now.

## Dirty downstream state

When a fact, decision, or summary changes, downstream material may become questionable.

Examples:
- a changed accepted fact may dirty a spec
- a changed architectural decision may dirty many work plans
- a cosmetic decision may have almost no ripple effect

The system should eventually preserve enough dependency links to mark downstream items as potentially dirty.

Near term:
- do not try to make this fully automatic and omniscient
- do preserve enough links that humans can inspect likely impact
- favor targeted re-evaluation over global panic

## Working rule

Do not confuse "the agent is gone" with "the work is gone."
The system should make restart and reconsideration ordinary.
