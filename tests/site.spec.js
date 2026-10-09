// @ts-check
const { test, expect } = require('@playwright/test');


/** Load the page, skip the intro, and collect any JS errors along the way. */
async function open(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // Never let a test run send a real contact-form email.
  await page.route('https://api.web3forms.com/**', route =>
    route.fulfill({ json: { success: true, message: 'mocked' } }));
  // './' not '/': relative to BASE_URL, so sub-path hosts (GitHub Pages at
  // /Portfolio/) are tested at the site, not at the bare domain root.
  await page.goto('./', { waitUntil: 'domcontentloaded' });
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

test('fonts and icons come from this site, and icons render', async ({ page }) => {
  // The icon fonts and Google Fonts were ~0.5 MB and three render-blocking requests.
  const external = [];
  page.on('request', r => { if (/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare|cdn\.jsdelivr/.test(r.url())) external.push(r.url()); });
  await open(page);
  await page.waitForLoadState('load');
  expect(external, 'requests to font/icon CDNs').toEqual([]);
  const mask = await page.locator('#cmdkBtn i').evaluate(i => getComputedStyle(i).maskImage || getComputedStyle(i).webkitMaskImage);
  expect(mask).toContain('data:image/svg+xml');
  expect(await page.evaluate(() => document.fonts.check('16px Geist'))).toBe(true);
});

test('the logo links are named, even where the wordmark is hidden', async ({ page }) => {
  await open(page);
  await expect(page.locator('.nav .logo')).toHaveAccessibleName(/Pratyush Nandi/);
  await expect(page.locator('.footer .logo')).toHaveAccessibleName(/Pratyush Nandi/);
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
  // The swap runs inside a view transition, so poll rather than assert at once.
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

test('project filter shows only the matching category', async ({ page }) => {
  await open(page);
  const visible = () => page.locator('#projGrid .pj:not(.is-hidden)').count();
  const total = await page.locator('#projGrid .pj').count();
  await page.locator('#projects').scrollIntoViewIfNeeded();
  await page.locator('.pf[data-f="ai"]').click();
  await expect(page.locator('.pf[data-f="ai"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await visible()).toBe(await page.locator('#projGrid .pj[data-cat="ai"]').count());
  // The experiments list follows the filter and hides when nothing in it matches.
  await expect(page.locator('.proj-more')).toBeHidden();
  await page.locator('.pf[data-f="all"]').click();
  expect(await visible()).toBe(total);
  await expect(page.locator('.proj-more')).toBeVisible();
  await expect(page.locator('.pj-mini')).toHaveCount(4);
});

test('mobile filter shows Aspend, and the system map links it', async ({ page }) => {
  await open(page);
  await page.locator('#projects').scrollIntoViewIfNeeded();
  await page.locator('.pf[data-f="mobile"]').click();
  await expect(page.locator('#projGrid .pj:not(.is-hidden) h3')).toHaveText(['Aspend']);
  await page.locator('#sysmap').scrollIntoViewIfNeeded();
  await page.locator('.sm-node[data-node="database"]').click();
  await expect(page.locator('#smInspector .smi-projects')).toContainText('Aspend');
});

test('experience keeps roles and disciplines apart', async ({ page }) => {
  await open(page);
  // Positions in the git log; how the stack grew in its own list, nothing dropped.
  await expect(page.locator('.gl-item h3')).toHaveText(['Intern', 'Student Developer Club, Tech Lead']);
  await expect(page.locator('.disc-list > li h4')).toHaveText(['React', 'Backend', 'Python & ML', 'Frontend', 'HTML']);
  await page.locator('#cmdkBtn').click();
  await page.locator('#cmdkInput').fill('What is your experience?');
  await page.keyboard.press('Enter');
  await expect(page.locator('#cmdkAnswer')).toContainText('Python & ML (2023 – 2026)');
});

test('certificate viewer opens and closes with Escape', async ({ page, isMobile }) => {
  test.skip(isMobile, 'phones open documents in a new tab instead');
  await open(page);
  const modal = page.locator('#pcModal');
  await page.locator('a[data-doc-title][href$=".jpg"]').click();
  await expect(modal).toBeVisible();
  await expect(page.locator('#pcModalImg')).toHaveAttribute('src', /sec-pass-certificate\.jpg$/);
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
});

test('engineering mode switches on, boots its panel and persists', async ({ page }) => {
  await open(page);
  const html = page.locator('html');
  await page.locator('#engToggle').click();
  await expect(html).toHaveAttribute('data-mode', 'eng');
  await expect(page.locator('#engToggle')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.ep-list li.up')).toHaveCount(12, { timeout: 5000 });
  // Section metadata is counted from the page, not hard-coded.
  await expect(page.locator('#projects .eng-meta')).toContainText(`${await page.locator('#projGrid .pj, .pj-mini').count()} projects`);
  await page.reload();
  await expect(html).toHaveAttribute('data-mode', 'eng');
  await page.locator('#engToggle').click();
  await expect(html).not.toHaveAttribute('data-mode', 'eng');
});

test('system map selection lights the route and fills the inspector', async ({ page }) => {
  await open(page);
  await page.locator('#sysmap').scrollIntoViewIfNeeded();
  await page.locator('.sm-node[data-node="cv"]').click();
  await expect(page.locator('.sm-node[data-node="cv"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#smInspector h3')).toHaveText('Computer Vision');
  await expect(page.locator('#smInspector .smi-chip')).toContainText(['YOLO']);
  await expect(page.locator('.sm-node[data-node="api"]')).toHaveClass(/lit/);
  await expect(page.locator('.sm-node[data-node="database"]')).not.toHaveClass(/lit/);
});

test('case study opens from its project and closes with Escape', async ({ page }) => {
  await open(page);
  const btn = page.locator('.pj [data-case="detectify"]');
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  const dlg = page.locator('#caseDlg');
  await expect(dlg).toBeVisible();
  await expect(page.locator('#caseTitle')).toHaveText('Detectify');
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();
  await expect(btn).toBeFocused();
});

test('command palette runs real commands from the keyboard', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard shortcut is a desktop affordance');
  await open(page);
  const palette = page.locator('#cmdk');
  await page.keyboard.press('Control+k');
  await expect(palette).toBeVisible();
  await page.keyboard.type('engineering');
  await page.keyboard.press('Enter');
  await expect(palette).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'eng');
});

test('assistant answers from page content and admits what it cannot answer', async ({ page }) => {
  await open(page);
  await page.locator('#cmdkBtn').click();
  await page.locator('.cmdk-item.is-ask', { hasText: 'What AI/ML work do you do?' }).click();
  const answer = page.locator('#cmdkAnswer');
  await expect(answer.locator('h3')).toHaveText('AI / ML work');
  await expect(answer).toContainText('YOLO');
  await page.locator('#cmdkInput').fill('Have you used Docker?');
  await page.keyboard.press('Enter');
  await expect(answer.locator('h3')).toHaveText('I can only answer from this portfolio');
  await expect(answer).toContainText('not an AI model');
});

test('command palette closes from its button and returns focus to the trigger', async ({ page }) => {
  await open(page);
  const trigger = page.locator('#cmdkBtn');
  await trigger.click();
  await expect(page.locator('#cmdk')).toBeVisible();
  await page.locator('#cmdkClose').click();
  await expect(page.locator('#cmdk')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('technology chips are toggle buttons with a text readout', async ({ page }) => {
  await open(page);
  const chip = page.locator('.node-btn', { hasText: 'PostgreSQL' });
  await chip.scrollIntoViewIfNeeded();
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  // Hovering another chip previews it by design; park the pointer so a smooth
  // scroll settling under it can't turn this into a preview of a neighbour.
  await page.mouse.move(1, 1);
  await expect(page.locator('#techReadout')).toContainText('PostgreSQL · layer: Database');
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
});

test('pipeline stages are buttons that expose their state', async ({ page }) => {
  await open(page);
  const heads = page.locator('.ps-head');
  await expect(heads).toHaveCount(7);
  await expect(heads.first()).toHaveAttribute('aria-controls', 'psMore0');
  await expect(heads.first()).toHaveAttribute('aria-expanded', /true|false/);
});

test('mobile: system map shows details inline and the menu makes the page inert', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await open(page);
  const node = page.locator('.sm-node[data-node="edge"]');
  await node.scrollIntoViewIfNeeded();
  await node.click();
  await expect(page.locator('#smCanvas > #smInspector')).toBeVisible();
  await expect(page.locator('#smInspector h3')).toHaveText('Edge AI');
  await node.click();
  await expect(page.locator('#smCanvas > #smInspector')).toHaveCount(0);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('#burger').click();
  await expect(page.locator('#main')).toHaveJSProperty('inert', true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#main')).toHaveJSProperty('inert', false);
  await expect(page.locator('#burger')).toBeFocused();
});

test('hero request path opens the system map at that layer', async ({ page }) => {
  await open(page);
  await page.locator('.hsys-path [data-goto-node="database"]').click();
  await expect(page.locator('.sm-node[data-node="database"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#smInspector h3')).toHaveText('Database');
  await expect(page.locator('#smInspector .smi-why')).toContainText('Why PostgreSQL?');
});

test('assistant explains engineering decisions from the page', async ({ page }) => {
  await open(page);
  await page.locator('#cmdkBtn').click();
  await page.locator('#cmdkInput').fill('Why Fastify?');
  await page.keyboard.press('Enter');
  const answer = page.locator('#cmdkAnswer');
  await expect(answer.locator('h3')).toHaveText('Fastify');
  await expect(answer).toContainText('schema validation');
});

test('how-I-build stages light up as they are read', async ({ page }) => {
  await open(page);
  await page.locator('.proc-step').nth(3).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 200));
  await expect.poll(() => page.locator('.proc-step.lit').count()).toBeGreaterThan(2);
});

test('command palette suggests commands for the section being read', async ({ page }) => {
  await open(page);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.locator('html')).toHaveAttribute('data-context', 'contact');
  await page.locator('#cmdkBtn').click();
  await expect(page.locator('.cmdk-group').first()).toHaveText('Suggested here');
  await expect(page.locator('.cmdk-item').first()).toContainText('Copy email address');
});

test('boot plays in full once per browser, then stays quick', async ({ page }) => {
  await open(page);
  expect(await page.evaluate(() => localStorage.getItem('pn-booted'))).toBe('1');
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#preloader')).not.toHaveClass(/mode-full/);
});

test('session layer records the route, draws it at the end and clears it', async ({ page }) => {
  await open(page);
  const path = () => page.evaluate(() => (JSON.parse(sessionStorage.getItem('pn-session') || '{}').path) || []);
  await page.evaluate(() => document.getElementById('skills').scrollIntoView());
  // A section only counts once the visitor stays in it.
  await expect.poll(path, { timeout: 5000 }).toContain('skills');
  await page.locator('.sm-node[data-node="cv"]').click();

  await page.locator('#sessEnd').scrollIntoViewIfNeeded();
  await expect(page.locator('#seSum')).toContainText('Technology');
  await expect(page.locator('#seInspected')).toContainText('Computer Vision');
  await expect(page.locator('#seSvg .se-node.seen')).not.toHaveCount(0);

  await page.locator('#seClear').click();
  await expect(page.locator('#seSum')).toContainText('Nothing explored yet');
  await expect(page.locator('.sysev')).toContainText('Exploration cleared');
  expect(await path()).toEqual([]);
});

test('the hidden command answers with a system message', async ({ page }) => {
  await open(page);
  await page.locator('#cmdkBtn').click();
  await page.locator('#cmdkInput').fill('ls -a');
  await page.keyboard.press('Enter');
  await expect(page.locator('#cmdkAnswer h3')).toContainText('wasn’t in the navigation');
  await expect(page.locator('#cmdkAnswer')).toContainText('Good engineers look deeper.');
});

test('contact form validates, then submits (API mocked)', async ({ page }) => {
  await open(page);
  let posts = 0;
  await page.route('https://api.web3forms.com/**', route => {
    posts++;
    return route.fulfill({ json: { success: true } });
  });
  const status = page.locator('#cfStatus');
  // Progressive disclosure: the form opens from its prompt and takes focus.
  const start = page.locator('#cfStart');
  await start.scrollIntoViewIfNeeded();
  await expect(page.locator('#contactForm')).toBeHidden();
  await start.click();
  await expect(start).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#cfName')).toBeFocused();
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
