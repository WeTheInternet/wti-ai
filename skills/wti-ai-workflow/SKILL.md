---
name: wti-ai-workflow
description: Route personal WTI-AI work to the right actor and environment, validate Theia IDE changes with the rootless Podman harness, and track work and launched resources across handoffs or restarts. Use when choosing who should act, recording or cleaning up resources, recovering blocked local execution, or deciding which evidence supports a validation claim.
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

## Choose the agent launch mode

In James's WTI-AI workflow, an unqualified request for an **agent** means a
**Direct Agent** (UI label **Direct**). Use a standalone interactive session
in the intended project and environment. Before calling it ready, verify that
James can address it himself in the intended app, for example through a visible
composer or a confirmed owner-authored turn. A view-only transcript, clickable
link, current running state, or the Dot's ability to send is not that evidence.
Conductor can assign and track the work without becoming the only feedback route.
If a Direct launch is unavailable, report the blocker instead of silently
substituting a subagent.

A **subagent** is an explicitly requested parent-managed worker rather than a
Direct Agent. **cleansub** means a subagent with no inherited parent conversation.
Provide its assignment and authorized sources explicitly. An optional modifier
applies to that worker: **cleansub low** requests low reasoning effort;
**cleansub high** requests high reasoning effort. Bare **cleansub** leaves effort
at the normal default. If the launcher cannot honor context isolation or a
requested effort, say so rather than silently substituting a different profile.
These terms do not change what data or tools the worker is authorized to use.

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
For a launched or allocated resource that needs a cleanup owner, create a
[resource receipt](references/work-ledger.md#resource-receipts) at launch.
Update it at handoff and stop, including who owns cleanup.
