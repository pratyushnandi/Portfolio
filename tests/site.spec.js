// @ts-check
const { test, expect } = require('@playwright/test');


/** Load the page, skip the intro, and collect any JS errors along the way. */
async function open(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // Never let a test run send a real contact-form email.
  await page.route('https://api.web3forms.com/**', route =>
    route.fulfill({ json: { success: true, message: 'mocked' } }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // The intro may already have ended on its own if CDN assets were slow; only
  // skip it (any click does) when it is still on screen.
  const pre = page.locator('#preloader');
  if (await pre.count()) await pre.dispatchEvent('click').catch(() => {});
  await page.waitForFunction(() => !document.documentElement.classList.contains('is-loading'), null, { timeout: 15_000 });
  await expect(pre).toHaveCount(0, { timeout: 5000 });
  return errors;
}

test('loads without JavaScript errors or broken local assets', async ({ page, baseURL }) => {
  const origin = new URL(String(baseURL)).origin;
  const bad = [];
  page.on('response', r => {
    if (r.url().startsWith(origin) && r.status() >= 400) {
      bad.push(`${r.status()} ${r.url()}`);
    }
  });
  const errors = await open(page);
  await page.waitForLoadState('load');
  expect(errors, 'page errors').toEqual([]);
  expect(bad, 'same-origin responses with 4xx/5xx').toEqual([]);
  await expect(page).toHaveTitle(/Pratyush Nandi/);
  await expect(page.locator('h1')).toContainText('Pratyush');
});

test('every section linked from the nav exists', async ({ page }) => {
  await open(page);
  const hrefs = await page.locator('.n-links a').evaluateAll(as => as.map(a => a.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(5);
  for (const h of hrefs) await expect(page.locator(String(h))).toHaveCount(1);
});

test('theme toggle switches and persists', async ({ page }) => {
  await open(page);
  const html = page.locator('html');
  const isLight = async () => (await html.getAttribute('data-theme')) === 'light';
  const startedLight = await isLight();
  await page.locator('#themeToggle').click();
  // The swap happens mid-wipe, ~600ms after the click.
  await expect.poll(isLight, { timeout: 10_000 }).toBe(!startedLight);
  expect(await page.evaluate(() => localStorage.getItem('pn-theme'))).toBe(startedLight ? 'dark' : 'light');
  await page.reload();
  expect(await isLight()).toBe(!startedLight);
});

test('mobile layout has no horizontal overflow and the menu opens', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await open(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const burger = page.locator('#burger');
  await expect(burger).toBeInViewport();
  await burger.click();
  await expect(burger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#nLinks')).toBeVisible();
});

test('contact form validates, then submits (API mocked)', async ({ page }) => {
  await open(page);
  let posts = 0;
  await page.route('https://api.web3forms.com/**', route => {
    posts++;
    return route.fulfill({ json: { success: true } });
  });
  const status = page.locator('#cfStatus');
  await page.locator('#contactForm').scrollIntoViewIfNeeded();
  await page.locator('#cfBtn').click();
  await expect(status).toContainText('name is required');
  expect(posts).toBe(0);

  await page.fill('#cfName', 'CI Bot');
  await page.fill('#cfEmail', 'ci@example.com');
  await page.selectOption('#cfReason', { index: 1 });
  await page.fill('#cfSubject', 'Automated test');
  await page.fill('#cfMessage', 'Sent by the CI pipeline against a mocked endpoint.');
  await page.locator('#cfBtn').click();
  await expect(status).toContainText('Message sent successfully');
  expect(posts).toBe(1);
});
