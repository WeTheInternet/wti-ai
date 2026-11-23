import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  communicationLabel, liveLinksOf, makeRadialLayout, normalizeLinkStatus,
  projectFocus, radialContext, selectionFor, topology,
} from 'agent-graph';
import { cyclicFixture, fixtureArtifact, fixtures } from 'agent-graph/fixtures';

test('fixtures use valid IDs, fixed clocks, and a real artifact reference', () => {
  for (const s of [fixtures.small, fixtures.dense, fixtures.status.before, fixtures.status.after]) {
    assert.equal(s.schemaVersion, 1);
    assert.ok(Number.isFinite(Date.parse(s.asOf)));
    for (const list of [s.participants, s.links, s.communication]) {
      assert.equal(new Set(list.map(({ id }) => id)).size, list.length);
    }
    const ids = new Set(s.participants.map(({ id }) => id));
    for (const { from, to } of [...s.links, ...s.communication]) assert.ok(ids.has(from) && ids.has(to));
    assert.ok(topology(s.participants, s.links));
  }
  const pilot = fixtures.small.participants.find(({ id }) => id === fixtures.small.driverId);
  assert.equal(pilot.artifacts[0].opaqueRef, fixtureArtifact.opaqueRef);
  assert.match(readFileSync(new URL('../' + fixtureArtifact.sourcePath, import.meta.url), 'utf8'), /Project Lantern handoff/);
  assert.deepEqual(selectionFor(fixtures.small, pilot.id), { effortId: fixtures.small.effortId, participantId: pilot.id });
  assert.equal(selectionFor(fixtures.small, 'nonexistent'), null);
});

test('unknown inputs remain unknown and receipts do not change structural status', () => {
  for (const raw of [null, 'future-state', 'constructor', undefined]) {
    assert.equal(normalizeLinkStatus(raw), 'unknown');
    assert.equal(communicationLabel(raw), 'Unknown');
  }
  const states = new Map([
    ['queued', 'Queued'], ['delivered', 'Delivered'], ['acknowledged', 'Acknowledged'],
    ['resultReported', 'Result reported'], ['resultAccepted', 'Result accepted'],
  ]);
  for (const [state, label] of states) assert.equal(communicationLabel(state), label);
  const { before, after } = fixtures.status;
  assert.equal(before.effortId, after.effortId);
  assert.notEqual(before.revision, after.revision);
  const status = (s, id) => s.links.find((link) => link.id === id)?.status;
  assert.equal(status(before, 'l-design'), 'active');
  assert.equal(status(after, 'l-design'), 'active');
  assert.ok(after.communication.some((event) => event.kind === 'acknowledged' && event.correlationId === 'l-design'));
  assert.equal(status(after, 'l-adapter-verify'), 'unknown');
  assert.equal(status(after, 'l-adapter'), 'completed');
  assert.ok(!liveLinksOf(after.links).some((link) => link.id === 'l-adapter'));
});

test('communication is bidirectional and excluded from DAG validation', () => {
  const events = fixtures.small.communication;
  assert.ok(events.some((event) => event.from === 'a-pilot' && event.to === 'a-watch'));
  assert.ok(events.some((event) => event.from === 'a-watch' && event.to === 'a-pilot'));
  assert.ok(topology(fixtures.small.participants, fixtures.small.links));
  assert.equal(topology(cyclicFixture.participants, cyclicFixture.links), null);
  assert.deepEqual(cyclicFixture.communication, events);
});

test('dense focus projects repeated routes onto copies of one canonical participant', () => {
  const { participants, links, driverId } = fixtures.dense;
  assert.equal(participants.length, 48);
  assert.equal(links.length, 84);
  const layout = makeRadialLayout(participants, links, driverId);
  assert.equal(layout.parent.get('a-dense-1-6'), 'a-dense-1-4');
  const ids = new Set(participants.map(({ id }) => id));
  const idle = radialContext(layout, links, ids, undefined, false, false);
  assert.ok(idle.visible.size < participants.length);
  const focusId = 'a-dense-0-0';
  const focus = radialContext(layout, links, ids, focusId, false, false);
  const projection = projectFocus(layout, links, focus.visible, focusId);
  const copies = projection.portals.filter(({ destination }) => destination === 'a-verify');
  assert.ok(copies.length > 1);
  assert.equal(copies.reduce((sum, copy) => sum + copy.count, 0), 6);
  assert.ok(copies.every((copy) => !selectionFor(fixtures.dense, copy.key)));
  assert.deepEqual(projection.points.get(focusId), layout.points.get(focusId));
});
