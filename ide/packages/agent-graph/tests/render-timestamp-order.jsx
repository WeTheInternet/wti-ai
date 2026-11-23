import React from 'react';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { AgentGraph } from 'agent-graph/react';
import { fixtures } from 'agent-graph/fixtures';

const cases = [
  { id: 'z', at: '2026-02-18T14:00:00Z' },
  { id: 'm', at: '2026-02-18T14:00:00.123Z' },
  { id: 'a', at: '2026-02-18T14:00:00.000Z' },
];
const driverId = fixtures.small.driverId;
const neighbor = fixtures.small.participants.find(({ id }) => id !== driverId);
const snapshot = {
  ...fixtures.small,
  participants: fixtures.small.participants.filter(({ id }) => id === driverId || id === neighbor.id),
  links: cases.map(({ id, at }) => ({
    id, from: driverId, to: neighbor.id, kind: 'dependency',
    status: 'active', updatedAt: at, label: 'Neighbor order ' + id,
  })),
  communication: cases.map(({ id, at }) => ({
    id, from: neighbor.id, to: driverId, kind: 'acknowledged',
    at, source: 'synthetic-test', label: 'Receipt order ' + id,
  })),
};
const selection = { effortId: snapshot.effortId, participantId: driverId };
const html = renderToStaticMarkup(<AgentGraph snapshot={snapshot} selection={selection} />);
for (const label of ['Neighbor order', 'Receipt order']) {
  const renderedIds = [...html.matchAll(new RegExp(label + ' ([amz])', 'g'))].map((match) => match[1]);
  assert.deepEqual(renderedIds, ['m', 'a', 'z'], label);
}
console.log('Inspector sorts both lists by instant descending, then ID ascending.');
