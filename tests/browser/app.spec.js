import { test, expect } from '@playwright/test';

// Deliberately non-scriptural fixtures. These check the API contract, not live content.
const verse = { verseId: 1, shabadId: 10, pageNo: 1, verse: { unicode: 'TEST UNICODE' }, transliteration: { en: 'Test transliteration' }, translation: { en: { bdb: 'Test translation' } } };
const shabad = { shabadInfo: { pageNo: 1, writer: { english: 'Test writer' }, raag: { english: 'Test raag' } }, verses: [verse] };
const bani = { baniInfo: { english: 'Test bani', unicode: 'TEST BANI' }, verses: [{ verse }] };

async function fixtureApi(page) {
  await page.route('https://api.banidb.com/v2/**', route => {
    const path = new URL(route.request().url()).pathname;
    let data;
    if (path === '/v2/banis') data = [{ ID: 1, transliteration: 'Test bani', gurmukhiUni: 'TEST BANI' }];
    else if (path.startsWith('/v2/search/')) data = { verses: [verse], resultsInfo: { totalResults: 21, pages: { totalPages: 2 } } };
    else if (path === '/v2/banis/1') data = bani;
    else if (path === '/v2/shabads/10') data = shabad;
    else if (path === '/v2/hukamnamas') data = { date: { gregorian: { year: 2026, month: 10, date: 20 } }, shabads: [shabad] };
    else return route.fulfill({ status: 404, json: { message: 'Test: not found' } });
    return route.fulfill({ json: data });
  });
}

test('home navigates to learning; reading progress survives reload', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A space to read');
  await page.getByRole('link', { name: 'Begin learning' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('curiosity');
  await expect(page.locator('.all-lessons .lesson-card')).toHaveCount(6);
  await page.locator('.all-lessons .lesson-card').first().click();
  await expect(page.getByRole('heading', { name: 'One Creator, a shared humanity' })).toBeVisible();
  await page.getByRole('button', { name: 'Mark as read', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Marked as read' })).toBeVisible();
  await page.getByRole('link', { name: 'All learning guides', exact: true }).click();
  await expect(page.getByText('1 of 6 read')).toBeVisible();
  expect(errors).toEqual([]);
});

test('search submits encoded query, opens a shabad, and bookmarks metadata only', async ({ page }) => {
  await fixtureApi(page);
  await page.goto('./#/gurbani');
  await page.getByRole('textbox', { name: 'Search Gurbani' }).fill('hope & peace');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page).toHaveURL(/q=hope%20%26%20peace/);
  await expect(page.getByText('21 matching verses')).toBeVisible();
  await page.getByRole('link', { name: 'Read full shabad' }).click();
  await expect(page.getByText('TEST UNICODE', { exact: true })).toBeVisible();
  await expect(page.getByText('Translation: BaniDB', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save reading' }).click();
  await page.getByRole('link', { name: 'Saved', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Shabad · Ang 1' })).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem('sikhi-path.saved'));
  expect(stored).not.toContain('Test translation');
  expect(stored).not.toContain('TEST UNICODE');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Shabad · Ang 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove Shabad · Ang 1' }).click();
  await expect(page.getByRole('heading', { name: 'Something to come back to.' })).toBeVisible();
});

test('bani reader controls and dark mode persist', async ({ page }) => {
  await fixtureApi(page);
  await page.goto('./#/gurbani');
  await page.getByRole('textbox', { name: 'Filter banis' }).fill('Test');
  await page.locator('.bani-card').click();
  await expect(page.getByRole('heading', { name: 'Test bani' })).toBeVisible();
  await page.getByRole('button', { name: 'Reading settings' }).click();
  await page.getByRole('checkbox', { name: 'English translation' }).uncheck();
  await expect(page.getByText('Test translation', { exact: true })).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Transliteration', exact: true }).uncheck();
  await expect(page.getByText('Test transliteration', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByText('Test translation', { exact: true })).toHaveCount(0);
});

test('Hukamnama shows the actual provider date rather than assuming today', async ({ page }) => {
  await fixtureApi(page);
  await page.goto('./#/read/hukamnama');
  await expect(page.getByText('LATEST AVAILABLE HUKAMNAMA', { exact: true })).toBeVisible();
  await expect(page.getByText('October 20, 2026 · Date supplied by BaniDB')).toBeVisible();
  await expect(page.getByText('TEST UNICODE', { exact: true })).toBeVisible();
});

test('API error provides retry and a working route to offline learning', async ({ page }) => {
  let calls = 0;
  await page.route('https://api.banidb.com/v2/**', route => { calls++; return route.fulfill({ status: 502, json: { message: 'We could not reach BaniDB. Please try again shortly. You can still explore Learn Sikhi.' } }); });
  await page.goto('./#/gurbani');
  await expect(page.getByRole('alert')).toContainText('We could not reach BaniDB');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect.poll(() => calls).toBe(2);
  await page.getByRole('link', { name: 'Explore Learn Sikhi' }).click();
  await expect(page.locator('.all-lessons .lesson-card')).toHaveCount(6);
});

test('zero search results and pagination are distinct from network errors', async ({ page }) => {
  await fixtureApi(page);
  await page.goto('./#/gurbani?q=test&type=3');
  await page.getByRole('link', { name: 'Next page' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole('link', { name: 'Previous' })).toBeVisible();
  await page.route('https://api.banidb.com/v2/search/empty*', route => route.fulfill({ json: { verses: [], resultsInfo: { totalResults: 0, pages: { totalPages: 0 } } } }));
  await page.getByRole('textbox', { name: 'Search Gurbani' }).fill('empty');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No matching verses' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('mobile routes have no horizontal overflow and keep navigation usable', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await fixtureApi(page);
  for (const path of ['/', '/learn', '/learn/gurdwara', '/gurbani', '/read/bani/1', '/saved']) {
    await page.goto(`./#${path}`);
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
});

test('malformed saved settings do not crash the app', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sikhi-path.saved', '[null]');
    localStorage.setItem('sikhi-path.preferences', '{"fontSize":-10}');
  });
  await page.goto('./#/saved');
  await expect(page.getByRole('heading', { name: 'Something to come back to.' })).toBeVisible();
});

test('mobile search keeps an accessible name when its visible label is hidden', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fixtureApi(page);
  await page.goto('./#/gurbani');
  await expect(page.locator('.search-input button')).toHaveAccessibleName('Search');
  await page.getByRole('textbox', { name: 'Search Gurbani' }).fill('peace');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.locator('.result-card')).toHaveCount(1);
});

test('Bani library finds familiar names despite provider transliteration spelling', async ({ page }) => {
  await page.route('https://api.banidb.com/v2/banis', route => route.fulfill({ json: [
    { ID: 2, token: 'japji', transliteration: 'japujee saahib', gurmukhiUni: 'TEST BANI' },
    { ID: 1, token: 'gurmantar', transliteration: 'gur ma(n)tr', gurmukhiUni: 'OTHER TEST BANI' },
  ] }));
  await page.goto('./#/gurbani');
  await page.getByRole('textbox', { name: 'Filter banis' }).fill('Japji Sahib');
  await expect(page.locator('.bani-card')).toHaveCount(1);
  await expect(page.locator('.bani-card')).toHaveAttribute('href', '#/read/bani/2');
});

test('pagination uses the page returned by the provider after an out-of-range request', async ({ page }) => {
  await page.route('https://api.banidb.com/v2/search/**', route => route.fulfill({ json: {
    verses: [verse], resultsInfo: { totalResults: 21, pages: { page: 2, totalPages: 2 } },
  } }));
  await page.goto('./#/gurbani?q=peace&type=3&page=9999');
  await expect(page.locator('.result-count')).toContainText('Page 2');
  await expect(page.getByRole('link', { name: 'Previous' })).toHaveAttribute('href', '#/gurbani?q=peace&type=3&page=1');
  await expect(page.getByRole('link', { name: 'Next page' })).toHaveCount(0);
});

test('blocked browser storage keeps controls usable and reports session-only changes', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage unavailable', 'QuotaExceededError'); };
  });
  await page.goto('./#/learn/beginning');
  await page.getByRole('button', { name: 'Mark as read', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Marked as read' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('this visit only');
  await page.getByRole('button', { name: 'Marked as read' }).click();
  await expect(page.getByRole('button', { name: 'Mark as read', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
});

test('static Pages hosting loads assets, favicon, and refreshed hash routes under the repository path', async ({ page }) => {
  const failed = [];
  page.on('response', response => {
    if (response.url().startsWith('http://127.0.0.1:3100/') && response.status() >= 400) failed.push(response.url());
  });
  await page.goto('./');
  expect(new URL(page.url()).pathname).toBe('/sikhism/');
  for (const url of await page.locator('script[src], link[rel="stylesheet"]').evaluateAll(elements => elements.map(element => element.src || element.href))) {
    expect(new URL(url).pathname).toMatch(/^\/sikhism\/assets\//);
  }
  const favicon = await page.locator('link[rel="icon"]').getAttribute('href');
  const response = await page.request.get(new URL(favicon, page.url()).href);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/svg+xml');
  await page.getByRole('link', { name: 'Begin learning' }).click();
  await page.locator('.all-lessons .lesson-card').first().click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'A first step into Sikhi' })).toBeVisible();
  expect(failed).toEqual([]);
});
