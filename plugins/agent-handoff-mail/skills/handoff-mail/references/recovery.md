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

There was no pre-ACK claim transition in handoff-mail. `accept-execution` is additive
in toolkit 0.1.4; all readers of an exchange must support it before it is used there.
Older readers reject the new kind. Existing event meanings/bytes are unchanged.
Legacy results need no retrofit; absent execution acceptance remains unverified.
The helper rejects first-time execution acceptance after a terminal result, while
allowing identical retries of an already saved acceptance. Trial contracts can
require this new receipt; `finish` continues to read/support the original workflow.

## Reconcile before retrying

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

## Execution lifetime and user control

The `.lock` excludes concurrent **outbox publication only**. It ends before any task
execution; it is not a lease, claim, fence or lifetime lock around a child process.
Use the existing single active session/writer for mutable work. An active-writer
denial, offline interval or timeout never authorizes takeover. Do not add a competing
executor. If a future launcher is justified, it must prove exclusion over the actual
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
