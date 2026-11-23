import * as React from '@theia/core/shared/react';
import { AgentGraph } from '@wti/agent-graph/react';
import type { GraphSelection } from '@wti/agent-graph';
import { agentColor, staleLimitLabel } from '../common/graph-ledger-display.js';
import { LedgerRelativeTime } from './ledger-relative-time.js';
import type { GraphLedgerService, LedgerRead, LedgerSource } from '../common/graph-ledger-protocol.js';

/** Host-side source controls; display clock advances, but reads never poll. */
export function GraphLedgerPanel({ service }: { service: GraphLedgerService }): React.ReactElement {
    const [sources, setSources] = React.useState<LedgerSource[]>([]);
    const [selected, setSelected] = React.useState('');
    const [configurationError, setConfigurationError] = React.useState('');
    const [values, setValues] = React.useState<ReadonlyMap<string, LedgerRead>>(new Map());
    const [errors, setErrors] = React.useState<ReadonlyMap<string, string>>(new Map());
    const [busy, setBusy] = React.useState(false);
    const [selection, setSelection] = React.useState<GraphSelection>(null);
    const graph = React.useRef<HTMLDivElement>(null);
    const [now, setNow] = React.useState(Date.now());
    React.useEffect(() => {
        let active = true;
        service.listSources().then(result => {
            if (!active) return;
            setSources(result.sources);
            setSelected(result.sources[0]?.id ?? '');
            setConfigurationError(result.configurationError ?? '');
        }).catch(() => { if (active) setConfigurationError('Source configuration could not be loaded.'); });
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => { active = false; window.clearInterval(timer); };
    }, [service]);
    const current = values.get(selected);
    const error = errors.get(selected);
    async function refresh(): Promise<void> {
        if (!selected || busy) return;
        const sourceId = selected;
        setBusy(true);
        try {
            const result = await service.refresh(sourceId);
            if (result.ok) {
                setValues(previous => new Map(previous).set(sourceId, result.value));
                setErrors(previous => { const next = new Map(previous); next.delete(sourceId); return next; });
            } else setErrors(previous => new Map(previous).set(sourceId, result.error.message));
        } catch {
            setErrors(previous => new Map(previous).set(sourceId, 'Refresh failed: the backend connection is unavailable.'));
        } finally { setBusy(false); setNow(Date.now()); }
    }
    const age = current ? now - Date.parse(current.source.reportedAt) : undefined;
    const freshness = age === undefined ? 'No status loaded.' : age < -1000 ? 'Future timestamp · freshness unknown'
        : age > current!.source.staleAfterMs ? `Stale · report exceeds ${staleLimitLabel(current!.source.staleAfterMs)} limit` : 'Stored snapshot';
    const h = React.createElement;
    function inspect(participantId: string): void {
        if (!current) return;
        setSelection({ effortId: current.snapshot.effortId, participantId });
        graph.current?.scrollIntoView({ block: 'nearest' });
    }
    return h('section', { className: 'wti-ledger', 'aria-label': 'Git ledger status' },
        h('header', { className: 'wti-ledger-toolbar' },
            h('h2', {}, sources.find(source => source.id === selected)?.label ?? 'Agent status'),
            h('button', { type: 'button', className: 'wti-ledger-refresh', onClick: refresh, disabled: busy || !selected }, busy ? 'Refreshing…' : 'Refresh'),
            h('div', { className: 'wti-ledger-header-meta' },
                h('span', { className: 'wti-ledger-muted' }, 'Read-only · stored reports'),
                current && h('span', { className: 'wti-ledger-freshness', 'data-testid': 'ledger-freshness', 'data-stale': age! > current.source.staleAfterMs }, freshness),
                current && h('span', { className: 'wti-ledger-muted' }, 'Reported ', h(LedgerRelativeTime, {
                    timestamp: current.source.reportedAt, now, label: 'Reported', testId: 'ledger-reported-time', seconds: current.source.staleAfterMs < 60000
                })))),
        configurationError && h('p', { role: 'alert', className: 'wti-ledger-error' }, configurationError),
        sources.length === 0 && h('p', {}, 'No ledger source configured.'),
        error && h('p', { role: 'alert', className: 'wti-ledger-error' }, `${error}${current ? ' Showing the last successful snapshot; it may be outdated.' : ''}`),
        current ?
            h('div', { className: 'wti-ledger-agents' }, ...current.participantReports.map(report => {
                const participant = current.snapshot.participants.find(p => p.id === report.participantId)!;
                const owner = current.snapshot.participants.find(p => p.id === report.ownerId);
                const initials = participant.name.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
                return h('article', {
                    key: report.participantId, className: 'wti-ledger-agent',
                    style: { '--wti-agent-color': agentColor(participant.id) } as React.CSSProperties,
                    'aria-label': `Reported status for ${participant.name}`
                },
                    h('header', { className: 'wti-ledger-agent-heading' },
                        h('button', { type: 'button', className: 'wti-ledger-identity', 'aria-label': `Inspect ${participant.name}`, onClick: () => inspect(participant.id) },
                            h('span', { className: 'wti-ledger-avatar', 'aria-hidden': true }, initials),
                            h('span', {}, h('strong', {}, participant.name), h('span', { className: 'wti-ledger-role' }, participant.role)), h('span', { className: 'wti-ledger-inspect-label', 'aria-hidden': true }, 'Inspect')),
                        h('div', { className: 'wti-ledger-report' },
                            h('span', { className: 'wti-ledger-status', 'data-state': report.status,
                                'data-testid': `ledger-status-${report.participantId}` }, `Reported ${report.status}`),
                            h('span', { className: 'wti-ledger-muted' }, 'Updated ', report.updatedAt
                                ? h(LedgerRelativeTime, { timestamp: report.updatedAt, now, label: 'Updated' }) : 'Unknown'))),
                    report.blockedReason && h('p', { className: 'wti-ledger-blocker' }, h('strong', {}, 'Blocked: '), report.blockedReason),
                    h('p', { className: 'wti-ledger-next' }, h('strong', {}, 'Next step: '), h('span', {}, report.nextAction ?? 'Unknown')),
                    (!owner || owner.id !== participant.id) && h('footer', { className: 'wti-ledger-agent-meta' },
                        h('span', {}, 'Owner: ', owner ? h('button', {
                            type: 'button', className: 'wti-ledger-inline-inspect',
                            style: { '--wti-agent-color': agentColor(owner.id) } as React.CSSProperties,
                            'aria-label': `Inspect owner ${owner.name}`, onClick: () => inspect(owner.id)
                        }, owner.name) : 'Unknown')));
            }))
            : h('p', { 'data-testid': 'ledger-freshness' }, freshness),
        h('details', { className: 'wti-ledger-provenance' },
            h('summary', {}, 'Source & provenance ', current && h('code', {}, current.source.commit.slice(0, 10))),
            h('div', { className: 'wti-ledger-source' },
                h('label', {}, 'Source', h('select', {
                    'aria-label': 'Ledger source', value: selected, disabled: busy || !sources.length,
                    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => { setSelected(event.target.value); setSelection(null); }
                }, ...sources.map(source => h('option', { key: source.id, value: source.id }, source.label))))),
            current && h('dl', {},
                h('dt', {}, 'Source commit'), h('dd', { 'data-testid': 'ledger-commit' }, h('code', {}, current.source.commit)),
                h('dt', {}, 'Report written'), h('dd', {}, h(LedgerRelativeTime, { timestamp: current.source.reportedAt, now, label: 'Report written' })),
                h('dt', {}, 'Observed at refresh'), h('dd', {}, h(LedgerRelativeTime, { timestamp: current.source.readAt, now, label: 'Observed at refresh', testId: 'ledger-observed-time' })),
                h('dt', {}, 'Effort'), h('dd', {}, current.snapshot.effortId),
                h('dt', {}, 'Agent IDs'), h('dd', {}, current.snapshot.participants.map(p => `${p.name}: ${p.id}`).join('; '))),
            h('p', { className: 'wti-ledger-muted' }, 'Refresh changes observation time, not report time. Stored reports do not establish current execution or connectivity.')),
        current && h('div', { ref: graph, className: 'wti-ledger-map' }, h(AgentGraph, {
            snapshot: current.snapshot, now: new Date(now).toISOString(), selection, onSelectionChange: setSelection
        })));
}
