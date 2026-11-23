import { test, expect } from '@playwright/test';
import { LocalGraphLedger, LedgerReadError, configuredGraphLedger, parseLedgerSources, publicLedgerEndpoint } from '../../../agents/infra/lib/node/graph-ledger-reader.js';

const commit = 'a'.repeat(40);
const source = { id: 'synthetic', label: 'Synthetic reader test', repo: '/never-read-by-fake',
    ref: 'refs/heads/synthetic', summaryPath: 'status/summary.json', staleAfterMs: 1000 };
const summary = {
    schemaVersion: 1, effortId: 'synthetic-reader-test', name: 'Synthetic only', driverId: 'one', reportedAt: '2026-11-23T00:00:00Z',
    participants: [{ id: 'one', name: 'One', role: 'Worker', status: 'active' }, { id: 'two', name: 'Two', role: 'Worker' }],
    assignments: [{ id: 'assignment', from: 'one', to: 'two', kind: 'delegation', status: 'active', updatedAt: '2026-11-23T00:00:00Z', label: 'Example' }],
    communication: [{ id: 'ack', from: 'two', to: 'one', kind: 'acknowledged', at: '2026-11-23T00:00:00Z', source: 'synthetic', label: 'Received' }]
};
function fake(bytes = Buffer.from(JSON.stringify(summary))) {
    const calls: string[][] = [];
    return { calls, run: async (_repo: string, args: string[]) => {
        calls.push(args);
        if (args[0] === 'rev-parse') return Buffer.from(commit + '\n');
        if (args[1] === '-t') return Buffer.from('blob\n');
        if (args[1] === '-s') return Buffer.from(String(bytes.length) + '\n');
        return bytes;
    } };
}
test('disabled by default; configuration and unknown IDs cannot select arbitrary repositories', async () => {
    expect((await configuredGraphLedger('').listSources()).sources).toEqual([]);
    const transport = fake();
    const service = new LocalGraphLedger([source], transport.run);
    expect((await service.refresh('/other/repo')).ok).toBe(false);
    expect(transport.calls).toEqual([]);
    for (const replacement of [{ ref: 'HEAD' }, { ref: 'refs/heads/x^{tree}' }, { summaryPath: '../secret.json' }, { repo: 'relative' }]) {
        expect(() => parseLedgerSources(JSON.stringify([{ ...source, ...replacement }]))).toThrow();
    }
    expect((await configuredGraphLedger('{bad json').listSources()).configurationError).toBeTruthy();
});
test('resolves once, pins every blob operation and preserves report semantics', async () => {
    const transport = fake();
    const result = await new LocalGraphLedger([source], transport.run).refresh(source.id);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected snapshot');
    expect(transport.calls.filter(args => args[0] === 'rev-parse')).toHaveLength(1);
    for (const args of transport.calls.slice(1)) expect(args.at(-1)).toBe(`${commit}:status/summary.json`);
    expect(result.value.snapshot.revision).toBe(commit);
    expect(result.value.snapshot.links).toHaveLength(1);
    expect(result.value.snapshot.links[0].status).toBe('active'); // ACK is not completion.
    expect(result.value.participantReports[1].status).toBe('unknown');
    const noEdges = fake(Buffer.from(JSON.stringify({ ...summary, assignments: [] })));
    const standalone = await new LocalGraphLedger([source], noEdges.run).refresh(source.id);
    expect(standalone.ok && standalone.value.snapshot.links).toEqual([]);
});
test('rejects transcript fields, malformed bytes and oversize blobs without exposing their text', async () => {
    for (const bytes of [Buffer.from(JSON.stringify({ ...summary, transcript: 'private test sentinel' })), Buffer.from([0xff])]) {
        const transport = fake(bytes);
        const result = await new LocalGraphLedger([source], transport.run).refresh(source.id);
        expect(result.ok).toBe(false);
        expect(JSON.stringify(result)).not.toContain('private test sentinel');
    }
    const calls: string[][] = [];
    const result = await new LocalGraphLedger([source], async (_repo: string, args: string[]) => {
        calls.push(args);
        return Buffer.from(args[0] === 'rev-parse' ? commit : args[1] === '-t' ? 'blob' : String(1024 * 1024 + 1));
    }).refresh(source.id);
    expect(result.ok).toBe(false);
    expect(calls.some(args => args[1] === 'blob')).toBe(false);
});
test('deadline and missing-object failures do not retry or fetch', async () => {
    let now = 0;
    const calls: string[][] = [];
    const result = await new LocalGraphLedger([source], async (_repo: string, args: string[]) => {
        calls.push(args); now = 6000; return Buffer.from(commit);
    }, () => now).refresh(source.id);
    expect(result.ok ? '' : result.error.code).toBe('timeout');
    expect(calls).toHaveLength(1);
    const missing = await new LocalGraphLedger([source], async () => { throw new LedgerReadError('missing'); }).refresh(source.id);
    expect(missing.ok ? '' : missing.error.code).toBe('missing');
});

test('RPC facade exposes no transport, configuration, constructor or prototype operations', async () => {
    const endpoint = publicLedgerEndpoint(new LocalGraphLedger([source], fake().run));
    expect(Object.getPrototypeOf(endpoint)).toBeNull();
    expect(Object.keys(endpoint).sort()).toEqual(['listSources', 'refresh']);
    expect(endpoint.run).toBeUndefined();
    expect(endpoint.sources).toBeUndefined();
    expect(endpoint.constructor).toBeUndefined();
});
