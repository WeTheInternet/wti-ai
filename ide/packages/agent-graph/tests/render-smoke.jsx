import React from 'react';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { AgentGraph } from 'agent-graph/react';
import { fixtures, fixtureArtifact, cyclicFixture, ledgerReviewFixture, participantLedgerFixture, crewStateFixtures } from 'agent-graph/fixtures';

let opens = 0;
const reference = fixtureArtifact.opaqueRef;
const host = { openArtifact: {
  isAvailable: (ref) => ref === reference,
  openArtifact: async () => { opens++; return { status: 'opened' }; },
} };
const pilot = { effortId: fixtures.small.effortId, participantId: 'a-pilot' };
const view = (snapshot, selection, bridge) =>
  renderToStaticMarkup(<AgentGraph snapshot={snapshot} selection={selection} host={bridge} />);

assert.match(view(fixtures.small, pilot, host), /aria-label="Open artifact Project Lantern handoff"/);
assert.doesNotMatch(view(fixtures.small, pilot), /aria-label="Open artifact/);
assert.doesNotMatch(view(fixtures.small, pilot, {
  openArtifact: { ...host.openArtifact, isAvailable: () => false },
}), /aria-label="Open artifact/);
assert.match(view(fixtures.small, pilot), /Project Lantern handoff/);
assert.match(view(fixtures.small, null, host), /Pick a bubble/);
assert.match(view(fixtures.small, { ...pilot, effortId: 'wrong-effort' }, host), /Pick a bubble/);
assert.equal(opens, 0, 'selection never executes the open capability');

assert.match(view(cyclicFixture, { ...pilot, effortId: cyclicFixture.effortId }), /contain a cycle/);
assert.match(view(cyclicFixture, { ...pilot, effortId: cyclicFixture.effortId }), /No new interruptions/);
assert.match(view(cyclicFixture, null), /Inspect participant/);

const after = fixtures.status.after;
const sketch = view(after, { effortId: after.effortId, participantId: 'a-design' });
assert.match(sketch, /Sketch acknowledged the brief/);
assert.match(sketch, /Unclassified receipt/);
const patch = view(after, { effortId: after.effortId, participantId: 'a-adapter' });
assert.match(patch, /Delivered/);
assert.match(patch, /Result reported/);
assert.match(patch, /Result accepted/);
assert.match(patch, /data-status="unknown"/);
assert.match(patch, /Completed connections/);
console.log('React static rendering passed for controlled selection, artifact capability, cycle fallback, and receipt/history evidence.');

const ledger = view(ledgerReviewFixture, null);
assert.match(ledger, /aria-label="Graph alerts"/);
assert.match(ledger, /Switchboard.*Action needed.*Reported 3 min ago.*Blocker.*Next step.*Ask the source owner/);
assert.doesNotMatch(ledger, /<a[^>]*>Ask the source owner/);
const withLink = (href) => ({
  ...ledgerReviewFixture,
  links: ledgerReviewFixture.links.map((link) => link.status === 'action'
    ? { ...link, attention: { ...link.attention, nextStep: { label: 'Inspect report', href } } }
    : link),
});
assert.match(view(withLink('https://example.test/report'), null), /<a href="https:\/\/example.test\/report">Inspect report/);
assert.match(view(withLink('javascript:invalid'), null), /<p>Inspect report<\/p>/);
assert.match(view({ ...ledgerReviewFixture, links: [] }, null), />No graph alerts<\/p>/);
console.log('Attention rendering passed for ordering, timestamp, explicit destination, unsafe destination, and graph-only empty state.');

const participantLedger = renderToStaticMarkup(<AgentGraph snapshot={participantLedgerFixture.snapshot}
  reports={participantLedgerFixture.reports} />);
assert.match(participantLedger, /Blocker.*Switchboard.*View agent details.*still missing.*Operator request.*Vale.*Open request/);
assert.match(participantLedger, /<button[^>]+aria-haspopup="dialog"[^>]*>Open request<\/button>/);
assert.match(participantLedger, /Routine reports.*Sketch.*Active.*Patch.*Completed.*Gauge.*Active/);
assert.match(participantLedger, />No graph alerts<\/p>/);
assert.match(participantLedger, /2 participants need action/);
assert.doesNotMatch(view(participantLedgerFixture.snapshot, null), /aria-label="Participant ledger"/);
console.log('Participant ledger passed for priority order, explicit record and fallback actions, and independent graph alerts.');

const options = [
  { id: 'fixture', label: 'Fixture', source: 'fixture' },
  { id: 'roster', label: 'Roster source', source: 'crew-ledger' },
];
const datasetView = (snapshot, selectedId, reports) => renderToStaticMarkup(
  <AgentGraph snapshot={snapshot} reports={reports} dataset={{ options, selectedId, onChange() {} }} />);
const datasetFixture = datasetView(participantLedgerFixture.snapshot, 'fixture', participantLedgerFixture.reports);
assert.match(datasetFixture, /Dataset.*Synthetic fixture.*Crew details.*Coordination map.*Source and provenance/);
assert.match(datasetFixture, /<optgroup label="Crew Ledger">/);
const emptyCrew = datasetView({ ...fixtures.small, participants: [], links: [], communication: [] }, 'roster');
assert.match(emptyCrew, /data-source="crew-ledger"/);
assert.match(emptyCrew, /No crew members in this dataset/);
assert.doesNotMatch(emptyCrew, /No participant reports in this dataset/);
assert.doesNotMatch(datasetView(fixtures.small, 'invalid'), /Coordination map/);
console.log('Dataset view passed for source distinction, crew-first order, and empty or unknown selections.');

const renderCrew = ({ snapshot, reports, now, crewReports }) => renderToStaticMarkup(
  <AgentGraph snapshot={snapshot} reports={reports} now={now}
    dataset={{ options, selectedId: 'fixture', onChange() {}, crewReports }} />);
const mixedCrew = renderCrew(crewStateFixtures.mixed);
assert.match(mixedCrew, /Needs attention.*Switchboard.*Stale report.*Other reports.*Gauge.*Stale report.*No reports.*No report yet/);
const noReports = renderCrew(crewStateFixtures.noReports);
assert.match(noReports, /No participant reports in this dataset/);
assert.doesNotMatch(noReports, /participants need action|participant needs action|Stale report/);
assert.match(renderCrew(crewStateFixtures.empty), /No crew members in this dataset/);
const unavailable = renderCrew(crewStateFixtures.unavailable);
assert.match(unavailable, /Crew source unavailable.*Current status is unknown/);
assert.doesNotMatch(unavailable, /No crew members|No report yet|Coordination map/);
const verifiedCrew = renderCrew(crewStateFixtures.retained);
assert.match(verifiedCrew, /Showing the last verified snapshot.*Needed attention in last snapshot/);
assert.doesNotMatch(verifiedCrew, />Open request<|No report yet/);
console.log('Crew view passed for empty roster, missing and stale reports, unavailable source, and last verified snapshot.');

const selectedCrew = (sample, participantId) => renderToStaticMarkup(<AgentGraph
  snapshot={sample.snapshot} reports={sample.reports} now={sample.now}
  selection={{ effortId: sample.snapshot.effortId, participantId }}
  dataset={{ options, selectedId: 'fixture', onChange() {}, crewReports: sample.crewReports }} />);
assert.match(selectedCrew(crewStateFixtures.mixed, 'a-triage'), /Participant reports.*Blocker.*Stale report.*Next-action owner/);
assert.match(selectedCrew(crewStateFixtures.mixed, 'a-vale'), /Participant reports.*View source record.*Waiting on this participant.*Switchboard/);
assert.match(selectedCrew(crewStateFixtures.mixed, 'a-watch'), /Participant reports.*No report yet/);
assert.doesNotMatch(selectedCrew(crewStateFixtures.retained, 'a-vale'), /View source record/);
console.log('Participant inspector passed for ownership, reverse lookup, source record, missing report, and historical action suppression.');
