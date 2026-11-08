# Recovery and evidence vocabulary

This helper stores records; it does not execute work or control session lifetimes.
One user machine is enough for the current task. When it is offline, coding may
pause; the user may separately continue planning. No failover or hardware wake is
required. Reuse the existing primary work/issue identity through every retry.

## Distinct facts, not one completion flag

| Fact | Record/evidence |
| --- | --- |
| Persisted | Complete validated record in the named storage surface. Local `storage: persisted` means the file is currently readable/valid; successful new publication requests file and directory fsync. Reading it does not prove power-loss survival or a remote store's durability semantics. |
| Sent | A transfer attempt, with attempt ID and route. An uncertain attempt stays uncertain. |
| Provider admission | Actual next-hop receipt. `delivery` outcome `queued` can report it, citing provider object/operation ID. It does not imply a turn started. |
| Received | Recipient-side component fetched and validated the exact record. A relay's fetch is receipt at that hop, not the intended agent's ACK. |
| Activated | Native evidence an existing recipient turn actually started. Record turn/session identity and source evidence separately from admission. |
| ACKed | Addressed recipient's `ack` of the exact sender/message/hash/revision. It means read, not agreement to execute. |
| Execution accepted | Recipient's `execution_acceptance` via `accept-execution`, after ACK and current-scope reconciliation. It means agreement to perform that bounded work, not a new authorization or execution lock. |
| Result | Recipient's durable terminal outcome with evidence, artifacts/tests and limits. `completed` means this task finished; `blocked`, `declined`, `superseded`, `cancelled` retain their own meanings. A shell exit is not a task result. |
| Independently reviewed | Another reviewer evaluated exact artifacts and requirements revision. For code include repository/PR/base/head and findings. |
| Completion-owner accepted | Existing `accept` / `acceptance_state` remains the named owner's assessment after a completed result. It does not mean recipient execution acceptance, independent review or merge authorization. |

Record admission, received and activation observations as separate `delivery`
events with stable stage-specific attempt IDs (for example `hop1-send1-admission`
and `hop1-send1-activation`). Each body names stage, actual observer, native IDs,
timestamp and evidence. `delivered` must say whether the observed boundary was a
component or an actual turn. The helper stores these reports; it does not verify
provider evidence or synthesize activation. A later observation gets a new report
ID; never overwrite an earlier uncertain report. Unknown evidence stays unknown.
Manual user forwarding is a real manual route, not a provider queue receipt.

There is no pre-ACK claim transition in wti-ai-msg. `accept-execution` is a separate
recipient agreement. All readers must support the current `wti-ai-msg/0.1` protocol.
Old `handoff-mail/0.1` exchanges stay with their retained helper and original bytes.
Legacy results need no retrofit; absent execution acceptance remains unverified.
The helper rejects first-time execution acceptance after a terminal result, while
allowing identical retries of an already saved acceptance. Trial contracts can
require this new receipt; `finish` continues to read/support the original workflow.

## Reconcile before retrying

Use `mailbox.py --root EXCHANGE --actor YOUR_ID reconcile` for a focused, read-only
view of pending and terminal work where you are sender, recipient, completion owner
or a recorded observer. It returns the original evidence and `next_actions`; it
does not execute them, consume a record, subscribe to changes or establish native
truth. Scan the explicitly enrolled exchanges, not every folder on the machine.
For legacy helpers without this command, combine `inbox --all`, sender `scan` and
the exact original sender/message `status`. Don't poll only one summary field.

At each check, reconcile latest user instructions and revisions first. Inspect all
new delivery observations and the source of any native receipt before choosing
the smallest next action. Follow admitted work through result retrieval and the
bounded return obligation; if waiting requires another turn, state who must act
and what wake/check route exists. Unknown is not pending, offline or failed. A
healthy process or `notLoaded` from one reader proves neither idle nor dead.

Keep work/request identity, requirements revision, logical message UUID, submission
attempt, native turn/session incarnation and optional diagnostic correlation distinct.
The message key is sender + UUID. Retry exact bytes under that key; an intentional
new request needs a new UUID even if its body is identical. Revisions and causal
references govern scope; global wall-clock ordering is not authority.

At startup/resume, after a notification, and at bounded safe checkpoints during
authorized coordination, run the same idempotent inbox/status scan. No background
poller is installed. When the machine or Triage is down, preserve work and pause.

1. Read the exact message/status and latest direct user instructions. Reconcile
   revisions before any effect. A duplicate message is not another assignment.
2. If admission/activation is uncertain, inspect the target's message/turn evidence
   for the same ID/hash. Do not resubmit a substantive task merely because of a
   timeout or successful queue command. If unresolved, retain uncertainty.
3. If a result is already saved, retrieve it with `status --sender ... --message-id
   ...` or `inbox --all`. Resend its evidence/notification; do not repeat the work.
   Normal `inbox` omits completed results, so an empty inbox is not lost-result proof.
4. If an external effect may have happened before a result, reconcile its artifact
   or target idempotency record before acting again. A mail record and an external
   effect are not one transaction. No exactly-once shell/GitHub/model-run guarantee.
5. Persist the result before advertising completion. Retain IDs/results through
   the agreed replay horizon. This prototype deletes nothing and defines no expiry;
   at its 1 MiB limit, stop and arrange owner-approved archival preserving dedup and
   lookup. Do not delete peer outboxes or records to silence notifications.

Malformed/truncated files fail closed and remain in place for diagnosis; the error
names the failing record/path where available. A bad file currently blocks an
exchange scan. The owner resolves it or approves quarantine after retaining bytes
and error; peers must not move/delete it silently. Disk-full/fsync errors remain
explicit; after a post-rename failure, visibility may exist while durability is
uncertain. A missed notification is repaired by scanning, not by assuming work lost.

## Saved-result return after a blocked notification

Recover the original completed result by sender/UUID/revision and result ID/hash.
Returning its bytes or destination is a separate obligation from doing the work.
An active-writer rejection on the return route neither loses that result nor
authorizes repeating it, resuming elsewhere, interrupting or replacing the owner.

Only after materially new relevant route evidence and current-scope reconciliation
may a known-not-executed notification use an authorized alternate route. Verify the
installed `codex queue --thread UUID --message NOTIFICATION` route **without
`--resume`**, the exact existing local recipient and shared access. Preserve the
original logical request/result identity in the notice; do not enqueue the original
substantive task again. The notification asks the original sender to read the saved
result. The foreground adapter handles only sender-owned fresh request notifications;
it intentionally will not redispatch a completed request or act as its recipient.
A bounded, separately verified native return call needs the actual caller's own
intent/accounting records; never impersonate the original sender to use the adapter.

Persist intent before the call. After an environment disconnect, missing accounting
is not proof that the call never ran. Recover exact provider stdout/stderr/queue ID
and target-turn evidence before another submission. If the call was admitted, write
late accounting in YOUR outbox against the original identity and attempt, citing
the actual event time separately from recording time. Do not resubmit to repair
accounting. If the outcome cannot be recovered, hold it as uncertain. Resume
warnings can coexist with admission in older routes; capture both streams.

Read the original sender's native acknowledgment of the saved result if available:
retain its actual author, source/turn/item locator, exact text/hash, original
request/revision and result ID/hash. That return ACK is not the helper's request
ACK: the original sender is not the addressed executor of its own request. The
observer may write a delivery observation, never a peer ACK or result. Admission,
activation and consumption are separate observations. A bounded destination return
can be closed without claiming the research, implementation, review or merge done.

## Native acceptance and helper projections

`acceptance_state` describes only owner-authored helper events. A native completion
owner may already have accepted in its own conversation/Page while that field is
`unverified`. Review every relevant delivery observation and verify accessible
native source evidence before saying acceptance is pending. Report both facts:
native acceptance (directly read or explicitly attributed relay) and the helper
projection. If the original source cannot be read, name the relay, locator and
hash verification actually performed; do not claim independent native retrieval.
Do not convert arbitrary JSON, a quote saying "accepted", broker success or an
agent comment into user authorization or owner acceptance. Check the named owner,
exact request/revision/hash, completed result and bounded criteria. The read-only
reconciliation command deliberately exposes reports for review rather than treating
their prose as authenticated state. Preserve superseded scopes and their evidence.

## Execution lifetime and user control

The `.lock` excludes concurrent **outbox publication only**. It ends before any task
execution; it is not a lease, claim, fence or lifetime lock around a child process.
Use the existing single active session/writer for mutable work. An active-writer
denial, offline interval or timeout never authorizes takeover. Do not add a competing
executor. Discovery failure means unknown, not dead. Keep stable logical roles,
work IDs, runtime session IDs and execution/dispatch attempts distinct. Cancellation
or retry must identify the original request/revision and exact native turn; never
interrupt whichever turn happens to be active. This helper has no cancellation API.
If a future launcher is justified, it must prove exclusion over the actual
surviving execution, including child/runtime ownership, before being adopted.

Separate sender/recipient files do not atomically serialize user amendments against
execution. Supersession is cooperative: a running tool can finish before its agent
sees a redirect. Stop subsequent affected work at supported safe points, record
already-in-flight effects honestly, and reconcile bookkeeping afterward. Do not
wait for an issue edit before obeying the current user. Never relabel an old result
as having executed a newer requirements revision.

## Borrowed mechanisms, not new infrastructure

Result lookup rather than re-execution follows
[Request-Response with Retry](https://www.enterpriseintegrationpatterns.com/patterns/conversation/RequestResponseRetry.html).
The [transactional outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)
explains why GitHub updates and this mailbox cannot be treated as one atomic write:
preserve the canonical record and retry the missing projection by stable identity.
The [fsync documentation](https://man7.org/linux/man-pages/man2/fsync.2.html) separates
file flushing from directory-entry flushing; tests here are not power-loss tests.

Native session adapters may later supply admission/activation evidence. They must
preserve this protocol and match the actual runtime, not infer a cloud route from
a local socket implementation. No broker, SQLite migration, service, watcher, lease
or new credential is introduced by these rules.
