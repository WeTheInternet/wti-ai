# handoff-mail

Addressed messages, recipient-owned ACKs/results, and explicit completion-owner
acceptance for existing Codex and ChatGPT participants. This is a standalone
skill and optional Python toolkit hosted in `wti-ai`. It has no Theia, Node,
workspace, daemon, MCP server, or model-powered triage dependency.

## Install just the skill

Ask Codex's bundled `skill-installer` to install
`plugins/agent-handoff-mail/skills/handoff-mail` from `WeTheInternet/wti-ai`, pinned
to the commit you reviewed. It downloads that skill with its scripts, references
and license notices; you do not need to set up the containing repository.

For the initial review branch, the equivalent upstream installer command is:

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" --repo WeTheInternet/wti-ai --ref handoff-mail-standalone --path plugins/agent-handoff-mail/skills/handoff-mail
```

Prefer a reviewed full commit SHA in `--ref` for reproducible installation. The
review branch may advance. This path is not on `main` until the PR is merged.
The installer refuses an existing destination. For updates, compare installed
files with the previously installed release, preserve local modifications and
keep a rollback copy before an authorized replacement. No updater runs in the
background. The skill is available on the next turn; do not restart active work.

Alternatively, extract a reviewed portable archive and install its
`skills/handoff-mail` directory in your existing skill root. Keep its `LICENSE`,
`NOTICE.md`, and referenced license text. The source root's `plugin.json` also
supports compatible plugin installers; the repository marketplace entry points
only at this component. Use either the standalone skill or plugin installation
to avoid duplicate discovery. Marketplace support varies by client; see the
[official plugin guide](https://developers.openai.com/plugins/build/plugins).

## Use it

Invoke `$handoff-mail` for an authorized handoff. Read
[the skill](skills/handoff-mail/SKILL.md) and the relevant surface workflow:

- [Local Codex](skills/handoff-mail/references/local-workflow.md): foreground
  scan, current target preflight, at most one queue submission, and reconciliation.
- [ChatGPT](skills/handoff-mail/references/chatgpt-workflow.md): reachable private
  content, independent byte verification, and recipient-authored native receipts.
- [Operations](OPERATIONS.md): ownership, writable scope, compatibility and checks.

Helper execution requires Linux and Python 3.10+ (standard library only). Optional
local wake requires a separately verified existing Codex CLI/session and permission
to notify it. `codex queue --resume` admission is not evidence of activation.
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

Run from this component directory, including after copying it out of `wti-ai`:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s evals -p 'test_*.py' -v
python3 package.py --output /var/tmp/agent-handoff-mail-0.1.6.zip
sha256sum /var/tmp/agent-handoff-mail-0.1.6.zip
```

The archive has an explicit allowlist and deterministic bytes. Its contents include
the tests and packaging script; no parent checkout is required. CI runs just this
component and uploads the ZIP plus its checksum. CI does not install, publish a
release, wake agents, or merge. For structural skill validation, use the upstream
`skill-creator/scripts/quick_validate.py` on `skills/handoff-mail` when available.

Mechanics tests use synthetic temporary exchanges and fake queue providers.
[Behavioral scenarios](evals/scenarios.md) and [blind prompts](evals/prompts.json)
support separate decision evals; no independent model-forward pass is claimed.
Prior deployment trials exercised recipient-authored nonce returns through local
files and private Pages, including a local ordinary-program wake. Their private
records are deliberately absent here. They establish those specific routes only;
they do not prove unattended remote wake, every host/client, or power-loss safety.

Version 0.1.6 packages the existing 0.1.5 toolkit for public installation. Mailbox
and dispatcher code, wire format, and pinned parent contract remain unchanged.
The issue/PR/operational-record split remains a proposal until a team adopts it.

## License

New implementation and instructions use [EPL-2.0](skills/handoff-mail/LICENSE).
Preserved XApi contract/templates retain their modified BSD notice. See
[provenance and notices](skills/handoff-mail/NOTICE.md) before redistribution.
