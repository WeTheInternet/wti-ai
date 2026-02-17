---
status: DRAFT
teams: []
roles: []
authors: []
lastUpdated: 2026-02-16T00:00:00Z
lifecycle: TRIAGE
maturity: NONE
verification:
  - "(manual) Codegen guidance prevents accidental nested-fence breakage in generated prompts"
---

# Goal: Codegen note for nested fenced blocks

## Goal

Avoid broken prompt/code generation when a fenced block contains another fenced block.

## Problem

Many prompt formats use triple-backtick fences (e.g. ```ops). If a generated payload includes another triple-backtick sequence inside the outer fence, the outer fence can be terminated early.

## Preferred approaches

1. Avoid nested triple-backtick blocks inside fenced blocks.
2. If you must nest, escape the inner fence sequence so it is not interpreted as a fence.
3. Prefer tag-based fences when supported (example patterns seen in Theia samples: `<question>` ... `</question>`).

## Non-goals

- Defining a universal markup language for ops blocks.
- Introducing xAPI markup into Theia v0.

## Notes

- xAPI-style tags (e.g. `<ops ... />`) may be a future direction, but should not leak into the current Theia v0 prompt/block formats. It can be considered when we need structured data inputs / transport formats.

## Acceptance criteria

- Prompt generation guidance includes an explicit rule preventing unescaped nested triple-backtick fences.

## Rollback

- Remove the goal doc.
