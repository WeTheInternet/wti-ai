import type { CommunicationKind, GraphLink, GraphSelection, GraphSnapshotV1, LinkStatus } from './index.ts';

const statuses: readonly LinkStatus[] = [
  'active', 'action', 'check', 'hold', 'interrupted', 'completed', 'unknown',
];

const receiptLabels: Record<CommunicationKind, string> = {
  queued: 'Queued',
  delivered: 'Delivered',
  acknowledged: 'Acknowledged',
  resultReported: 'Result reported',
  resultAccepted: 'Result accepted',
  unknown: 'Unknown',
};

export function normalizeLinkStatus(value: unknown): LinkStatus {
  return statuses.find((status) => status === value) ?? 'unknown';
}

export function normalizeCommunicationKind(value: unknown): CommunicationKind {
  return typeof value === 'string' && Object.hasOwn(receiptLabels, value)
    ? value as CommunicationKind
    : 'unknown';
}

export function communicationLabel(value: unknown): string {
  return receiptLabels[normalizeCommunicationKind(value)];
}

export function liveLinksOf(links: readonly GraphLink[]): GraphLink[] {
  return links.filter((link) => link.status !== 'completed');
}

export function selectionFor(snapshot: GraphSnapshotV1, participantId?: string): GraphSelection {
  return participantId !== undefined && snapshot.participants.some(({ id }) => id === participantId)
    ? { effortId: snapshot.effortId, participantId }
    : null;
}
