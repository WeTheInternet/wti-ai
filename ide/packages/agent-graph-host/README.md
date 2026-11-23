---
status: DRAFT
teams: []
roles: [agent]
authors: [JamesXNelson]
lastUpdated: 2026-11-23T00:00:00Z
verification:
  - "Combined exact-head container validation required before merge"
---

# Agent Graph packaging and native preview

The portable `../agent-graph` source is pinned to `agent-graph-portable-v0.1.0.zip`
(36,127 bytes), SHA-256
`b9b5332e7885bd6af0b6877bf55d02f56cda28057c8ece13114d8bf54694b242`.
The sole approved source exception changes three display strings to **Graph alerts**
and **No graph alerts** in `src/AgentBubbles.jsx`; resulting SHA-256:
`e3487a912a6f752ab8882840882b8cda7f6012279b6c845864d7f94b0c751ec7`.
All other imported files remain byte-identical. See `portable-provenance.json`.
This milestone does not include later standalone playtest releases.

This host package stages portable source without rewriting it, bundles browser
ESM with React external, and emits supporting declarations. Only generated
relative declaration imports are normalized to `.js`. Infra retains its NodeNext
compiler settings and consumes `@wti/agent-graph` built outputs. Its frontend
explicitly imports portable and host stylesheets. Build scripts include the Infra
workspace dependency closure so staging precedes Infra and the IDE bundle.

Open **Agent Graph (Preview)** using **Ctrl+Alt+G** or its View command. The native
panel starts in the main docking area and offers small, dense, status-before,
status-after, and cyclic fictional fixtures. Selection only inspects participants;
it does not start work. Border copies select the same canonical participant.
Structural delegation/dependency links determine layout; communication receipts
never imply execution or completion. The ledger source option is disabled until
an operator explicitly configures sources; see
[the read-only source contract](../../agents/infra/GRAPH-LEDGER.md).

The only editor capability resolves the opaque reference `fixture:lantern-handoff`
to `wti-agent-graph:/fixtures/lantern-handoff.md`. A read-only ResourceResolver
serves the exact packaged Markdown fixture in the native editor. It does not edit
the physical fixture or depend on the opened workspace. No arbitrary graph-supplied
path, URI, session link, terminal action, or workflow dispatch is accepted.

## Validation

From the repository root, the existing authorized container workflow is:

```sh
bash ide/tests/container/build.sh
bash ide/tests/container/test.sh
```

The standard runner performs frozen installation, native loading, portable model
and fixture tests, staged declaration/ESM generation, Infra compilation, IDE build,
and Playwright tests. It retains the merged Markdown-preview, source-snapshot
exclusions, isolated test profiles, and process-group cleanup behavior.

Graph coverage includes native reveal, selection/resizing, artifact editor content,
status semantics, dense canonical selection and cyclic diagnostics. Capability
unit tests cover reference rejection, resource resolution and asynchronous results.
Read-only ledger tests cover pinned Git reads, disabled defaults, RPC confinement,
synthetic local updates and multi-participant display. No real producer reports,
private ledger configuration, writer implementation, or rollout evidence is included.

The newly composed branch requires combined exact-head validation; historical
results from other worktrees are not a validation claim for this composition.
Manual drag-docking, standalone/native visual parity and browser editing rejection
remain separate checks. Staging currently has no watch rebuild command.
