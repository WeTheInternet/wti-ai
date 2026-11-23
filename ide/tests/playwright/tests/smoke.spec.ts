import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect } from '@playwright/test';
import { test } from '../fixtures/theia-test';

test.describe('wti-ide smoke', () => {
  test('loads workbench shell and shows AI chat', async ({ theia, page }) => {
    await page.goto(theia.url, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#theia-app-shell')).toBeVisible({ timeout: 120_000 });

    await expect(page.locator('.theia-preload')).toHaveCount(0, { timeout: 120_000 });

    const chat = page.locator('#chat-view-widget');
    if (!await chat.isVisible()) {
      // Theia 1.77's aiChat:toggle binding reveals the collapsed right panel.
      await page.keyboard.press(process.platform === 'darwin' ? 'Control+Meta+i' : 'Control+Alt+i');
    }
    await expect(chat).toBeVisible();

    // A credential-free profile has no ready model, so chat input can be
    // disabled. Verify the actual registered agent through its configuration.
    await chat.getByRole('button', { name: 'Open AI Configuration', exact: true }).click();
    const configuration = page.locator('#ai-configuration');
    await expect(configuration).toBeVisible();
    // The clean test profile hides agent settings until AI is enabled.
    // No provider credentials are supplied and no prompt is submitted.
    const enableAI = configuration.getByRole('checkbox', { name: 'Enable AI features', exact: true });
    await expect(enableAI).toBeEnabled();
    // The styled switch track overlays the input; use its native keyboard action.
    if (!await enableAI.isChecked()) {
      await enableAI.press('Space');
    }
    await expect(enableAI).toBeChecked();
    await configuration.getByText('Agents', { exact: true }).and(page.locator(':visible')).first().click();
    const infra = configuration.getByText('Infra', { exact: true }).and(page.locator(':visible')).first();
    await expect(infra).toBeVisible();
    await infra.click();
    await expect(configuration.getByText('Id: Infra', { exact: true })).toBeVisible();
  });

  test('renders Markdown in the preview webview', async ({ theia, page }) => {
    const workspace = await mkdtemp(path.join(tmpdir(), 'wti-markdown-'));
    try {
      await writeFile(path.join(workspace, 'sample.md'), '# Rendered preview marker\n');
      // The webview uses a subdomain; Chromium resolves *.localhost to loopback.
      const url = new URL(theia.url);
      url.hostname = 'localhost';
      url.hash = workspace;
      await page.goto(url.href);
      await page.getByRole('button', { name: /Yes, I trust/i }).click();
      await expect(page.locator('.theia-preload')).toHaveCount(0);
      await page.keyboard.press('ControlOrMeta+p');
      await page.keyboard.type('sample.md');
      await page.getByRole('option').filter({ hasText: 'sample.md' }).first().click();
      await expect(page.getByText('Markdown', { exact: true }).first()).toBeVisible();
      await page.keyboard.press('ControlOrMeta+Shift+v');
      await expect.poll(async () => {
        for (const frame of page.frames().slice(1)) {
          if (await frame.getByRole('heading', { name: 'Rendered preview marker', exact: true }).count()) return true;
        }
        return false;
      }, { timeout: 30_000 }).toBe(true);
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });
});
