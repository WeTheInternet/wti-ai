---
status: DRAFT
teams: []
roles: []
authors:
  - JamesXNelson
lastUpdated: 2026-11-23T09:43:27Z
verification:
  - "Role direction supplied by The Human; implementation and proposed recovery mechanics not certified"
---

# Feature delivery workflow

**LISA** stands for **Locate, Investigate, Solve, Assess**.

The Human has defined the role and authority split below. This DRAFT records that direction; it does not certify an implementation. Artifact details, state mechanics and evaluation checks remain design proposals. Repository execution permissions remain governed by AGENTS.md.

## Flow and ownership

**Receive intent → discuss → create spec → deliver spec to workers → create and execute implementation → verify → report.**

Conductor and feature lead have distinct responsibilities. Conductor decides **what** should happen and establishes the people/agents and workflows needed to pursue it. The feature lead is accountable for **making the assigned feature happen**: implementation decisions, coordination, integration, verification and delivery within the spec and permissions. “Team lead” refers to that implementation lead here.

| Responsibility | Accountable role |
|---|---|
| Collect input from The Human; refine intent; define requirements, spec and acceptance criteria | Conductor |
| Invoke code-oriented workflows, generate/route prompts, establish feature leads and supporting helpers | Conductor |
| Choose implementation approach and working plan; do the work or assemble coders, designers, reviewers and testers | Feature lead |
| Assign and coordinate implementation workers; integrate, verify and report the result against the spec | Feature lead, with Conductor oversight |
| Change direction, resolve a requested spec change or an implementation/spec conflict | Conductor; appeal to The Human when needed |
| Select what knowledge from the feature should persist; refine, deny or escalate recording requests | Feature lead within assigned scope; Historian records authorized decisions |

Conductor chiefly works with The Human and feature leads. Workers negotiate with their lead; leads negotiate with Conductor. For a simple feature the lead can implement directly. Harder work can use specialists without making them competing delivery owners. Conductor's oversight does not turn routine implementation choices into repeated approval requests.

The Human can work directly with Conductor, a lead or any worker. Triage remains a raw connector: it preserves addressed messages and receipts and reports delivery problems without changing work meaning, priorities, specs or knowledge decisions.

## Program-owned mechanics and agent-backed judgment

The proposed harness owns explicit state and revisions, assignments, prompt assembly/routing, receipt/result reconciliation and follow-through under configured policy. It keeps attempted, acknowledged, observed and completed states distinct and associates results with the correct revision and attempt. This workflow structure should not need to be rediscovered by an LLM each turn.

Agent-backed Conductor judgment refines intent, requirements and specs and decides direction. Agent-backed lead judgment selects and coordinates the implementation. The program records and applies permitted transitions; an agent statement alone does not prove execution, verification or completion. This responsibility split does not prescribe process count or grant additional permissions.

## Stage outputs

| Step | Accountable owner and useful result |
|---|---|
| Receive intent | Conductor records the desired outcome, constraints, source input and relationship to a project goal. |
| Discuss | Conductor refines intent with The Human and relevant evidence; the lead and specialists contribute feasibility, alternatives and pitfalls. Record bounded assumptions. |
| Create spec | Conductor defines observable behavior, acceptance criteria, constraints, exclusions and unresolved assumptions, with a spec revision. A small change can use a few paragraphs. |
| Deliver to workers | Conductor assigns a feature lead and the spec. The lead performs or delegates implementation with clear scope, capabilities, evidence, permission limits and escalation conditions. |
| Implement | The lead chooses the realization plan and implementation decisions. Workers report evidence and conflicts to the lead; artifacts remain attributable to revision and attempt. |
| Verify | The lead checks the result against intent and acceptance criteria, using independent challenge where useful. Record failures and limits. A spec conflict goes to Conductor. |
| Report | The lead delivers the usable result and evidence, remaining limits and proposed durable knowledge. Conductor reconciles the outcome with project intent and The Human. |

A spec does not create permission. The lead cannot silently redefine acceptance criteria to fit its result. Conductor cannot treat an inferred requirement or provisional assumption as accepted user intent. The flow scales with the task and does not require seven agents, screens or repeated human sign-off.

LISA remains useful inside this flow without requiring a rigid GUI phase selector.

## Design, feedback and revision

The flow is iterative: **shape a small outcome → design and implement → inspect evidence and feedback → revise the affected intent, spec or implementation → verify again**. A useful prototype can expose the next question without settling the final architecture. This proposed loop makes the recovered [interpretation revision rules](../history/snapshots/recovered-design/intent/reference/original-seed/interpretation.md?plain=1#L108-L147) explicit; it does not introduce a mandatory meeting, extra agent or routine approval gate.

Start with enough intent and observable acceptance criteria to judge the next useful result. The lead selects proportionate design review, experiments and independent challenge before expensive or difficult-to-reverse work. For a small, well-understood change, a short spec and direct implementation can suffice. For an uncertain interaction, inspect a small prototype or playtest before expanding it.

User feedback, failed verification, a conflicting constraint or hidden coupling can reopen the relevant decision. The lead owns changes to the implementation and plan within the spec. If the desired behavior, scope or acceptance criteria need to change, the lead sends the evidence and proposed change to Conductor. Conductor resolves direction within its authority or asks The Human where needed; autonomous and manual scope rules still apply.

Keep the prior spec and decision evidence. Record what changed, why, who owns the next step, and which assignments or verification results are affected. The lead reconciles in-flight attempts before retrying and re-verifies affected claims against the resulting spec revision. Unaffected authorized work can continue. A passing check against an obsolete spec is not evidence that the revised request is satisfied.

At a useful milestone, report the usable outcome, evidence, remaining uncertainty and next feedback opportunity. Mark temporary shortcuts and their revisit triggers so a later architect can distinguish delivery expedience from an accepted design. The lead selects durable learning through the [knowledge workflow](project-knowledge.md); neither a successful prototype nor an accumulated transcript automatically becomes project policy.

## Autonomous scopes, changes and human steering

The default is continued authorized progress. Conductor handles ambiguity about intent or requirements; the lead handles implementation choices within the spec. Each makes bounded, reversible assumptions visible, preserves useful alternatives and continues independent work when only one part is blocked.

Manual mode is The Human's per-scope choice to stop and ask on ambiguity. Neither mode grants missing permission or overrides an explicit stop. Timeouts, consensus and expanded plans cannot supply authority.

If a worker finds a spec conflict or believes the spec should change, it appeals through its lead to Conductor. Conductor resolves the direction or appeals to The Human. The lead can pursue clearly identified provisional work within its scope while a decision is pending; provisional work is not acceptance of a changed spec or a permanent knowledge claim.

Direct steering from The Human keeps its source and authority as it reaches the active agent. Routing a spec-affecting instruction to Conductor reconciles the spec and downstream work; it is not a demand that The Human prove the same authorization to several agents. Conductor may flag conflicts or unforeseen consequences. The lead reconciles affected implementation, in-flight actions and superseded verification. Check possible prior effects before retries.

## Successor ownership

A successor feature lead starts by reviewing the ledgers of the team it supersedes. It then chooses which agents to retain, replace or supplement. A failed attempt does not make every prior agent unreliable. Unselected agents may be archived or retained in explicit reviewer scopes when their earlier context remains useful.

Conductor makes the feature ownership transfer explicit. Preserve predecessor/team ledgers as evidence, identify the assignment and spec revision being transferred, and reconcile in-flight effects. Predecessor and successor must not concurrently hold write authority over the same assignment. Retained workers receive their current lead and scope; a predecessor or former worker retained as reviewer does not keep its old write authority by implication. The mechanism enforcing this boundary remains to be designed.

## Supporting responsibilities

- **Guru:** understands recorded knowledge and in-flight intent; supplies evidence, alternatives and pitfalls. Show both sides of unresolved claims and flag new evidence that merits reopening discussion.
- **Researcher:** acquires relevant external information within scoped read-only context and assesses relevance/resource safety without giving orders. The Human requires input before an operation affected by an exfiltration warning proceeds; timeout/redaction details remain open.
- **Chronicler:** records what happened, distinguishing attributed reports from observed events and verified results. It also selects useful ledger evidence and explains its future value in a paper-trail PR for the lead to review into the feature's working branch. Keep that PR open while work develops and merge selected evidence at a meaningful feature milestone, within delegated permissions. See [Chronicler evidence curation](project-knowledge.md#chronicler-evidence-curation-and-milestone-review).
- **Historian:** may act as a scribe tracking official documentation and carrying out lead/Conductor recording decisions. By default it accepts knowledge-recording requests only from Conductor or a lead; workers ask their lead to forward them. See [project knowledge](project-knowledge.md).
- **Implementation specialists:** coders, designers, reviewers and testers contribute under the lead's coordination; the lead owns the implementation response and next step.

The harness remains independent of Theia. GUI and CLI surfaces can expose progress, evidence and direct steering; see [operator supervision](operator-supervision.md).

## Separate design mock and evaluation

This broader evaluation is separate from the fixture/ledger UI slice and is not its prerequisite or mandatory ceremony for routine work.

Use a realistic slice: Conductor turns real-ish intent into a spec, then a feature lead implements, verifies and delivers without routine human interaction. Independently challenge whether apparently successful implementation and tests satisfy the request. Include failed verification with bounded retry/stop, mid-run redirection, lead-directed knowledge recording, and a fresh successor detecting changed evidence. Preserve actual post-assembly adapter input per attempt, distinct from previews or unobservable provider internals.

Budget coordination and verification effort before the exercise. Compare delivery quality, operator comprehension and cost with a plain CLI workflow. Successful panel reload alone does not establish orchestration or safe context recovery.

## Provenance and open implementation choices

[Recovered fast paths and deliberate transitions](../history/snapshots/recovered-design/intent/delta-from-seed.md?plain=1#L22-L45), [revisioned interpretation](../history/snapshots/recovered-design/intent/reference/original-seed/interpretation.md?plain=1#L108-L147), and [verified handoff](../history/snapshots/recovered-design/intent/reference/original-seed/handoff.md?plain=1#L24-L55) preserve useful prior design. The older [worker pause rule](../history/snapshots/recovered-design/intent/worker.md?plain=1#L32-L40) differs from The Human's later autonomous-default decision and should not silently override it.

The transport, runtime process count, storage engine and deployment architecture remain implementation choices. This contract does not adopt Quarkus, GKE, Deephaven, a fixed graph schema or a particular GUI renderer.

The former proposal that feature lead was simply a feature-scoped Conductor is superseded by the role split above. Preserve that earlier proposal in the private review record rather than presenting it as current policy. Runtime packaging, storage, transport and branch-based recovery mechanics remain open.
