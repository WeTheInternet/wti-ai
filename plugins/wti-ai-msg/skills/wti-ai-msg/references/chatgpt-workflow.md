# ChatGPT participant and private relay workflow

Use the SAME [wti-ai-msg skill](../SKILL.md) and [parent contract](protocol.md).
This is a surface-specific instruction page, not a competing protocol or second
registry. System, our name for our Manager Dot (an existing ChatGPT coordinator),
coordinates through existing hubs in this deployment. Other teams use their own
assigned coordinator; System is neither a required participant nor a mandatory gate.
Participants own their ACK/agreement/results. Current user directions override
queued assumptions.

## Establish the environment

Name the existing ChatGPT conversation/participant and bind its stable role to its
verified runtime identifier. Record the identifier's namespace and actual evidence.
A desktop observer thread ID is not automatically the ChatGPT conversation ID.
Check the current participant's tools and authorization. ChatGPT's Python sandbox,
if any, is not the user's local workstation. `/var/tmp/gpt`, `/opt/...` and localhost
URLs cannot deliver local bytes into this chat. Use connected GitHub for pushed
code; use an actually accessible private Page/Space or Library object for private
operational payloads. A visible Page does not prove access to its attached file.

The local agent may now have a Pages connector; verify direct access before adding
an intermediary. Otherwise System can carry content through its existing supported
desktop/files and ChatGPT resources. Confirm both forward AND return access, exact
private destination and current permissions. Do not create credentials, broaden
sharing or replace a team hub to establish a route.

## Receive without changing attribution

1. Read the complete sender envelope through the authorized resource. Record its
   immutable request ID/revision, sender, message UUID, recipient, completion owner
   and payload hash. Check the exact original bytes, not a summary or a provider's
   successful upload flag. [Mail format](mail.md) defines the unchanged envelope.
2. Independently verify the byte count and SHA-256 of a transported UTF-8 blob.
   If a Page is used, a single exact base64 string plus byte count/hash can carry
   the original file without Markdown normalization. Hash decoded bytes with an
   actual tool; don't claim verification from visually comparing printed hashes.
   Keep both blob hash and envelope payload hash (different concepts). Validate
   the event schema/ID/hash using the exact helper when the environment supports
   it. If computation or full retrieval is missing, report that specific blocker.
3. Only the addressed participant authors its read ACK. Then reconcile current
   user instruction, revision and prior outcome before agreeing to execute.
   Preserve superseded history; stop affected subsequent work at safe points.
4. Persist your result before advertising it. Include exact message identity/hash,
   actual outcome, artifacts/tests and limits. Do not infer that the sender saw
   the result. Keep the result available for reread; notifications may be lost.
5. Only the named completion owner accepts after independently reading the return
   and checking criteria. Review acceptance is not merge authorization.

Prefer one writer per participant's Page/object, with immutable per-message payload
objects retained. Do not silently edit another actor's outbox or shared status
document. If the user explicitly requests takeover from a superseded session,
verify the old writer has stopped through supported controls and record the scope
and successor identity before continuing. The successor writes under its own
identity, preserving the original records; takeover is not permission to forge
the old session's ACK/result or bypass an active writer. For uncertain Page
creation, look up the stable message marker first;
do not blindly create duplicates. Record actual object/Page ID, version/sequence
when returned, byte hash and observer for each hop. Page edits and file rename are
not equivalent transactions. Treat all notifications as hints to reread durable work.

## Receipts when the local helper is unavailable

Author separate native records in YOUR conversation or your designated private
response Page: read ACK, execution agreement, result. Each names sender, recipient,
UUID, request ID/revision and original payload hash. This is the existing contract's
attributed native-evidence route, not a fake filesystem receipt. A relay may copy
your exact response into a relay-owned evidence artifact with source locator/hash;
it must never invoke `mailbox.py --actor YOU` or write your local outbox for you.

The local sender records only its own observed-delivery evidence. Its file-helper
ACK/result/acceptance fields stay unverified if no actual recipient-authored file
receipts exist. A completion owner can separately sign off in its own evidence
record, explicitly accepting native evidence and naming that limitation. Do not
invent helper acceptance just to make every projection green. If the actual remote
participant can run the unchanged helper, it may produce its own outbox bytes;
transport that exact artifact with attributed provenance and verify independently
before considering any separately authorized import. Import is not implemented by
this package and must not overwrite an existing peer record.

When checking completion, inspect native owner acceptance and attributed delivery
observations even for terminal messages. Report the native decision and helper
projection separately; do not repeatedly call an accepted native result pending
because the filesystem has no owner-authored acceptance. A return-read ACK from an
original sender is native consumption evidence, not an ACK of its own outgoing
request. [Recovery](recovery.md) defines the exact binding and late-accounting rules.

## Activation and adoption

The user or an authorized coordinator manually activates the existing chat for now. Saving a Page,
installing a skill, adding an instruction or sharing a Library object does not
wake a session. Do not enable auto-update, schedule a task, install a monitor or
claim cross-chat notification support from the existence of a tool alone.
Reply in the named existing conversation; no new agent is required.

No installation is required for a bounded trial: make this skill plus the relevant
contract/reference bytes available in the chosen private surface and explicitly
ask the existing participant to read them. Record the actual version/hash received.
A local filesystem path alone is not that transfer. Permanent ChatGPT skill/plugin
installation remains a separate supported-flow decision for System, after review;
do not assume the local Codex skills folder registers a remote ChatGPT skill.

Before an update, compare the remote installed package version and source/manifest
hashes with the exact pushed commit or portable archive supplied for review. Local
canonical source, local installation and remote installation are three independent
states. If remote inspection is unavailable, report it unknown and ask System to
check through its existing installation surface. If already matching, no reinstall
is needed. If stale, use that surface's supported update flow when authorized;
reinstall only if it offers no update path. Until then an existing participant can
explicitly read the exact pushed skill/references for this bounded task. Do not
invent a universal refresh command, replace a session or stop an active driver.

For code review, use [pushed review](pushed-review.md): exact repository, issue/PR,
base/head SHAs, requirements revision, tests and gaps; severity/file/line/reason/
reproduction or missing requirement in findings. Re-review fixes at the new SHA.
Keep the proposed GitHub issue/PR/operations split a proposal until adopted.
