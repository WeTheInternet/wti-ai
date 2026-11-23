# Theia Workbench Direction

## Purpose

The project now clearly wants multiple dedicated interfaces rather than one giant chat pane.

The conductor should still feel central, but each stage of the pipeline deserves its own working surface.

## Main surfaces

### 1. Conductor window

The entrypoint for:
- new prompts
- candidate intent clarification
- route selection
- accepted intent creation/update
- quick action choice

This is where the user should see the row of next-step options.

This surface should also host a threaded chat view with a selection-driven interaction panel.

#### Threaded chat surface

- conversation is presented as bubbles
- selecting text (or a whole bubble) is a first-class operation

#### Interaction panel (selection-driven)

When the user selects text in a bubble, the interaction panel should:
- show a highlighted quote of the selection
- re-render the bubble with the selection highlighted
- show existing threads for the selection, expanded

Concise actions:
- Promote (combobox)
- + Comment
- Send → Deliberation
- Optional rating with tooltips

Deliberation happens in a separate context; only an accepted replacement suggestion flows back and updates a `.wti` document.

### 2. Deliberation window

A thread/graph-oriented interface for:
- matters
- proposals
- reasons
- judgments
- decisions
- summaries
- branch reopening

This should feel debate-map-like without becoming unreadable.

### 3. Spec builder

A more authoritative structured document surface for:
- requirements
- acceptance criteria
- constraints
- assumptions
- edge cases
- open questions

### 4. Work plan window

A living task graph for turning specs into bounded worker tasks.

### 5. Verification window

A review-oriented surface for:
- implementation inspection
- spec compliance
- challenge notices
- retry loops
- reflection on whether to return to deliberation/spec

### 6. Artifact/document panes

Views into:
- code
- docs
- tests
- summaries
- logs
- promoted knowledge

## Timeline and linking

The conductor surface should provide timeline-style navigation across the lifecycle of a request.

From one place, the user should be able to jump to:
- initial prompt
- accepted intent
- related deliberation
- active spec
- work plan
- worker runs
- validation outcome
- archived predecessors

## Deliberation visualization

The user is unsure whether the main visual metaphor should feel more like:
- debate map
- legal case file
- design review
- task graph with argument metadata

That uncertainty is worth preserving.

A likely answer is:
- thread-first for human interaction
- graph-backed for retrieval and dependency logic
- summaries to collapse resolved noise

## Summary behavior

When a branch is resolved:
- generate a summary
- get it approved by branch participants or governing roles
- let ordinary readers consume the summary first
- keep the full history available through drill-down

This is one of the highest-value UX ideas in the current direction.

## Working rule

Each interface should match the kind of work being done.
Do not force all thinking into one universal pane.
