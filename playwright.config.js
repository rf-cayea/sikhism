import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (!process.env.CI && existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:3100/sikhism/', launchOptions: { executablePath }, screenshot: 'only-on-failure' },
  webServer: { command: 'node tests/serve-pages.mjs', url: 'http://127.0.0.1:3100/sikhism/', reuseExistingServer: false },
});
