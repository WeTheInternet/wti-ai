# wti-ai-msg

Addressed messages, recipient-owned ACKs/results, and explicit completion-owner
acceptance for existing Codex and ChatGPT participants. This is a standalone
skill and optional Python toolkit hosted in `wti-ai`. It has no Theia, Node,
workspace, daemon, MCP server, or model-powered triage dependency.

## Install just the skill

Ask Codex's bundled `skill-installer` to install
`plugins/wti-ai-msg/skills/wti-ai-msg` from `WeTheInternet/wti-ai`, pinned
to the commit you reviewed. It downloads that skill with its scripts, references
and license notices; you do not need to set up the containing repository.

Replace `REVIEWED_COMMIT_SHA` with the exact reviewed commit in this upstream installer command:

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" --repo WeTheInternet/wti-ai --ref REVIEWED_COMMIT_SHA --path plugins/wti-ai-msg/skills/wti-ai-msg
```

Prefer a reviewed full commit SHA in `--ref` for reproducible installation. The
review branch may advance. This path is not on `main` until the PR is merged.
The installer refuses an existing destination. For updates, compare installed
files with the previously installed release, preserve local modifications and
keep a rollback copy before an authorized replacement. No updater runs in the
background. Standalone skill changes are normally detected automatically. If the
update is missing, save current work and restart Codex at a safe boundary; see
[standalone skill discovery](https://learn.chatgpt.com/docs/build-skills).
For a plugin install, start a new chat/session to load bundled skills and tools;
see [plugin discovery](https://learn.chatgpt.com/docs/plugins). Do not interrupt
an active driver to refresh discovery.

Alternatively, extract a reviewed portable archive and install its
`skills/wti-ai-msg` directory in your existing skill root. Keep its `LICENSE`,
`NOTICE.md`, and referenced license text. The source root's `plugin.json` also
supports compatible plugin installers; the repository marketplace entry points
only at this component. Use either the standalone skill or plugin installation
to avoid duplicate discovery. Marketplace support varies by client; see the
[official plugin guide](https://developers.openai.com/plugins/build/plugins).

## Use it

Invoke `$wti-ai-msg` for an authorized handoff. Read
[the skill](skills/wti-ai-msg/SKILL.md) and the relevant surface workflow:

- [Local Codex](skills/wti-ai-msg/references/local-workflow.md): foreground
  scan, current target preflight, at most one queue submission, and reconciliation.
- [ChatGPT](skills/wti-ai-msg/references/chatgpt-workflow.md): reachable private
  content, independent byte verification, and recipient-authored native receipts.
- [Operations](OPERATIONS.md): ownership, writable scope, compatibility and checks.

Helper execution requires Linux and Python 3.10+ (standard library only). Optional
local wake requires a separately verified existing Codex CLI/session and permission
to notify it. The v0.2.1 adapter queues without `--resume` and requires explicit
route evidence. Admission is not activation or consumption. For inbox checks use
`mailbox.py reconcile`, including saved results and native evidence, not just pending mail.
ChatGPT can use reachable instructions and native records without Python execution;
exact-byte verification still requires an actual computation tool on that surface.
A local install does not install a remote ChatGPT skill, grant file access, or wake
any session. Remote notification remains manual or coordinator-mediated unless a
supported route is independently verified.

Persist messages in an authorized location such as `/var/tmp/gpt/exchanges`, outside
this public source tree. Each actor owns only its outbox. Preserve existing task,
issue and role identities. Read-ACK, execution agreement, result and completion
acceptance are separate. User redirects take precedence as an agent protocol rule;
the helper cannot enforce conversation authority. Same-UID attribution is cooperative,
not authentication. Nothing here authorizes merge or exactly-once external effects.

## Validate and package in isolation

If GitHub Actions or its artifacts are unavailable, follow the
[manual CI fallback](OPERATIONS.md#manual-fallback-when-ci-is-unavailable) for
standalone source setup, commands, expected results and evidence to report.

Run from this component directory, including after copying it out of `wti-ai`:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s evals -p 'test_*.py' -v
python3 package.py --output /var/tmp/wti-ai-msg-0.2.3.zip
sha256sum /var/tmp/wti-ai-msg-0.2.3.zip
```

The archive has an explicit allowlist and repeatable bytes within the same Python/zlib
toolchain. It replaces the output only after validation; a failed build preserves any
previous artifact. Its contents include
the tests and packaging script; no parent checkout is required. On POSIX the output
keeps the temporary file's private mode (normally `0600`), including when replacing
an archive previously readable by other users. Existing mode/ACLs are not preserved.
Build to an owner-controlled staging path, not a live shared download path; distribute
through the approved upload/install surface. Shared-filesystem permissions are a
separate owner decision, never automatically broadened by this builder.
CI runs just this
component and uploads the ZIP plus its checksum. CI does not install, publish a
release, wake agents, or merge. For structural skill validation, use the upstream
`skill-creator/scripts/quick_validate.py` on `skills/wti-ai-msg` when available.

Mechanics tests use synthetic temporary exchanges and fake queue providers.
[Behavioral scenarios](evals/scenarios.md) and [blind prompts](evals/prompts.json)
support separate decision evals; no independent model-forward pass is claimed.
Prior deployment trials exercised recipient-authored nonce returns through local
files and private Pages, including a local ordinary-program wake. Their private
records are deliberately absent here. They establish those specific routes only;
they do not prove unattended remote wake, every host/client, or power-loss safety.

Version 0.2.0 renames the skill, package and wire protocol to `wti-ai-msg`
(`wti-ai-msg/0.1` on the wire) and fixes the reviewed packaging/read/scan/dispatch
issues. All participants in a new exchange must update. Old `handoff-mail/0.1`
records remain immutable and require their retained old helper; do not rewrite
IDs, checksums, ACKs or results. Keep the old install outside the discoverable skill
root for rollback, and update remote installations separately. The pinned XApi
parent contract remains unchanged. Prior live trials used the old namespace;
mechanics tests do not establish a new live cross-boundary trial.
Version 0.2.1 adds focused reconciliation across pending/terminal work, non-resuming
queue dispatch with verified route evidence, lossless timeout output, and fixes
execution-acceptance concurrency and archive publication. Wire semantics are unchanged
from 0.2.0. Refresh old preflight files before using the new adapter. Saved-result return
and native owner acceptance remain distinct from helper projections; see
[recovery](skills/wti-ai-msg/references/recovery.md). Updating this source does not
update an installed local or remote copy; compare versions and hashes separately.
Version 0.2.2 adds the offending outbox path to schema/checksum diagnostics while
preserving the original error and failing closed. It documents and checks the
existing private archive-mode behavior without changing permission policy.
Version 0.2.3 fails visibly on unreadable exchanges or receipts whose sender
message is missing. Both helpers accept `WTI_AI_MSG_DIR` as an existing exchange
default, overridden by `--root`. Guidance clarifies private references, local file
footers versus remote prompts, receipt-check fallbacks and user-authorized succession.
See [design limits and deferred mechanisms](DESIGN.md).
The issue/PR/operational-record split remains a proposal until a team adopts it.

## License

New implementation and instructions use [EPL-2.0](skills/wti-ai-msg/LICENSE).
Preserved XApi contract/templates retain their modified BSD notice. See
[provenance and notices](skills/wti-ai-msg/NOTICE.md) before redistribution.
