# Validator and Critic

## Purpose

The system likely needs both a narrow mechanical validator and a broader critic function, even if they are implemented together at first.

This document uses `Validator` as the broad user-facing term and leaves room for a more specialized internal `Linter` later.

## Why this split matters

A purely mechanical linter is easy to understand:
- syntax
- schema
- formatting
- policy checks
- test results

But the system also needs richer criticism:
- hidden ambiguity
- false confidence
- contradicting assumptions
- bad framing
- quality risk
- spec/work mismatch

Those are not all "lint."

## Practical near-term stance

Near term, it is fine to keep one role that performs:
- mechanical validation
- semantic criticism
- challenge notices
- policy checks

Later, the role may split into:
- Linter
- Critic
- Reviewer
- Safety gate

## Core responsibilities

A validator/critic should be able to detect:
- implementation does not satisfy current spec
- work exceeded approved scope
- active assumptions appear false or contradictory
- accepted intent and current artifact diverge
- a human request appears to target the wrong problem
- a decision summary hides meaningful dissent

## Output shape

Good outputs are likely:
- pass/fail checks
- issue list
- severity
- confidence
- suggested next step
- challenge notice, when appropriate

## Intent challenge

The validator/critic is a good home for structured intent challenge.

A challenge should usually contain:
- what appears wrong
- why it matters
- one or more better nearby options
- whether work can safely continue anyway

## Human experience

For non-programmers, `Validator` or `Critic` is easier to grasp than `Linter`.

For programmers, `Linter` still makes sense for the narrow mechanical subset.

Do not force this naming decision yet, but preserve the conceptual distinction.

## Working rule

Criticism should reduce error and wasted work, not create bureaucratic paralysis.
