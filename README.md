# ⚡ Pratyush Nandi — Developer Portfolio (v5.0)

[![Website Vercel](https://img.shields.io/badge/Vercel-Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://pratyushnandi.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Pratyush_Nandi-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/pratyushnandi/)
[![GitHub](https://img.shields.io/badge/GitHub-pratyushnandi-181717?style=for-the-badge&logo=github)](https://github.com/pratyushnandi)

A high-performance, developer-centric personal portfolio built with a futuristic terminal aesthetic, neon gradients, glassmorphism, and responsive design. Features a cinematic boot intro, a `Ctrl+K` command palette, an interactive in-browser terminal, light/dark themes, custom canvas particle physics, GSAP scroll animations, 3D tilt effects, and an integrated direct-dispatch contact system — all in plain HTML, CSS and JavaScript with no build step.

---

## 🌐 Live Website

- **Production (Vercel):** [https://pratyushnandi.vercel.app](https://pratyushnandi.vercel.app)

---

## 🔁 CI/CD

[![CI](https://github.com/pratyushnandi/Portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/pratyushnandi/Portfolio/actions/workflows/ci.yml)

| Stage | Where | What it does |
| :--- | :--- | :--- |
| **CI** | `.github/workflows/ci.yml` — every PR to `main` and push to `main` / `deployment` | HTML validation, CSS + JS linting, local asset check, Playwright browser tests (desktop + mobile), Lighthouse audit |
| **CD** | Vercel Git integration | Preview deployment per push, production deployment on merge to `main` |
| **Post-deploy** | `.github/workflows/post-deploy.yml` — on every successful deployment | Re-runs the browser tests against the live URL |
| **Maintenance** | `.github/dependabot.yml` | Weekly grouped updates for npm tooling and GitHub Actions |

Lighthouse fails the build if Accessibility, SEO or Best Practices drop below 90 (Performance below 60 only warns). The browser tests mock the contact-form API, so CI never sends real email.

Run the same checks locally:

```bash
npm ci
npx playwright install chromium   # first time only
npm run ci                        # lint + asset check + browser tests
npm run lighthouse                # optional: Lighthouse audit
```

Optional repository settings:
- **`PRODUCTION_URL`** (Actions variable) — domain the post-deploy test hits for production (defaults to `https://pratyushnandi.vercel.app`).
- **`VERCEL_AUTOMATION_BYPASS_SECRET`** (Actions secret) — from Vercel → Settings → Deployment Protection; lets the post-deploy test reach protected preview URLs. Without it, previews are skipped.

---

## ✨ Features & Highlights

- **⚡ Cinematic Boot Intro:** Simulated system boot sequence (`boot.sh`) with a glyph-decoding name, logo charge-up and shockwave, and a CRT-style switch-off exit. It adapts rather than repeating itself: the full sequence on a first visit, a ~40% faster version on reload in the same tab, and a calm, motion-free version under `prefers-reduced-motion`. Any key, click or tap skips it.
- **⌨️ Command Palette (`Ctrl+K` / `⌘K`):** Fuzzy-search launcher to jump to any section, toggle the theme, open the terminal, download the résumé, copy the email address, or open GitHub / LinkedIn. Fully keyboard-driven (`↑` `↓` `Enter` `Esc`).
- **🖥️ Interactive Terminal (`` ` ``):** A working shell overlay with command history (`↑` / `↓`), `Tab` completion and `Ctrl+L` to clear. Try `help`, `whoami`, `neofetch`, `ls`, `cat about.md`, `experience`, `skills`, `projects`, `education`, `contact`, `socials`, `resume`, `hire` — and `sudo`, if you're feeling lucky.
- **🌗 Light / Dark Theme:** Theme toggle that persists between visits, plus toast notifications for quick actions like copying the email address.
- **🌌 Dynamic Particle Canvas & Ambient Lighting:** Custom HTML5 canvas particle background with interactive mouse glow, moving ambient orbs, and floating code snippet badges.
- **🎯 Custom Tri-Layer Cursor:** Precision interactive custom cursor composed of a focal dot, trailing fluid ring, and ambient cursor glow.
- **📜 Horizontal Experience Timeline:** Interactive horizontal scrolling timeline tracing developer milestones, full-stack roles, and campus tech leadership.
- **📊 Filterable Skills Matrix & Infinite Marquee:** Interactive category tabs (Languages, Frontend, Backend, Tools) with animated proficiency indicators and a continuous tech logo marquee.
- **💼 Interactive Project Showcase:** Project cards with category filtering (*All, AI/ML, Web App, Full-Stack*), 3D perspective tilt (`vanilla-tilt`), and live demo/source links.
- **🎓 Academic & Verified Credentials:** Dedicated credentials section highlighting degrees, GPA, and external certificate verification (Google Data Analytics, Deloitte, NSDC).
- **📬 Reliable Contact System:** Integrated contact form powered by Web3Forms with structured reason dropdowns, company fields, real-time validation, an automatic `mailto:` fallback, and an `aria-live` status region for screen readers.
- **📱 Fully Responsive:** Optimized across mobile, tablet, laptop, and ultra-wide displays with accessible navigation and a hamburger menu.
- **🔍 SEO & Discoverability:** OpenGraph metadata with absolute image URLs, `Person` JSON-LD structured data, `robots.txt`, and `sitemap.xml` for search engine indexing.

---

## 🛠️ Tech Stack & Libraries

### Core Architecture
- **HTML5:** Semantic, accessible page architecture with OpenGraph metadata and SEO optimization.
- **CSS3:** Custom design system built with CSS variables, backdrop filters, responsive flexbox/grid layouts, and glassmorphism.
- **JavaScript (ES6+):** Modular client-side scripting for state management, interactive UI, and event delegation.

### Tooling & Quality
- **[Playwright](https://playwright.dev/):** End-to-end browser tests on desktop and mobile (Pixel 7) viewports.
- **[html-validate](https://html-validate.org/), [Stylelint](https://stylelint.io/) & [ESLint](https://eslint.org/):** HTML, CSS and JavaScript linting.
- **[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci):** Performance, accessibility, SEO and best-practice budgets.
- **GitHub Actions + Vercel:** CI quality gate, preview/production deploys, and post-deploy smoke tests.

### Libraries & Frameworks
- **[GSAP 3.12.5](https://greensock.com/gsap/):** High-performance UI motion and entry sequences.
- **[ScrollTrigger](https://greensock.com/scrolltrigger/):** Scroll-driven element reveals and viewport animations.
- **[Vanilla Tilt 1.8.1](https://micku7zu.github.io/vanilla-tilt.js/):** Smooth 3D tilt interaction on project cards and skill badges.
- **[Devicon](https://devicon.dev/) & [Font Awesome 6.5](https://fontawesome.com/):** Vector iconography for programming languages, tools, and social links.
- **Google Fonts:** *Plus Jakarta Sans* (Primary UI typography) & *Fira Code* (Monospace code elements).

---

## 📂 Project Showcase

| Project | Category | Tech Stack | Highlights | Links |
| :--- | :--- | :--- | :--- | :---: |
| **Detectify** | AI / ML *(Featured)* | Python, OpenCV, Computer Vision, ML | Real-time traffic violation detection (red light jumping, speeding, helmet violations). | [GitHub](https://github.com/pratyushnandi) |
| **Campus Recruitment System** | Web App *(Featured)* | PHP, Laravel, MySQL, HTML/CSS | Full-stack recruitment portal with student registration, job postings, and tracking. | [GitHub](https://github.com/pratyushnandi) |
| **Code Editor** | Full-Stack | HTML5, CSS3, JavaScript | Browser-based real-time code editor with instant live render output. | [Live Demo](https://pratyushnandi.github.io/Code_EDITOR/) |
| **Web Calculator** | Full-Stack | Node.js, Express, HTML, CSS | Responsive web calculator with server-side logic and clean interface. | [Live Demo](https://web-calculator-ad.netlify.app/) |
| **Rock Paper Scissors** | Game / JS | JavaScript, HTML5, CSS3 | Interactive game with intelligent AI opponent logic and smooth animations. | [Live Demo](https://playfull-game.netlify.app/) |
| **Cyber Calendar** | Utility | JavaScript, HTML5, CSS3 | Futuristic cyberpunk-themed interactive calendar and event manager. | [Live Demo](https://cyber-calender-ab.netlify.app/) |
| **Background Changer** | Utility | Node.js, Express, HTML, CSS | Real-time interactive background color manipulation tool. | [Live Demo](https://background-change12.netlify.app/) |

---

## 👨‍💻 Experience & Education

- **Current Role:** Software Developer at **Eltern Segen Technologie Pvt. Ltd.** (Kolkata, India)
- **Leadership:** Tech Lead, Student Developer Club at Adamas University
- **Education:**
  - **Master of Computer Applications (MCA):** Adamas University *(2024 – 2026)*
  - **Bachelor of Computer Application (BCA):** Techno India (Hooghly) – MAKAUT *(2021 – 2024, CGPA: 8.06)*
- **Certifications:**
  - Google Data Analytics Professional Certificate — [Verify Credential](https://www.coursera.org/account/accomplishments/professional-cert/DNU7LAGUDSYJ)
  - Data Analytics Job Simulation — Deloitte (Forage)
  - IT / ITES Level 1 & Level 2 — NSDC & Skill India
  - Domestic IT Helpdesk Attendant — NSQF Level-4

---

## 📁 Repository Structure

```text
PORTFOLIO/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml           # Lint, asset check, Playwright & Lighthouse on PR/push
│   │   └── post-deploy.yml  # Smoke tests against each live Vercel deployment
│   └── dependabot.yml       # Weekly npm + Actions dependency updates
├── documents/           # Education grade cards & certificates (PDF/JPG)
├── files/               # Resume/CV PDF
│   └── PRATYUSH NANDI_CV (NEW).pdf
├── images/              # Profile images, icons, and graphic assets
│   └── profile.jpg
├── projects/            # Project showcase preview images
│   ├── detectify.jpg
│   └── recruitment.jpg
├── scripts/
│   ├── check-assets.mjs # Fails if index.html references a missing local file
│   └── stage-site.mjs   # Copies deployable files for the Lighthouse run
├── tests/
│   └── site.spec.js     # Playwright end-to-end tests
├── .htmlvalidate.json   # html-validate rules
├── .stylelintrc.json    # Stylelint rules
├── .vercelignore        # Keeps tooling and tests out of the deployment
├── eslint.config.mjs    # ESLint flat config
├── index.html           # Main semantic HTML structure & markup
├── lighthouserc.json    # Lighthouse CI budgets
├── LICENSE              # MIT License
├── package.json         # Project metadata and npm scripts
├── playwright.config.js # Playwright projects (desktop + mobile) & local server
├── README.md            # Project documentation
├── robots.txt           # Search engine crawl rules
├── script.js            # Main script (preloader, GSAP, canvas, cursor, command palette, terminal, form)
├── sitemap.xml          # Sitemap for search engine indexing
├── style.css            # Complete design system, variables & styling
└── vercel.json          # Vercel deployment configuration
```

---

## 🚀 Local Development Setup

To run this website locally on your machine:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (or Python 3).

### 1. Clone the repository
```bash
git clone https://github.com/pratyushnandi/Portfolio.git
cd Portfolio
```

### 2. Install dependencies (optional for local server)
```bash
npm install
```

### 3. Run the development server

Using the pre-configured npm scripts:
```bash
npm run dev
# or
npm run serve
```

Alternatively, run with Python:
```bash
python -m http.server 3000
```

Open your browser and navigate to:
```text
http://localhost:3000
```

### 4. Available npm scripts

| Script | What it does |
| :--- | :--- |
| `npm start` / `npm run dev` | Live-reloading dev server on port 3000 |
| `npm run serve` | Static server on port 3000 (no live reload) |
| `npm run lint` | Runs `lint:html`, `lint:css` and `lint:js` |
| `npm run check:assets` | Verifies every local file referenced in `index.html` exists |
| `npm run test:e2e` | Playwright tests (starts its own server on port 4173; set `BASE_URL` to test a deployed site) |
| `npm run lighthouse` | Stages the site and runs a Lighthouse CI audit |
| `npm run ci` | Lint + asset check + browser tests — the same gate as CI |

---

## 📬 Contact & Connect

- **Email:** [pratyushnandi100@gmail.com](mailto:pratyushnandi100@gmail.com)
- **Phone:** [+91-7890706472](tel:+917890706472)
- **LinkedIn:** [linkedin.com/in/pratyushnandi](https://www.linkedin.com/in/pratyushnandi/)
- **GitHub:** [github.com/pratyushnandi](https://github.com/pratyushnandi)
- **Location:** Kolkata, West Bengal, India

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — see the LICENSE file for details.
