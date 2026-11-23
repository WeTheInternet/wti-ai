---
status: DRAFT
teams: []
roles: []
authors:
  - JamesXNelson
lastUpdated: 2026-11-23T00:28:53Z
verification:
  - "Draft source reconciliation; no runtime behavior certified"
---

# Bounded documentation reconciliation

DRAFT plan; preparation and review do not authorize runtime work. Steward owns synthesis and the proposed docs patch. This plan separates confirmed user direction, owner-reported evidence and design recommendations.

## Current direction and owners

The Human chose the delivery flow, autonomous default, direct steering and platform-independent harness. The latest role decision distinguishes Conductor's intent/requirements/spec/direction ownership from the feature lead's implementation and delivery ownership. Workers negotiate with their lead; spec conflicts and proposed spec changes go through the lead to Conductor, which may appeal to The Human. The lead selects what knowledge should persist; an optional Historian scribe accepts recording requests from Conductor or leads by default. Workers submit candidates through their lead. Chronicler records events and Triage remains a raw connector. The [workflow](../specs/agent-workflow.md) and [knowledge](../specs/project-knowledge.md) drafts record these decisions. Their runtime packaging remains open.

System's input arrived through Triage's verified pull relay. CLI adapter research owns Graph integration, Lab owns portable UI/fixtures and Triage provides the communication relay. The existing Graph preview remains fixture-backed, without active Git-ledger ingestion. System has assigned CLI Adapter the first explicitly configured read-only Git-ledger-to-Graph slice; that assignment is not a report of delivered ingestion. System reports that the initial source is a dedicated localhost bare Git repository with one agent-written status branch. CLI Adapter is proving two local pushes followed by explicit refresh; this is a local proof in progress, not a hosted ledger or completed integration claim. This status is neither a documentation publication gate nor a delivery promise. The reported five-test run and unverified reload/build attribution are documented in [operator supervision](../specs/operator-supervision.md). Earlier synthetic comparison results are a separate evidence set.

## Exact proposed first patch

| Path | Change |
|---|---|
| `README.md` | Replace competing product-role/default-gate descriptions with the short current route. Preserve the approved evidence paragraph from docs branch 3a7db2e, with only the user-requested LISA capitalization correction. Link runtime instructions at their existing location. |
| `MASTER_PLAN.md` | Keep the public path as a router; preserve both old roadmap bodies in snapshots. Do not label GKE/Quarkus rejected. |
| `docs/specs/agent-workflow.md` | Add the compact delivery contract, Conductor direction versus feature-lead implementation ownership, role responsibilities, autonomy/manual distinction and first exercise criteria. |
| `docs/specs/project-knowledge.md` | Add recording/candidate/verification/promotion distinctions, Chronicler event recording, lead knowledge-selection authority, default Conductor/lead-to-Historian request path, evidence limits and contradiction example. |
| `docs/specs/operator-supervision.md` | Add observable requirements, separate fixture and live evidence, explicit owner-reported limitations, and the proposed branch/successor recovery boundary. |
| `docs/plans/docs-reconciliation.md` | Maintain this bounded plan, review decisions and closure checks. |
| `docs/README.md`, `PURPOSE.md`, `docs/PURPOSE.md`, `docs/specs/PURPOSE.md`, `docs/plans/PURPOSE.md`, `docs/theia/PURPOSE.md` | Route to these maintained drafts and preserved sources. Describe plans as plans/playbooks with approval recorded separately. |
| `docs/goals/conductor-lisa-loops.md` | Add The Human's delivery flow and links to the workflow/supervision drafts while preserving LISA purpose. Treat the old v0 non-goal as the scope of that earlier goal iteration. |
| `.prompts/PURPOSE.md` | Preserve the explicit-reading boundary; explain generated contexts as dated assembly/workflow evidence whose currentness requires per-file judgment. Do not move their current files. |
| `docs/history/PURPOSE.md`, `docs/history/INDEX.md`, `docs/history/source-manifest.tsv` and snapshot wrappers | Create the recoverable history route and exact source manifest. Keep snapshots distinct from rejected or deferred ideas. |
| `docs/history/snapshots/recovered-design/**` | Preserve the non-sensitive selected source versions byte-for-byte. Withhold employer-specific material from the public patch; original sensitive sources are preserved in the existing private archive and withheld from this candidate. This is version preservation, not a declaration that every idea is historical or rejected. |
| `docs/history/snapshots/main-9de86d6/README.md`, `MASTER_PLAN.md` | Preserve the two main-version bodies before replacing their current entry-point text. |

The proposal uses `docs/history/` as the recoverable graveyard area. `docs/trash/` remains deletion staging. Current generated prompts and existing working docs remain in place except the explicitly replaced root entry-point bodies. No original recovery file or remote history is deleted. Sensitive recovered source copies are excluded from this public candidate.

The snapshot index records screened local sources, current-use links and disposition; `docs/history/source-manifest.tsv` records collection ID, exact-byte source destination, byte hash and view path. Exact recovery refs, URLs and original-to-snapshot mapping remain only in the private review package. Snapshot directories have PURPOSE wrappers. Historical CERTIFIED documents use an exact raw source attachment and a DRAFT Markdown wrapper with fenced source quotation; no governing trust-rule exception is introduced. Embedded relative links remain preserved source text and may name historical targets absent from this selection; maintained citations route to screened local snapshots. Known original defects, including `intent/main.md` naming absent `conductor.md`, are recorded rather than rewritten inside snapshots. The maintained index links the real `orchestrator.md`.

The indexed snapshot selection compares an earlier historical baseline to the recovered design collection; exact refs remain in private provenance. It is not a diff against initial proposal main `9de86d6c40ccdf230db330008d32f416d04b4e65`, which includes later transport work. Its seven deletions are historical inventory evidence, never instructions to delete current-main files. Unchanged old documents remain in their existing paths and Git history.

Preserve `intent/reference/Wti.jjt` separately as one byte-identical, unreviewed design grammar. The public candidate retains 71 indexed documents plus that grammar and two initial-main root versions: 74 source artifacts. Three source documents containing employer-specific material are withheld from this candidate; originals are preserved in the existing private archive. Existing remote history is unchanged. The next-cut patch base is `f5edfdc37e3c622bd347cca6e631c6a5bc04a26e`; later transport work is retained. No runtime, lockfile, credential, archive binary or infrastructure-configuration transfer is proposed.

## Explicitly separate follow-ups

- Certified glossary: propose the Conductor/feature-lead terminology update with review provenance; do not silently certify a new definition.
- Fix the location-based certification sentence in `docs/0_triage/PURPOSE.md` and the stale `docs/MASTER_PLAN.md` link in `skills/wti-ai-infra/SKILL.md`.
- Resolve the substantive checklist under generated `docs/status/` through a byte-preserving move and compatibility pointer.
- Reconcile AGENTS' old priority list only as a targeted priority update; leave its operating/permission rules intact.
- Give peripheral infrastructure and review-skill families individual disposition decisions. The snapshot manifest preserves them while this review remains open.

These are identified changes, not untracked omissions or adoption of the recovered runtime.

## Review/evaluation sequence

1. Validate this docs patch with experienced knowledge/operator readers, a fresh curation reader and an independent skeptical read of the resulting draft.
2. Keep the existing preview explicitly fixture-backed. CLI Adapter owns the separately assigned, explicitly configured read-only Git-ledger-to-Graph slice; the fixture preview does not prove that slice implemented. Apply Lab's Graph contract without inventing edges or online presence.
3. Separately prepare the previously requested realistic design mock. It is neither a gate for the fixture/ledger UI work nor a mandatory flow for routine tasks. It assigns no new implementation work here. Four ordered stories:
   - autonomous happy path from user intent to usable result, with spec/criteria traceability and independent challenge of implementation and verification;
   - human redirection during in-flight work, including revision changes, stale evidence and adapter retries;
   - a disputed knowledge candidate routed worker → lead → Historian, with evidence, a lead disposition, a spec conflict returned to Conductor and provisional work while a reserved decision is pending;
   - a successor first reviewing the superseded team's ledgers, selecting retained/replaced/new agents and scoped reviewers, establishing current state, detecting a changed assumption and taking exclusive write ownership of its assignment.
4. Include a failed verification and a bounded retry/stop outcome. For every story record operator visibility, evidence jumps, next owner/action and actual blocker. Preserve the actual post-assembly adapter input per attempt, not a preview.
5. Before running a comparison, fix the task, environment/build identity, budgets, scoring criteria, ordering and cache treatment; make confounds visible. Compare with a plain CLI workflow. Stop conditions and permissions must be stated before execution.
6. Return a compact recommendation and the smallest localhost experiment that could falsify it. Revisit architecture after evidence; do not treat the mock as a commitment.

## Closure checks

- Privately verify every copied snapshot against its pinned Git blob; every selected source has a public snapshot row and private provenance mapping.
- Verify maintained relative links and planned path replacements, and verify original locators privately; separate preserved-source link defects from current navigation defects.
- Preserve generated prompts, original dissent and seed details; show the current destination or preserved source for each removed root-doc claim.
- Keep direct user direction, proposal, source observation, owner report and tested behavior distinct.
- A fresh reader must find the current flow, owner/next action, genuine blockers, knowledge authority boundary and recovery evidence without full transcripts.
- Distinguish the role authority directly supplied by The Human from unimplemented mechanics; these drafts do not certify deployment, live control or additional execution permissions.
- Run only static documentation/diff checks for this patch. Runtime tests belong to their separately authorized work.

## Bootstrap discovery ownership

The skill builder owns `xapi-bootstrap`. System reports that it is prepared and checked against XApi `ee0377b`, but not installed or shipped. The current stable procedure locator is [XApi bootstrap/README.md](https://github.com/WeTheInternet/xapi/blob/main/bootstrap/README.md). The bootstrap documents the local inputs needed to reproduce the build; these docs provide rationale and discovery without copying its recipe, install instructions or transport setup. Prepared skill status is neither a publication gate nor a shipment promise.

## Remaining mechanics and source follow-up

Runtime packaging, retention/deletion policy, branch/checkpoint/ledger recovery mechanics and eventual deployment architecture. Recover the earlier agent-colors source before treating it as a branch or filesystem rule. Conductor/lead responsibilities, lead-selected knowledge, authorized Historian request routing, autonomous default, Chronicler recording, ledger-first successor review and explicit exclusive assignment ownership are decided direction, not open alternatives.
