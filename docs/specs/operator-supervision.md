---
status: DRAFT
teams: []
roles: []
authors:
  - JamesXNelson
lastUpdated: 2026-11-23T01:41:28Z
verification:
  - "Source and direction review pending; no runtime behavior certified"
---

# Operator supervision

Proposed product requirements for a separate supervision surface, usable with a platform-independent harness. This draft does not claim that any live control or persistence behavior has been implemented. Follow the [feature workflow](agent-workflow.md).

## See and inspect the work

For a task, expose the responsible Conductor, feature lead and assigned worker, current intent/spec revision, state, next action, blocker or bounded assumption, and relevant artifacts. Distinguish a direction/spec decision owned by Conductor from an implementation decision owned by the lead. Show whether a scope is autonomous or explicitly manual. Keep permission requests distinct from scope-mode choices.

The operator should reach the evidence behind a result without reading every transcript: input/spec, actual submitted adapter input per attempt, output, verification, and final report. Summaries should link to supporting detail and recorded dissent. Fixture-derived state must be visibly attributed to its fixture and build.

## Intervene and observe the result

Direct conversation with an active worker is essential. For a supported steering action, distinguish the human request, delivery, recipient acknowledgement and observed effect. An enabled-looking button or a successful enqueue is not evidence that work stopped or changed.

A correction identifies the affected revision, in-flight work and potentially stale verification. Spec changes and conflicts go through the lead to Conductor; direct input from The Human keeps its attribution without repeated authorization demands. Knowledge views distinguish the candidate author, deciding owner, authorized requester and actual recorder, whether a lead records directly or delegates to Historian. Show what continues, what actually blocks and who owns the next step. Do not imply controls exist before the current owner supplies evidence.

## Recover after interruption

A checkpoint identifies task, source/spec revisions, workspace state, decisions, assumptions, risks and next steps. A successor first reviews the superseded team's ledgers, then chooses which agents to retain, replace or supplement. It reloads current sources, compares the delta, verifies consequential inherited claims and identifies stale assumptions. Show predecessor, successor, ownership-transfer point, retained/replaced agents, reviewer-only scopes, checkpoint and verification outcome. Preserve old ledgers; no predecessor/successor pair may concurrently hold write authority over the same assignment.

A panel reopening after delayed reload exercises a different operation from a worker resuming safely. Report the exact operation demonstrated.

## Branch-based context recovery — proposal

The Human proposes aligning filesystem ownership with the agent hierarchy and using Git-backed progress branches to support context recovery. A lead might gather its owned workers' progress, or a fresh lead might start a new branch with the failed attempt and instructions on what to improve. These are design options, not implemented behavior or a selected ledger-merge algorithm. The earlier “agent colors” source has not yet been recovered for this draft; do not invent a color-to-branch mapping.

A branch can select recorded artifacts and decisions, but reverting it does not erase a running model's context, undo external effects or withdraw messages already delivered. After reviewing the superseded team's ledgers, a successor can construct its working context from an explicit checkpoint and selected evidence. It does not assume that all prior agents or all prior work are unreliable. Preserve the failed attempt, mark superseded decisions and evidence, reconcile in-flight effects, and state what the successor must recheck before dependent work resumes.

Matching directory and agent hierarchies can make ownership discoverable. It does not itself enforce write authority, establish which spec is current, or resolve semantic conflicts when ledgers are combined. Keep contributor identity, assignment/spec revision and attempt lineage when collecting worker results; Git merge success is not agreement on their meaning or promotion into official knowledge.

A short worked example: an export feature fails verification because the team used the wrong timestamp assumption. The successor first reviews the lead and both workers' ledgers, separates the faulty assumption from still-valid work, and records its staffing choice. It might retain the parser worker, keep the former UI worker as a reviewer with no implementation write authority, and add a new implementation worker. Conductor records the ownership transfer; the old lead no longer writes that assignment. The successor rechecks the affected behavior against the spec, preserves the failed attempt and unaffected evidence, and records what changed. This is an example, not a rule to replace any particular role after failure.

A smallest proposed exercise can test that handover with one lead and two workers, checking ledger review, explicit staffing/ownership, superseded evidence and prevention of duplicate effects. This separate exercise must not become a prerequisite for the existing fixture/ledger UI slice.

## Keep the related intent editor discoverable

The recovered threaded editor proposes stable source anchors, comments, focused deliberation and accepted replacement text. This addresses editing intent; runtime supervision addresses ongoing work. Retain the former as a linked design without requiring its entire implementation for the first supervision slice.

The seven workflow steps do not require seven panes. LISA (Locate, Investigate, Solve, Assess) describes useful activities without prescribing a phase-selector UI or particular renderer.

## Evidence currently available

Keep two evidence sets separate.

1. **Earlier synthetic comparison:** System reported both Codex and LISA arms passing the exercised clean and delayed reload checks; wrong builds were rejected before scoring, run order was fixed and cache use differed. This supports only that comparison's checks.
2. **Current fixture panel:** System's owner input, relayed by Triage, reports a GUI available on MSI at localhost:1771. The saved five-test container run covers selection, resize, status and native editor open. Next-action, owner and blocker/hold attribution were observed in source but not asserted by that run. Fixture selection resets on reload; immediate/delayed reload was not verified by that run; the UI has no build-hash display. The presets note belongs to a later playtest.

These are attributed reports rather than raw run artifacts independently inspected for this draft. Do not transfer evidence between the comparison and panel runs. CLI adapter research owns Graph integration, Lab owns portable UI/fixtures and Triage provides the communication relay. The existing Graph preview remains fixture-backed; it does not demonstrate active Git-ledger ingestion. System has now assigned CLI Adapter the first explicitly configured read-only Git-ledger-to-Graph slice. That is an owned next slice, not evidence of completed ingestion. There is no authorization here for ledger writes, active agent control or automatic repository discovery. The broader mock/evaluation is separate and does not gate the fixture/ledger UI.

Before upgrading a claim to live verification, obtain the exact build, fixture/run identities, checks, results and limitations from its owner. Current CLI, panel, Theia migration and transport work retain their existing owners.

## Owner-confirmed Graph contract for the next slice

Lab supplied this target contract; it is not a claim about completed adapter behavior:

- Use the source commit SHA as revision, reported UTC as `asOf`, stable IDs, and per-assignment `updatedAt`.
- Put standalone agent status in participant details. Do not manufacture delegation edges to represent it.
- Structural edges are explicit; communication can cycle.
- Describe last reported active state or status unknown, not online presence. Pass host `now` to compute age without replacing source report time.
- An ACK records acknowledgement, not completion.

CLI Adapter owns the first explicitly configured read-only Git-ledger input. System reports that the initial source is a dedicated localhost bare Git repository with one agent-written status branch. CLI Adapter is proving two local pushes followed by explicit refresh; this is a local proof in progress, not a hosted ledger or completed integration claim. Exact invocation and run results belong to the implementation evidence. This status is neither a documentation publication gate nor a delivery promise.

## Acceptance checks

1. A fixture shows current owner, spec revision, next action and blocker/assumption; every evidence link reaches the intended revision.
2. A steering exercise distinguishes requested, acknowledged and observed outcomes, and marks superseded evidence.
3. A successor exercise detects an intentionally changed assumption before resuming dependent work.
4. An unsupported control cannot masquerade as an implemented action, and fixture behavior cannot masquerade as live orchestration.

These are proposed checks. Require an evidence record before marking any one exercised or verified.

## Provenance

[Seed workbench and controls](../history/snapshots/recovered-design/intent/reference/original-seed/theia.md?plain=1#L43-L98), [verified handoff](../history/snapshots/recovered-design/intent/reference/original-seed/handoff.md?plain=1#L24-L55), [threaded editor](../history/snapshots/recovered-design/intent/threaded-chat-view.md?plain=1#L7-L67), [portable sidebar boundary](../history/snapshots/recovered-design/.prompts/task-contexts/Theia-Orchestrator-Sidebar-Panel.md?plain=1#L98-L175).
