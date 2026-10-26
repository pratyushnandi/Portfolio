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

test('architecture explorer: three views, honest status, decisions traced to their project', async ({ page }) => {
  await open(page);
  const ax = page.locator('#ax');
  await ax.scrollIntoViewIfNeeded();
  // Overview: the seven layers, top to bottom, each with a status.
  await expect(page.locator('.ax-row strong')).toHaveText(['User Interface', 'Frontend', 'API / Backend', 'Database', 'Application Logic', 'AI / Computer Vision', 'Edge / IoT Integration']);
  await expect(page.locator('.ax-row[data-l="edge"]')).toContainText('concept');
  // Selecting a layer opens it in the architecture view.
  await page.locator('.ax-row[data-l="api"]').click();
  await expect(page.locator('#axTabArchitecture')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#axArchitecture')).toBeVisible();
  await expect(page.locator('#axOverview')).toBeHidden();
  await expect(page.locator('#axInspect h3')).toHaveText('API / Backend');
  await expect(page.locator('#axInspect')).toContainText('Campus Recruitment System');
  await expect(page.locator('.ax-node[data-l="database"]')).toHaveClass(/rel/);
  // Connections lead to other layers; the edge layer claims nothing it has not built.
  await page.locator('.ax-node[data-l="edge"]').click();
  await expect(page.locator('#axInspect')).toContainText('conceptual example');
  await expect(page.locator('#axInspect .ax-proj')).toHaveCount(0);
  // Detail: decisions, each traced to a project or labelled conceptual.
  await page.locator('#axInspect .ax-deeper').click();
  await expect(page.locator('#axTabDetail')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#axDetailBody .ax-src')).toHaveText(['conceptual example', 'conceptual example']);
  await page.locator('.ax-pick button', { hasText: 'Database' }).click();
  await expect(page.locator('#axDetailBody h3')).toHaveText('Database');
  await expect(page.locator('#axDetailBody .ax-src').first()).toHaveText('documented in Aspend →');
  await expect(page.locator('#axDetailBody')).toContainText('trade-offs');
});

test('architecture explorer: the views are keyboard tabs', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard');
  await open(page);
  const first = page.locator('#axTabOverview');
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#axTabArchitecture')).toBeFocused();
  await expect(page.locator('#axTabArchitecture')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(page.locator('#axTabDetail')).toBeFocused();
  await expect(page.locator('#axDetail')).toBeVisible();
  await page.keyboard.press('Home');
  await expect(first).toHaveAttribute('aria-selected', 'true');
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
  // IoT is honest about having no public project yet, and its journey opens in the explorer.
  await page.locator('.uv-domain[data-d="iot"]').click();
  await expect(page.locator('#uvPanel')).toContainText('No public project shows this yet');
  await page.locator('#uvPanel .uvp-btn', { hasText: 'Walk journey C' }).click();
  await expect(page.locator('#axTabArchitecture')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#axInspect h3')).toHaveText('Edge / IoT Integration');
});

test('code to production: each stage explains itself with a real example', async ({ page }) => {
  await open(page);
  const steps = page.locator('.c2p-step');
  await expect(steps).toHaveCount(7);
  await steps.first().scrollIntoViewIfNeeded();
  await expect(page.locator('#c2pBody h3')).toHaveText('Idea');
  await page.locator('.c2p-step[data-s="testing"]').click();
  await expect(page.locator('.c2p-step[data-s="testing"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.c2p-step.done')).toHaveCount(4);
  await expect(page.locator('#c2pBody h3')).toHaveText('Testing');
  await expect(page.locator('#c2pBody .c2p-tools')).toContainText('Playwright');
  await expect(page.locator('#c2pBody .c2p-ex').first()).toContainText('This portfolio');
  await page.locator('.c2p-step[data-s="testing"]').press('ArrowRight');
  await expect(page.locator('#c2pBody h3')).toHaveText('Deployment');
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

test('the hidden note: discoverable from the footer, three checkable principles', async ({ page }) => {
  await open(page);
  await expect(page.locator('.foot-egg')).toContainText('ls -a');
  await page.locator('#cmdkBtn').click();
  await page.locator('#cmdkInput').fill('ls -a');
  await page.keyboard.press('Enter');
  const answer = page.locator('#cmdkAnswer');
  await expect(answer).toContainText('ENGINEERING_NOTES.md');
  await expect(answer.locator('dt')).toHaveText(['Label what is real.', 'Measure on data the model never saw.', 'Make failure visible, and recoverable.']);
});

test('projects filter by technology, combined with the category', async ({ page }) => {
  await open(page);
  await page.locator('#projects').scrollIntoViewIfNeeded();
  // Chips come from the projects' own tags.
  await expect(page.locator('.pt-chip[data-t="YOLOv8"]')).toHaveCount(1);
  await page.locator('.pt-chip[data-t="SQLite"]').click();
  await expect(page.locator('#projGrid .pj:not(.is-hidden) h3')).toHaveText(['Aspend']);
  await expect(page.locator('#projStatus')).toHaveText('1 project using SQLite');
  await page.locator('.pt-chip[data-t="Node.js"]').click();
  await expect(page.locator('#projGrid .pj:not(.is-hidden) h3')).toHaveText(['Campus Recruitment System']);
  await expect(page.locator('.pj-mini:not([hidden]) h4')).toHaveText(['Web Calculator', 'Background Changer']);
  await page.locator('.pf[data-f="ai"]').click();
  await expect(page.locator('#projGrid .pj:not(.is-hidden)')).toHaveCount(0);
  await page.locator('.pt-chip', { hasText: 'Any' }).click();
  await expect(page.locator('#projGrid .pj:not(.is-hidden) h3')).toHaveText(['Detectify']);
});

test('the palette filters projects by technology', async ({ page }) => {
  await open(page);
  await page.locator('#cmdkBtn').click();
  await page.locator('#cmdkInput').fill('projects using python');
  await expect(page.locator('.cmdk-item').first()).toContainText('Projects using Python');
  await page.keyboard.press('Enter');
  await expect(page.locator('.pt-chip[data-t="Python"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#projGrid .pj:not(.is-hidden) h3')).toHaveText(['Detectify']);
});

test('AI lab: the vision pipeline and stream topology are labelled conceptual', async ({ page }) => {
  await open(page);
  const sys = page.locator('#lsys');
  await sys.scrollIntoViewIfNeeded();
  await expect(sys).toContainText('conceptual');
  await expect(page.locator('.ls-stage')).toHaveCount(5);
  await page.locator('.ls-stage[data-s="preprocess"]').click();
  await expect(page.locator('#lsPipeRead h4')).toHaveText('Preprocessing');
  await expect(page.locator('#lsPipeRead .ls-real')).toContainText('designed, not published');
  await page.locator('#lsTabTopo').click();
  await expect(page.locator('#lsTopoMap .ls-cross')).toContainText('video');
  await page.locator('.ls-m[data-m="edge"]').click();
  await expect(page.locator('#lsTopoMap .ls-cross')).toContainText('events');
  await expect(page.locator('#lsTopoMap .ls-zone').first()).toContainText('Edge device');
  await page.locator('.ls-node[data-n="device"]').click();
  await expect(page.locator('#lsTopoRead h4')).toHaveText('Edge device');
  // Nothing asks for a camera.
  expect(await page.evaluate(() => navigator.permissions ? navigator.permissions.query({ name: 'camera' }).then(p => p.state).catch(() => 'n/a') : 'n/a')).not.toBe('granted');
});

test('case studies give the problem, then the solution', async ({ page }) => {
  await open(page);
  for (const key of ['detectify', 'aspend', 'campus-recruitment-system', 'codeex-space']) {
    const btn = page.locator(`.pj [data-case="${key}"]`);
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    const heads = await page.locator('#caseBody .cs-sec h3').allTextContents();
    expect(heads.slice(0, 2).map(h => h.trim().toLowerCase())).toEqual(['problem', 'solution']);
    await page.keyboard.press('Escape');
    await expect(page.locator('#caseDlg')).toBeHidden();
  }
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

test('chatbot: answers come instantly from the page, and nothing leaves the browser', async ({ page, baseURL }) => {
  await open(page);
  // From here on, count every request the page makes: asking must make none.
  const origin = new URL(String(baseURL)).origin;
  const sent = [];
  page.on('request', r => { if (r.method() !== 'GET' || !r.url().startsWith(origin)) sent.push(r.method() + ' ' + r.url()); });
  const fab = page.locator('.chat-fab');
  await fab.click();
  await expect(fab).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#chatPanel')).toBeVisible();
  await expect(page.locator('#chatInput')).toBeFocused();
  await expect(page.locator('#chatPanel')).not.toContainText('Claude');
  await page.locator('#chatInput').fill('What technologies do you use?');
  await page.keyboard.press('Enter');
  const reply = page.locator('#chatLog .chat-msg.bot').last();
  await expect(reply.locator('.chat-t')).toHaveText('My development stack');
  await expect(reply.locator('.chat-badge')).toHaveText('from this page');
  expect(sent).toEqual([]);
  // Esc closes and returns focus to the button.
  await page.keyboard.press('Escape');
  await expect(page.locator('#chatPanel')).toBeHidden();
  await expect(fab).toBeFocused();
});

test('chatbot: an unmatched question gets an honest answer; the hero opens it; suggestions work', async ({ page }) => {
  await open(page);
  await page.locator('[data-ask]').first().click();
  await expect(page.locator('#chatPanel')).toBeVisible();
  await page.locator('#chatInput').fill('Have you used Docker?');
  await page.keyboard.press('Enter');
  const reply = page.locator('#chatLog .chat-msg.bot').last();
  await expect(reply).toContainText('I can only answer from this portfolio');
  await page.locator('.chat-sg').first().click();
  await expect(page.locator('#chatLog .chat-msg.user')).toHaveCount(2);
  // The conversation survives a reload in the same tab, and Clear empties it.
  await page.reload();
  await page.locator('#preloader').dispatchEvent('click').catch(() => {});
  await page.locator('.chat-fab').click();
  await expect(page.locator('#chatLog .chat-msg.user')).toHaveCount(2);
  await page.locator('[data-chat="clear"]').click();
  await expect(page.locator('#chatLog .chat-msg.user')).toHaveCount(0);
});

test('chatbot: reads past typos, follows up on "it" and "tell me more", and completes as you type', async ({ page }) => {
  await open(page);
  await page.locator('.chat-fab').click();
  const input = page.locator('#chatInput');
  const reply = () => page.locator('#chatLog .chat-msg.bot').last();
  const say = async q => { await input.fill(q); await page.keyboard.press('Enter'); };
  // Small talk gets a friendly answer, not "I can only answer…".
  await say('hi');
  await expect(reply().locator('.chat-t')).toHaveText('Hello!');
  // A typo is read as the nearest known word, and the answer says so.
  await say('do you know pyhton?');
  await expect(reply().locator('.chat-t')).toHaveText('Python');
  await expect(reply().locator('.chat-how')).toContainText('read as “python”');
  // "it" means what the last answer was about.
  await say('Which projects use it?');
  await expect(reply().locator('.chat-t')).toHaveText('Projects using Python');
  await expect(reply().locator('.chat-how')).toContainText('about Python');
  // "tell me more" shows the whole of a long answer.
  await say('Show me your projects.');
  const shown = await reply().locator('.chat-rows > div').count();
  await expect(reply().locator('.chat-more')).toBeVisible();
  await say('tell me more');
  await expect(reply().locator('.chat-how')).toContainText('the full answer');
  expect(await reply().locator('.chat-rows > div').count()).toBeGreaterThan(shown);
  // Suggestions follow the last answer, and complete what is being typed.
  await expect(page.locator('#chatSugg')).toHaveAttribute('data-mode', 'next');
  await input.fill('detec');
  await expect(page.locator('#chatSugg')).toHaveAttribute('data-mode', 'typing');
  await expect(page.locator('.chat-sg').first()).toHaveText('Tell me about Detectify');
  // ↑ recalls the last question.
  await input.fill('');
  await input.press('ArrowUp');
  await expect(input).toHaveValue('tell me more');
});

test('spotlight cards: light and edge follow the pointer, small cards tilt and settle back', async ({ page, isMobile }) => {
  test.skip(isMobile, 'pointer effect, desktop only');
  await open(page);
  const card = page.locator('.b-now');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveClass(/spot-tilt/);
  await expect(card.locator('.spot-edge')).toHaveAttribute('aria-hidden', 'true');
  // Project worlds are large: light only, no tilt.
  await expect(page.locator('#projGrid .pj').first()).not.toHaveClass(/spot-tilt/);
  const box = await card.boundingBox();
  await page.mouse.move(box.x + box.width * .2, box.y + box.height * .25, { steps: 5 });
  await expect.poll(() => card.evaluate(c => c.style.rotate)).toMatch(/deg$/);
  expect(await card.evaluate(c => c.style.getPropertyValue('--mx'))).toMatch(/px$/);
  await page.mouse.move(2, 2, { steps: 4 });
  await expect.poll(() => card.evaluate(c => c.style.rotate)).toBe('');
});

test('code constellation: decorative, alive, and still under reduced motion', async ({ browser }) => {
  const live = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  let page = await live.newPage();
  await open(page);
  const field = page.locator('.bd-field');
  await expect(field).toHaveAttribute('aria-hidden', 'true');
  await expect(field).toHaveAttribute('data-state', 'live');
  // It sits behind the page and never takes a click.
  expect(await field.evaluate(c => getComputedStyle(c.parentElement).pointerEvents)).toBe('none');
  await live.close();
  const calm = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
  page = await calm.newPage();
  await open(page);
  await expect(page.locator('.bd-field')).toHaveAttribute('data-state', 'still');
  await calm.close();
});

test('the living canvas and the monogram are decorative and present', async ({ page }) => {
  await open(page);
  await expect(page.locator('.bd-canvas')).toHaveAttribute('aria-hidden', 'true');
  // The logo is the portrait everywhere: nav, footer, portal, intro, favicon.
  await expect(page.locator('.logo-mark img, .pm-core img')).toHaveCount(3);
  for (const src of await page.locator('.logo-mark img, .pm-core img').evaluateAll(is => is.map(i => i.getAttribute('src')))) {
    expect(src).toBe('images/logo.jpg');
  }
  expect(await page.locator('.logo-mark img').first().evaluate(i => i.complete && i.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', 'favicon.png');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', 'apple-touch-icon.png');
});

test('digital twin: a zone opens with its evidence, lights its system and joins the exploration', async ({ page }) => {
  await open(page);
  const tw = page.locator('#tw');
  await page.locator('#twin').scrollIntoViewIfNeeded();
  await expect(page.locator('.tw-zone')).toHaveCount(5);
  // The idle system is the end-to-end one, honestly labelled a concept.
  await expect(page.locator('#twFlowTitle')).toContainText('concept');
  await page.locator('.tw-zone[data-z="lab"]').click();
  await expect(page.locator('.tw-zone[data-z="lab"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#twPanel h3')).toHaveText('The Intelligence Lab');
  await expect(page.locator('#twPanel .twp-proj')).toHaveText([/Detectify/]);
  await expect(page.locator('#twFlow .tw-c strong')).toHaveText(['Camera stream', 'AI engine', 'Rules & events', 'Human review']);
  await expect(page.locator('#twFlowTitle')).toContainText('partly built');
  expect(await page.locator('.tw-path.lit').count()).toBeGreaterThan(0);
  await expect(page.locator('#twFormula')).toContainText('Visual AI');
  // A component explains its role and technologies.
  await page.locator('.tw-c[data-c="model"]').click();
  await expect(page.locator('#twComp')).toContainText('YOLOv8');
  // The Edge Network claims nothing it has not built.
  await page.locator('#twPanel .twp-link', { hasText: 'The Edge Network' }).click();
  await expect(page.locator('#twPanel h3')).toHaveText('The Edge Network');
  await expect(page.locator('#twPanel .twp-proj')).toHaveCount(0);
  await expect(page.locator('#twPanel')).toContainText('No public project shows it yet');
  await expect(page.locator('#twFormula')).toContainText('Edge systems');
  // Esc steps back out, and focus stays on the zone.
  await page.keyboard.press('Escape');
  await expect(page.locator('.tw-zone[aria-pressed="true"]')).toHaveCount(0);
  await expect(page.locator('.tw-zone[data-z="edge"]')).toBeFocused();
  await expect(tw).not.toHaveClass(/has-sel/);
});

test('digital twin: arrow keys walk the zones and Enter opens one', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard');
  await open(page);
  await page.locator('.tw-zone[data-z="core"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.tw-zone[data-z="web"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#twPanel h3')).toHaveText('The Web');
  await expect(page.locator('#twPanel .twp-proj strong')).toContainText(['Campus Recruitment System', 'Aspend']);
});

test('digital twin: what-if scenarios mark what they affect and are labelled educational', async ({ page }) => {
  await open(page);
  await page.locator('#twin').scrollIntoViewIfNeeded();
  await page.locator('.tw-wi[data-w="network"]').click();
  const out = page.locator('#twWhat');
  await expect(out).toBeVisible();
  await expect(out).toContainText('educational');
  await expect(out).toContainText('Buffer events, not video');
  await expect(page.locator('.tw-c.hit strong')).toHaveText(['API', 'Dashboard']);
  await expect(page.locator('.tw-path.cut')).toHaveCount(1);
  await expect(page.locator('#twFormula')).toContainText('Architectural reasoning');
  // The backend scenario cites the real fallback this site has.
  await page.locator('.tw-wi[data-w="backend"]').click();
  await expect(page.locator('.tw-wi[data-w="network"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(out).toContainText('prefilled email link');
  await page.keyboard.press('Escape');
  await expect(out).toBeHidden();
  await expect(page.locator('.tw-c.hit')).toHaveCount(0);
});

test('digital twin: reset clears the exploration; the text view carries everything', async ({ page }) => {
  await open(page);
  await page.locator('#twin').scrollIntoViewIfNeeded();
  await page.locator('.tw-zone[data-z="build"]').click();
  await expect(page.locator('#twFormula')).toContainText('Delivery & testing');
  // Kept for this tab across a reload.
  await page.reload();
  await page.locator('#preloader').dispatchEvent('click').catch(() => {});
  await expect(page.locator('#twFormula')).toContainText('Delivery & testing');
  await page.locator('#twReset').click();
  await expect(page.locator('#twFormula')).toContainText('Nothing yet');
  expect(await page.evaluate(() => sessionStorage.getItem('pn-twin'))).toBeNull();
  await page.locator('#twView').click();
  await expect(page.locator('#twView')).toHaveAttribute('aria-pressed', 'true');
  const text = page.locator('#twText');
  await expect(text).toBeVisible();
  await expect(page.locator('.tw-main')).toBeHidden();
  await expect(text.locator('.twt-zone')).toHaveCount(5);
  await expect(text.locator('.twt-what')).toHaveCount(5);
  await expect(text).toContainText('What if the network connection is lost?');
  await page.locator('#twView').click();
  await expect(page.locator('.tw-main')).toBeVisible();
});

test('digital twin: phones get the zones as a plan of buttons, no sculpture', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await open(page);
  await page.locator('#twin').scrollIntoViewIfNeeded();
  await expect(page.locator('#twSvg')).toBeHidden();
  await page.locator('.tw-zone[data-z="web"]').click();
  await expect(page.locator('#twPanel h3')).toHaveText('The Web');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('digital twin: reduced motion keeps the model still', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  await open(page);
  await expect(page.locator('#tw')).toHaveClass(/lite/);
  await page.locator('#twin').scrollIntoViewIfNeeded();
  await page.locator('.tw-zone[data-z="lab"]').click();
  // No camera move, and the signal never leaves its parking spot.
  expect(await page.locator('#twWorld').evaluate(w => w.style.getPropertyValue('--tx'))).toBe('');
  await page.waitForTimeout(400);
  expect(await page.locator('.tw-sig').getAttribute('cx')).toBe('-50');
  await ctx.close();
});
