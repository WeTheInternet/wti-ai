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
});
