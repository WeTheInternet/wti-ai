# wti-ai-msg operations — package 0.2.0

Load `skills/wti-ai-msg/SKILL.md` by explicit path on each participating surface.
Use the existing session and its exact identity, not a new agent. For permanent
adoption, use the upstream supported skill/plugin installation surface and verify
discovery there. This package neither installs itself nor changes configuration.

An exchange has one actor-owned outbox per participant. Canonical team hubs and
role records remain the source of assignment/ownership truth. The mailbox is
transport evidence only. Use existing request IDs/revisions in message envelopes.

Sender: persist a UUID-bearing request; notify using a verified route; record its
actual receipt. Recipient: check inbox, ACK the exact message, follow the latest
user instruction, finish with evidence. System can bridge a message through its
existing host-aware connector or private shared resources. The relay preserves
identity/hash and cannot ACK or finish for the recipient.

Completed work stays separate from accepted work. New messages can explicitly name
the existing completion owner, who alone can record acceptance after a completed
result and required checks. Neither receipt authorizes merge. See the skill's
authority proposal and pushed-review procedure for the proposed issue/PR/mail split
and exact-SHA review loop. The proposal does not migrate existing records.

Recipient `accept-execution` follows read-ACK and is distinct from completion-owner
`accept`. All readers in new exchanges must support `wti-ai-msg/0.1` (package 0.2.0).
Old `handoff-mail/0.1` records must be read with the retained old helper, without
rewriting evidence or retrofitting acceptance. Upgrade both endpoints before
starting new exchanges; a local installation does not update remote participants.
Read [recovery](skills/wti-ai-msg/references/recovery.md) for stage-specific
admission/activation evidence, saved-result lookup and execution-lifetime limits.
The helper's lock covers publication, not actual task execution. One computer may
pause while offline; no failover, background scanner or hardware wake is required.

At adoption, name each actor's owned outbox and read-only peer paths. Ownership is
a protocol rule, not an exact-file sandbox grant: publication also creates a lock
and random temporary files in the exchange directory, then replaces the outbox.
Follow [write scope](skills/wti-ai-msg/references/write-scope.md) before requesting
access. Prefer approval of the concrete helper command; do not silently grant the
whole exchange directory. Such a directory grant can also permit replacing peers'
entries, even when their files are described as read-only. This package supplies
no OS-enforced isolation between actors sharing a UID.

Every participant records its actual environment and separately verified read,
write and notification capabilities using the
[environment preflight](skills/wti-ai-msg/references/environment.md). A path or
localhost URL on Codex's host is not a route into ChatGPT. Use connected GitHub for
pushed code, a verified shared filesystem, or an authorized private resource/mail
relay which carries the actual content and preserves attribution.

Each actor checks inbox at start/resume and safe boundaries. No autonomous wake or
notification service is installed. Offline/busy mail persists; unattended delivery
requires a separately verified/authorized mechanism. Never take over a driver.

Run mechanics evals from the extracted toolkit root:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s evals -p 'test_*.py' -v
```

The tests use synthetic identities in temporary subdirectories of `evals/`, clean
up their own fixtures, and contact no agents or networks. They do not establish
cross-host delivery or reboot durability. `evals/scenarios.md` defines behavioral
cases for separate model evaluation; retain private deployment evidence separately from this public package.

On Linux with existing `strace`, trace synthetic create/replace/retry operations
from the extracted toolkit root, choosing a new approved evidence directory:

```bash
python3 evals/probe_write_scope.py --output-dir APPROVED_EVIDENCE_DIRECTORY
```

The probe checks the helper's write footprint and unchanged peer bytes, not the
enforcement of any particular host sandbox or directory grant. It installs nothing.

Run the upstream skill-creator `quick_validate.py` against `skills/wti-ai-msg`.
Build the portable archive with `python3 package.py --output PATH.zip`. Packaging
excludes live identities, exchange contents and local review/handshake files.
An archive is not installation and grants no tool, filesystem or account access.

Limits: Linux/Python 3.10+, local filesystem, same OS-user cooperative actors,
1 MiB per outbox, no cryptographic signatures, no exactly-once external effects,
no background receiver. Checksums identify content; they do not authenticate peers.
Same-UID attribution is cooperative; even the optional `CODEX_THREAD_ID` guard is
an accident check, not authentication. Latest-user-instruction priority is a rule
agents must apply; the helper cannot read conversations, authorize work or prevent
stale execution. Revision flags assist reconciliation but do not enforce it.
`/var/tmp/gpt` is a suggested persistent local parent and survives ordinary reboots,
but host cleanup/backup policy remains separate. Do not change that policy silently.

## Foreground workflow and ChatGPT adoption

No installation is needed for a trial. Use the existing skill by path locally.
Read [local workflow](skills/wti-ai-msg/references/local-workflow.md) for the
read-only scan, exact target preflight, single queue submission and reconciliation.
Only the sender writes adapter reports. The extra sender-owned `.dispatch.lock`
is held across queue; it does not cover recipient execution. No automatic retries
or background scanning occur.

The [ChatGPT workflow](skills/wti-ai-msg/references/chatgpt-workflow.md) is the
matching remote instruction set from this same canonical skill. Deliver its bytes
through a verified private surface; local skill installation does not register it
in ChatGPT. Remote receipt/result evidence retains its actual author and source.
System must confirm the existing chat identity and private destination before a
Space trial. Nothing here changes sharing or activates a remote session.

For permanent local adoption only after approval, install/copy this reviewed
`skills/wti-ai-msg` directory into the existing user skill root, checking for an
existing version first and using the supported install workflow. Do not overwrite
unrelated skills or modify AGENTS/config to force discovery. For ChatGPT, System
selects the currently supported private skill/plugin install flow after review;
explicitly loading the transferred instructions suffices for the trial. There is
no proposed service, monitor, credential or new agent installation.
