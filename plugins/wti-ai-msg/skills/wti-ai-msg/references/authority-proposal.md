# Requirements and messages — proposal

Status: proposed for future project work, not globally adopted. No records are
migrated or replaced. Apply current instructions/contracts until the user adopts
this division for the project.

| Record | Proposed authority and existing owner |
| --- | --- |
| Primary GitHub issue | Durable project objective, scope, criteria, approved decisions, open questions and links to implementation/review/focused design owners. Keep the primary issue stable; no duplicate on handoff. |
| PR and review | Commit-specific implementation discussion, findings, CI and review evidence tied to exact base/head SHAs. |
| Existing coordination hub/manifest and role records | Assignment owner, actor identity, request revision, dependencies and routing. Preserve sole-writer ownership; no competing assignment registry. |
| Messages and actor outboxes | Immutable dispatch, delivery evidence, ACK, transient execution reports and results; not requirements authority. |
| Named completion owner's acceptance | Acceptance of an exact request revision/result against criteria and required user gates. Link durable acceptance evidence from issue/PR where appropriate. |
| Latest applicable direct user instruction | Scope, priority and cancellation authority within system/permission constraints. Reconcile stale records to it; agent comments do not create user authorization. |

XApi contract 1.2 already supplies request IDs/revisions, completion owners,
manifests and evidence states. The issue is the proposed requirement anchor;
the existing manifest remains assignment authority. Mail references both.
For projects using primary issues and focused durable design documents, summarize
decisions in the issue and link their owning documents rather than duplicating
whole specifications.

Any sensitive information, including financial or personal work, retains its
existing approved private records. Do not move it to GitHub by analogy. Existing
hubs, ledgers and role ownership remain unchanged; any migration needs an explicit
scoped decision.

Reconciliation:

1. Resolve the existing issue, request/manifest revision and current user direction.
2. Record a user change's source/locator and affected scope. Stop affected stale
   work at a safe boundary; preserve earlier results/history. Agent paraphrases
   alone do not expand authorization.
3. The authorized owner updates the requirement/assignment records. Until then,
   mark reconciliation pending; do not execute stale work to match old records.
4. Dispatch a new immutable message with the same request ID, next revision,
   superseded IDs and user-change evidence. Recipient ACKs what it read, records
   cancellation/supersession and works only within current authority.
5. Worker reports exact revision, artifacts/commit and tests. Completion owner
   separately accepts against criteria. Technical agent acceptance cannot replace
   user-owned manual/product checks or grant merge permission.

Ambiguous competing changes need a bounded owner/user question. Timestamp order,
an agent's asserted role and GitHub comments are evidence, not authorization.
Issue edits/closure, PR publication and access changes still need applicable
authority. This toolkit performs none automatically.
