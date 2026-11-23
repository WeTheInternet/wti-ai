---
status: DRAFT
teams: []
roles: []
authors: []
lastUpdated: 2026-11-23T00:26:41Z
lifecycle: TRIAGE
maturity: NONE
verification:
  - "(manual) Conductor docs describe agent orchestration as a deliberate multi-agent symphony"
---

# Goal: Conductor as “LISA Loops” (not “Ralph loops”)

## Goal

Ensure the future Conductor integration behaves like a deliberate, structured orchestration system ("LISA Loops"), rather than accidental, repetitive, low-signal loops ("Ralph loops"). This should be reflected in the wti-ai repository root README (which should be a feature list / sales pitch for how great this tool is).

## Intent

- Conductor defines intent, requirements, specs and direction and establishes feature leads.
- Feature leads own implementation decisions and delivery, directly or through specialists.
- The integration/harness carries explicit state and transitions, enforces configured permission boundaries and preserves durable artifacts (plans, ops blocks, decisions). Agent judgment and program-owned mechanics remain distinct.

## Earlier v0 non-goals

- Implementing Conductor in v0.

## Acceptance criteria

- Conductor integration docs describe:
  - the orchestration loop as explicit state machine(s)
  - how to prevent repeated low-signal iterations
  - how to surface decisions and next actions

## Rollback

- Remove the goal doc.

## Current direction supplied by The Human

Receive intent → discuss → create spec → deliver spec to workers → create and execute implementation → verify → report. Conductor refines intent, requirements and specs with The Human and sets direction. A feature lead owns implementation and delivery, directly or with specialists; requested spec changes return to Conductor. The lead selects durable knowledge and can direct Historian to record it.

- [Delivery workflow](../specs/agent-workflow.md) records autonomy/manual scope and verification.
- [Operator supervision](../specs/operator-supervision.md) makes owner, next action, evidence and actual blockers observable.
- [Reconciliation plan](../plans/docs-reconciliation.md) defines the bounded documentation work.

Locate, Investigate, Solve and Assess remain useful activities inside that flow. The earlier v0 non-goal above describes that earlier goal iteration; it is not a permanent prohibition on future Conductor implementation. This DRAFT adds direction and acceptance intent, not implementation permission.
