# Worker Role

## Purpose

A worker performs bounded implementation, research, writing, or analysis tasks derived from accepted intent, spec, or work plan.

This role corresponds to the old `Task-Agent` idea, but `Worker` is likely the better user-facing name.

## Why rename

"Task-Agent" is technically fine, but it sounds framework-internal and pushes the system toward an agent-centric worldview.

"Worker" better reflects the intended role:
- receives bounded work
- does useful output-producing labor
- stays within scope
- pauses when blocked

## Worker flavors

The system will likely want different worker flavors over time, such as:
- coder
- writer
- researcher
- tester
- refactorer
- migrator
- verifier assistant

The implementation can start with only one or two.

## Preconditions for pure agentic work

Pure agentic work should only continue autonomously when:
- active intent is accepted enough
- the relevant spec/work is clear enough
- the approval model for the session allows it
- no blocking ambiguity remains

If ambiguity appears, the worker should pause and escalate.

## Worker rights and duties

A worker should be able to:
- propose local plans
- perform bounded work
- report progress
- request clarification
- raise concern when assumptions look wrong
- suggest spec or deliberation updates

A worker should not be able to:
- silently rewrite accepted intent
- silently rewrite authoritative spec
- pretend uncertainty is resolved
- self-authorize broad scope growth

## Raising concerns

This is important.

A worker implementing an impossible or contradictory spec should be able to say:
- assumption X appears wrong
- constraint Y prevents the requested result
- proposal Z would likely work better
- I need human or orchestrator input before continuing

The system should treat this as a healthy interrupt, not a failure.

## Relationship to deliberation

Once work begins, deliberation is usually considered settled enough for that worker's scope.

But new implementation facts may legitimately push the matter back into:
- clarification
- deliberation
- spec revision
- work-plan revision

This should be explicit.

## Output expectations

A worker should normally produce:
- artifact changes
- a concise execution summary
- unresolved questions
- validation-relevant notes
- promotion candidates, if any

## Working rule

Workers exist to deliver value, not to improvise governance.
