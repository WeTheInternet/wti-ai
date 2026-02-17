import { defineConfig } from '@playwright/test';

const port = Number(process.env.WTI_IDE_TEST_PORT ?? '1337');

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure'
  }
});
