import React from 'react';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { AgentGraph } from 'agent-graph/react';
import { fixtures, fixtureArtifact, cyclicFixture } from 'agent-graph/fixtures';

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
