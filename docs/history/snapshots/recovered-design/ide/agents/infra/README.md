# Prime agent (Theia-integrated)

`@Prime` is a Theia chat agent that produces structured `ops` work orders and orchestrates specialist agents.

## The `ops` block

Prime always starts by emitting an `ops` block. This block is a work order and an instruction-passing channel between agents.

- It captures intent, constraints, deliverables, and verification.
- Delegations should follow the `Prompt:` section inside the `ops` block.

## Modes

- **design**: Coordinates **Architect + Coder** to create or edit docs/specs.
  - Typical flow: Architect proposes structure/decisions, Coder applies edits.
- **implement**: Runs a **Coder ⇄ Reviewer** loop (uses **Architect as reviewer** for now).
  - If review requests changes, Prime sends a follow-up to Coder.
- **review**: Requests review from **Architect** and splits results into:
  - **FOR_SURE** changesets delegated to Coder immediately.
  - **SUGGESTIONS** returned to the user for another iteration.
- **test**: Orchestrates **Coder + AppTester** loops to get tests passing.
  - If blocked (env details, flaky failures), Prime stops and asks the user for help.
