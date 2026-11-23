import { test, expect } from '@playwright/test';
import { startTheia } from '../fixtures/start-theia';

test('native graph preview preserves selection, shows status and opens the fixture editor', async ({ page }) => {
    const started = await startTheia({ port: Number(process.env.WTI_GRAPH_TEST_PORT ?? '1338') });
    try {
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.goto(started.url, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('#theia-app-shell')).toBeVisible({ timeout: 120_000 });
        await expect(page.getByRole('heading', { name: 'Eclipse Theia Welcome', exact: true })).toBeVisible();
        await expect(page.locator('.theia-preload')).toBeHidden();
        await page.keyboard.press('Control+Alt+g');
        const panel = page.locator('#wti-agent-graph');
        await expect(panel).toBeVisible();
        const picker = panel.getByRole('combobox', { name: 'Graph fixture', exact: true });
        await panel.locator('[data-agent="a-pilot"]').first().press('Enter');
        await expect(panel.getByRole('heading', { name: 'Agent inspector for Pilot' })).toBeVisible();
        await page.setViewportSize({ width: 1000, height: 800 });
        await expect(panel.getByRole('heading', { name: 'Agent inspector for Pilot' })).toBeVisible();
        await panel.getByRole('button', { name: 'Open artifact Project Lantern handoff', exact: true }).click();
        await expect(page.locator('.lm-TabBar-tabLabel').filter({ hasText: /^lantern-handoff\.md$/ })).toBeVisible();
        await expect(page.locator('.monaco-editor .view-lines').filter({ hasText: '# Project Lantern handoff' })).toBeVisible();
        // Return to the existing widget after the editor became active.
        await page.keyboard.press('Control+Alt+g');
        await expect(panel).toBeVisible();
        await picker.selectOption('status-before');
        await expect(panel.locator('[data-edge="l-design"]')).toHaveAttribute('data-status', 'active');
        await picker.selectOption('status-after');
        await expect(panel.locator('[data-edge="l-adapter"]')).toHaveCount(0);
        await expect(panel.locator('[data-edge="l-design"]')).toHaveAttribute('data-status', 'active');
        await expect(panel.locator('[data-edge="l-adapter-verify"]')).toHaveAttribute('data-status', 'unknown');
        await picker.selectOption('dense');
        await panel.locator('[data-agent="a-dense-0-0"]').first().click();
        const copy = panel.locator('[data-portal-for="a-verify"]').first();
        await expect(copy).toBeVisible();
        await copy.click();
        await expect(panel.getByRole('heading', { name: 'Agent inspector for Gauge' })).toBeVisible();
        await picker.selectOption('cyclic');
        await expect(panel.getByRole('alert')).toHaveText('The coordination links contain a cycle.');
        await panel.getByRole('combobox', { name: 'Inspect participant' }).selectOption('a-pilot');
        await expect(panel.getByRole('heading', { name: 'Agent inspector for Pilot' })).toBeVisible();
    } finally {
        await started.dispose();
    }
});
