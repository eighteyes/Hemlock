/**
 * playwright.config.js — Playwright test configuration
 * Responsibilities:
 *   - Configure Chrome extension loading for e2e tests
 *   - Set up fixture file serving
 */

const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: '.',
  testMatch: '*.spec.js',
  timeout: 30000,
  use: {
    browserName: 'chromium',
    headless: false,
    launchOptions: {
      args: [
        `--disable-extensions-except=${path.resolve(__dirname, '..')}`,
        `--load-extension=${path.resolve(__dirname, '..')}`,
        '--no-first-run'
      ]
    }
  }
});
