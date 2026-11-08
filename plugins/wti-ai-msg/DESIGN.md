# Bounded handoffs and replaceable notifications

Decision for this component, 2026-11-08: finish the reviewed package and learn from
real handoffs. No AgentMail integration, new service, directory, task board, lease,
dashboard or broker is part of this release. Keep the operational contract under
our control. Existing project issue/PR authorities and role owners remain intact;
the proposed record split is not a silent migration.

The request UUID/revision, recipient ACK, execution acceptance, saved result and
completion-owner acceptance survive any transport replacement. Notifications are
hints to fetch exact durable work; losing a hint must not lose the assignment.
Read-only observation never consumes evidence. A discovery failure means unknown,
not dead. Logical role/work, concrete session and execution attempt are distinct.
Cancellation must target the original request and turn, not whatever is active.
External effects remain outside any once-only publication/deduplication guarantee.

## Kept small now

`dispatch.py scan` already derives next actions from persisted state, including
`reconcile_delivery_no_resend`, `reconcile_scope` and `recover_saved_result`.
The updated helper indexes one fresh command-scoped snapshot and rechecks before
intent publication. It does not fence user amendments or recipient execution.
Read-only scans, saved-result recovery, uncertain queue outcomes, revision changes,
active writers and duplicate/conflicting IDs have focused synthetic tests. Ordinary
queue dispatch remains an optional foreground operation with no background model.

## Borrow later, when a demonstrated gap requires it

- [Agent Mail CLI](https://github.com/JuanjoFuchs/agent-mail-cli): actionable commands
  derived from observed state. Extend the existing projections only for an actual
  handoff where an agent cannot determine its valid next action.
- [AgentMail MCP Events](https://docs.agentmail.to/integrations/mcp-events) and
  [OpenAI MCP Events](https://developers.openai.com/plugins/build/mcp-events):
  metadata-only notification followed by explicit durable-message fetch. Preserve
  stable event IDs across retries; verify signed webhooks; expect duplicate and
  out-of-order events. Handle subscription lifetime/refresh and idempotent
  subscribe/unsubscribe. Put no peer instructions in notification payloads.
  A provider receipt is not recipient execution acceptance or completion. Where
  replay is absent, reconcile from durable message state, not notifications.
- Any provider adapter must look like durable request → notification → exact
  request fetch → this lifecycle. Provider addresses, hosted accounts, retention
  and idempotency horizons must not define work identity or result semantics.

A temporary AgentMail experiment could use an existing hosted MCP integration to
probe one verified existing ChatGPT participant. It still needs account/access and
subscription approval, an exact identity binding, durable forward/return retrieval
and independent recipient evidence. A successful probe proves that route only;
it is not an adoption decision.

Exposing MCP Events ourselves would add an authenticated reachable MCP endpoint,
subscription storage/lifetimes, signed callback handling, retry/reconciliation and
operations. It offers control but materially more implementation/hosting work than
a temporary hosted probe. Neither is justified while manual notification or bounded
foreground checks suffice. No implementation or trial is authorized by this note.
