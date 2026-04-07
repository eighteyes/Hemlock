/**
 * hemlock.spec.js — End-to-end tests for Hemlock extension
 * Responsibilities:
 *   - Verify content filtering on static fixture pages
 *   - Verify MutationObserver filtering on dynamic content
 *   - Verify image/link attribute filtering
 *   - Verify sanitization rejects invalid input
 */

const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

const EXTENSION_PATH = path.resolve(__dirname, '..');
const FIXTURES = path.resolve(__dirname, 'fixtures');

let context;
let extId;

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-first-run'
    ]
  });

  let bgPage = context.serviceWorkers()[0];
  if (!bgPage) {
    bgPage = await context.waitForEvent('serviceworker');
  }
  extId = bgPage.url().split('/')[2];
});

test.afterAll(async () => {
  await context.close();
});

test('basic: removes articles containing blocked names', async () => {
  const page = await context.newPage();
  await page.goto(`file://${FIXTURES}/basic.html`);
  await page.waitForTimeout(1000);

  await expect(page.locator('#a1')).toHaveCount(0);
  await expect(page.locator('#a2')).toHaveCount(1);
  await expect(page.locator('#a3')).toHaveCount(0);
  await expect(page.locator('#a4')).toHaveCount(1);
  await page.close();
});

test('nested: removes list items with blocked names', async () => {
  const page = await context.newPage();
  await page.goto(`file://${FIXTURES}/nested.html`);
  await page.waitForTimeout(1000);

  await expect(page.locator('#li1')).toHaveCount(0);
  await expect(page.locator('#li2')).toHaveCount(1);
  await expect(page.locator('#li3')).toHaveCount(0);
  await page.close();
});

test('dynamic: removes dynamically inserted matching content', async () => {
  const page = await context.newPage();
  await page.goto(`file://${FIXTURES}/dynamic.html`);
  await page.waitForTimeout(1500);

  const texts = await page.locator('#feed p').allTextContents();
  expect(texts).toEqual(['New park opens downtown']);
  await page.close();
});

test('images: removes images and links with blocked names in attributes', async () => {
  const page = await context.newPage();
  await page.goto(`file://${FIXTURES}/images.html`);
  await page.waitForTimeout(1000);

  await expect(page.locator('#img1')).toHaveCount(0);
  await expect(page.locator('#img2')).toHaveCount(1);
  await expect(page.locator('#link2')).toHaveCount(1);
  await page.close();
});

test('links: removes table rows containing blocked names', async () => {
  const page = await context.newPage();
  await page.goto(`file://${FIXTURES}/links.html`);
  await page.waitForTimeout(1000);

  await expect(page.locator('#row1')).toHaveCount(0);
  await expect(page.locator('#row2')).toHaveCount(1);
  await expect(page.locator('#row3')).toHaveCount(0);
  await page.close();
});

test('div-soup: S climbs single-child div chains', async () => {
  const page = await context.newPage();
  await page.goto(`file://${FIXTURES}/div-soup.html`);
  await page.waitForTimeout(1000);

  // S: single-child chain around Trump card — entire wrapper should be gone
  const trumpWrapper = page.locator('.feed-wrapper').first();
  await expect(trumpWrapper).toHaveCount(0);

  // S: multi-child parent — sibling survives, Musk card removed
  await expect(page.locator('#keep-sibling')).toHaveCount(1);

  // R: role="article" — Sam Altman article removed, bakery survives
  await expect(page.locator('#role-article')).toHaveCount(0);
  await expect(page.locator('#role-article-keep')).toHaveCount(1);

  // R: data-testid="story-card" — Bezos removed, community garden survives
  await expect(page.locator('#data-story')).toHaveCount(0);
  await expect(page.locator('#data-story-keep')).toHaveCount(1);

  // R: itemtype schema.org — Zuckerberg article removed
  await expect(page.locator('#schema-article')).toHaveCount(0);

  // E: empty ancestors cleaned after removal
  await expect(page.locator('#should-clean')).toHaveCount(0);

  // Clean content survives
  await expect(page.locator('#must-survive')).toHaveCount(1);

  await page.close();
});

test('sanitization: rejects invalid names', async () => {
  const page = await context.newPage();
  await page.goto(`file://${FIXTURES}/basic.html`);

  const invalid = [
    '',
    '  ',
    '<script>alert(1)</script>',
    'name; DROP TABLE',
    'a'.repeat(101)
  ];

  for (const name of invalid) {
    const result = await page.evaluate((n) => Sanitize.isValidName(n), name);
    expect(result).toBe(false);
  }

  const valid = ['Trump', "O'Brien", 'Mary-Jane Watson', 'Elon Musk'];
  for (const name of valid) {
    const result = await page.evaluate((n) => Sanitize.isValidName(n), name);
    expect(result).toBe(true);
  }
  await page.close();
});
