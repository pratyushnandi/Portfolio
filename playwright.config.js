// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const PORT = 4173;
const CI = !!process.env.CI;

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  // Each page runs canvas + CSS animation; too many parallel browsers starve the CPU.
  workers: 2,
  timeout: 60_000,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    // Always end in "/" so tests can open './' relative to it. GitHub Pages serves
    // the site under /Portfolio/, and '/' would resolve to the domain root instead.
    baseURL: (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/?$/, '/'),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Lets the post-deploy job reach protected Vercel preview URLs.
    extraHTTPHeaders: process.env.VERCEL_BYPASS
      ? { 'x-vercel-protection-bypass': process.env.VERCEL_BYPASS, 'x-vercel-set-bypass-cookie': 'true' }
      : undefined
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } }
  ],
  // Skip the local server when pointing the suite at a deployed URL (BASE_URL).
  webServer: process.env.BASE_URL ? undefined : {
    command: `npx serve . -l ${PORT} --no-clipboard`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 60_000
  }
});
