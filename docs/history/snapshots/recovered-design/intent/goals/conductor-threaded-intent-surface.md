# Goal: Conductor threaded intent surface

## Goal

Turn the seed prompt into a threaded conversation surface where the user can interact with, comment on, and refine recorded intent at the level of individual pieces of text.

## Model

- The seed prompt is rendered as source bubbles.
- A bubble contains smaller addressable pieces (sentence/paragraph/subrange).
- The user can interact with any piece directly.

## User actions

- The user can add comments and weighted ratings anywhere without deliberation.
- The user can send any selected piece to deliberation (fresh context) to resolve contradictions and produce accepted truth.
- Deliberation returns a suggested replacement for the selected source text.
- The user accepts the replacement and it is committed into the `.wti` document representing recorded intent.
- The user can ship it at any time to write intent to disk and/or send to an ImplementationEngine.

## Links

- Threaded chat view: `../threaded-chat-view.md`
- Implementation engines: `../implementation-engines.md`

## v0 acceptance criteria

- The Conductor presents a threaded chat surface where seed prompt text is rendered as source bubbles.
- The user can select a piece of text within a bubble and open an interaction panel for that selection.
- The user can add a comment thread to any selected piece without sending it to deliberation.
- Sending a selected piece to deliberation runs in a separate context.
- Deliberation returns a suggested replacement for the selected source text.
- Accepting the replacement updates a `.wti` document that represents recorded intent.
- The user can ship it to commit intent to disk and/or dispatch the finalized intent to a SoftwareImplementationEngine.
