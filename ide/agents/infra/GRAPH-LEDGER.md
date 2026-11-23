---
status: DRAFT
teams: []
roles: [agent]
authors: [JamesXNelson]
lastUpdated: 2026-11-23T00:00:00Z
verification:
  - "Combined exact-head reader, synthetic refresh and GUI tests required before merge"
---

# Read-only local Git status preview

The Agent Graph panel offers a `ledger` view alongside fictional fixtures.
Backend startup defaults to **zero sources**. Selecting a source does not read it;
**Refresh** performs the local read. The display clock updates ages without polling
Git. Stored reports are not live execution, connectivity or an authoritative roster.
This milestone has no writer, dispatch, mailbox, provider or producer rollout.

## Explicit configuration

An operator may set `WTI_AGENT_GRAPH_LEDGER_SOURCES` at backend startup to a JSON
array of at most eight records. Fields are `id`, `label`, absolute local `repo`,
full `ref` (`refs/heads/...` or `refs/remotes/...`), repository-relative JSON
`summaryPath`, and optional `staleAfterMs` (default 300000, range 1000–86400000).
Configuration is trusted operator input, not frontend data or actor authentication.
No configured sources, machine paths or real reports ship with the demo. The generic
GUI launcher neither forwards this variable nor mounts ledger repositories.

The frontend can only call `listSources()` and `refresh(sourceId)`. A null-prototype
RPC facade exposes those two methods, not configuration, constructors or transport.
Malformed configuration disables the source list instead of discovering repositories.
Each refresh resolves a tip once and pins subsequent type, size and blob operations
to that exact commit/path. Limits are one MiB, a five-second command budget and one
concurrent read. Git receives fixed argument arrays, not a shell; no inherited
credentials, global/system configuration, hooks, fsmonitor, replacement objects,
optional writes, lazy fetch or network protocols are enabled. No history is scanned.

Read failures use bounded messages without raw Git errors or repository paths. The
UI retains its last successful snapshot and shows the refresh error. Report and
observation times remain distinct; relative ages expose exact UTC on hover/focus.
Staleness names the configured report-age limit. **Inspect** selects the canonical
participant internally; it does not invent a session URL or execute a next action.

## Summary contract

The reader accepts a small, status-only v1 JSON shape. For example:

```json
{
  "schemaVersion": 1,
  "effortId": "fictional-example",
  "name": "DEMONSTRATION — fictional report",
  "driverId": "example-worker",
  "reportedAt": "2026-01-01T00:00:00Z",
  "participants": [{
    "id": "example-worker", "name": "Example worker", "role": "Fictional worker",
    "status": "active", "updatedAt": "2026-01-01T00:00:00Z",
    "nextAction": "Review the fictional example", "ownerId": "example-worker"
  }],
  "assignments": [],
  "communication": []
}
```

The decoder rejects unknown fields, including prompts, transcripts and attachments.
This is structural validation, not a semantic guarantee that free text is non-sensitive.
Operators must consent to the source and its contents before configuring it.
Stable IDs remain source identities; the commit becomes snapshot `revision`, and
reported UTC becomes `asOf`. Per-participant status, update time, next action, owner
and optional blocker stay host metadata. Missing evidence displays as Unknown.
Only explicit assignment records create delegation/dependency links. ACK, result
reported and result accepted remain distinct communication evidence; none advances
a structural link's status. A completed participant does not create a completed edge.

## Synthetic validation only

`graph-ledger-reader.spec.ts` covers disabled defaults, source-ID confinement,
immutable blob reads, data/size/deadline rejection and the RPC facade.
`graph-ledger-refresh.spec.ts` creates disposable file-only Git repositories with
fictional status records; it checks explicit Refresh after a local update, no
background advance, stale labels, unchanged report time on reread, focusable exact
timestamps and last-good retention on read failure. `graph-ledger-demo.spec.ts`
uses separate fictional blocked/active/completed reports and checks canonical
keyboard Inspect, provenance and narrow layouts with no inferred links.
No real report publishing or independent producer capability is established.
