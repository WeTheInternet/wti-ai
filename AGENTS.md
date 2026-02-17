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
- docs/features/doc-system-spec.md
- PURPOSE.md
- docs/PURPOSE.md

## Reading scope
- Prefer loading `PURPOSE.md` routers whose frontmatter `teams` and `roles` match the task, if you already understand wti-ai teams and roles; if you do not, assume your team and role are both 'agent'.
- Avoid loading large numbers of files; read the minimum set needed.

## Trust rules
- Authoritative truth is determined by frontmatter: only `status: CERTIFIED` is authoritative.
- Folder location does not determine authority (including `docs/5_certified/`).
- `docs/0_triage/` is non-authoritative by default.
- Generated indexes (e.g. `docs/status/`) are non-authoritative unless explicitly certified.

## Approval gates
Do not run tasks, scripts, or destructive commands without explicit user approval.

Do not propose broad refactors unless the user asks.

## Runtime assumptions (durable)
- The WTI Theia browser IDE is built and run from the `ide/` pnpm workspace.
- A `repos/theia` directory may exist in this repo for IDE performance (workspace excludes) and source lookup.
  - Keep the workspace ignores/excludes for `repos/theia` enabled to prevent IDE indexing/watching overload.
  - Do not reference `repos/theia` in product code, scripts, or non-workspace configuration.

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
