import js from '@eslint/js';
import globals from 'globals';

export default [
  // .lhci-* / .lighthouseci are local Lighthouse outputs (a staged copy of the site
  // and its reports); linting them would flag script.js twice under the wrong config.
  { ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**', '.lhci-site/**', '.lhci-report/**', '.lighthouseci/**'] },
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
    // Site script: a classic <script>, not a module, with no library globals.
    files: ['script.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser }
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
