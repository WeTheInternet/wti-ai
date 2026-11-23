# Orchestrator

## Purpose

The orchestrator is the governed entrypoint for human requests.

It accepts a prompt, clarifies intent, creates or updates authoritative intent state, and offers sensible next-step options.

## First responsibility

The orchestrator should start every new request by trying to clarify the human's request enough that an intent document can be created or updated and committed.

This is true even when the eventual path is fast and lightweight.

## Main responses the orchestrator should support

Given a fresh request, the orchestrator should be able to respond with a row of options such as:

- ask for more clarity
- send to deliberation
- plan spec
- plan work
- research first
- just do it

The UI should allow the human to choose an option and attach a comment when doing so.

## Routing rule

The orchestrator should choose the lightest responsible next step.

Examples:

### Simple direct work

Human:
"Make the OK button green."

Likely route:
- interpret
- create/update short accepted intent
- offer direct work or tiny work plan
- continue quickly

### Ambiguous product change

Human:
"Improve the navigation."

Likely route:
- clarify
- propose multiple interpretations
- maybe create a matter and route to deliberation/spec

### Possible false premise

Human:
"Remove the second database because we don't use it."

Likely route:
- challenge possible false premise
- ask a focused question or propose research
- do not blindly proceed

## Intent challenge behavior

The orchestrator should be able to incorporate challenge notices from critic/validator roles.

But the orchestrator should not become annoying or paternalistic.

Preferred behavior:
- one or two strong concerns
- specific alternatives
- concrete next options
- allow the human to continue anyway in normal cases

## Promotion responsibility

The orchestrator should own or coordinate the transitions among:
- idea
- candidate intent
- accepted intent
- goal
- spec
- work plan
- worker task

This does not mean the orchestrator writes everything itself.
It means it governs the state machine and approvals.

## Pause rule

Any agent under orchestrator control should be allowed to pause and ask the human for help rather than hallucinating through uncertainty.

The orchestrator should treat that as healthy behavior.

## Out-of-band promotion

The human should be able to promote a thought into the system outside the normal workflow.

Examples:
- "save this as an idea"
- "promote that to a goal"
- "record this as fact"
- "archive this branch"
- "commit this deliberation"

The orchestrator should make these moves easy and explicit.

## Session-level approval model

The orchestrator should eventually support session-level rules such as:
- always ask before doing work
- auto-continue for trivial edits
- allow direct worker execution after accepted intent
- require human review at every branch summary

For now, keep the model simple and human-gated.

## Important constraint

The orchestrator should not try to be the whole system.

It governs:
- routing
- approvals
- transitions
- visible state

It should not absorb:
- deep retrieval compilation
- full deliberation reasoning
- full implementation work
- authoritative commit writing by default

## Working rule

The orchestrator should feel like a smart traffic controller, not a bureaucratic bottleneck.
