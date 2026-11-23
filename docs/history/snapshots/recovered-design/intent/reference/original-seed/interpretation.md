# Interpretation Layer

## Purpose

The Interpretation layer converts raw human intent into a bounded, machine-usable task definition. It is the bridge between a messy human request and a safe execution process.

Without this layer, the system still interprets intent; it simply does so invisibly and unreliably.

---

## Why Interpretation Must Exist

Human requests are often:
- incomplete,
- inconsistent,
- underspecified,
- broader than they first appear,
- contaminated by unspoken assumptions.

Execution requires sharper boundaries:
- what is in scope,
- what is out of scope,
- what assumptions are being made,
- what success means,
- what constraints apply,
- whether ambiguity remains unresolved.

The Interpretation artifact makes these boundaries explicit.

---

## Responsibilities

The Interpretation layer should produce a structured artifact that includes:

- task goal
- motivating intent reference
- in-scope artifacts or domains
- out-of-scope artifacts or domains
- applicable constraints from L0 and L1 context
- assumptions
- unresolved ambiguities
- acceptance criteria
- human approval requirements
- risk notes

It should be concise enough to guide execution and precise enough to challenge.

---

## Key Rule

**No major execution should begin without an interpretation artifact.**

Small tasks may use a compact interpretation, but they should not bypass interpretation entirely.

---

## Example shape

```yaml
interpretation_id: INT-2026-001
task_goal: Add a snooze button to CalendarView
intent_refs:
  - proposals/snooze-button.prop.xapi
scope:
  in:
    - src/ui/CalendarView.java
    - src/test/CalendarViewSpec.groovy
  out:
    - reminder back-end redesign
    - notification scheduling service
constraints:
  - UI mutations must respect non-blocking UI-thread policy
  - snooze duration is fixed at 15 minutes
assumptions:
  - existing reminder model already supports delay updates
ambiguities:
  - whether label text is product-approved
acceptance_criteria:
  - snooze button appears in CalendarView
  - action applies exactly 15-minute snooze
  - tests cover main behavior
approval_required:
  - no
risks:
  - possible UI copy mismatch
```

---

## Interpretation versus Planning

Interpretation is not the same thing as an execution plan.

Interpretation answers:
- what this task is,
- what boundaries it has,
- what assumptions apply.

Planning answers:
- how the worker intends to complete it.

A task-agent may produce a local plan after hydration, but it should inherit interpretation rather than silently reinvent it.

---

## Revision rules

Interpretation may need revision when:
- the human changes intent,
- the knowledge layer reveals a conflicting constraint,
- the task decomposes into subtasks,
- hidden coupling expands true scope,
- a linter discovers acceptance mismatch.

When this happens:
- the old interpretation must not disappear,
- the revision should be recorded,
- dependent workers may need invalidation or rehydration.

---

## Failure modes to defend against

### Hidden scope creep
A worker starts changing adjacent systems because the task "obviously implies" more than the human requested.

### Missing acceptance logic
A task is completed according to the worker's taste rather than the user's actual outcome criteria.

### Assumption burial
A risky assumption exists but is never surfaced early enough for review.

### Interpretation drift
Different workers carry slightly different versions of what the task really is.

---

## Desired UX in Theia

The interpretation should be visible as a first-class artifact in the task pane. A human should be able to:

- read it quickly,
- approve or challenge it,
- compare revisions,
- see which workers are operating under which version.

---

## Minimal implementation advice

Start with a compact but explicit interpretation schema. Do not try to model every nuance up front. The real test is whether it helps real tasks avoid silent misunderstanding.
