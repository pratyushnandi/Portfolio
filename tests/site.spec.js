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
  // The headline is the h1; the name sits right above it.
  await expect(page.locator('h1')).toHaveText('I Build Software That Sees, Thinks & Acts.');
  await expect(page.locator('.hero-name')).toContainText('Pratyush Nandi');
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
  await expect(page.locator('.pj-mini')).toHaveCount(5);
});

test('mobile filter shows Aspend, and the constellation links it to SQLite', async ({ page }) => {
  await open(page);
  await page.locator('#projects').scrollIntoViewIfNeeded();
  await page.locator('.pf[data-f="mobile"]').click();
  await expect(page.locator('#projGrid .pj:not(.is-hidden) h3')).toHaveText(['Aspend']);
  await page.locator('#cst').scrollIntoViewIfNeeded();
  await page.locator('[data-t="sqlite"]').click();
  await expect(page.locator('#cstRead')).toContainText('Aspend');
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

test('engineering DNA: a journey opens in detail, with status and evidence per stage', async ({ page }) => {
  await open(page);
  const dna = page.locator('#dna');
  await dna.scrollIntoViewIfNeeded();
  await page.locator('.dna-strand[data-j="vision"] .ds-go').click();
  await expect(dna).toHaveClass(/detail/);
  await expect(page.locator('.dna-strand[data-j="vision"] .ds-go')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#dnaDetail h3')).toHaveText('Camera Input');
  await expect(page.locator('#dnaDetail')).toContainText('concept');
  await expect(page.locator('#dnaDetail')).toContainText('Not in a public project yet');
  await page.locator('.dna-strand[data-j="vision"] [data-s="inference"]').click();
  await expect(page.locator('#dnaDetail h3')).toHaveText('AI Inference');
  await expect(page.locator('#dnaDetail .dd-head')).toContainText('built');
  await expect(page.locator('#dnaDetail .dd-demo')).toContainText('Detectify');
  await expect(page.locator('#dnaDetail')).toContainText('trade-offs');
  // Arrow keys walk the stages; Escape returns to the overview.
  await page.locator('.dna-strand[data-j="vision"] [data-s="inference"]').press('ArrowRight');
  await expect(page.locator('#dnaDetail h3')).toHaveText('Detection');
  await page.keyboard.press('Escape');
  await expect(dna).not.toHaveClass(/detail/);
  await expect(page.locator('#dnaBack')).toBeHidden();
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
  await page.keyboard.type('engineering mode');
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

test('capability constellation: technologies connect to disciplines and projects, honestly', async ({ page }) => {
  await open(page);
  const pg = page.locator('[data-t="postgresql"]');
  await pg.scrollIntoViewIfNeeded();
  await pg.click();
  await expect(pg).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-dc="data"]')).toHaveClass(/rel/);
  await expect(page.locator('#cstRead')).toContainText('Not in a project on this page yet');
  await page.locator('[data-t="yolo"]').click();
  await expect(page.locator('[data-p="detectify"]')).toHaveClass(/rel/);
  await expect(page.locator('#cstRead')).toContainText('Computer Vision & AI');
  await page.locator('[data-p="campus-recruitment-system"]').click();
  await expect(page.locator('[data-t="express"]')).toHaveClass(/rel/);
  await page.locator('[data-p="campus-recruitment-system"]').click();
  await expect(page.locator('[data-p="campus-recruitment-system"]')).toHaveAttribute('aria-pressed', 'false');
});

test('pipeline stages are buttons that expose their state', async ({ page }) => {
  await open(page);
  const heads = page.locator('.ps-head');
  await expect(heads).toHaveCount(6);
  await expect(heads.first()).toHaveAttribute('aria-controls', 'psMore0');
  await expect(heads.first()).toHaveAttribute('aria-expanded', /true|false/);
});

test('mobile: the universe becomes a domain grid, and the menu makes the page inert', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await open(page);
  await expect(page.locator('.uv-links')).toBeHidden();
  const cv = page.locator('.uv-domain[data-d="cv"]');
  await cv.scrollIntoViewIfNeeded();
  await cv.click();
  await expect(cv).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#uvPanel h3')).toHaveText('Computer Vision');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('#burger').click();
  await expect(page.locator('#main')).toHaveJSProperty('inert', true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#main')).toHaveJSProperty('inert', false);
  await expect(page.locator('#burger')).toBeFocused();
});

test('PN universe: a domain lights its pathways, inspects, and walks its journey', async ({ page }) => {
  await open(page);
  const uv = page.locator('#universe');
  const ai = page.locator('.uv-domain[data-d="ai"]');
  await ai.click();
  await expect(ai).toHaveAttribute('aria-pressed', 'true');
  await expect(uv).toHaveClass(/has-sel/);
  await expect(page.locator('#uvPanel h3')).toHaveText('Artificial Intelligence');
  await expect(page.locator('#uvPanel')).toContainText('Detectify');
  await page.locator('#uvPanel .uvp-btn', { hasText: 'Inspect' }).click();
  await expect(uv).toHaveClass(/inspect/);
  await expect(page.locator('#uvPanel .uvp-inspect')).toContainText('held-out');
  await page.keyboard.press('Escape');
  await expect(uv).not.toHaveClass(/inspect/);
  // IoT is honest about having no public project yet.
  await page.locator('.uv-domain[data-d="iot"]').click();
  await expect(page.locator('#uvPanel')).toContainText('No public project shows this yet');
  await page.locator('#uvPanel .uvp-btn', { hasText: 'Walk journey C' }).click();
  await expect(page.locator('#dna')).toHaveClass(/detail/);
  await expect(page.locator('#dna')).toHaveAttribute('data-j', 'connected');
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
  // A chapter only counts once the visitor stays in it.
  await expect.poll(path, { timeout: 5000 }).toContain('thinking');
  await page.locator('[data-t="yolo"]').click();

  await page.locator('#sessEnd').scrollIntoViewIfNeeded();
  await expect(page.locator('#seSum')).toContainText('Thinking');
  await expect(page.locator('#seInspected')).toContainText('YOLO');
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
  await expect(status).toContainText('fields need attention');
  // Each field explains itself, and is linked to its message.
  await expect(page.locator('#cfNameErr')).toHaveText('Please enter your name.');
  await expect(page.locator('#cfName')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#cfName')).toHaveAttribute('aria-describedby', 'cfNameErr');
  await expect(page.locator('#cfName')).toBeFocused();
  expect(posts).toBe(0);
  await page.fill('#cfEmail', 'not-an-email');
  await page.locator('#cfEmail').blur();
  await expect(page.locator('#cfEmailErr')).toContainText('full email address');

  await page.fill('#cfName', 'CI Bot');
  await page.fill('#cfEmail', 'ci@example.com');
  await page.selectOption('#cfReason', { index: 1 });
  await page.fill('#cfSubject', 'Automated test');
  await page.fill('#cfMessage', 'Sent by the CI pipeline against a mocked endpoint.');
  await page.locator('#cfBtn').click();
  await expect(status).toContainText('Message sent successfully');
  expect(posts).toBe(1);
});

test('visual AI playground: labelled simulated, and the threshold really changes the alerts', async ({ page }) => {
  await open(page);
  const lab = page.locator('#lab');
  await lab.scrollIntoViewIfNeeded();
  await expect(lab.locator('.lab-sim')).toContainText('No camera');
  await expect(page.locator('.cv-hud-tr')).toHaveText('simulated');
  const thr = page.locator('#labThr');
  const setThr = async v => { await thr.fill(v); await thr.dispatchEvent('input'); };
  // Default threshold: one red-light violation.
  await setThr('0.5');
  await expect(page.locator('#labPos')).toHaveText('stage 6 / 6');
  await expect(page.locator('#labStatus')).toContainText('1 alert: Red-light violation');
  // Low threshold: a puddle becomes a car, and the hint calls it a false alarm.
  await setThr('0.3');
  await expect(page.locator('#labStatus')).toContainText('2 alerts');
  await expect(page.locator('#labThrHint')).toContainText('False alarm');
  // High threshold: the real violation is missed.
  await setThr('0.95');
  await expect(page.locator('#labStatus')).toContainText('No alert raised');
  await expect(page.locator('#labThrHint')).toContainText('Missed');
  // Rules can be switched off; the green-light frame raises nothing.
  await setThr('0.5');
  await page.locator('[data-rule="red_light"]').uncheck();
  await expect(page.locator('#labStatus')).toContainText('No alert raised');
  await page.locator('[data-rule="red_light"]').check();
  await page.locator('.lab-scene[data-scene="green"]').click();
  await expect(page.locator('.lab-scene[data-scene="green"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#labLog')).toContainText('the signal is green');
  // The event log and the timeline carry (simulated) timestamps.
  await expect(page.locator('#labLog li').first()).toHaveText(/^\d{2}:\d{2}:\d{2}\.\d{3}/);
  await expect(page.locator('#labTimeline li.on')).toHaveCount(6);
  await page.locator('.lab-scene[data-scene="helmet"]').click();
  await expect(page.locator('#labStatus')).toContainText('Rider without a helmet');
});

test('playground stages step with buttons and expose the current step', async ({ page }) => {
  await open(page);
  await page.locator('#lab').scrollIntoViewIfNeeded();
  await page.locator('.ps-head').nth(2).click();
  await expect(page.locator('#labPos')).toHaveText('stage 3 / 6');
  await expect(page.locator('.ps-head').nth(2)).toHaveAttribute('aria-current', 'step');
  await page.locator('#labNext').click();
  await expect(page.locator('#labPos')).toHaveText('stage 4 / 6');
  await page.locator('#labPrev').click();
  await expect(page.locator('#labPos')).toHaveText('stage 3 / 6');
});

test('observatory: real model output, compared with its input frame', async ({ page }) => {
  await open(page);
  const cmp = page.locator('#obsCompare');
  await cmp.scrollIntoViewIfNeeded();
  await expect(page.locator('.obs-badge')).toContainText('real');
  await expect(page.locator('.oc-out img')).toHaveAttribute('src', /detectify-junction-vehicle\.jpg$/);
  await page.locator('#obsSplit').fill('20');
  await page.locator('#obsSplit').dispatchEvent('input');
  await expect.poll(() => cmp.evaluate(e => e.style.getPropertyValue('--split'))).toBe('20%');
  await expect(page.locator('.obs-dets')).toContainText('yellow_light');
});

test('Aspend has a case study, credited to Eltern Segen', async ({ page }) => {
  await open(page);
  const btn = page.locator('.pj [data-case="aspend"]');
  await btn.scrollIntoViewIfNeeded();
  await expect(page.locator('.pj:has([data-case="aspend"])')).toContainText('Built at Eltern Segen Technologie');
  await btn.click();
  await expect(page.locator('#caseTitle')).toHaveText('Aspend');
  await expect(page.locator('#caseBody')).toContainText('Built as part of my role at Eltern Segen Technologie');
  await expect(page.locator('#caseBody')).toContainText('Payments are not expenses');
  await page.keyboard.press('Escape');
  await expect(page.locator('#caseDlg')).toBeHidden();
});

test('project worlds use real images only, and Detectify states its scope', async ({ page }) => {
  await open(page);
  const srcs = await page.locator('#projGrid img').evaluateAll(imgs => imgs.map(i => i.getAttribute('src')));
  expect(srcs.length).toBeGreaterThan(0);
  for (const src of srcs) expect(src).toMatch(/^images\/work\//);
  await expect(page.locator('.w-detectify figcaption')).toContainText('Mistakes included');
  await expect(page.locator('.w-metrics')).toContainText('0.989');
  const btn = page.locator('.pj [data-case="detectify"]');
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await expect(page.locator('#caseBody .cs-scope')).toContainText('not in the public repository');
});

test('Campus Recruitment describes the Node.js build and its access rules', async ({ page }) => {
  await open(page);
  const btn = page.locator('.pj [data-case="campus-recruitment-system"]');
  await btn.scrollIntoViewIfNeeded();
  await expect(page.locator('.pj:has([data-case="campus-recruitment-system"]) .tags')).toContainText('Express');
  await btn.click();
  await expect(page.locator('#caseBody')).toContainText('Eligibility, explained');
  await expect(page.locator('#caseBody')).not.toContainText('Laravel');
});

test('page metadata: canonical, social preview and structured data', async ({ page }) => {
  await open(page);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://pratyushnandi.vercel.app/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://pratyushnandi.vercel.app/');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', /summary/);
  const ld = JSON.parse(String(await page.locator('script[type="application/ld+json"]').textContent()));
  expect(ld['@type']).toBe('Person');
  expect(await page.locator('h1').count()).toBe(1);
});

test('the intro has a real skip button that ends it at once', async ({ page }) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const skip = page.locator('#plSkip');
  // The intro may already be over on a fast machine; only press it while it shows.
  if (await skip.isVisible().catch(() => false)) await skip.click({ timeout: 2000 }).catch(() => {});
  await page.waitForFunction(() => !document.documentElement.classList.contains('is-loading'), null, { timeout: 2500 });
  await expect(page.locator('h1')).toBeVisible();
});

test('command palette: dotted command ids, and actions acknowledge themselves', async ({ page }) => {
  await open(page);
  await page.locator('#cmdkBtn').click();
  await page.locator('#cmdkInput').fill('explore.');
  await expect(page.locator('.cmdk-item').first()).toContainText('explore.');
  await page.locator('#cmdkInput').fill('theme.toggle');
  await expect(page.locator('.cmdk-item.active')).toContainText('theme.toggle');
  await page.keyboard.press('Enter');
  await expect(page.locator('.ack')).toContainText('theme');
});

test('copying the email confirms it', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard permission is chromium-only here');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page);
  const btn = page.locator('#copyEmail');
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await expect(btn).toContainText('Copied');
  await expect(page.locator('.ack')).toContainText('Email copied');
});

test('the living canvas and the monogram are decorative and present', async ({ page }) => {
  await open(page);
  await expect(page.locator('.bd-canvas')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#pnMark')).toHaveCount(1);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /c8f03c/);
});
