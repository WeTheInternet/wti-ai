---
status: DRAFT
teams: []
roles: []
authors: []
lastUpdated: 2026-02-16T00:00:00Z
lifecycle: TRIAGE
maturity: NONE
verification:
  - "(manual) Conductor docs describe agent orchestration as a deliberate multi-agent symphony"
---

# Goal: Conductor as “Lisa Loops” (not “Ralph loops”)

## Goal

Ensure the future Conductor integration behaves like a deliberate, structured orchestration system ("Lisa Loops"), rather than accidental, repetitive, low-signal loops ("Ralph loops"). This should be reflected in the wti-ai repository root README (which should be a feature list / sales pitch for how great this tool is).

## Intent

- Conductor should:
  - orchestrate multiple agents with clear roles
  - manage explicit state and transitions
  - enforce approval gates
  - preserve durable artifacts (plans, ops blocks, decisions)

## Non-goals

- Implementing Conductor in v0.

## Acceptance criteria

- Conductor integration docs describe:
  - the orchestration loop as explicit state machine(s)
  - how to prevent repeated low-signal iterations
  - how to surface decisions and next actions

## Rollback

- Remove the goal doc.
