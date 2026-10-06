import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  {
    rules: {
      // `try { localStorage… } catch {}` is used on purpose: storage can throw in
      // private mode and the site must keep working without it.
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': ['error', { caughtErrors: 'none' }]
    }
  },
  {
    // Site script: a classic <script>, not a module, talking to CDN globals.
    files: ['script.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, gsap: 'readonly', ScrollTrigger: 'readonly', VanillaTilt: 'readonly' }
    }
  },
  {
    files: ['tests/**/*.js', 'scripts/**/*.mjs', 'playwright.config.js', '*.config.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node, ...globals.browser } }
  },
  {
    files: ['playwright.config.js', 'tests/**/*.js'],
    languageOptions: { sourceType: 'commonjs' }
  }
];
