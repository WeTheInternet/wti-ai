# Threaded chat view

## Purpose

Define a threaded chat view that supports selection-based interaction and links seed prompt text to comments and deliberation threads.

## Source bubble model

- Seed prompt text is rendered as source bubbles.
- A bubble contains smaller addressable pieces.
  - sentence
  - paragraph
  - arbitrary text range
  - whole bubble
- Comments and deliberation threads attach to a bubble + piece anchor.
- Each bubble has stable identity and can be referenced by comments/threads.
- Bubbles can contain rich text, code blocks, and links.

## Selection model

Selections are anchored to a bubble and a range within the bubble.

Supported selection scopes:
- sentence
- paragraph
- arbitrary text range
- whole bubble

Gestures are desired UX, not a hard requirement.

Aspirational examples:
- drag to select text range
- click sentence/paragraph affordance to expand selection
- click a bubble header to select whole bubble

## Interaction panel

The interaction panel is likely a main-area editor.

When a selection is made, the interaction panel should:
- re-render the source bubble with the selection highlighted
- show a highlighted quote of the selected text
- open existing comment threads for that selection (expanded)

### Controls (concise)

Prefer a small set of controls:
- Promote: [combobox]
- + Comment
- Send → Deliberation
- optional rating with tooltip

## Deliberation rule

- Deliberation happens in a separate context from the Conductor and the threaded chat view.
- Successful deliberation can produce update suggestions for the selected text (or to change a larger selection of the source material).
- Only an accepted replacement flows back from deliberation.
- By default, the original author must approve changes, unless that author was an agent and the suggestion is from a human.
- The return value is a suggested replacement for the selected source text.

## v0 success path

- User selects a piece of source text.
- User sends it to deliberation.
- Deliberation yields a replacement suggestion.
- User accepts the replacement.
- Acceptance updates the `.wti` document representing recorded intent.
