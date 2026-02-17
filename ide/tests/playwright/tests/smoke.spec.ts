import { test, expect } from '@playwright/test';
import { startTheia } from '../fixtures/start-theia';

test.describe('wti-ide smoke', () => {
  test('loads workbench shell and shows AI chat', async ({ page }) => {
    const started = await startTheia();
    try {
      await page.goto(started.url, { waitUntil: 'domcontentloaded' });

      await expect(page.locator('#theia-app-shell')).toBeVisible({ timeout: 120_000 });

      const aiChatText = page.getByText(/AI Chat/i).first();
      const aiChatButton = page.getByRole('button', { name: /AI Chat/i }).first();
      if (await aiChatButton.count()) {
        await aiChatButton.click();
      } else if (await aiChatText.count()) {
        await aiChatText.click();
      }

      await expect(page.getByText(/Infra/i).first()).toBeVisible({ timeout: 120_000 });
    } finally {
      await started.dispose();
    }
  });
});
