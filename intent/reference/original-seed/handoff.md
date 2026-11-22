# Handoff and Warm Boot

## Purpose

Handoff exists to preserve progress when a worker's context is degrading, when a task is long-running, or when source truth changes enough that a fresh successor is safer than continued execution.

Warm boot is a verified continuation process, not a sentimental conversation between old and new agents.

---

## Why handoff exists

Long-running workers accumulate:
- hidden assumptions,
- context-window pressure,
- stale file snapshots,
- repeated summaries,
- unstructured tool history.

At some point, continuing with the same worker becomes less safe than hydrating a fresh worker from authoritative context plus a checkpoint bundle.

---

## Predecessor responsibilities

Before handoff, the predecessor should emit a checkpoint package containing:

- task identifier
- active interpretation reference
- files touched
- current branch or workspace state
- major decisions taken
- assumptions currently relied upon
- unresolved questions
- known risks
- recommended next action
- confidence estimate
- candidate discard notes
- candidate reusable notes

This package should be structured, not a prose dump.

---

## Successor responsibilities

The successor should:
1. cold-load authoritative context,
2. load predecessor checkpoint,
3. compute a delta since predecessor checkpoint,
4. identify likely stale assumptions,
5. verify key claims before continuing,
6. ask only targeted clarification questions if needed.

The successor's first job is not "continue writing." It is "re-establish a trustworthy working set."

---

## Transfer memo

A compact transfer memo may be useful as a human-readable summary of:
- mission
- current state
- unfinished work
- top risks
- most likely failure next
- recommended next action

This memo is helpful, but it should not replace the structured checkpoint.

---

## Verification interview

A bounded verification cycle may help the successor confirm continuity.

Possible prompts:
- restate the task in one paragraph
- list critical facts you are relying on
- list unresolved work
- list which assumptions may be stale
- state the safest next action

The point is verification, not long free-form exchange.

---

## Handoff triggers

Possible triggers:
- token pressure beyond threshold
- large uncheckpointed tool history
- repeated context rereads
- human or source invalidation mid-task
- rising contradiction count
- lengthy active duration
- widening uncertainty

These triggers should be observable and tunable.

---

## Failure modes

### Handoff theater
The predecessor dumps vague narrative and the successor pretends continuity exists.

### Blind inheritance
The successor trusts predecessor assumptions that are now stale.

### Over-frequent handoff
The system pays more cost in rehydration than it saves in clarity.

### Missing artifact alignment
The successor continues from an outdated workspace snapshot.

---

## Good handoff properties

A good handoff should leave the successor able to answer:
- what exactly is the task,
- what sources of truth are current,
- what has already been done,
- what is risky,
- what should happen next,
- what should probably be discarded.

If those answers are not clear, the handoff is incomplete.

---

## Theia implications

Theia should show:
- that a handoff happened,
- why it happened,
- what changed between predecessor and successor,
- whether any assumptions were invalidated,
- whether the successor agrees with predecessor interpretation.

That makes warm boot legible to the human operator.
