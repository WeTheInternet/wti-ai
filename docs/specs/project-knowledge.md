---
status: DRAFT
teams: []
roles: []
authors:
  - JamesXNelson
lastUpdated: 2026-11-23T00:26:41Z
verification:
  - "Role direction supplied by The Human; implementation and proposed recovery mechanics not certified"
---

# Project knowledge and recording

The Human assigns the decision about **what should persist** to the feature/team lead. Historian is a possible scribe helper for that owner, not a competing knowledge authority. Chronicler records what happened. These role boundaries are decided direction; the record format and storage mechanics below remain proposals.

## What deserves persistence

Project knowledge is persistent, revisioned data selected to help future work. A true observation does not automatically deserve permanent documentation. A proposed record should explain future value, applicability, supporting evidence, limits and reconsideration conditions.

Keep distinct the event or attributed report; candidate claim, inference or decision; supporting verification; the owner's decision to retain it; and whether it is still current. “Worker reported tests passed” is not a verified test outcome. Agreement on a shared weak source is not independent corroboration. Version and environment limits must survive promotion.

## Owner and helper responsibilities

**Feature/team lead — selection and decision.** Refine, accept, deny or defer workers' recording requests; decide what belongs in official knowledge for the assigned scope. The lead can ask a scribe to track documentation needs while it focuses on delivery. Cross-scope conflicts, intent/spec changes or reserved decisions go to Conductor, which may appeal to The Human.

**Historian — recording helper.** Maintain the official-documentation view and execute authorized recording requests. By default only Conductor or a lead can send knowledge-record requests; a worker asks its lead to forward a request. Historian can surface missing evidence, contradictions, stale targets or ambiguous instructions to that owner; it does not independently settle what the project ought to persist. Direct authenticated instructions from The Human retain their authority.

**Chronicler — event record.** Record events, attributed commentary, decisions and their stated reasons, plus artifact/attempt references. Recording an event is not promotion into official knowledge. Keep underlying evidence and distinguish observations from assertions. This role does not imply unrestricted capture or unlimited retention.

**Workers and Guru — candidates and evidence.** Workers nominate useful findings through their lead. Guru provides relevant context, competing arguments, evidence and dependencies; it can flag a reason to revive discussion when new evidence changes the case. Neither automatically writes official knowledge because it has found a fact.

**Conductor — direction and oversight.** Can issue recording requests, reconcile cross-feature knowledge with requirements, and resolve escalated direction or policy questions. It does not become an extra approver for every lead-selected record.

**Triage — raw connector.** Relay requests and receipts with attribution. Do not decide which claims matter, combine claims semantically, adjudicate disputes or change a request's meaning.

## Recording and disputes

Proposed normal path: worker candidate and evidence → lead review/selection → authorized Historian request → recorded disposition with traceable evidence. The lead can do the recording directly when a helper would add needless coordination. Each official update should have a visible deciding owner, authorized requester and executing actor.

Resolve disagreements through evidence and discussion where possible. Guru exposes both arguments rather than hiding an unresolved alternative. The lead decides the recording disposition within its scope and preserves the reasoning and dissent. A decision to retain or defer a claim must not manufacture certainty or erase contradictory evidence.

If the issue changes a spec or crosses the lead's authority, the lead appeals to Conductor. Conductor may ask The Human. The lead can continue authorized provisional work, compare alternatives or defer recording while awaiting the decision. Unaffected delivery continues; only work dependent on the unresolved claim or missing permission actually blocks. A deadline or successful delivery does not turn a provisional claim into verified knowledge.

Historian returns disputed or unclear recording instructions to the requesting/deciding owner—lead or Conductor—and preserves the escalation path for decisions outside that owner's scope. It does not ordinarily gate delivery. A worker cannot bypass its lead by sending a competing promotion request directly to Historian. A lead's control of implementation does not permit silent changes to user intent, governing permissions or acceptance criteria through a documentation edit.

Recheck source and target revisions before committing a record. Preserve superseded claims, rationale and links to the current replacement. New evidence should reopen the affected judgment and identify dependent advice without forcing unrelated work to restart.

## Proposed minimum record, not a storage schema

Retain claim/type; future value and applicability; evidence/source revisions; candidate author; deciding owner; authorized requester and recorder; disposition/rationale; conflicting claims; dependencies and supersession; and freshness/reconsideration conditions.

Keep abstraction level, confidence, acceptance authority and freshness distinct. The seed's L0/L1/L2 context levels and later human-accepted L0 facts are different concepts. No database, TTL, confidence threshold or graph depth is selected here. Older workspace overlays, source locking and quarantine remain design evidence, not adopted mechanisms.

## Acceptance example

A worker verifies that a workaround fixes one build and asks its lead to retain the finding. Chronicler records the attempt and evidence. Guru identifies version limits or conflicting runs. The lead decides whether the scoped result is useful enough to persist, refines its limits and either records it or directs Historian to do so. Historian records that decision and its evidence; it must not broaden the claim to “always works.”

A later contradictory run returns through the lead, with both arguments and dependent advice visible. The lead can defer the disputed claim or record an explicitly scoped decision while delivery proceeds provisionally. A proposed spec change goes to Conductor. The trace explains who decided, why, what remained uncertain and when to reconsider.

## Provenance and remaining mechanics

[Early storage and automatic-persistence proposal](../history/snapshots/recovered-design/docs/0_triage/ideas/agent-ideas.md#L3-L30); [seed classes and controlled promotion](../history/snapshots/recovered-design/intent/reference/original-seed/knowledge.md#L26-L95); [later human commitment](../history/snapshots/recovered-design/intent/knowledge.md#L13-L24); [Chronicler's record/commit distinction](../history/snapshots/recovered-design/intent/chronicler.md#L11-L81); [typed statements and retention options](../history/snapshots/recovered-design/intent/reference/original-seed/ideas.md#L16-L42).

Open mechanics: evidence criteria appropriate to each claim, whether a lead uses a separate Historian invocation, retention/deletion, concurrency and invalidation. The lead's selection responsibility is already decided.


Earlier proposals variously described automatic persistence, human-approved facts and an independently empowered curator. They preserve useful evidence but do not override the current lead-decision/authorized-scribe direction. Retention, concurrent updates, invalidation and runtime packaging still need design work; none requires reinstating a separate curator approval gate.
