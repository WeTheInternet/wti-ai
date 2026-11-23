---
name: wti-ai-workflow
description: Route personal WTI-AI work to the right actor and environment, validate Theia IDE changes with the rootless Podman harness, and track work and launched resources across handoffs or restarts. Use for Conductor handoffs, choosing who should act, recording or cleaning up resources, recovering blocked local execution, or deciding which evidence supports a validation claim.
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
For a launched or allocated resource that needs a cleanup owner, create a
[resource receipt](references/work-ledger.md#resource-receipts) at launch.
Update it at handoff and stop, including who owns cleanup.

## Conductor-managed work

Use the [feature delivery workflow](https://github.com/WeTheInternet/wti-ai/blob/main/docs/specs/agent-workflow.md)
for ownership. Conductor owns intent, spec revisions and direction. The feature
lead owns implementation, verification and delivery. Triage preserves the
addressed handoff and its receipts, and surfaces delivery problems. When a direct
human instruction changes scope, honor it and route its source to Conductor and
the lead so they can reconcile affected work and possible prior effects.

Resume from the current assignment, spec revision and exact evidence of prior
attempts. Preserve one writer during handoff. Treat history as reported evidence.
In a Conductor-managed watcher, Conductor owns the history cursor, action
deduplication and authorization. An agent notification requires a matching
approved pending record. A human notification requires a current, explicitly
addressed decision or action. Environment adapters verify the local route and
return evidence. Use wti-ai-msg for attempt correlation and receipt recovery.
Use `report-workflow-to-history` for enrolled owner checkpoints.
