---
status: DRAFT
owner: wti
reviewed-by: TBD
review-date: TBD
verification:
  - "(manual) Read this file before making changes"
changelog:
  - 2026-02-16: Initial draft
---

# WTI-AI Agent Entry

This repository uses a review/certification workflow.

## Start here
- docs/INDEX.md
- docs/README.md

## Trust rules
- Anything under `docs/5_certified/` is authoritative.
- Everything else is `DRAFT`/`UNREVIEWED` and must not be treated as truth.

## Approval gates
Do not run tasks, scripts, or destructive commands without explicit user approval.

Do not propose broad refactors unless the user asks.

## Current top priorities (near-term)
1. Establish documentation taxonomy + certification headers.
2. Define infra acceptance criteria.
3. Improve `ai/infra` safety and repeatability (helpers, smoke test).
4. Deploy hello-world behind Envoy Gateway with cert-manager DNS-01.

## Allowed without explicit approval
- Reading files.
- Proposing doc changes and small safe code edits as diffs.

## Requires explicit approval
- Running any workspace tasks/scripts.
- Making changes to production credentials, DNS, or cloud resources.
