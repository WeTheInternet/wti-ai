import type { AgentGraphFixtures, CrewReportSource, GraphSnapshotV1, Participant, ParticipantReport } from './index.ts';
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
export const ledgerReviewFixture: GraphSnapshotV1 = {
  ...small,
  effortId: 'effort-ledger-review',
  name: 'Ledger review',
  links: small.links.map((link) => {
    if (link.id === 'l-approval') {
      const { attention: _attention, ...coordinationLink } = link;
      return { ...coordinationLink, status: 'active', label: 'Coordinate with the decision owner' };
    }
    if (link.id !== 'l-triage') return link;
    return {
      ...link,
      status: 'action',
      label: 'Approved ledger location is missing',
      attention: {
        ownerId: 'a-vale',
        affectedId: 'a-triage',
        detail: 'The source owner has not supplied approved coordinates for the Git status summary.',
        reportedStatus: 'action',
        reportedAt: '2026-02-18T13:57:00Z',
        nextStep: { label: 'Ask the source owner for the approved repository or mirror, branch or ref, and summary path.' },
      },
    };
  }),
};
export const participantLedgerFixture = {
  snapshot: {
    ...ledgerReviewFixture,
    effortId: 'effort-participant-ledger',
    name: 'Ledger review',
    links: ledgerReviewFixture.links.map((link) => link.status === 'action'
      ? { ...link, status: 'active' as const }
      : link),
  } satisfies GraphSnapshotV1,
  request: {
    id: 'ledger-request-scope-review',
    title: 'Review the proposed ledger scope',
    detail: 'The source owner proposes one approved mirror, one ref, and one summary path for the status feed. Confirm that the feed will read only the selected summary.',
  },
  reports: [
    { id: 'report-sketch', participantId: 'a-design', kind: 'routine', status: 'active',
      reportedAt: '2026-02-18T13:59:00Z', details: 'Sketch is comparing the compact graph layout with the neighborhood view.' },
    { id: 'report-switchboard', participantId: 'a-triage', kind: 'blocker', status: 'action',
      reportedAt: '2026-02-18T13:57:00Z', actionOwnerId: 'a-vale', reason: 'The approved repository or mirror, ref, and summary path are still missing.' },
    { id: 'report-vale', participantId: 'a-vale', kind: 'operatorRequest', status: 'action',
      reportedAt: '2026-02-18T13:55:00Z', actionOwnerId: 'a-pilot', reason: 'A proposed read-only scope is ready for the operator to review.',
      action: {
        label: 'Open request',
        href: '#ledger-request-scope-review',
        preview: {
          title: 'Review the proposed ledger scope',
          body: 'Confirm that the feed will read only the selected summary.',
        },
      } },
    { id: 'report-patch', participantId: 'a-adapter', kind: 'routine', status: 'completed',
      reportedAt: '2026-02-18T13:47:00Z', details: 'Patch reported that the synthetic adapter handoff was ready for verification.' },
    { id: 'report-gauge', participantId: 'a-verify', kind: 'routine', status: 'active',
      reportedAt: '2026-02-18T13:52:00Z', details: 'Gauge is checking the sample’s keyboard path.' },
  ] satisfies readonly ParticipantReport[],
};

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

interface CrewStateExample {
  label: string;
  snapshot: GraphSnapshotV1;
  reports?: readonly ParticipantReport[];
  crewReports: CrewReportSource;
  now?: string;
}

const staleAfterMs = 30 * 60 * 1000;
const data = participantLedgerFixture.snapshot;
const emptyCrew: GraphSnapshotV1 = { ...data, effortId: 'effort-empty-crew', name: 'Empty crew',
  driverId: '', participants: [], links: [], communication: [] };
const mixedReports: readonly ParticipantReport[] = participantLedgerFixture.reports.map((report) => (
  report.participantId === 'a-triage' || report.participantId === 'a-verify'
    ? { ...report, reportedAt: '2026-02-18T13:05:00Z' }
    : report
));

export const crewStateFixtures = {
  mixed: {
    label: 'Crew report states',
    snapshot: data,
    reports: mixedReports,
    crewReports: { state: 'available', staleAfterMs },
  },
  noReports: {
    label: 'Crew with no reports',
    snapshot: { ...data, effortId: 'effort-no-reports', name: 'Crew with no reports' },
    reports: [],
    crewReports: { state: 'available', staleAfterMs },
  },
  empty: {
    label: 'Empty crew',
    snapshot: emptyCrew,
    crewReports: { state: 'available', staleAfterMs },
  },
  unavailable: {
    label: 'Crew source unavailable',
    snapshot: { ...emptyCrew, effortId: 'effort-no-crew-source', name: 'Crew source unavailable' },
    crewReports: { state: 'unavailable', reason: 'The selected source could not be read.' },
  },
  retained: {
    label: 'Unavailable with last verified snapshot',
    snapshot: { ...data, effortId: 'effort-retained-crew', name: 'Last verified crew snapshot' },
    reports: mixedReports,
    now: '2026-02-18T15:05:00Z',
    crewReports: { state: 'unavailable', reason: 'The selected source could not be read.', lastVerified: true, staleAfterMs },
  },
} satisfies Record<string, CrewStateExample>;
