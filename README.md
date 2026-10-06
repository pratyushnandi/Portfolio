# ⚡ Pratyush Nandi — Developer Portfolio (v6.0)

[![Website Vercel](https://img.shields.io/badge/Vercel-Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://pratyushnandi.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Pratyush_Nandi-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/pratyushnandi/)
[![GitHub](https://img.shields.io/badge/GitHub-pratyushnandi-181717?style=for-the-badge&logo=github)](https://github.com/pratyushnandi)

A premium, developer-focused personal portfolio with two intentionally designed themes, an IDE-inspired hero, a live system-architecture diagram, a commit-graph experience timeline and a motion system built on `transform`/`opacity` only — all in plain HTML, CSS and JavaScript with no build step and no animation library.

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

- **⚡ Short Intro:** A ~1.3s logo-draw preloader on first visit, ~0.45s on reload, near-instant under `prefers-reduced-motion`. Any key, click or tap skips it, and it waits for web fonts so the hero never reveals mid-swap.
- **🌗 Two Designed Themes:** A deep, ambient dark theme and a dedicated off-white light theme (its own palette, shadows and light-mode IDE — not an inversion). Switching grows the new theme out of the toggle as a circle via the View Transitions API, with a colour cross-fade fallback. The choice persists; otherwise the OS preference is followed.
- **🖥️ IDE Hero:** Kinetic name reveal, a `developer.ts` editor whose lines type in, a deploy terminal, profile card and tech chips with pointer parallax, over a lightweight node-network canvas that pauses whenever the hero or tab is hidden.
- **🧭 Navigation:** Floating glass navbar that tightens on scroll, a sliding active-section indicator driven by scroll-spy, a scroll progress line, and a full-screen mobile menu.
- **🧱 About Bento:** Intro, photo, current role, animated counters, focus areas and a `profile.json` card.
- **🌿 Commit-Graph Experience:** Roles laid out like a `git log`, with a rail that fills as you read and nodes that light up.
- **🗺️ Stack + Architecture:** A live diagram of the web platform and edge vision pipeline (React/Next.js → Fastify → PostgreSQL; RTSP → MediaMTX → YOLO on Raspberry Pi), plus grouped technology nodes that glow in each tool's brand colour.
- **💼 Project Showcase:** Two featured case-study rows (Detectify shows detection boxes on hover), generated preview art for each smaller project, a sliding category filter (*All, AI/ML, Web App, Full-Stack*), and live/source links.
- **🎓 Academic & Verified Credentials:** Degrees with grades, viewable grade cards and certificates in an accessible modal (focus-trapped, Esc to close; phones open PDFs in a new tab), and external certificate verification.
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
- **No animation library:** reveals, counters, parallax and scroll-linked effects use `IntersectionObserver`, one rAF-throttled scroll loop and CSS transitions.
- **[Devicon](https://devicon.dev/) & [Font Awesome 6.5](https://fontawesome.com/):** Vector iconography for programming languages, tools, and social links.
- **Google Fonts:** *Geist* (UI typography), *JetBrains Mono* (code and technical labels) & *Instrument Serif* (italic accents).

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
├── script.js            # Main script (preloader, theme, nav, hero canvas, reveals, form, viewer)
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
