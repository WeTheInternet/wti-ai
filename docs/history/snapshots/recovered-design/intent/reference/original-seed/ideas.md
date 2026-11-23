# Ideas, Loose Ends, and Important Details

This document holds important details that do not yet deserve their own full spec, but should remain visible so they are not forgotten.

---

## Naming and framing ideas

- "Intent Compiler" is strong because it implies structured transformation, not magic.
- The system may benefit from describing output artifacts as **compiled intent artifacts**.
- "Interpretation" should be a first-class term, not just a planning step.
- Consider whether "Guru" should remain the final name or whether a less mystical name would better signal read-only context compilation.

---

## Epistemic tagging

Every durable statement should carry a type tag such as:

- source_fact
- human_asserted
- derived_summary
- inferred
- hypothesis
- decision
- validation_result
- deprecated

This may feel heavy early on, but the system will become untrustworthy without it.

---

## Save-versus-discard discipline

Important principle: **the system should bias toward forgetting** unless a piece of information is clearly durable and useful.

Possible retention levels:
- discard immediately
- keep only in active task checkpoint
- keep for current session only
- promote to project knowledge
- queue for human review before promotion

---

## Context rot heuristics

The system needs a practical notion of when a worker is degrading.

Possible signals:
- too many unresolved assumptions
- repeated rereading of the same material
- increasing contradiction count
- high token pressure
- too many tool results not captured in checkpoint form
- rising uncertainty or divergence from source truth
- work duration beyond a configured threshold

---

## Warm boot details

Warm boot should probably include a delta report:
- what source files changed since predecessor checkpoint
- what knowledge rows changed
- which prior assumptions may now be stale
- whether current scope still matches original interpretation

The successor should not blindly inherit predecessor belief.

---

## UI notes for Theia

- A DAG or tree of task nodes will scale better than chat tabs alone.
- The "decision trace" should be filterable by:
  - approvals,
  - file edits,
  - failures,
  - interpretation changes,
  - knowledge promotions.
- Human controls should likely operate on task nodes, not raw messages.
- The system may need separate views for:
  - work execution,
  - memory curation,
  - failed or paused subtasks.

---

## Potential anti-patterns

### Monologue theater
Showing huge streams of raw "thinking" may look transparent while actually hiding the signal.

### Memory landfill
Saving every summary or attempted idea will degrade future performance.

### Over-decomposition
Spawning many agents can create merge pain, monitoring fatigue, and fake progress.

### Hidden interpretation
If interpretation is not explicit, it still exists; it is just invisible and riskier.

### Confused authority
Embeddings, summaries, and source files are not equal forms of truth.

---

## Candidate event types

These are examples, not yet a locked schema:

- IntentReceived
- InterpretationCreated
- InterpretationRevised
- ContextHydrated
- WorkerProvisioned
- WorkerWarmBooted
- CheckpointWritten
- ScopeExpanded
- ScopeRejected
- FilePatched
- TestRunCompleted
- LintFailed
- HandoffInitiated
- HandoffCompleted
- MemoryCandidateProposed
- KnowledgePromoted
- KnowledgeRejected
- HumanInterruptReceived
- TaskRetired

---

## Open design questions

- Should a single task-agent ever own multiple disjoint file scopes?
- When should the orchestrator automatically fork subtasks versus ask the human?
- How should semantic merge conflicts be presented in Theia?
- How much of the system should be deterministic versus model-mediated?
- Should the knowledge store record embeddings directly, or treat them as an index sidecar?
- When should a promoted fact expire or require revalidation?
- What is the smallest useful acceptance scenario that exercises the whole lifecycle?
- How do we distinguish project lore from hard project policy?

---

## Evaluation ideas

A future evaluation harness should test:
- correctness of interpretation under ambiguity
- faithfulness of context hydration
- task completion under cold boot
- successor continuity under warm boot
- precision of memory promotion
- operator comprehension in Theia
- conflict handling under concurrent subtasks
- recovery after context invalidation mid-task

---

## Packaging idea for future sessions

When this project plan is handed to a clean session, consider giving it in this order:

1. `main.md`
2. `intent.md`
3. `scenarios.md`
4. only then the role/pipeline documents as needed

That ordering may encourage the new session to reason from purpose and examples before prematurely fixing on infrastructure.

---

## Cultural note

The system should reward disciplined reduction of ambiguity, not just confident execution. A useful harness says:
- "this is the current interpretation,"
- "these are the assumptions,"
- "this is what changed,"
- "this is what I am not sure about,"
rather than merely behaving as though uncertainty does not exist.
