# Foreground local workflow

Use this only for an existing, authorized `codex/local/<UUID>` recipient whose
access to this exact exchange and helper has been verified. It does not create a
session, guess a remote endpoint, install a service or poll with a model. Canonical
roles/assignments stay in the existing hubs. The operator supplies the route; this
is not a new registry. Keep each logical message in ONE declared exchange.

`dispatch.py` is an optional adapter around `mailbox.py`; both use `wti-ai-msg/0.1`.
A scan gives state-derived next actions without consuming any records. Each command
reads a fresh exchange snapshot; dispatch rechecks immediately before recording
intent. This is cooperative reconciliation, not an atomic scope/execution fence.
It writes only its own sender's `delivery` records, and never writes peer ACKs,
results or completion acceptance. A relay acting for another sender uses its own
delivery record through `mailbox.py`; the dispatcher deliberately supports only
the sender's own messages. Never clear `CODEX_THREAD_ID` to impersonate a sender.

## Read, select, dispatch once

1. At sender startup/resume or a requested handoff, scan only the named exchange.
   Use `mailbox.py reconcile` for incoming/outgoing/owned/observed work, including
   terminal returns; `inbox` alone hides completed messages. See [recovery](recovery.md).
2. Reconcile the current user instruction and request revision. For an eligible
   message, confirm the intended existing session, installed CLI path, target cwd,
   current observed state, shared-file access and separately verified queue-without-resume
   compatibility. Read-only native session tools or
   an authorized coordinator's supported host-aware reader can supply that observation. Do not
   substitute a stale directory entry or `notLoaded` for idle/offline evidence.
   Unknown stays deferred. A known busy existing owner may receive queued input
   through the verified non-resuming route; do not take over or interrupt it.
3. Pass the exact sender, UUID and hash from scan to `once`. This submits ONE
   `codex queue --thread <UUID> --message <notification>` using argv, WITHOUT `--resume`,
   the existing session's model and no `--remote`, config changes or credentials.
   This can consume quota by starting a turn. It requires authorization for the
   particular existing recipient; a skill does not grant that authority.
4. Scan again when the recipient responds or at a later authorized reconciliation.
   Read its actual outbox; completed work remains recoverable even after lost
   notifications. Observe native activation independently if a supported reader is
   available. Inspect native return/owner evidence as well as helper fields.
   File receipts demonstrate recipient processing but do not invent a
   native provider/turn receipt. The completion owner reviews and explicitly
   `accept`s; the dispatcher never does that automatically.

Commands below are templates; use actual absolute paths and discovered identities.
No daemon, timer, hook, skill install or permissions grant is required to load the
skill by path. No automatic scanning happens while nobody invokes the helper.
Both commands also accept `WTI_AI_MSG_DIR` as the existing exchange directory when
`--root` is omitted. An explicit `--root` overrides it; neither form creates the
directory, proves shared access or grants permissions.

```bash
python3 /ABS/skills/wti-ai-msg/scripts/dispatch.py --root EXCHANGE --actor SENDER scan
python3 /ABS/skills/wti-ai-msg/scripts/dispatch.py --root EXCHANGE --actor SENDER once --message-id UUID --message-sha256 SHA256 --preflight-file /ABS/preflight.json --codex /ABS/installed-codex --cwd /ABS/existing-target-cwd --scope-current
python3 /ABS/skills/wti-ai-msg/scripts/mailbox.py --root EXCHANGE --actor RECIPIENT reconcile
python3 /ABS/skills/wti-ai-msg/scripts/mailbox.py --root EXCHANGE --actor OWNER status --sender SENDER --message-id UUID
python3 /ABS/skills/wti-ai-msg/scripts/mailbox.py --root EXCHANGE --actor OWNER accept --sender SENDER --message-id UUID --text 'Verified exact result against the named criteria; evidence ...'
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
  "shared_exchange": "/var/tmp/gpt/exchanges/EXCHANGE",
  "queue_without_resume_evidence": "exact installed-version/route compatibility evidence, independently checked"
}
```

`--scope-current` attests that the caller reconciled scope. The code cannot see
conversations, validate the operator's route assertion or enforce latest-user-instruction
priority. A v0.2.0 preflight lacking `queue_without_resume_evidence` must be refreshed;
do not copy a claim from this example. A stale-read race can
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

If saving a provider reply fails, the command exits nonzero and includes
`recovery_evidence` in its JSON stderr: exact actor/message/hash, request revision,
recipient, original attempt ID, outcome and delivery body with lossless provider
streams. Preserve that output privately. `storage: unverified` means accounting
may be absent or may have been replaced before a later fsync failed. Read the
existing outbox first. Once storage is available, the original sender may append
only the missing delivery record using that same attempt ID/body; an identical
retry is idempotent. Do not rerun queue, create a new message or fabricate receipt.
The fallback itself is not durable unless the caller retains it; a process/host
failure can still leave only the original intent for reconciliation.

An explicit `Queued message ... for thread ...` reply records admission. Exit zero
or empty stderr proves neither activation nor ACK. Older `--resume` routes can fail
to resume while queue succeeds. v0.2.1 does not request resume. An active-writer error
or unknown reply preserves raw evidence (including timeout streams as base64)
and requires reconciliation; absence of a receipt is NOT proof of non-admission.
The command sends no cancellation or interruption to the target.

If receipt remains uncertain after reconciliation, tell the user plainly and offer
one short prompt for the intended existing recipient. Fill every placeholder with
the exact record and a recipient-accessible locator (not a sender-local path for
remote chat):

```text
At a safe boundary, check message UUID from SENDER, request REQUEST rev REVISION, at REACHABLE_LOCATOR. Confirm whether you read it or already saved a result; return that result if present. Do not restart work or resend it.
```

This asks for receipt clarification, not another assignment or automatic retry.
Keep the original ID/body and uncertainty until recipient evidence arrives. A
user-relayed prompt is a fallback, not proof of delivery or permission to interrupt.

`scan` exposes persistence, provider admission, activation observations, recipient
ACK, execution agreement, result and owner acceptance separately. Its `next_action`:

| Value | Meaning |
| --- | --- |
| eligible_for_preflight | No recorded send/ACK/result; scope still needs human/agent reconciliation |
| deferred_unknown | `once` preflight could not establish current state; request unchanged |
| reconcile_scope | Higher request revision exists; don't execute the old scope |
| reconcile_delivery_no_resend | Some delivery/intent evidence exists; inspect target/provider first |
| await_result | Recipient ACK exists; no repeat execution notification |
| recover_saved_result | Read saved result, delivery/native evidence and actual outcome; never redispatch work |
| accepted | Owner acceptance already saved; no repeat work |

There is deliberately no timed retry or force flag. For uncertain or admitted
submissions, inspect the exact target/message ID, provider evidence and saved
results. If still unknown, keep held. If a future resend is explicitly authorized
after reconciliation, use one supported native call with the SAME logical ID and
notification, recording your own evidence; never assign a new UUID to escape the
guard. The basic adapter does not automate this exceptional recovery. A new scope
gets a new message/revision only under current authority.
For an already-completed request's return notification and late own accounting,
follow [saved-result recovery](recovery.md#saved-result-return-after-a-blocked-notification).
Do not interpret `recover_saved_result` or helper `unverified` as proof that a native
completion-owner acceptance is absent.

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
