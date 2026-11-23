import { test as base } from '@playwright/test';
import { startTheia, type StartedTheia } from './start-theia';

const startupTimeout = 120_000;
// Playwright gives this fixture its own setup and teardown budgets. Allow
// startTheia to finish its TERM/KILL sequence even after a startup timeout.
export const test = base.extend<{ theia: StartedTheia }>({
  theia: [async ({}, use) => {
    const server = await startTheia({ timeout: startupTimeout });
    try {
      await use(server);
    } finally {
      await server.dispose();
    }
  }, { timeout: startupTimeout + 20_000 }]
});
