---
status: DRAFT
teams: []
roles:
  - theia-dev
authors: []
lastUpdated: 2026-02-16T00:00:00Z
lifecycle: TRIAGE
maturity: NONE
verification:
  - "(manual) Theia build includes the Infra agent as a standalone extension package"
  - "(manual) @Infra remains registered and functional after extracting into its own package"
---

# Goal: Fix packaging for Theia `@Infra`

## Goal

Package the Theia `@Infra` agent like a normal Theia extension package, rather than wiring it directly into an existing package.

## Why

- Reduces coupling to `@theia/ai-ide`.
- Makes the feature easier to maintain, version, and upstream.
- Establishes a repeatable pattern for future WTI agents.

## Scope

- Create a dedicated package (e.g. `repos/theia/packages/ai-infra-agent/` or equivalent naming aligned with Theia conventions).
- Move `InfraAgent` implementation and DI bindings into that package.
- Register the package in the Theia workspace so it is built and loaded.

## Non-goals

- No conductor integration.
- No new UI widgets.

## Acceptance criteria

- `@Infra` appears in the chat agent selector.
- `@Infra` modes are visible.
- `@Infra` can generate and refine delegation blocks.

## Rollback

- Revert the new package and restore the previous wiring.
