import type { GraphSnapshotV1 } from '@wti/agent-graph';

export const GraphLedgerService = Symbol('GraphLedgerService');
export const graphLedgerPath = '/services/wti-agent-graph-ledger';
export interface LedgerSource { id: string; label: string }
export interface ParticipantReport {
    participantId: string;
    status: 'active' | 'blocked' | 'idle' | 'completed' | 'unknown';
    updatedAt?: string;
    nextAction?: string;
    ownerId?: string;
    blockedReason?: string;
}
export interface LedgerRead {
    snapshot: GraphSnapshotV1;
    participantReports: ParticipantReport[];
    source: LedgerSource & { commit: string; reportedAt: string; readAt: string; staleAfterMs: number };
}
export type LedgerResult = { ok: true; value: LedgerRead } | {
    ok: false;
    error: { code: 'unconfigured' | 'missing' | 'invalid' | 'timeout' | 'unavailable' | 'busy'; message: string };
};
export interface GraphLedgerService {
    listSources(): Promise<{ sources: LedgerSource[]; configurationError?: string }>;
    refresh(sourceId: string): Promise<LedgerResult>;
}
