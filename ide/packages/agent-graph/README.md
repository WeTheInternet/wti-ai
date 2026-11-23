# Agent Graph 0.1.6

Portable Agent Graph source derived from the radial spike archive
`40d067f1afb121e65f92c476ba4043a03550a4e3550b4280803ed3d0312e7a25`.
This package uses React as an external peer and has no dependency on Theia.

## Entry points

| Import | Exports |
| --- | --- |
| `agent-graph` | `GraphSnapshotV1`, `Participant`, `GraphLink`, `LinkStatus`, `CommunicationEvent`, `CommunicationKind`, `Artifact`, `GraphSelection`, `AgentGraphDataset`, `CrewReportSource`, `ParticipantReport`, `AgentGraphHost`, `AgentGraphProps`, `AgentGraphFixtures`, and framework-independent model and layout helpers |
| `agent-graph/react` | `AgentGraph`, `AgentGraphProps` |
| `agent-graph/fixtures` | `fixtures`, `cyclicFixture`, `fixtureArtifact`, `ledgerReviewFixture`, `participantLedgerFixture`, `crewStateFixtures` |

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

## Dataset view

Pass optional `dataset` to put the selector above crew details and move
source and provenance behind a disclosure after the graph. The available
source types are `fixture` and `crew-ledger`. The demo ships synthetic
fixtures only. Crew Ledger owns the approved roster and source metadata.
The host controls the dataset options and supplies the snapshot and reports.

`selectedId` must identify the snapshot and reports currently displayed.
During asynchronous loading, keep the previous selection and snapshot
together until the replacement is ready. The selector emits an ID and
does not fetch or merge roster data. Missing reports leave names and roles
visible without assigning participant statuses.

## Crew report states

Use the dataset selector in `demo.html` to explore the mixed, no-report,
empty-crew, unavailable, and last-verified examples. All are synthetic.

- A blocker or explicit operator request leads **Needs attention**.
- **Stale report** describes elapsed time since the report. It preserves the
  reported state and does not create or dismiss an action. Configure
  `dataset.crewReports.staleAfterMs` from the source's expected cadence.
  The fixture uses 30 minutes.
- **No report yet** describes a known participant without a report.
  **No crew members in this dataset** describes a successfully read empty roster.
- Set `dataset.crewReports.state` to `unavailable` when the source could not be
  read. The panel says current status is unknown. With `lastVerified: true`,
  supply the retained snapshot and its original time. The panel marks it as
  historical and omits report request actions.

## Clicking through participant reports

Selecting a bubble or crew row shows that participant’s own reports first.
For an explicit blocker or operator request, supply `actionOwnerId` when the
source establishes a stable participant identity. The inspector links to
that owner and lists the reports waiting on them. Use `actionOwnerLabel`
for a source-provided name without a stable participant ID. A missing
owner stays unknown. A verified `action.href` provides a source-record
link. Last-verified historical snapshots leave that action unavailable.

For the first real-data integration, the host should pass an approved
Crew Ledger snapshot and reports into the existing dataset view. Use the
source’s reported timestamps and stable IDs, preserve the Git revision in
provenance, and expose only explicitly supported source-record destinations.
Validate the same participant from the crew row, graph, and report-owner
link in the native panel. Report inspection does not dispatch work or
write to the source.

## Participant ledger

Pass optional `reports` to `AgentGraph` to show the portable ledger. Use
`blocker` or `operatorRequest` with a short reason, and `routine` for compact
reports that can be expanded. Report IDs are stable and participant IDs refer
to participants in the snapshot. Reports are independent of structural
links and do not change the **Graph alerts** count.

The host may supply one explicit destination for a priority report with
`action: { label, href, preview? }`. Use a verb and object for the label.
Destinations can be absolute HTTP(S), mailto, or an existing same-document
fragment supplied by the host. The primary button selects the participant
and opens a dialog at the current scroll position. The optional preview has
a title and body. **View source record** in the dialog follows the supplied
destination. Escape closes the dialog and returns focus to the button.

Without a supported destination, **View agent details** selects the
participant and leaves the reason visible. The map marks affected
participants with an exclamation point and shows a separate participant
attention count. **Graph alerts** continues to count structural link alerts.

Open `demo.html` for the offline multi-participant example. **Open request** opens the request dialog.
The dialog’s **View source record** link targets an embedded synthetic record. A host that reuses the
fixture should render that record at the same fragment or supply its own
record-backed destination.

## Graph alerts

The **Graph alerts** panel counts structural links marked `action`. **No graph
alerts** describes that graph-specific count. Host ledger status, freshness,
and broader next-step labels belong to the host.

For a graph alert, `attention.affectedId` can identify an agent other than the
link target. `attention.reportedStatus` and `attention.reportedAt` describe the
reported state and its timestamp. The link status and update time are the
defaults. The agent link opens the inspector. The exact report time is
available on keyboard focus and hover.

Provide `attention.nextStep.label` for an explicit corrective action. Add
`attention.nextStep.href` only when the source supplies a destination. The
portable view renders absolute HTTP(S) or mailto destinations as links.
A missing or unsupported destination leaves a prominent text action.

## Fixture map

| Export | Identity and purpose |
| --- | --- |
| `fixtures.small` | `effort-lantern` r1. Pilot exposes the synthetic artifact. |
| `fixtures.dense` | `effort-greenhouse` r1. 48 participants and 84 links. Focus Layout lead to see repeated routes to Gauge. |
| `fixtures.status.before` and `fixtures.status.after` | `effort-status-transition` r1/r2. `l-adapter` completes, `l-adapter-verify` remains unknown, and an ACK leaves `l-design` active. |
| `ledgerReviewFixture` | `effort-ledger-review` r1. Switchboard has an action-needed report with a corrective step and no destination. |
| `cyclicFixture` | `effort-cycle-diagnostic` r1. A structural cycle tests the diagnostic and receipt inspector. |

The host resolves **`fixture:lantern-handoff`** to
**`fixtures/lantern-handoff.md`** via its own allowlist. The graph shows the
artifact label with or without a bridge. It exposes **Open artifact** only
when the bridge advertises availability for that reference. Selection never
calls the bridge. An explicit click calls it and reports its result.

Run `npm test` with Node 24 for dependency-free model, fixture, and layout
tests. The included fixtures contain fictional data.

Open `demo.html` directly to play the offline stand-alone review fixture.
