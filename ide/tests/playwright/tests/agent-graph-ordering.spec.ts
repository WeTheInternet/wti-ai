import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import path from 'node:path';
import { AgentGraph } from '../../../packages/agent-graph-host/dist/react.js';

// Use the same installed React instance as the IDE; no new dependencies or
// alternate portable renderer are introduced by this host-owned regression.
const appRequire = createRequire(path.resolve(__dirname, '../../../apps/wti-ide/package.json'));
const { createElement } = appRequire('react');
const { renderToStaticMarkup } = appRequire('react-dom/server');

test('rendered inspector orders timestamp instants before ID ties for links and receipts', async ({ page }) => {
    const records = [
        { id: 'z', at: '2026-01-01T12:00:00Z' },
        { id: 'm', at: '2026-01-01T12:00:00.123Z' },
        { id: 'a', at: '2026-01-01T12:00:00.000Z' }
    ];
    const snapshot = {
        schemaVersion: 1, effortId: 'synthetic-instant-order', name: 'Synthetic timestamp ordering', revision: 'r1',
        asOf: '2026-01-01T12:01:00Z', driverId: 'driver',
        participants: [{ id: 'driver', name: 'Driver', role: 'Driver' }, { id: 'worker', name: 'Worker', role: 'Worker' }],
        links: records.map(({ id, at }) => ({ id, from: 'driver', to: 'worker', kind: 'delegation', status: 'active', updatedAt: at, label: `link:${id}` })),
        communication: records.map(({ id, at }) => ({ id, from: 'worker', to: 'driver', kind: 'acknowledged', at, source: 'synthetic', label: `receipt:${id}` }))
    };
    const markup = renderToStaticMarkup(createElement(AgentGraph, {
        snapshot, selection: { effortId: snapshot.effortId, participantId: 'driver' }
    }));
    await page.setContent(markup);
    const inspector = page.getByRole('region', { name: 'Agent inspector for Driver', exact: true });
    await expect(inspector.getByRole('heading', { name: 'Live neighbors 3', exact: true })).toBeVisible();
    await expect(inspector.locator('.br-connections > li > p')).toHaveText([
        'Outgoing delegation · link:m', 'Outgoing delegation · link:a', 'Outgoing delegation · link:z'
    ]);
    await expect(inspector.getByRole('heading', { name: 'Communication and receipts', exact: true })).toBeVisible();
    await expect(inspector.locator('.br-events > li > p:first-of-type')).toHaveText(['receipt:m', 'receipt:a', 'receipt:z']);
    // The second-only and .000 forms are the same instant, so their stable IDs
    // break the tie (a before z); .123 is newer than both despite lexical order.
    for (const list of ['.br-connections', '.br-events']) {
        expect(await inspector.locator(`${list} time`).evaluateAll(elements => elements.map(element => element.getAttribute('datetime')))).toEqual([
            records[1].at, records[2].at, records[0].at
        ]);
    }
});
