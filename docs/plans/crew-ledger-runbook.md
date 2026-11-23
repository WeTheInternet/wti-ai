---
status: DRAFT
teams: []
roles: [agent]
authors: [JamesXNelson]
lastUpdated: 2026-11-23T06:09:55Z
verification:
  - "Compare exact source commit and displayed fields after explicit refresh"
  - "Confirm host-specific UI flow with its owner before operational adoption"
---

# Crew ledger runbook

A standalone operating proposal. Merging this document does not enroll writers, set deadlines, configure readers or enable rollout.

## 1. Bind each branch to its publisher

Record the approved repository, exact ref, record path and publishing route. Distinguish the assigned publisher, report author, actual publishing account, next-action owner and rollout approver. A shared account or commit match does not authenticate an agent.

**Proposed policy:** one publisher per exact ref, with owner opt-in and approval from the named assigning authority under The Human's grant. Transfer records include the previous publisher's release, reconciled head and pending attempts, successor acceptance and effective time. Preserve divergent evidence. Summary and Chronicler branches are optional arrangements, not default writers. Triage routes without changing ownership or report meaning.

## 2. Report meaningful changes

**Proposed triggers:** acceptance; state, blocker or decision changes; verification that changes the record; pause; handoff; completion. Do not commit unchanged reports merely to reset age.

A 30-minute active interval is only a proposal. The lead agrees a task-specific UTC due time with the writer, or sets it under explicit delegated authority. Otherwise show **No due time agreed** and leave overdue unclassified. The reader's configured age threshold is a separate display rule.

Keep the strict summary schema unchanged. Put unsupported assignment, evidence and decision details in approved separate records; keep the compact ACTIVE record separate from the replace-in-place machine projection. Schema validity does not prove truth or safe content. Preserve source `reportedAt`, participant `updatedAt` and observation time separately. Distinguish the affected human's dependency from the agent's follow-up; do not invent an assignee.

## 3. Follow the host's inspection flow

- **Native local reader:** select the configured source, explicitly **Refresh**, then **Inspect** the participant. Selection does not read Git. Inspect selects the canonical participant; it does not run a next action. Sources default to empty and this reader fetches nothing.
- **Hosted crew roster:** **Reload roster** reads only its approved hosted refs and derives the roster. Verify the displayed source revision before following available history/evidence links.
- **Request-capable fixture UI:** **Open request** should keep the affected participant and request in context; **View source record** exposes evidence. Close/Escape returns focus to the opener. Opening, inspecting or closing is not recording or submitting a decision.

Do not transfer capabilities or acceptance evidence between hosts. Portable dialog/time-label checks do not prove live roster behavior. Unresolved next steps remain text; expose an action only when its destination and capability are verified.

## 4. Verify refresh against Git

For local inspection, substitute approved absolute repository and exact ref/path values:

```bash
LEDGER_GIT_DIR='/absolute/path/to/approved-ledger.git'
BRANCH_REF='refs/heads/assigned-status-branch'
SUMMARY_PATH='status/summary.json'
COMMIT=$(git --git-dir="$LEDGER_GIT_DIR" rev-parse --verify "$BRANCH_REF^{commit}") || exit 1
BLOB=$(git --git-dir="$LEDGER_GIT_DIR" rev-parse --verify "$COMMIT:$SUMMARY_PATH") || exit 1
git --git-dir="$LEDGER_GIT_DIR" cat-file blob "$BLOB"
```

This pins a committed read; it neither fetches nor validates the schema. For hosted refs, inspect the exact displayed commit through the approved source route, not a potentially stale local ref.

Record ref, commit, blob/digest, reader build, observation time and per-field comparison. Compare only displayed fields; unavailable fields mean **verification incomplete**. An unchanged-tip refresh must preserve report time. A later tip is a new observation. Matching Git proves faithful display, not completed work; ACK is not completion.

## 5. Handle missing or stale reports

Distinguish reachable source/no first report, valid reported unknown, missing/invalid time, agreed deadline passed, source unavailable, and labeled last verified snapshot with its original timestamp/current status unknown. Do not substitute demo data or relabel old evidence as fresh.

**Proposed escalation:** the lead names the mismatch and response due time; Triage routes one request and records delivery/ACK. Only the authorized writer/relay corrects the ref. Pause specifically dependent work; independent authorized work may continue. If an agreed response deadline passes, reconcile attempts and escalate ownership/scope choices to the assigning authority or The Human. Silence grants no resend, takeover or automatic reassignment.

**Open decisions:** due-time model, follow-up/backup responsibilities, optional summary/Chronicler policy.

Basis: [pinned local-reader contract](https://github.com/WeTheInternet/wti-ai/blob/aaba7c41dffd3fd068f0208589d1acfad0eae1f3/ide/agents/infra/GRAPH-LEDGER.md) (PR #9, not assumed merged); owner corrections for the hosted roster and portable UI. [Operator supervision](../specs/operator-supervision.md) remains the separate product spec.
