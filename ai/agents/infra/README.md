# Infra agent — earlier implementation

The active implementation is in [`ide/agents/infra`](../../../ide/agents/infra); use the [IDE workflow](../../../docs/theia/WTI_IDE_WORKFLOW.md).

This directory retains the earlier deterministic, mode-specific copy/paste work-order generator. It is not an identical copy of the active agent, which uses model responses and interactive questions. The checked-in `ide/` workspace and lockfile select the active package, not this directory.

Both layouts and the original move notice entered Git in commit `4c83ea53c4306e92d32ef8216be0e44174770750`. Commit `69bcb4578baed4782e88a29b25f969ea9f3e5a1f` replaced the active agent implementation and removed the old build/watch/deploy helpers.

Keep [the extension-point research report](theia-dev-report.md) discoverable as provenance. Its external checkout revision was not recorded; it does not establish compatibility with the current Theia pin.

Removal of this old package is pending a reference check of workstation-only tooling and the unmerged upgrade worktree. No runtime validation or package removal is implied by this note.
