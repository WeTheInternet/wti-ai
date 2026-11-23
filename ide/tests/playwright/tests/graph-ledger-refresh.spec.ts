import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { startTheia } from '../fixtures/start-theia';

const exec = promisify(execFile);
test('synthetic local status updates become visible only through explicit Refresh', async ({ page }, testInfo) => {
    process.umask(0o077);
    const root = testInfo.outputPath('ledger-refresh-fixture');
    const writer = path.join(root, 'writer');
    const bare = path.join(root, 'ledger.git');
    await mkdir(writer, { recursive: true, mode: 0o700 });
    const git = async (cwd: string, args: string[]) => (await exec('/usr/bin/git', [
        '-c', 'core.hooksPath=/dev/null', '-c', 'user.name=Synthetic Graph Fixture', '-c', 'user.email=graph-worker@localhost.invalid', '-C', cwd, ...args
    ], { timeout: 10000, maxBuffer: 1024 * 1024, env: { PATH: '/usr/bin:/bin', LANG: 'C',
        GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_TERMINAL_PROMPT: '0', GIT_ALLOW_PROTOCOL: 'file' } })).stdout.trim();
    await git(root, ['init', '--bare', '--template=', bare]);
    await git(writer, ['init', '--template=']);
    await mkdir(path.join(writer, 'status'));
    const makeSummary = (status: 'active' | 'blocked', nextAction: string) => ({
        schemaVersion: 1, effortId: 'synthetic-reader-refresh', name: 'SYNTHETIC reader refresh', driverId: 'synthetic-reader-worker',
        reportedAt: new Date().toISOString(),
        participants: [{ id: 'synthetic-reader-worker', name: 'Synthetic reader worker', role: 'Fictional worker',
            status, updatedAt: new Date().toISOString(), nextAction, ownerId: 'synthetic-reader-worker',
            ...(status === 'blocked' ? { blockedReason: 'A fictional review decision is pending.' } : {}) }],
        assignments: [], communication: []
    });
    const push = async (summary: ReturnType<typeof makeSummary>) => {
        const bytes = JSON.stringify(summary, null, 2) + '\n';
        await writeFile(path.join(writer, 'status/summary.json'), bytes);
        await git(writer, ['add', '--', 'status/summary.json']);
        await git(writer, ['commit', '-m', `Report synthetic fixture ${summary.participants[0].status}`]);
        const commit = await git(writer, ['rev-parse', 'HEAD']);
        await git(writer, ['push', bare, `HEAD:refs/heads/synthetic-reader-worker`]);
        return { commit, reportedAt: summary.reportedAt, status: summary.participants[0].status,
            summarySha256: createHash('sha256').update(bytes).digest('hex') };
    };
    const first = await push(makeSummary('active', 'Read the first synthetic report.'));
    const started = await startTheia({ port: 1339, ledgerSources: JSON.stringify([{
        id: 'synthetic-source', label: 'SYNTHETIC reader refresh ledger', repo: bare,
        ref: 'refs/heads/synthetic-reader-worker', summaryPath: 'status/summary.json', staleAfterMs: 1000
    }]) });
    let hidden = false;
    try {
        await page.setViewportSize({ width: 1440, height: 1100 });
        await page.goto(started.url, { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { name: 'Eclipse Theia Welcome', exact: true })).toBeVisible();
        await expect(page.locator('.theia-preload')).toBeHidden();
        await page.keyboard.press('Control+Alt+g');
        const panel = page.locator('#wti-agent-graph');
        await panel.getByRole('combobox', { name: 'Graph fixture', exact: true }).selectOption('ledger');
        await expect(panel.getByText('No status loaded.', { exact: true })).toBeVisible();
        const refresh = panel.getByRole('button', { name: 'Refresh', exact: true });
        await expect(refresh).toBeEnabled();
        await refresh.click();
        const provenance = panel.locator('.wti-ledger-provenance');
        await provenance.locator('summary').click();
        await expect(panel.getByTestId('ledger-commit')).toHaveText(first.commit);
        await expect(panel.getByTestId('ledger-status-synthetic-reader-worker')).toHaveText('Reported active');
        await provenance.locator('summary').click();
        const reported = panel.getByTestId('ledger-reported-time');
        await expect(reported).toHaveAttribute('datetime', first.reportedAt);
        await expect(reported).toHaveText(/^(?:just now|\d+ sec ago)$/);
        const exact = reported.locator('..').getByRole('tooltip');
        await reported.hover();
        await expect(exact).toHaveText(`${first.reportedAt} (UTC)`);
        await expect(exact).toBeVisible();
        await exact.hover(); // Tooltip remains available when the pointer enters it.
        await expect(exact).toBeVisible();
        await refresh.focus();
        await page.keyboard.press('Tab');
        await expect(reported).toBeFocused();
        await expect(exact).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(exact).toBeHidden();
        await page.screenshot({ path: testInfo.outputPath('ledger-first.png'), fullPage: true });
        const second = await push(makeSummary('blocked', 'Choose the next fictional review example.'));
        // Source changed, but the frontend must not silently poll or advance.
        await page.waitForTimeout(1200);
        await provenance.locator('summary').click();
        await expect(panel.getByTestId('ledger-commit')).toHaveText(first.commit);
        await expect(panel.getByTestId('ledger-freshness')).toHaveText('Stale · report exceeds 1 sec limit');
        await refresh.click();
        await expect(panel.getByTestId('ledger-commit')).toHaveText(second.commit);
        await expect(panel.getByTestId('ledger-status-synthetic-reader-worker')).toHaveText('Reported blocked');
        const sameReportTime = await reported.getAttribute('datetime');
        const observedBefore = await panel.getByTestId('ledger-observed-time').getAttribute('datetime');
        await refresh.click();
        await expect(panel.getByTestId('ledger-commit')).toHaveText(second.commit);
        await expect(reported).toHaveAttribute('datetime', sameReportTime!);
        await expect(panel.getByTestId('ledger-observed-time')).not.toHaveAttribute('datetime', observedBefore!); // Refresh changes observation only.
        await expect(panel.getByText('Blocked: A fictional review decision is pending.', { exact: true })).toBeVisible();
        await provenance.locator('summary').click();
        const card = panel.getByRole('article', { name: 'Reported status for Synthetic reader worker' });
        await expect(card.locator('a')).toHaveCount(0); // No invented session URL.
        await expect(card.getByText('Owner:', { exact: false })).toHaveCount(0); // Same owner is the named agent.
        await card.getByRole('button', { name: 'Inspect Synthetic reader worker', exact: true }).press('Enter');
        await expect(panel.getByRole('heading', { name: 'Agent inspector for Synthetic reader worker' })).toBeVisible();
        await expect(panel.getByRole('region', { name: 'Graph alerts', exact: true }).getByText('No graph alerts', { exact: true })).toBeVisible();
        await expect(panel.getByText('No action is needed in this snapshot.', { exact: true })).toHaveCount(0);
        await panel.evaluate(element => { element.scrollTop = 0; });
        await page.screenshot({ path: testInfo.outputPath('ledger-second.png'), fullPage: true });
        await page.setViewportSize({ width: 520, height: 1000 });
        await expect(card.getByTestId('ledger-status-synthetic-reader-worker')).toBeVisible();
        await expect(card.getByText('A fictional review decision is pending.', { exact: false })).toBeVisible();
        const dimensions = await panel.evaluate(element => ({ client: element.clientWidth, scroll: element.scrollWidth }));
        expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
        await page.screenshot({ path: testInfo.outputPath('ledger-narrow.png'), fullPage: true });
        await reported.focus();
        await expect(exact).toBeVisible();
        const focusedDimensions = await panel.evaluate(element => ({ client: element.clientWidth, scroll: element.scrollWidth }));
        expect(focusedDimensions.scroll).toBeLessThanOrEqual(focusedDimensions.client + 1);
        await page.keyboard.press('Escape');
        await page.setViewportSize({ width: 1440, height: 1100 });
        await provenance.locator('summary').click();
        // Deliberate local read failure: retain the second snapshot with an error.
        await rename(bare, bare + '.offline'); hidden = true;
        // Fixture navigation must not discard the only cached successful read.
        await panel.getByRole('combobox', { name: 'Graph fixture', exact: true }).selectOption('small');
        await expect(panel.locator('.wti-ledger')).toBeHidden();
        await panel.getByRole('combobox', { name: 'Graph fixture', exact: true }).selectOption('ledger');
        await expect(panel.getByTestId('ledger-commit')).toHaveText(second.commit);
        await expect(panel.getByTestId('ledger-status-synthetic-reader-worker')).toHaveText('Reported blocked');
        await refresh.click();
        await expect(panel.getByRole('alert')).toContainText('Showing the last successful snapshot');
        await expect(panel.getByTestId('ledger-commit')).toHaveText(second.commit);
        await page.screenshot({ path: testInfo.outputPath('ledger-refresh-error.png'), fullPage: true });
        await rename(bare + '.offline', bare); hidden = false;
        await writeFile(path.join(root, 'receipt.json'), JSON.stringify({
            kind: 'synthetic-local-reader-refresh', actorId: 'synthetic-reader-worker',
            branch: 'refs/heads/synthetic-reader-worker', summaryPath: 'status/summary.json', first, second,
            checks: ['two-local-pushes', 'explicit-refresh', 'no-automatic-advance', 'stale-label', 'last-good-on-error'],
            hostedSourceVerified: false
        }, null, 2) + '\n');
    } finally {
        if (hidden) await rename(bare + '.offline', bare);
        await started.dispose();
    }
});
