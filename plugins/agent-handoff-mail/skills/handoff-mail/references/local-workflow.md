# Foreground local workflow

Use this only for an existing, authorized `codex/local/<UUID>` recipient whose
access to this exact exchange and helper has been verified. It does not create a
session, guess a remote endpoint, install a service or poll with a model. Canonical
roles/assignments stay in the existing hubs. The operator supplies the route; this
is not a new registry. Keep each logical message in ONE declared exchange.

`dispatch.py` is an optional adapter around the unchanged v0.1.4 `mailbox.py`.
It writes only its own sender's `delivery` records, and never writes peer ACKs,
results or completion acceptance. A relay acting for another sender uses its own
delivery record through `mailbox.py`; the dispatcher deliberately supports only
the sender's own messages. Never clear `CODEX_THREAD_ID` to impersonate a sender.

## Read, select, dispatch once

1. At sender startup/resume or a requested handoff, scan only the named exchange.
   At recipient startup/resume and safe boundaries, use `mailbox.py inbox`.
2. Reconcile the current user instruction and request revision. For an eligible
   message, confirm the intended existing session, installed CLI path, target cwd,
   current idle state and shared-file access. Read-only native session tools or
   System's supported host-aware reader can supply that observation. Do not
   substitute a stale agent directory entry for current availability. Unknown,
   offline, busy or active-writer targets stay deferred. Do not take over drivers.
3. Pass the exact sender, UUID and hash from scan to `once`. This submits ONE
   `codex queue --thread <UUID> --message <notification> --resume` using argv,
   the existing session's model and no `--remote`, config changes or credentials.
   This can consume quota by starting a turn. It requires authorization for the
   particular existing recipient; a skill does not grant that authority.
4. Scan again when the recipient responds or at a later authorized reconciliation.
   Read its actual outbox; completed work remains recoverable even after lost
   notifications. Observe native activation independently if a supported reader is
   available. File receipts demonstrate recipient processing but do not invent a
   native provider/turn receipt. The completion owner reviews and explicitly
   `accept`s; the dispatcher never does that automatically.

Commands below are templates; use actual absolute paths and discovered identities.
No daemon, timer, hook, skill install or permissions grant is required to load the
skill by path. No automatic scanning happens while nobody invokes the helper.

```bash
python3 /ABS/skills/handoff-mail/scripts/dispatch.py --root EXCHANGE --actor SENDER scan
python3 /ABS/skills/handoff-mail/scripts/dispatch.py --root EXCHANGE --actor SENDER once --message-id UUID --message-sha256 SHA256 --preflight-file /ABS/preflight.json --codex /ABS/installed-codex --cwd /ABS/existing-target-cwd --scope-current
python3 /ABS/skills/handoff-mail/scripts/mailbox.py --root EXCHANGE --actor RECIPIENT inbox
python3 /ABS/skills/handoff-mail/scripts/mailbox.py --root EXCHANGE --actor OWNER status --sender SENDER --message-id UUID
python3 /ABS/skills/handoff-mail/scripts/mailbox.py --root EXCHANGE --actor OWNER accept --sender SENDER --message-id UUID --text 'Verified exact result against the named criteria; evidence ...'
```

Preflight JSON lives outside the exchange (which contains only actor `*.md`
outboxes). It is an operator-authored observation, not authentication. Required
fields, with a real timezone timestamp no older than five minutes:

```json
{
  "recipient": "codex/local/RECIPIENT-UUID",
  "state": "idle",
  "observed_at": "2026-11-08T16:00:00+00:00",
  "source": "supported thread reader actually used",
  "reference": "saved exact reader evidence; current route and scope checked",
  "shared_exchange": "/var/tmp/gpt/exchanges/EXCHANGE"
}
```

`--scope-current` attests that the caller reconciled scope. The code cannot see
conversations or enforce latest-user-instruction priority. A stale-read race can
still happen after preflight; recipient rechecks remain mandatory. The adapter
holds its dispatch lock across the queue subprocess, not the recipient's eventual
model/tools. It is not an execution lease or a guarantee of exactly-once effects.

## Recovery and evidence

Before queueing, the adapter fsyncs an `intent` delivery record in the existing
sender outbox. It holds a separate sender-owned `.dispatch.lock` until queue returns
or the 20-second client timeout expires. A crash even before actual submission
leaves uncertainty: availability is sacrificed rather than risking duplicate work.
Concurrent invocations fail or observe the retained intent. A saved provider reply
has a separate event. Disk-full before intent prevents queue; after queue, intent
still prevents a blind retry. Do not delete intent/lock/history to force another send.

An explicit `Queued message ... for thread ...` reply records admission. Exit zero,
empty stderr, or `--resume` alone proves neither activation nor ACK. Resume can fail
while queue succeeds. An active-writer error or unknown reply preserves raw evidence
and requires reconciliation; absence of a receipt is NOT proof of non-admission.
The command sends no cancellation or interruption to the target.

`scan` exposes persistence, provider admission, activation observations, recipient
ACK, execution agreement, result and owner acceptance separately. Its `next_action`:

| Value | Meaning |
| --- | --- |
| eligible_for_preflight | No recorded send/ACK/result; scope still needs human/agent reconciliation |
| deferred_busy / deferred_unknown | `once` preflight refused to submit; pending request unchanged |
| reconcile_scope | Higher request revision exists; don't execute the old scope |
| reconcile_delivery_no_resend | Some delivery/intent evidence exists; inspect target/provider first |
| await_result | Recipient ACK exists; no repeat execution notification |
| recover_saved_result | Read saved result and its actual outcome; complete only applicable owner checks |
| accepted | Owner acceptance already saved; no repeat work |

There is deliberately no timed retry or force flag. For uncertain or admitted
submissions, inspect the exact target/message ID, provider evidence and saved
results. If still unknown, keep held. If a future resend is explicitly authorized
after reconciliation, use one supported native call with the SAME logical ID and
notification, recording your own evidence; never assign a new UUID to escape the
guard. The basic adapter does not automate this exceptional recovery. A new scope
gets a new message/revision only under current authority.

To attach a native activation observation, use `observe-activation --message-id UUID
--evidence-file /ABS/activation.json` with the common `--root`/`--actor` arguments.
Required fields: `recipient`, `message_id`, `message_sha256`, `source`, `turn_id`,
`observed_at` (timezone required), `detail`. Bind the exact notification to the
observed native turn; a later unrelated turn is insufficient. The helper validates
binding and records the observer's assertion, not the external truth. It cannot
manufacture a recipient ACK or convert native replies into peer-authored files.
Keep native-only replies as attributed external evidence when no peer outbox exists.

## Smallest writable scope

In addition to [mailbox write scope](write-scope.md), `once` needs create/read/write/
flock on `SENDER_FILENAME.dispatch.lock` in the same exchange. It keeps this stable
lock inode; never replace or unlink an in-use lock. The mailbox still needs its
own `.lock`, random `.mail-*` files, replace of its OWN outbox and directory fsync.
`scan` only reads. `observe-activation` uses the mailbox's normal write footprint.
Prefer approval of the exact command, not a broad peer-writable directory grant.
No chmod, ACL change, socket access or permission expansion is performed by it.
Same-UID ownership is cooperative. See [environment](environment.md).

The supported queue behavior is documented in
[Codex developer commands](https://learn.chatgpt.com/docs/developer-commands#codex-queue).
Actual local compatibility must be established separately for the selected install
and recipient; older source experiments and labels are not universal route evidence.
