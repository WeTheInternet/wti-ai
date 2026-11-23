# Agent Graph 0.1.0

Portable Agent Graph source derived from the radial spike archive
`40d067f1afb121e65f92c476ba4043a03550a4e3550b4280803ed3d0312e7a25`.
This package uses React as an external peer and has no dependency on Theia.

## Entry points

| Import | Exports |
| --- | --- |
| `agent-graph` | `GraphSnapshotV1`, `Participant`, `GraphLink`, `LinkStatus`, `CommunicationEvent`, `CommunicationKind`, `Artifact`, `GraphSelection`, `AgentGraphHost`, `AgentGraphProps`, `AgentGraphFixtures`, and framework-independent model and layout helpers |
| `agent-graph/react` | `AgentGraph`, `AgentGraphProps` |
| `agent-graph/fixtures` | `fixtures`, `cyclicFixture`, `fixtureArtifact` |

The package exports source. Use the host's TypeScript/JSX/CSS build, enable
TypeScript source imports (for example, `allowImportingTsExtensions` with
`noEmit`), and resolve a single host React instance. The CSS is imported by
the React entry point. `index.html` is the fixture demo entry in a Vite
workspace with React and React DOM already available.

```tsx
import { AgentGraph } from 'agent-graph/react';
import { fixtures } from 'agent-graph/fixtures';

export function Preview() {
  return <AgentGraph snapshot={fixtures.small} />;
}
```

Omit `selection` for local focus. Pass an effort-scoped selection, including
`null` to clear focus, together with `onSelectionChange` to control it.
The callback reports user selection changes. A border copy always selects
the canonical participant. The snapshot's `asOf` is the default display clock.
With controlled selection, pass a new selection in response to the callback
to accept the interaction.

Structural links determine layout. A cycle leaves the participant inspector
available through a picker. Receipt evidence never advances structural
status. Unknown statuses and communication kinds use the Unknown label.

## Fixture map

| Export | Identity and purpose |
| --- | --- |
| `fixtures.small` | `effort-lantern` r1. Pilot exposes the synthetic artifact. |
| `fixtures.dense` | `effort-greenhouse` r1. 48 participants and 84 links. Focus Layout lead to see repeated routes to Gauge. |
| `fixtures.status.before` and `fixtures.status.after` | `effort-status-transition` r1/r2. `l-adapter` completes, `l-adapter-verify` remains unknown, and an ACK leaves `l-design` active. |
| `cyclicFixture` | `effort-cycle-diagnostic` r1. A structural cycle tests the diagnostic and receipt inspector. |

The host resolves **`fixture:lantern-handoff`** to
**`fixtures/lantern-handoff.md`** via its own allowlist. The graph shows the
artifact label with or without a bridge. It exposes **Open artifact** only
when the bridge advertises availability for that reference. Selection never
calls the bridge. An explicit click calls it and reports its result.

Run `npm test` with Node 24 for dependency-free model, fixture, and layout
tests. The included fixtures contain fictional data.
