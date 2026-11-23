import type { GraphSnapshotV1, GraphLink, CommunicationEvent, Participant } from '@wti/agent-graph';
import type { ParticipantReport } from '../common/graph-ledger-protocol.js';

const object = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected object');
    return value as Record<string, unknown>;
};
const text = (value: unknown, max = 1024): string => {
    if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new Error('Invalid text');
    return value;
};
const id = (value: unknown): string => {
    const result = text(value, 128);
    if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(result)) throw new Error('Invalid ID');
    return result;
};
const time = (value: unknown): string => {
    const result = text(value, 40);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(result) || !Number.isFinite(Date.parse(result))) throw new Error('Invalid UTC time');
    return result;
};
const list = (value: unknown, max: number): unknown[] => {
    if (!Array.isArray(value) || value.length > max) throw new Error('Invalid list');
    return value;
};
const fields = (value: Record<string, unknown>, allowed: string[]): void => {
    if (Object.keys(value).some(key => !allowed.includes(key))) throw new Error('Unexpected summary field');
};
const unique = (values: readonly { id: string }[]): void => {
    if (new Set(values.map(value => value.id)).size !== values.length) throw new Error('Duplicate ID');
};

/** Deliberately small status-only v1 summary. No prompts, transcripts or attachments. */
export function decodeLedgerSummary(raw: string, commit: string): {
    snapshot: GraphSnapshotV1; participantReports: ParticipantReport[];
} {
    const data = object(JSON.parse(raw));
    fields(data, ['schemaVersion', 'effortId', 'name', 'driverId', 'reportedAt', 'participants', 'assignments', 'communication']);
    if (data.schemaVersion !== 1) throw new Error('Unsupported status summary');
    const participantReports: ParticipantReport[] = [];
    const participants: Participant[] = list(data.participants, 128).map(value => {
        const p = object(value);
        fields(p, ['id', 'name', 'role', 'creatorId', 'workstreamIds', 'status', 'updatedAt', 'nextAction', 'ownerId', 'blockedReason']);
        const participant: Participant = { id: id(p.id), name: text(p.name, 128), role: text(p.role, 128) };
        if (p.creatorId !== undefined) participant.creatorId = id(p.creatorId);
        if (p.workstreamIds !== undefined) participant.workstreamIds = list(p.workstreamIds, 16).map(id);
        const status = ['active', 'blocked', 'idle', 'completed', 'unknown'].includes(String(p.status))
            ? p.status as ParticipantReport['status'] : 'unknown';
        participantReports.push({
            participantId: participant.id, status,
            ...(p.updatedAt === undefined ? {} : { updatedAt: time(p.updatedAt) }),
            ...(p.nextAction === undefined ? {} : { nextAction: text(p.nextAction, 512) }),
            ...(p.ownerId === undefined ? {} : { ownerId: id(p.ownerId) }),
            ...(p.blockedReason === undefined ? {} : { blockedReason: text(p.blockedReason, 512) })
        });
        return participant;
    });
    unique(participants);
    const ids = new Set(participants.map(p => p.id));
    const participantId = (value: unknown): string => {
        const result = id(value);
        if (!ids.has(result)) throw new Error('Unknown participant');
        return result;
    };
    participants.forEach(p => { if (p.creatorId) participantId(p.creatorId); });
    participantReports.forEach(p => { if (p.ownerId) participantId(p.ownerId); });
    const links: GraphLink[] = list(data.assignments, 256).map(value => {
        const link = object(value);
        fields(link, ['id', 'from', 'to', 'kind', 'status', 'updatedAt', 'label', 'attention']);
        if (link.kind !== 'delegation' && link.kind !== 'dependency') throw new Error('Invalid structural kind');
        const result: GraphLink = {
            id: id(link.id), from: participantId(link.from), to: participantId(link.to), kind: link.kind,
            status: ['active', 'action', 'check', 'hold', 'interrupted', 'completed', 'unknown'].includes(String(link.status))
                ? link.status as GraphLink['status'] : 'unknown',
            updatedAt: time(link.updatedAt), label: text(link.label, 512)
        };
        if (link.attention !== undefined) {
            const attention = object(link.attention); fields(attention, ['ownerId', 'detail']);
            result.attention = { ownerId: participantId(attention.ownerId), detail: text(attention.detail, 512) };
        }
        return result;
    });
    unique(links);
    const communication: CommunicationEvent[] = list(data.communication, 512).map(value => {
        const event = object(value);
        fields(event, ['id', 'from', 'to', 'kind', 'at', 'source', 'correlationId', 'label']);
        return {
            id: id(event.id), from: participantId(event.from), to: participantId(event.to),
            kind: ['queued', 'delivered', 'acknowledged', 'resultReported', 'resultAccepted', 'unknown'].includes(String(event.kind))
                ? event.kind as CommunicationEvent['kind'] : 'unknown',
            at: time(event.at), source: text(event.source, 128), label: text(event.label, 512),
            ...(event.correlationId === undefined ? {} : { correlationId: id(event.correlationId) })
        };
    });
    unique(communication);
    return {
        snapshot: { schemaVersion: 1, effortId: id(data.effortId), name: text(data.name, 128),
            driverId: participantId(data.driverId), revision: commit, asOf: time(data.reportedAt), participants, links, communication },
        participantReports
    };
}
