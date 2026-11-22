# Work ledgers and resumption

Use the existing issue, work record, or owner-private state directory as the
checkpoint. If the owner has chosen Git for durable agent state, use the approved
private state repository or an access-appropriate dedicated branch. A branch in
a public repository is public. Keep state records out of product changes unless
the owner explicitly asks to include them.

Keep a short continuation record:

- Objective, current owner and exact request or issue link.
- Source commit, worktree and snapshot hash when relevant.
- Decisions and short shareable rationale, with the author and applicable approval.
- Last verified action and a locator for its receipt. Distinguish pending,
  uncertain, interrupted and settled effects.
- Next authorized action, owner, blocker, and any explicit hold or stop condition.

Prefer pointers and hashes for owner-private logs and artifacts. Keep credentials,
private reasoning, raw transcripts, and unrelated personal data out of the ledger.
Assign one writer per ledger file or branch. Before switching writers, reconcile
the existing head and record the handoff. Preserve both histories on divergence
and coordinate with the owner. A checkpoint or commit grants no authority to send,
publish, push product changes, merge, or rerun work.

After restart, verify host, owner, current branch, latest user scope and exact
request identity. Read durable receipts and inspect the destination or saved
artifact for an uncertain action. Reuse exact completed evidence. When the final
status is missing, report what can be proved, preserve the uncertain attempt, and
continue only actions already authorized for the current state.
