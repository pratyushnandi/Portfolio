# ⚡ Pratyush Nandi — Developer Portfolio (v9.1)

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

### Signature experiences

- **🧭 Engineering identity in the hero:** *Software Developer* as the primary identity, with *AI / ML · Full-Stack · Computer Vision · Real-Time Systems*. Below it, a **request path** band (User → Frontend → API → Database → AI / ML → Computer Vision → Edge) with a data packet travelling through the layers; each layer opens the System Map with that node selected.
- **⚖️ Engineering decisions:** every System Map node explains why its tools are in the stack (Why Fastify? Why PostgreSQL? Why RTSP and MediaMTX? Why process at the edge?). This is reasoning about the tools, not claims about any one project, and the assistant answers "Why X?" from the same data.
- **🔁 How I build:** an eight-stage, scroll-driven loop (Idea → Architecture → Development → Integration → Testing → Deployment → Monitoring → Optimisation). Every stage is evidenced by this portfolio's own, checkable engineering: CI, Playwright, Vercel and Pages deploys, post-deploy smoke tests and Lighthouse budgets.
- **🎯 Current focus:** five focus areas drawn from the stack.
- **🧠 Context-aware UI:** the page knows which section is being read (scroll position only). The command palette opens with commands suggested for that section, and the assistant leads with a matching question.

- **🛠️ Engineering Mode:** One toggle (`ENG` in the navbar) re-reads the whole site as an engineering interface. A scan line sweeps the screen and each element switches as the line passes it. You get a blueprint grid with rulers, crop-mark frames with component tags, section metadata counted live from the page, a technical flow line on every project, circuit-style traces in the hero, and a system panel that boots row by row. The panel's statuses are labelled as a representation; its runtime block (current section, viewport, theme, motion) is real.
- **🗺️ Interactive System Map:** The stack as one connected system, from User → Frontend → API → Database / AI·ML → Computer Vision (+ Stream) → Edge AI → IoT → Real World. Selecting a node lights the route a request takes to reach it, runs data along those edges only, mutes the rest, highlights its technologies in the stack grid, and fills an inspector with what it does and which projects use it.
- **👁️ AI Pipeline (scroll-driven):** Seven stages (Input → Data → Processing → Model → Inference → Decision → Action) come online as you scroll, with a signal travelling the rail. Each stage visibly changes an illustrated camera frame: raw feed, data patches, wireframe processing, detection boxes, a red-light verdict, and finally an alert. It rewinds when you scroll back and never loops. The frame is labelled an illustration, and no camera is used.
- **📖 Project Case Studies:** Detectify and the Campus Recruitment System open as engineering write-ups covering problem, architecture (with an animated flow), technology and engineering decisions. Every statement comes from the project description or its repository. There is no invented "results" section.
- **⌨️ Command Palette:** `Ctrl K` / `⌘ K` (or the search button) to jump to any section, toggle the theme or Engineering Mode, copy the email, download the resume, or open a case study.
- **💬 Portfolio Assistant:** Ask about the work from inside the palette, or with *Ask about my work* in the hero. It is **deterministic, not an AI model**, and says so. Questions are matched to intents, technologies or projects, and answers are assembled from the page's own content. Anything it can't ground in the page gets an honest "I can only answer from this portfolio".
- **🖱️ Contextual Cursor:** On desktop, a small label joins the native pointer over projects (*Explore*), technologies (*Tech*) and contact links (*Let's talk*). Off on touch devices and under reduced motion.

### Mobile, keyboard & screen readers

Each signature feature has its own touch and keyboard interaction model, not a shrunken desktop:

- **Engineering Mode:** a compact bottom sheet on phones (system list plus *View architecture*; secondary groups fold away).
- **System map:** becomes a full-width linear flow with details opening inline under the tapped node. Arrow keys walk the nodes, and Esc clears.
- **Technology chips:** toggle buttons; tap or Enter selects, and a text readout says where each fits.
- **AI pipeline:** stages are buttons. In the pinned view they jump to their point in the story; in the in-flow view (reduced motion, or screens too short to pin) they expand.
- **Case studies:** sections are disclosure buttons; phones open with Problem and Architecture expanded.
- **Command palette:** reachable from a visible button on every device, with an explicit close button and a strict focus trap, and focus returns to the trigger.
- **Mobile menu:** modal: the page behind is inert, focus moves into the menu, and Esc returns focus to the button.
- **Touch targets:** 44 × 44 px or larger on touch devices.
- **Contrast:** meets WCAG AA in dark, light and Engineering Mode. States are always shown as text too, never by colour alone.
- **Motion:** touch and small screens drop continuous background motion. `prefers-reduced-motion` removes motion but keeps every function.
- **Overflow:** none from 320 px to 1920 px.

### Everything else

- **⚡ Short Intro:** A ~1.3s logo-draw preloader on first visit, ~0.45s on reload, near-instant under `prefers-reduced-motion`. Any key, click or tap skips it, and it waits for web fonts so the hero never reveals mid-swap.
- **🌗 Two Designed Themes:** A deep, ambient dark theme and a dedicated off-white light theme (its own palette, shadows and light-mode IDE — not an inversion). Switching grows the new theme out of the toggle as a circle via the View Transitions API, with a colour cross-fade fallback. The choice persists; otherwise the OS preference is followed.
- **🖥️ IDE Hero:** Kinetic name reveal, a `developer.ts` editor whose lines type in, a deploy terminal, profile card and tech chips with pointer parallax, over a lightweight node-network canvas that pauses whenever the hero or tab is hidden.
- **🧭 Navigation:** Floating glass navbar that tightens on scroll, a sliding active-section indicator driven by scroll-spy, a scroll progress line, and a full-screen mobile menu.
- **🧱 About Bento:** Intro, photo, current role, animated counters, focus areas and a `profile.json` card.
- **🌿 Commit-Graph Experience:** Roles laid out like a `git log`, with a rail that fills as you read and nodes that light up.
- **🧩 Tech Stack:** Grouped technology nodes that glow in each tool's brand colour, plus an edge-pipeline log panel.
- **💼 Project Showcase:** Two featured rows (Detectify shows detection boxes on hover) with case studies, generated preview art for each smaller project, a sliding category filter (*All, AI/ML, Web App, Full-Stack*), and live/source links.
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
| **Detectify** | AI / ML *(Featured)* | Python, OpenCV, Computer Vision, ML | Real-time traffic violation detection (red light jumping, speeding, helmet violations). | [Source](https://github.com/pratyushnandi/DETECTIFY) |
| **Campus Recruitment System** | Web App *(Featured)* | PHP, Laravel, MySQL, HTML/CSS | Full-stack recruitment portal with student registration, job postings, and tracking. | [GitHub](https://github.com/pratyushnandi) |
| **Code Editor** | Full-Stack | HTML5, CSS3, JavaScript | Browser-based real-time code editor with instant live render output. | [Live Demo](https://pratyushnandi.github.io/Code_EDITOR/) · [Source](https://github.com/pratyushnandi/Code_EDITOR) |
| **Portfolio Website** | Web App | HTML, CSS, JavaScript | Earlier responsive portfolio with neon animations, AOS effects and an EmailJS contact form. | [Live Demo](https://portfolio-website-ab1.netlify.app/) · [Source](https://github.com/pratyushnandi/Portfolio) |
| **Web Calculator** | Full-Stack | Node.js, Express, HTML, CSS | Responsive web calculator with server-side logic and clean interface. | [Live Demo](https://web-calculator-ad.netlify.app/) |
| **Rock Paper Scissors** | Game / JS | JavaScript, HTML5, CSS3 | Interactive game with intelligent AI opponent logic and smooth animations. | [Live Demo](https://playfull-game.netlify.app/) |
| **Cyber Calendar** | Utility | JavaScript, HTML5, CSS3 | Futuristic cyberpunk-themed interactive calendar and event manager. | [Live Demo](https://cyber-calender-ab.netlify.app/) |
| **Background Changer** | Utility | Node.js, Express, HTML, CSS | Real-time interactive background color manipulation tool. | [Live Demo](https://background-change12.netlify.app/) |

---

## 👨‍💻 Experience & Education

- **Current Role:** Software Developer at **Eltern Segen Technologie Pvt. Ltd.** (Kolkata, India)
- **Leadership:** Tech Lead, Student Developer Club at Adamas University
- **Stack:** Python, JavaScript, TypeScript, Java, C/C++ · React.js, Next.js · Node.js, Fastify, Express, REST APIs, Laravel/PHP · PostgreSQL, MySQL, Prisma, MongoDB · Raspberry Pi, RTSP, MediaMTX, YOLO, OpenCV, IoT, Edge Computing, Visual AI · Git, GitHub
- **Education:**
  - **Master of Computer Applications (MCA):** Adamas University *(2024 – 2026, CGPA: 7.80)*
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

## 🏷️ Releases

| Version | Highlights |
| :--- | :--- |
| **[v10.4.0](https://github.com/pratyushnandi/Portfolio/releases/tag/v10.4.0)** | Aspend, an offline-first Android expense tracker (React Native, Expo, TypeScript, SQLite, Zustand), joins the selected work with a Mobile filter; Web Calculator moves to earlier experiments. React Native and SQLite join the stack and the system map's frontend and database layers. "Years coding" now matches the timeline (5+). The technology grid no longer leaves an empty block where the telemetry log was. |
| [v10.3.0](https://github.com/pratyushnandi/Portfolio/releases/tag/v10.3.0) | Credibility pass. Experience keeps real positions on the commit graph and moves how the stack grew into a separate Disciplines list (all text kept). The about stat that counted those as roles now shows the two YOLOv8 models trained for Detectify. Projects: three cards in one row, plus a compact "earlier experiments" list that the filter, assistant and system map still read. Removed the stack section's illustrative telemetry log and the Campus Recruitment "GitHub" link that pointed at the profile, not a repository. |
| [v10.2.1](https://github.com/pratyushnandi/Portfolio/releases/tag/v10.2.1) | Performance: page weight 828 → 280 KiB. Icon fonts replaced by a generated, same-origin `icons.css` with only the icons in use (`scripts/build-icons.mjs`); fonts self-hosted and preloaded; no third-party requests before first paint. The hero bio paints without waiting for the intro, scroll handlers no longer force a reflow per module on load, and the request-path pulse runs on the compositor. Desktop Lighthouse 80 → 95, layout shift 0.164 → 0.006. Both logo links now have an accessible name. |
| [v10.2.0](https://github.com/pratyushnandi/Portfolio/releases/tag/v10.2.0) | PRATYUSH OS, a session layer over the existing site: a once-per-browser boot sequence, a section rail on wide screens, rare system events, and a "Session complete" ending that draws the visitor's own route (kept in sessionStorage for the tab only, with restart and clear). The AI section is renamed AI Lab, Engineering Mode shows the visitor's local clock, and there is one hidden command in the palette. |
| [v10.0.0](https://github.com/pratyushnandi/Portfolio/releases/tag/v10.0.0) | Art direction: one professional design system. Semantic design tokens (colour, spacing, radius, motion, z-index), a restrained single-hue palette, editorial section marks (01 / About), an executive hero, Engineering Mode restyled as a control center, a progressive-disclosure contact flow and a signature footer. Fabricated hero telemetry and the footer status line were removed. |
| [v9.1.2](https://github.com/pratyushnandi/Portfolio/releases/tag/v9.1.2) | Cache-busting: stylesheet and script URLs carry the release version, so returning visitors get each release immediately instead of a stale cached copy. |
| [v9.1.1](https://github.com/pratyushnandi/Portfolio/releases/tag/v9.1.1) | Ambulance Management System: full project description (search and booking, patient and pickup details, booking status, availability, drivers, emergency requests and trip management). |
| [v9.1.0](https://github.com/pratyushnandi/Portfolio/releases/tag/v9.1.0) | From the CV: Ambulance Management System project, Univolve Consulting internship (Jul – Aug 2025) and the Udemy AWS Solutions Architect Associate course certificate. |
| [v9.0.1](https://github.com/pratyushnandi/Portfolio/releases/tag/v9.0.1) | Case studies complete: Detectify gains a Result section with the recorded YOLOv8 evaluation runs (including a stated limitation) and My Contribution; Campus Recruitment gains a Result section. All drawn from the DETECTIFY repository and the CV. |
| [v9.0.0](https://github.com/pratyushnandi/Portfolio/releases/tag/v9.0.0) | Engineering identity: hero identity + request-path band into the System Map, engineering decisions per system layer, Challenge and Solution in case studies, a scroll-driven "How I build" section evidenced by this site, Current focus, context-aware palette and assistant suggestions, launcher-style palette ranking, decorative particle canvas removed. |
| [v8.0.1](https://github.com/pratyushnandi/Portfolio/releases/tag/v8.0.1) | Post-deploy smoke test now runs against the GitHub Pages copy (served under `/Portfolio/`) instead of failing on the domain root; technology-chip selection no longer jumps to a neighbouring chip. |
| [v8.0.0](https://github.com/pratyushnandi/Portfolio/releases/tag/v8.0.0) | Mobile & accessibility: every signature feature gets its own touch and keyboard model (Engineering Mode bottom sheet, linear system map with inline details, toggle tech chips with a text readout, tappable pipeline stages, expandable case studies), 44px touch targets, strict focus traps, an inert page behind the mobile menu, WCAG AA contrast in every theme and mode, still hero background on touch, and no overflow from 320px to 1920px. |
| [v7.1.1](https://github.com/pratyushnandi/Portfolio/releases/tag/v7.1.1) | Navbar keeps its full width when scrolled so Resume stays inside it; Resume is now a gradient call-to-action; hero tech chips fly independent "bee" paths; full stop removed after the name. |
| [v7.1.0](https://github.com/pratyushnandi/Portfolio/releases/tag/v7.1.0) | Signature experiences: Engineering Mode, interactive System Map, scroll-driven AI pipeline with an illustrated computer-vision frame, project case studies, command palette with a deterministic portfolio assistant, and a contextual cursor. New e2e tests for each. Lighthouse 90 / 100 / 100 / 100. |
| [v7.0.0](https://github.com/pratyushnandi/Portfolio/releases/tag/v7.0.0) | Version bump to 7.0.0 across the site, package metadata and README. |
| [v6.0.0](https://github.com/pratyushnandi/Portfolio/releases/tag/v6.0.0) | Full redesign: new design system, dedicated light and dark themes with a circular theme transition, an IDE-style hero, a commit-graph timeline, a live architecture diagram, redesigned projects, contact and footer. GSAP and Vanilla Tilt removed. Lighthouse 91 / 100 / 100 / 100. |
| v4.1.0 | Reworked preloader intro, CI pipeline, post-deploy smoke tests and accessibility fixes. |

Each release is tagged (`vX.Y.Z`) and published on the [Releases page](https://github.com/pratyushnandi/Portfolio/releases).

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
