import type { AgentGraphFixtures, GraphSnapshotV1, Participant } from './index.ts';
import { normalizeCommunicationKind, normalizeLinkStatus } from './model.ts';
import { baseline, snapshotAt } from './fixture.js';

export const fixtureArtifact = Object.freeze({
  opaqueRef: 'fixture:lantern-handoff',
  label: 'Project Lantern handoff',
  sourcePath: 'fixtures/lantern-handoff.md',
});

function snapshotFrom(sample: typeof baseline.pilot): GraphSnapshotV1 {
  const participants = sample.agents.map(({ id, name, role, neighborhood }): Participant => {
    const creatorId = sample.links.find((link) => link.to === id && link.kind === 'delegation')?.from;
    return {
      id, name, role,
      ...(creatorId ? { creatorId } : {}),
      workstreamIds: [neighborhood],
      ...(id === 'a-pilot' && sample.id === baseline.pilot.id
        ? { artifacts: [{ opaqueRef: fixtureArtifact.opaqueRef, label: fixtureArtifact.label }] }
        : {}),
    };
  });
  return {
    schemaVersion: 1,
    effortId: sample.id,
    name: sample.name,
    revision: 'r1',
    asOf: snapshotAt,
    driverId: sample.driverId,
    participants,
    links: sample.links.map((link) => ({
      ...link,
      kind: link.kind === 'dependency' ? 'dependency' : 'delegation',
      status: normalizeLinkStatus(link.status),
    })),
    communication: sample.events.map((event) => ({
      ...event, kind: normalizeCommunicationKind(event.kind), source: 'synthetic-fixture',
    })),
  };
}

const small = snapshotFrom(baseline.pilot);
const dense = snapshotFrom(baseline.dense);
const statusBefore: GraphSnapshotV1 = {
  ...small, effortId: 'effort-status-transition', name: 'Status transition',
  links: small.links.map((link) => link.id === 'l-adapter-verify' ? { ...link, status: 'unknown' } : link),
};

const statusAfter: GraphSnapshotV1 = {
  ...statusBefore, revision: 'r2', asOf: '2026-02-18T14:04:00Z',
  links: statusBefore.links.map((link) => link.id === 'l-adapter'
    ? { ...link, status: 'completed', updatedAt: '2026-02-18T14:02:00Z' }
    : link),
  communication: [
    ...statusBefore.communication,
    { id: 'e-adapter-delivered', from: 'a-triage', to: 'a-adapter', kind: 'delivered',
      at: '2026-02-18T14:01:00Z', source: 'synthetic-fixture', correlationId: 'e-adapter',
      label: 'Adapter review request delivered' },
    { id: 'e-design-ack', from: 'a-design', to: 'a-triage', kind: 'acknowledged',
      at: '2026-02-18T14:03:00Z', source: 'synthetic-fixture', correlationId: 'l-design',
      label: 'Sketch acknowledged the brief' },
    { id: 'e-design-unknown', from: 'a-triage', to: 'a-design', kind: 'unknown',
      at: '2026-02-18T14:03:00Z', source: 'synthetic-fixture', label: 'Unclassified receipt' },
    { id: 'e-patch-result', from: 'a-adapter', to: 'a-triage', kind: 'resultReported',
      at: '2026-02-18T14:02:00Z', source: 'synthetic-fixture', correlationId: 'l-adapter',
      label: 'Adapter result reported' },
    { id: 'e-patch-acceptance', from: 'a-triage', to: 'a-adapter', kind: 'resultAccepted',
      at: '2026-02-18T14:04:00Z', source: 'synthetic-fixture', correlationId: 'l-adapter',
      label: 'Coordinator accepted the adapter result' },
  ],
};

export const fixtures: AgentGraphFixtures = { small, dense, status: { before: statusBefore, after: statusAfter } };

export const cyclicFixture: GraphSnapshotV1 = {
  ...small, effortId: 'effort-cycle-diagnostic', name: 'Invalid circular dependency',
  links: [
    ...small.links,
    { id: 'l-invalid-return', from: 'a-verify', to: 'a-pilot', kind: 'dependency',
      status: 'unknown', updatedAt: snapshotAt, label: 'Synthetic invalid return dependency' },
  ],
};
