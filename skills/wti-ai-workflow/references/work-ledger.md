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

## Resource receipts

Record a receipt at launch for any process, listener, container, service,
temporary browser tab, or other allocation whose cleanup needs an owner.
Use the existing private task ledger. If the full receipt lives in the existing
owner-private durable run directory, put its locator in that ledger. Use
durable storage outside `/tmp`. Keep credentials, environment dumps and
secret-bearing command arguments or URL parameters out of the receipt.

| Field | Record |
| --- | --- |
| Work and ownership | Work item, purpose, actual host, owning agent/thread, and cleanup successor when assigned. |
| Resource identity | PID plus observed start identity such as boot ID and process start time or ticks. Include container ID and name, systemd unit and invocation when available, or stable browser/tab ID on its actual surface. Identify other allocations by their native locator. |
| Endpoints and dependencies | Actual bind addresses, ports or socket paths, dependencies and sanitized user-facing URL. |
| Launch evidence | Exact launch command with secrets omitted, cwd, pinned source or build ID, and log/evidence paths. |
| Lifetime and cleanup | Intended lifetime, exact graceful stop procedure, bounded wait and any authorized escalation, plus rollback steps. |
| Last verification | Timestamp, observer, evidence locator and observed state such as starting, running, stopped or unknown. |

Have launch helpers write the receipt automatically where practical. Record the
initial state and update it when actual IDs or endpoints are known. At handoff,
record the accepted cleanup successor and current evidence. Until acceptance,
the current owner retains cleanup responsibility.

Before stopping anything, confirm authority and match the live resource to its
launch identity on the recorded host. A listening port or PID alone is
insufficient. Check for an active human or unknown clients. When client use is
uncertain, preserve the instance and route the decision to its owner. For a
replacement, verify its expected behavior and endpoints before retiring the
superseded owned instance. Use its recorded graceful stop, wait the bounded
interval, and recheck identity and authority before any escalation. Verify the
targeted instance stopped and its expected ports, sockets or other resources
were released. If an endpoint is occupied by a different owner, report that
separately. Preserve the receipt and append the stop evidence.

After reboot or a lost session, use the receipt as launch history. Recheck the
host and boot, resource identity, bind state and client evidence through
supported observations. Preserve prior receipts and record current observations
and any uncertainty separately before choosing an authorized cleanup action.
