---
status: DRAFT
teams: []
roles:
  - theia-dev
authors: []
lastUpdated: 2026-02-16T00:00:00Z
lifecycle: CONFIRMED
maturity: NONE
verification:
  - "(manual) @Infra is selectable as a ChatAgent and shows its modes"
  - "(manual) @Infra can generate an ops block and refine it via Next mode"
  - "(manual) ops block targets @Coder in implement mode"
---

# Theia `@Infra` agent v0 (modes + refine + delegation)

## Shipped in v0

- A chat agent named `Infra` (`@Infra`) registered in Theia.
- Explicit modes:
  - `design`
  - `implement`
  - `review`
  - `test`
- Produces a stable, human-readable `ops` block for delegating to a specialist agent.
- Provides a simple refine loop via a user choice:
  - Generate (same mode)
  - Next mode (refine)

## Modes → target agent mapping

- `design` → `@Architect`
- `implement` → `@Coder`
- `review` → `@Reviewer`
- `test` → `@AppTester`

## Ops block format (stable)

The agent emits a fenced block:

```text
\`\`\`ops
Title: ...
Mode: ...
TargetAgent: ...
Risk: ...
Preconditions:
- ...
Prompt:
...
ExpectedOutputs:
- ...
Rollback:
- ...
\`\`\`
```

## What is stubbed / limited

- No dedicated helper widget/view.
- No direct click-to-send integration; user copy/pastes the generated prompt into the chat input.
- No conductor integration.

## Future conductor integration hooks

- Treat the `ops` fenced block as the durable artifact to serialize.
- A future integration can:
  - parse the `ops` block into a machine-validated schema
  - store it as durable state (mode, step, approval)
  - provide a click-to-send / click-to-execute UI with explicit approvals

## Manual verification checklist

- Confirm `@Infra` appears in the chat agent list / can be invoked by mention.
- Switch between modes and confirm the target agent in the ops block changes accordingly.
- Use the refine loop and confirm preconditions/expected outputs/rollback become more explicit.
