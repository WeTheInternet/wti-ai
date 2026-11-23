import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { startTheia } from '../fixtures/start-theia';

const exec = promisify(execFile);
test('DEMONSTRATION ledger shows multiple reports and explicit keyboard Inspect', async ({ page }, testInfo) => {
    process.umask(0o077);
    const root = testInfo.outputPath('ledger-demo');
    const writer = path.join(root, 'writer');
    const bare = path.join(root, 'ledger.git');
    await mkdir(writer, { recursive: true, mode: 0o700 });
    const git = async (cwd: string, args: string[]) => (await exec('/usr/bin/git', [
        '-c', 'core.hooksPath=/dev/null', '-c', 'user.name=WTI Agent Graph', '-c', 'user.email=graph-worker@localhost.invalid', '-C', cwd, ...args
    ], { timeout: 10000, maxBuffer: 1024 * 1024, env: { PATH: '/usr/bin:/bin', LANG: 'C',
        GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_TERMINAL_PROMPT: '0', GIT_ALLOW_PROTOCOL: 'file' } })).stdout.trim();
    await git(root, ['init', '--bare', '--template=', bare]);
    await git(writer, ['init', '--template=']);
    await mkdir(path.join(writer, 'status'));
    const reportedAt = new Date().toISOString();
    const participants = [
        { id: 'demo-amber', name: 'Demo Amber', role: 'Fictional review worker', status: 'blocked', nextAction: 'Choose a fictional acceptance example.', blockedReason: 'DEMONSTRATION: a fictional decision is pending.' },
        { id: 'demo-birch', name: 'Demo Birch', role: 'Fictional implementation worker', status: 'active', nextAction: 'Continue the fictional layout check.' },
        { id: 'demo-coral', name: 'Demo Coral', role: 'Fictional validation worker', status: 'completed', nextAction: 'No follow-up in this demonstration.' }
    ].map(p => ({ ...p, updatedAt: reportedAt, ownerId: p.id }));
    const summary = { schemaVersion: 1, effortId: 'demonstration-multiple-reports', name: 'DEMONSTRATION — fictional reports only', driverId: 'demo-amber', reportedAt, participants, assignments: [], communication: [] };
    await writeFile(path.join(writer, 'status/summary.json'), JSON.stringify(summary, null, 2) + '\n');
    await git(writer, ['add', '--', 'status/summary.json']);
    await git(writer, ['commit', '-m', 'DEMONSTRATION fictional participant reports']);
    const commit = await git(writer, ['rev-parse', 'HEAD']);
    await git(writer, ['push', bare, 'HEAD:refs/heads/demonstration']);
    const started = await startTheia({ port: 1340, ledgerSources: JSON.stringify([{ id: 'demonstration', label: 'DEMONSTRATION — fictional agents', repo: bare, ref: 'refs/heads/demonstration', summaryPath: 'status/summary.json', staleAfterMs: 300000 }]) });
    try {
        await page.setViewportSize({ width: 1440, height: 1100 });
        await page.goto(started.url);
        await expect(page.locator('.theia-preload')).toBeHidden();
        await page.keyboard.press('Control+Alt+g');
        const panel = page.locator('#wti-agent-graph');
        await panel.getByRole('combobox', { name: 'Graph fixture', exact: true }).selectOption('ledger');
        await panel.getByRole('button', { name: 'Refresh', exact: true }).click();
        await expect(panel.locator('.wti-ledger-agent')).toHaveCount(3);
        for (const participant of participants) {
            const card = panel.getByRole('article', { name: `Reported status for ${participant.name}` });
            await expect(card.getByTestId(`ledger-status-${participant.id}`)).toHaveText(`Reported ${participant.status}`);
            const inspect = card.getByRole('button', { name: `Inspect ${participant.name}`, exact: true });
            await expect(inspect).toContainText('Inspect');
            await inspect.focus();
            await expect(inspect).toBeFocused();
            await inspect.press('Enter');
            await expect(panel.getByRole('heading', { name: `Agent inspector for ${participant.name}`, exact: true })).toBeInViewport();
        }
        await expect(panel.getByText('0 Live links', { exact: true })).toBeVisible();
        const provenance = panel.locator('.wti-ledger-provenance');
        await provenance.locator('summary').click();
        await expect(panel.getByTestId('ledger-commit')).toHaveText(commit);
        await provenance.locator('summary').click();
        await panel.evaluate(e => { e.scrollTop = 0; });
        await page.screenshot({ path: testInfo.outputPath('demo-normal.png'), fullPage: true });
        await page.setViewportSize({ width: 520, height: 1000 });
        const dimensions = await panel.evaluate(e => ({ client: e.clientWidth, scroll: e.scrollWidth }));
        expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
        await page.screenshot({ path: testInfo.outputPath('demo-narrow.png'), fullPage: true });
        await writeFile(path.join(root, 'receipt.json'), JSON.stringify({ kind: 'synthetic-demonstration-only', commit, reportedAt, participants: participants.map(p => p.id), branch: 'refs/heads/demonstration', summaryPath: 'status/summary.json' }, null, 2) + '\n');
    } finally { await started.dispose(); }
});
