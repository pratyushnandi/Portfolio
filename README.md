# ⚡ Pratyush Nandi — Developer Portfolio (v2.0)

[![Website Vercel](https://img.shields.io/badge/Vercel-Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://pratyushnandi.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Pratyush_Nandi-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/pratyushnandi/)
[![GitHub](https://img.shields.io/badge/GitHub-pratyushnandi-181717?style=for-the-badge&logo=github)](https://github.com/pratyushnandi)

A high-performance, developer-centric personal portfolio built with a futuristic dark terminal aesthetic, neon gradients, glassmorphism, and responsive design. Features custom canvas particle physics, GSAP scroll animations, 3D tilt effects, and an integrated direct-dispatch contact system.

---

## 🌐 Live Website

- **Production (Vercel):** [https://pratyushnandi.vercel.app](https://pratyushnandi.vercel.app)

---

## ✨ Features & Highlights

- **⚡ Interactive Terminal Preloader:** Simulated system boot sequence (`boot.sh`) displaying progress diagnostics before loading the site.
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
- **JavaScript (ES6+):** Modular clientside scripting for state management, interactive UI, and event delegation.

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
├── documents/           # Education grade cards & certificates (PDF/JPG)
├── files/               # Resume/CV PDF
│   └── PRATYUSH NANDI_CV (NEW).pdf
├── images/              # Profile images, icons, and graphic assets
│   └── profile.jpg
├── projects/            # Project showcase preview images
│   ├── detectify.jpg
│   └── recruitment.jpg
├── .gitignore           # Git ignore rules
├── index.html           # Main semantic HTML structure & markup
├── LICENSE              # MIT License
├── package.json         # Project metadata and local scripts
├── package-lock.json    # Dependency lockfile
├── README.md            # Comprehensive project documentation
├── robots.txt           # Search engine crawl rules
├── script.js            # Main script (GSAP, Canvas, Cursor, Form logic)
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
