# Recovery handoff

This branch preserves local repository work for reconciliation with the current direction. Treat it as a recovery source, not as a validated implementation.

## User direction

The user has independently upgraded Theia to a much newer version. The older Theia and IDE changes in this branch are less valuable and may be stale. Focus first on recovering and reconciling documentation and planning.

## Where to look first

- `intent/` — intent, architecture, roles, lifecycle, and planning notes, including `intent/reference/original-seed/`.
- `feedback.md` — review notes and identified concerns.
- `.prompts/task-contexts/Fix-ChatRequestModel-vs-MutableChatRequestModel.md`
- `.prompts/task-contexts/Theia-Orchestrator-Sidebar-Panel.md`
- `docs/0_triage/ideas/agent-ideas.md`
- `ai/review/` — review and skill drafts included in the snapshot.

These materials have mixed maturity. Follow repository trust rules: only `status: CERTIFIED` documents are authoritative; treat drafts, triage, and imported/reference materials as proposals or historical context.

## Snapshot contents and limits

The recovery commit preserves the two local commits that were ahead of `origin/main`, plus the captured worktree changes. It includes old Theia dependency/build changes and infra/code changes as historical context; do not assume they match the user's newer Theia upgrade or current direction.

`ai/review/jenkins-ci-failures/values.yaml` is intentionally excluded from the branch because it contains nonempty secret-like configuration fields. It remains only in the original local working tree. Do not re-add it without inspecting and sanitizing it.

No build or tests were run for this preservation snapshot. The initial whitespace check found trailing whitespace in `docs/0_triage/ideas/agent-ideas.md` and `ide/apps/wti-ide/gen-webpack.node.config.js`; those lines were preserved.

## Reconciliation task

Review the documentation and planning first. Identify which ideas still fit the user's current direction, which conflict with it, and what should be carried forward. Treat the older IDE/Theia changes as potentially obsolete; do not merge them blindly into the newer upgrade.
