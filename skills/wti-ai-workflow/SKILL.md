---
name: wti-ai-workflow
description: Route personal WTI-AI work to the right actor and environment, validate Theia IDE changes with the rootless Podman harness, and checkpoint work across agent handoffs or restarts. Use when choosing who should act, recovering blocked local execution, or deciding which evidence supports a validation claim.
---

# WTI-AI workflow

## Verify scope, owner, and capability

Identify the current WTI-AI job, latest user instructions, exact source or
artifact, and the assigned writer. Read the checkout's `AGENTS.md` and relevant
`PURPOSE.md` before editing or running tasks. Verify the current host, checkout,
account, tools, and separate read, write, execution and notification permissions.
Keep this workflow on personal WTI-AI resources. Role names describe responsibilities
and confer no permissions.

| Actor | In-scope next action |
| --- | --- |
| MSI execution agent | Inspect and edit its assigned isolated durable checkout. Run authorized commands on the verified MSI surface. Use [local IDE validation](references/local-ide-validation.md) for container work. |
| Remote or browser-only agent | Review reachable source or private artifacts. Verify the MSI execution owner can read the exact source and return the evidence. When dispatch is authorized, route the source, requested check and expected evidence to that owner. |
| Triage or coordinating Dot | Reconcile the exact task using supported status, latest relevant turn and receipts. Route the next authorized action. Notify James when a concrete blocker, decision or required input needs him. Carry out only the bounded checks assigned to this surface. |
| Source or implementation owner | Keep one assigned writer per file or worktree. Delegate independent, bounded work only when user instructions and the tool permit it. Reconcile overlapping edits with the current owner before writing. |

Use durable isolated work under `/opt/src` or an approved personal worktree.
Preserve main, concurrent edits, and owner-private evidence. When the current
owner or worktree is unverified, limit your work to inspection or a reviewable
patch. An active turn can do its bounded checks and
checkpoint. Continued monitoring needs its own supported, authorized route.

Use [wti-ai-msg](https://github.com/WeTheInternet/wti-ai/tree/main/plugins/wti-ai-msg/skills/wti-ai-msg)
for request identity, delivery, receipts and recovery. Keep transport admission,
recipient read ACK, execution agreement, completed work, and validation separate.
A local file path is usable only by a participant whose access has been verified.
Prefer a private reviewed artifact or a concise evidence summary when crossing
surfaces. If a task appears idle, determine whether its owner needs input, is held,
or is unreachable before asking for a ping.

Use [work ledgers and resumption](references/work-ledger.md) when pausing, handing
off work, or resuming after interruption. Record the existing work identity and
link exact evidence so the next owner can continue from the checkpoint.
