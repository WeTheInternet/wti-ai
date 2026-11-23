# Native host integration

Use the source entry `agent-graph/react` for `AgentGraph`. Keep the host's React
instance and process the package's CSS imports in the host build. The model and
types are exported from `agent-graph`. Synthetic fixtures have their own entry.
The participant ledger is internal to the graph component.

```tsx
import { AgentGraph } from 'agent-graph/react';
import type { AgentGraphDataset, GraphSnapshotV1, ParticipantReport } from 'agent-graph';

function CrewPanel({ snapshot, reports, dataset }: {
  snapshot: GraphSnapshotV1;
  reports: readonly ParticipantReport[];
  dataset: AgentGraphDataset;
}) {
  return <AgentGraph snapshot={snapshot} reports={reports} dataset={dataset}
    now={new Date().toISOString()} ledger={{ order: 'chronological' }} />;
}
```

Give each report a stable ID and a participant ID that exists in the snapshot.
Use the reported time for `reportedAt` and the host clock for `now`. Set
`dataset.crewReports` from the host's observation and explicitly set a stale
threshold only when agreed. Supply graph edges and receipt events only when
supported by data. An empty crew may use an empty snapshot and the dataset
wrapper's empty state.

For a blocked row use `kind: 'blocker'`, `status: 'blocked'` and `reason`.
Provide `humanDependency.detail` and `agentFollowUp` as separate fields.
Set `ledger.operatorId` only when the host knows the operator's canonical ID.
The signed-in operator sees “Needs you” on a current report only when its
explicit human assignee ID matches. Routine rows use `kind: 'routine'`.

Use `history: { href, verified: true }` only for a verified root-relative
same-origin destination. This control currently renders an ordinary anchor.
Host-owned in-panel History navigation needs its own binding. The portable
component does not fetch, refresh or implement the hosting route.

The chronological changes relative to v0.1.6 touch `src/AgentBubbles.jsx`,
`src/ParticipantLedger.jsx`, `src/index.ts` and `src/ledger.css`.
This package also carries the approved timestamp comparator fix and an
inspector regression under `tests/`.
