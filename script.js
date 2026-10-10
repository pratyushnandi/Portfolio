'use strict';

/* Pratyush Nandi — Portfolio · v6
   Plain modules, no framework. Every looping effect is paused while its
   section is off-screen or the tab is hidden, and nothing moves under
   prefers-reduced-motion. */

const root = document.documentElement;
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
// Every project on the page: the cards, plus the compact "earlier experiments"
// rows (titled with h4 there). Anything that lists or counts projects uses these.
const PROJECTS = '#projGrid .pj, .pj-mini';
const titleOf = p => $('h3, h4', p);
// The six chapters of the page, and which chapter each section belongs to.
const CHAPTERS = [['hero', '01', 'Identity'], ['thinking', '02', 'Thinking'], ['projects', '03', 'Building'],
  ['pipeline', '04', 'Intelligence'], ['experience', '05', 'Experience'], ['contact', '06', 'Connection']];
const CHAPTER_OF = { hero: 'hero', about: 'hero', thinking: 'thinking', process: 'thinking', skills: 'thinking',
  projects: 'projects', pipeline: 'pipeline', focus: 'pipeline', experience: 'experience', education: 'experience', contact: 'contact' };
// Modal <dialog>s already make the page inert; this also stops Tab from
// escaping to the browser chrome, so focus cycles inside the dialog.
function trapTab(dialog) {
  dialog.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', dialog)
      .filter(el => el.offsetParent !== null && !el.closest('[hidden]'));
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}
// Features announce when the visitor goes deeper than reading (pins a layer,
// opens a case study…). The session layer (§25) records it for this tab only.
const inspect = (kind, key, label) =>
  window.dispatchEvent(new CustomEvent('pn:inspect', { detail: { kind, key, label } }));
// Small, polite confirmation that an action completed (copy, theme, mode…).
const ack = (function () {
  let box = null, t = 0;
  return text => {
    if (!box) {
      box = document.createElement('div');
      box.className = 'ack';
      box.setAttribute('role', 'status');
      document.body.appendChild(box);
    }
    box.textContent = text;
    box.classList.add('on');
    clearTimeout(t);
    t = setTimeout(() => box.classList.remove('on'), 2200);
  };
})();

/* ══ 1. BOOT ══
   The full sequence (subsystems coming up one by one) plays once per browser:
   ~1.5s. Every later load, in this tab or a new one, gets the ~0.45s quick
   boot; reduced motion is near-instant. Any click or key skips it. Everything
   that waits on the intro listens for `pn:introdone` (or reads the flag). */
(function () {
  const loader = $('#preloader');
  function introDone() {
    if (window.__pnIntroDone) return;
    window.__pnIntroDone = true;
    root.classList.remove('is-loading');
    root.classList.add('hero-ready');
    window.dispatchEvent(new Event('pn:introdone'));
  }
  if (!loader) { introDone(); return; }

  let seen = false;
  try { seen = sessionStorage.getItem('pn-seen') === '1' || localStorage.getItem('pn-booted') === '1'; } catch (e) {}
  try { sessionStorage.setItem('pn-seen', '1'); localStorage.setItem('pn-booted', '1'); } catch (e) {}
  const mode = REDUCE_MOTION ? 'calm' : (seen ? 'quick' : 'full');
  const DURATION = { full: 1100, quick: 400, calm: 150 }[mode];
  loader.classList.add('mode-' + mode);
  root.classList.add('is-loading');

  const bar = $('#plBar');
  const cmd = $('#plCmd');
  if (bar) {
    bar.style.transition = `transform ${DURATION}ms cubic-bezier(.65,0,.35,1)`;
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transform = 'scaleX(1)'; }));
  }
  const timers = [];
  if (mode === 'full') $$('#plLog li').forEach((li, i) => timers.push(setTimeout(() => li.classList.add('up'), 160 + i * 110)));
  timers.push(setTimeout(() => { if (cmd) cmd.textContent = 'system online ✓'; }, DURATION * .8));

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    document.removeEventListener('keydown', onKey);
    loader.classList.add('gone');
    loader.setAttribute('aria-hidden', 'true');
    loader.setAttribute('aria-busy', 'false');
    introDone();
    setTimeout(() => loader.remove(), 600);
  }
  function onKey(e) { if (e.key !== 'Tab') finish(); }
  loader.addEventListener('click', finish);
  document.addEventListener('keydown', onKey);

  // Lift at the later of (animation done, web fonts ready), never past 1.8s,
  // so the hero reveal never runs with a font swap under it.
  let timeUp = false, fontsUp = !document.fonts;
  const maybe = () => { if (timeUp && fontsUp) finish(); };
  setTimeout(() => { timeUp = true; maybe(); }, DURATION);
  if (document.fonts) document.fonts.ready.then(() => { fontsUp = true; maybe(); }, () => { fontsUp = true; maybe(); });
  setTimeout(finish, 1800);
})();

/* ══ 2. THEME ══
   The new theme grows out of the toggle as a circle (View Transitions API),
   with a colour cross-fade fallback. Stored choice wins; otherwise follow the OS. */
(function () {
  const btn = $('#themeToggle');
  if (!btn) return;
  const meta = $('#themeColor');
  const isLight = () => root.getAttribute('data-theme') === 'light';
  function label() {
    btn.setAttribute('aria-label', isLight() ? 'Switch to dark theme' : 'Switch to light theme');
    btn.title = isLight() ? 'Light theme · switch to dark' : 'Dark theme · switch to light';
  }
  function apply(theme) {
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f3ee' : '#0c0d0f');
    label();
    window.dispatchEvent(new CustomEvent('pn:themechange', { detail: { theme } }));
  }
  label();

  btn.addEventListener('click', () => {
    const next = isLight() ? 'dark' : 'light';
    try { localStorage.setItem('pn-theme', next); } catch (e) {}

    if (REDUCE_MOTION) { apply(next); return; }
    if (!document.startViewTransition) {
      root.classList.add('theme-fade');
      apply(next);
      setTimeout(() => root.classList.remove('theme-fade'), 500);
      return;
    }
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = document.startViewTransition(() => apply(next));
    t.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 720, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
  });

  const mq = window.matchMedia('(prefers-color-scheme: light)');
  const onOS = e => {
    let stored = null;
    try { stored = localStorage.getItem('pn-theme'); } catch (err) {}
    if (!stored) apply(e.matches ? 'light' : 'dark');
  };
  if (mq.addEventListener) mq.addEventListener('change', onOS);
})();

/* ══ 3. NAVBAR · scroll state, scroll-spy, sliding indicator, mobile menu ══ */
const Nav = (function () {
  const nav = $('#nav');
  const links = $('#nLinks');
  const burger = $('#burger');
  const ind = $('.n-indicator');
  const prog = $('#navProg');
  const navAs = $$('.n-links a');
  // Spy on every section, not only linked ones, so reading a section without a
  // nav link (How I build, Current focus) clears the highlight instead of
  // leaving the previous link lit.
  const sections = $$('main > section[id]');
  let current = null;

  function moveIndicator(a) {
    if (!ind) return;
    if (!a) { ind.classList.remove('on'); return; }
    ind.style.setProperty('--ix', a.offsetLeft + 'px');
    ind.style.setProperty('--iw', a.offsetWidth + 'px');
    ind.classList.add('on');
  }
  function setActive(a) {
    if (a === current) return;
    current = a;
    navAs.forEach(n => {
      const on = n === a;
      n.classList.toggle('act', on);
      if (on) n.setAttribute('aria-current', 'true'); else n.removeAttribute('aria-current');
    });
    moveIndicator(a);
  }
  // Active section = the last one whose top has crossed 35% of the viewport;
  // none while still on the hero. At the very bottom force the last one: a
  // short final section may never cross the line.
  function spy() {
    if (!sections.length) return;
    let active = null;
    if (innerHeight + scrollY >= root.scrollHeight - 2) active = sections[sections.length - 1];
    else for (const s of sections) { if (s.getBoundingClientRect().top <= innerHeight * .35) active = s; else break; }
    window.__pnSection = active ? '#' + active.id : '#hero';
    setActive(active ? navAs.find(a => a.getAttribute('href') === '#' + active.id) : null);
  }
  function onScroll() {
    nav.classList.toggle('scrolled', scrollY > 40);
    const max = root.scrollHeight - innerHeight;
    if (prog) prog.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : '0');
    spy();
  }

  // The open menu is modal: everything behind it goes inert, so Tab stays in
  // the menu and screen readers don't wander into the page underneath.
  const behind = () => [$('#main'), $('.footer'), $('#topBtn'), $('#engPanel')].filter(Boolean);
  function setMenu(open) {
    const was = links.classList.contains('open');
    links.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    root.classList.toggle('modal-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    behind().forEach(el => { el.inert = open; });
    if (open && !was) {
      // Retry once after the open transition: an early focus() can lose the
      // race with the panel becoming visible.
      const first = $('a', links);
      const tryFocus = () => { if (first && links.classList.contains('open') && document.activeElement !== first) first.focus(); };
      setTimeout(tryFocus, 60); setTimeout(tryFocus, 450);
    }
  }
  burger.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  navAs.forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && links.classList.contains('open')) { setMenu(false); burger.focus(); }
  });
  window.addEventListener('resize', () => {
    if (innerWidth > 1100 && links.classList.contains('open')) setMenu(false);
    moveIndicator(current);
  }, { passive: true });
  // Web fonts change link widths after first layout.
  if (document.fonts) document.fonts.ready.then(() => moveIndicator(current));

  return { onScroll };
})();

/* ══ 4. ONE SCROLL LOOP ══
   Everything scroll-linked runs from a single rAF-throttled listener. */
const Scroll = (function () {
  const subs = [Nav.onScroll];
  let ticking = false;
  function run() { ticking = false; subs.forEach(f => f()); }
  const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  schedule();
  // A new subscriber runs on the next frame with all the others, not on the
  // spot: each module adds while the script is still writing to the DOM, and
  // reading layout there forced a full-page reflow per module on load.
  return { add: f => { subs.push(f); schedule(); } };
})();

/* ══ 4b. CONTEXT ══
   Which section is being read, published as html[data-context] and a
   pn:context event. The palette and assistant adapt to it. It is scroll
   position only; nothing about the visitor is inferred or stored. */
(function () {
  const secs = $$('main > section[id]');
  const label = $('#navChapter');
  let cur = null;
  Scroll.add(() => {
    let a = 'hero';
    if (innerHeight + scrollY >= root.scrollHeight - 2) a = secs[secs.length - 1].id;
    else for (const s of secs) { if (s.getBoundingClientRect().top <= innerHeight * .4) a = s.id; else break; }
    if (a === cur) return;
    cur = a;
    root.dataset.context = a;
    const ch = CHAPTERS.find(c => c[0] === CHAPTER_OF[a]);
    if (label && ch) label.innerHTML = `<b>${ch[1]}</b> ${ch[2]}`;
    window.dispatchEvent(new CustomEvent('pn:context', { detail: { context: a } }));
  });
})();

/* ══ 5. HERO · THE PN DIGITAL UNIVERSE ══
   Four engineering domains around the PN mark. Hover (mouse) previews a
   domain; click, tap, Enter or Space selects it: its pathways light up, its
   technical objects come forward and the panel explains it, with the projects
   that show it. "Inspect" moves the field towards the domain and reveals the
   detail on every object. Esc steps back out. The field leans gently with
   the pointer on desktop only, never under reduced motion, and only while
   the hero is on screen. Phones get a 2 × 2 domain grid instead of the field. */
(function () {
  const hero = $('#hero');
  if (!hero) return;
  $$('[data-hero]', hero).forEach((el, i) => el.style.setProperty('--hi', i));
  // Looping CSS (pathway pulses) pauses while the hero is off screen.
  new IntersectionObserver(([e]) => hero.classList.toggle('paused', !e.isIntersecting)).observe(hero);

  const uv = $('#universe');
  if (!uv) return;
  const stage = $('.uv-stage', uv), field = $('.uv-field', uv), panel = $('#uvPanel');
  const domains = $$('.uv-domain', uv);
  const lines = $$('[data-l]', uv), objects = $$('.uv-objects li', uv);
  const idle = panel.innerHTML;
  // What each domain is made of. Projects are listed only where a project on
  // this page shows the domain; IoT & Edge is honest about being a focus area.
  const DOMAINS = {
    sw: { label: 'Software Engineering', journey: 'product',
      line: 'Products people use: interfaces, APIs and data, typed, tested and shipped.',
      tech: ['React', 'React Native', 'TypeScript', 'Node.js', 'Express', 'MySQL', 'SQLite'],
      projects: ['campus-recruitment-system', 'aspend', 'ambulance-management-system', 'codeex-space'],
      inspect: [['interfaces', 'React on the web, React Native on Android'], ['apis', 'REST on Node.js and Express, with JWT roles'], ['data', 'MySQL, SQLite on the device, a JSON store behind one module']] },
    ai: { label: 'Artificial Intelligence', journey: 'vision',
      line: 'Models trained on labelled data, and measured on data they never saw.',
      tech: ['Python', 'YOLOv8', 'Ultralytics', 'Google Colab'],
      projects: ['detectify'],
      inspect: [['training', 'YOLOv8 on labelled frames, in Colab'], ['evaluation', 'precision, recall and mAP on held-out sets'], ['candour', 'weak held-out recall (0.52) is reported, not hidden']] },
    cv: { label: 'Computer Vision', journey: 'vision',
      line: 'Turning frames into boxes, classes and confidence, and those into decisions.',
      tech: ['YOLO', 'OpenCV', 'RTSP'],
      projects: ['detectify'],
      inspect: [['detection', 'helmets, plates, vehicles, signal state'], ['rules', 'detections become events, such as a red-light violation'], ['streams', 'RTSP from IP cameras: designed, not yet public']] },
    iot: { label: 'IoT & Edge Systems', journey: 'connected', focus: true,
      line: 'Inference next to the camera, so events travel over the network instead of video.',
      tech: ['Raspberry Pi', 'IoT', 'MediaMTX', 'REST APIs'],
      projects: [],
      inspect: [['edge', 'models on a Raspberry Pi at the site'], ['transport', 'events posted to the same API as the web app'], ['status', 'a current focus area, not yet in a public project']] }
  };
  // Which links light for each domain: its spoke, its two ring neighbours, its satellites.
  const LIT = { sw: ['core-sw', 'sw-ai', 'iot-sw', 'sw'], ai: ['core-ai', 'sw-ai', 'ai-cv', 'ai'],
    cv: ['core-cv', 'ai-cv', 'cv-iot', 'cv'], iot: ['core-iot', 'cv-iot', 'iot-sw', 'iot'] };

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  let pinned = null, shown = null;

  function render(k) {
    const d = DOMAINS[k];
    const w = el('div', 'uvp-node');
    const head = el('div', 'uvp-head');
    head.append(el('span', 'uvp-n mono', $(`[data-d="${k}"] .mono`, uv).textContent), el('h3', null, d.label));
    w.append(head, el('p', 'uvp-line', d.line));
    const tech = el('ul', 'uvp-tech mono');
    d.tech.forEach(t => tech.appendChild(el('li', null, t)));
    w.appendChild(tech);
    if (uv.classList.contains('inspect')) {
      const dl = el('dl', 'uvp-inspect');
      d.inspect.forEach(([k2, v]) => { const r = el('div'); r.append(el('dt', 'mono', k2), el('dd', null, v)); dl.appendChild(r); });
      w.appendChild(dl);
    }
    const foot = el('div', 'uvp-foot');
    const found = d.projects.map(projectEl).filter(Boolean);
    if (found.length) {
      foot.appendChild(el('span', 'uvp-k mono', 'seen in'));
      found.forEach(p => {
        const key = slug(titleOf(p).textContent);
        const b = el('button', 'uvp-proj', titleOf(p).textContent);
        b.type = 'button';
        b.addEventListener('click', () => {
          if ($(`.pj [data-case="${key}"]`)) Case.open(key, b);
          else p.scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth', block: 'center' });
        });
        foot.appendChild(b);
      });
    } else {
      foot.appendChild(el('span', 'uvp-k mono', 'focus area'));
      foot.appendChild(el('span', 'uvp-none', 'No public project shows this yet.'));
    }
    w.appendChild(foot);
    const acts = el('div', 'uvp-acts');
    const ins = el('button', 'uvp-btn mono', uv.classList.contains('inspect') ? 'Close inspection' : 'Inspect');
    ins.type = 'button';
    ins.setAttribute('aria-pressed', uv.classList.contains('inspect') ? 'true' : 'false');
    ins.addEventListener('click', () => setInspect(!uv.classList.contains('inspect')));
    const walk = el('button', 'uvp-btn mono', `Walk journey ${{ product: 'A', vision: 'B', connected: 'C' }[d.journey]}`);
    walk.type = 'button';
    walk.addEventListener('click', () => window.dispatchEvent(new CustomEvent('pn:dna-open', { detail: { journey: d.journey } })));
    acts.append(ins, walk);
    w.appendChild(acts);
    panel.replaceChildren(w);
  }
  function show(k) {
    if (k === shown) return;
    shown = k;
    uv.classList.toggle('has-sel', !!k);
    uv.dataset.sel = k || '';
    domains.forEach(b => b.classList.toggle('on', b.dataset.d === k));
    lines.forEach(l => l.classList.toggle('lit', !!k && LIT[k].includes(l.dataset.l)));
    objects.forEach(o => o.classList.toggle('on', o.dataset.d === k));
    if (k) render(k); else panel.innerHTML = idle;
  }
  function setInspect(on) {
    if (on && !pinned) return;
    uv.classList.toggle('inspect', on);
    if (on) {
      const b = domains.find(x => x.dataset.d === pinned);
      uv.style.setProperty('--fx', b.style.getPropertyValue('--x'));
      uv.style.setProperty('--fy', b.style.getPropertyValue('--y'));
      inspect('layer', 'uv-' + pinned + '-inspect', DOMAINS[pinned].label + ', inspected');
    }
    shown = undefined; show(pinned);
    // The panel was rebuilt: keep focus on its inspect toggle, inside the universe.
    const t = $('.uvp-btn', panel);
    if (t) t.focus({ preventScroll: true });
  }
  function pin(k) {
    pinned = pinned === k ? null : k;
    if (!pinned) uv.classList.remove('inspect');
    domains.forEach(b => b.setAttribute('aria-pressed', b.dataset.d === pinned ? 'true' : 'false'));
    shown = undefined; show(pinned);
    if (pinned) inspect('layer', 'uv-' + pinned, DOMAINS[pinned].label);
  }
  const narrow = window.matchMedia('(max-width: 760px)');
  domains.forEach((b, i) => {
    b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !narrow.matches) show(b.dataset.d); });
    b.addEventListener('click', () => pin(b.dataset.d));
    b.addEventListener('keydown', e => {
      if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
      e.preventDefault();
      domains[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + domains.length) % domains.length].focus();
    });
  });
  stage.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') show(pinned); });
  uv.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (uv.classList.contains('inspect')) { setInspect(false); return; }
    if (pinned) { const b = domains.find(x => x.dataset.d === pinned); pin(pinned); if (b) b.focus(); }
  });

  // Depth: the field leans towards the pointer, a few degrees at most.
  if (FINE_POINTER && !REDUCE_MOTION) {
    let raf = 0, px = 0, py = 0;
    stage.addEventListener('pointermove', e => {
      px = e.clientX; py = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = stage.getBoundingClientRect();
        const nx = (px - r.left) / r.width - .5, ny = (py - r.top) / r.height - .5;
        field.style.setProperty('--ry', (nx * 7).toFixed(2) + 'deg');
        field.style.setProperty('--rx', (-ny * 7).toFixed(2) + 'deg');
      });
    }, { passive: true });
    stage.addEventListener('pointerleave', () => { field.style.setProperty('--ry', '0deg'); field.style.setProperty('--rx', '0deg'); });
  }
})();

/* ══ 7. SCROLL REVEAL ══ */
(function () {
  // Tech nodes stagger in after their group.
  $$('.stack-group').forEach(g => $$('.node', g).forEach((n, i) => n.style.setProperty('--n', i)));

  const els = $$('[data-reveal]');
  if (REDUCE_MOTION || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach(el => {
    // Anything already above the fold on load (restored scroll / #anchor) shows at once.
    if (el.getBoundingClientRect().bottom < 0) el.classList.add('is-in');
    else io.observe(el);
  });
})();

/* ══ 8. COUNTERS ══ */
(function () {
  const els = $$('.count[data-count]');
  if (REDUCE_MOTION || !els.length) return;
  const ease = t => 1 - Math.pow(1 - t, 4);
  function run(el) {
    const end = +el.dataset.count, t0 = performance.now(), dur = 1400;
    const step = now => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(end * ease(p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  els.forEach(el => { el.textContent = '0'; });
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const go = () => setTimeout(() => run(e.target), e.target.closest('#hero') ? 900 : 150);
    if (window.__pnIntroDone) go(); else window.addEventListener('pn:introdone', go, { once: true });
  }), { threshold: .6 });
  els.forEach(el => io.observe(el));
})();

/* ══ 9. EXPERIENCE · commit-graph rail fills as you read ══ */
(function () {
  const wrap = $('#gitlog');
  if (!wrap) return;
  const fill = $('.gl-fill', wrap);
  const items = $$('.gl-item', wrap);
  Scroll.add(() => {
    const r = wrap.getBoundingClientRect();
    if (r.bottom < -100 || r.top > innerHeight + 100) return;
    const line = innerHeight * .6;
    const p = Math.min(Math.max((line - r.top) / r.height, 0), 1);
    fill.style.setProperty('--fill', p.toFixed(4));
    items.forEach(it => it.classList.toggle('lit', it.getBoundingClientRect().top + 12 < line));
  });
})();

/* ══ 10. HOW I BUILD ══
   Stages light up as they cross the reading line, the rail fills with
   progress, and the pinned counter beside the heading names the current one. */
(function () {
  const wrap = $('.proc-list');
  if (!wrap) return;
  const fill = $('.proc-fill', wrap);
  const steps = $$('.proc-step', wrap);
  const num = $('#procNum'), name = $('#procName');
  Scroll.add(() => {
    const r = wrap.getBoundingClientRect();
    if (r.bottom < -100 || r.top > innerHeight + 100) return;
    const line = innerHeight * .55;
    fill.style.setProperty('--fill', Math.min(Math.max((line - r.top) / r.height, 0), 1).toFixed(4));
    let last = 0;
    steps.forEach((s, i) => {
      const lit = s.getBoundingClientRect().top + 24 < line;
      s.classList.toggle('lit', lit);
      if (lit) last = i;
    });
    num.textContent = String(last + 1).padStart(2, '0');
    name.textContent = $('h3', steps[last]).textContent;
  });
})();

/* ══ 11. PROJECT FILTERS ══ */
(function () {
  const btns = $$('.pf');
  const cards = $$('#projGrid .pj');
  const ind = $('.pf-ind');
  if (!btns.length) return;
  function moveInd(b) {
    if (!ind || !b) return;
    ind.style.setProperty('--fx', b.offsetLeft + 'px');
    ind.style.setProperty('--fw', b.offsetWidth + 'px');
  }
  btns.forEach(btn => btn.addEventListener('click', () => {
    btns.forEach(b => { const on = b === btn; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    moveInd(btn);
    const f = btn.dataset.f;
    let shown = 0;
    // data-cat is a space-separated list: a project can belong to two filters.
    const inFilter = el => f === 'all' || el.dataset.cat.split(' ').includes(f);
    cards.forEach(card => {
      const show = inFilter(card);
      card.classList.toggle('is-hidden', !show);
      card.classList.remove('filter-in');
      if (show && !REDUCE_MOTION) {
        card.classList.add('is-in');
        card.style.setProperty('--fi', shown++);
        void card.offsetWidth;
        card.classList.add('filter-in');
      }
    });
    // The experiment rows follow the same filter; their block hides when empty.
    const minis = $$('.pj-mini');
    minis.forEach(m => { m.hidden = !inFilter(m); });
    const more = $('.proj-more');
    if (more) more.hidden = minis.every(m => m.hidden);
  }));
  const active = btns.find(b => b.classList.contains('active'));
  moveInd(active);
  window.addEventListener('resize', () => moveInd(btns.find(b => b.classList.contains('active'))), { passive: true });
  if (document.fonts) document.fonts.ready.then(() => moveInd(btns.find(b => b.classList.contains('active'))));
})();

/* ══ 12. POINTER MICRO-INTERACTIONS (desktop only) ══
   Spotlight on cards, magnetic buttons, gentle tilt on the about photo. */
(function () {
  if (!FINE_POINTER) return;
  $$('.b-card, .gl-card, .exp-current, .stack-group, .pj, .edu-item, .cert, .mail-card').forEach(c => c.classList.add('spot'));
  document.addEventListener('pointermove', e => {
    const c = e.target.closest && e.target.closest('.spot');
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  if (REDUCE_MOTION) return;
  $$('.magnetic').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * .08).toFixed(1) + 'px');
      btn.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * .1).toFixed(1) + 'px');
    });
    btn.addEventListener('pointerleave', () => { btn.style.setProperty('--bx', '0px'); btn.style.setProperty('--by', '0px'); });
  });

  $$('.tilt').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
})();

/* ══ 13. COPY EMAIL ══ */
(function () {
  const btn = $('#copyEmail');
  if (!btn) return;
  const label = $('span', btn);
  label.setAttribute('aria-live', 'polite');
  let t = 0;
  btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (err) {}
      ta.remove();
    }
    label.textContent = ok ? 'Copied to clipboard' : 'Press Ctrl+C to copy';
    if (ok) ack('Email copied: pratyushnandi100@gmail.com');
    btn.classList.toggle('copied', ok);
    clearTimeout(t);
    t = setTimeout(() => { label.textContent = 'Copy email'; btn.classList.remove('copied'); }, 2200);
  });
})();

/* ══ 14. CONTACT FORM ══
   `novalidate` keeps native bubbles off, so constraint validation is checked
   here (required, type=email, type=url, minlength all honoured). Each field
   gets its own message, linked with aria-describedby and re-checked as the
   visitor fixes it. Web3Forms first, with a 15s timeout; if the request fails
   for any reason, a prefilled mailto: link takes over. Nothing typed into the
   form is ever logged. */
(function () {
  const form = $('#contactForm');
  if (!form) return;

  // The form opens from a single prompt; anything that needs it (the
  // palette, a deep link) asks for it with `pn:open-form`.
  const shell = $('#formShell'), start = $('#cfStart');
  const openForm = () => {
    if (!shell.classList.contains('is-open')) {
      shell.classList.add('is-open');
      start.setAttribute('aria-expanded', 'true');
    }
    $('#cfName').focus({ preventScroll: true });
    form.scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth', block: 'center' });
  };
  start.addEventListener('click', openForm);
  window.addEventListener('pn:open-form', openForm);

  const btn = $('#cfBtn');
  const txt = $('#cfTxt'), load = $('#cfLoad');
  const status = $('#cfStatus');
  // [required message, invalid message]
  const MESSAGES = {
    user_name: ['Please enter your name.'],
    user_email: ['Please enter your email address.', 'Enter a full email address, like name@company.com.'],
    contact_reason: ['Please choose a reason.'],
    subject: ['Please add a subject.'],
    social_link: [null, 'Enter a full link, starting with https://.'],
    message: ['Please write a short message.', 'A little more detail helps: at least 10 characters.']
  };
  const fields = $$('input, textarea, select', form).filter(el => el.name in MESSAGES);
  const errOf = el => $('#' + el.id + 'Err');
  // One message element per field, announced with the field itself.
  fields.forEach(el => {
    const p = document.createElement('p');
    p.className = 'f-err'; p.id = el.id + 'Err'; p.hidden = true;
    el.closest('.f-grp').appendChild(p);
    el.setAttribute('aria-describedby', p.id);
  });
  const messageFor = el => {
    if (el.checkValidity()) return '';
    const [req, bad] = MESSAGES[el.name];
    return (!el.value.trim() ? req : bad) || bad || req;
  };
  function mark(el) {
    const msg = messageFor(el), err = errOf(el);
    el.classList.toggle('cf-invalid', !!msg);
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    err.textContent = msg; err.hidden = !msg;
    return !msg;
  }
  // Errors appear once a field has been left (or a send attempted), then
  // follow every keystroke so the message clears the moment it is fixed.
  fields.forEach(el => {
    el.addEventListener('blur', () => { if (el.value.trim() || el.dataset.touched) { el.dataset.touched = '1'; mark(el); } });
    el.addEventListener('input', () => { if (el.dataset.touched) mark(el); });
    el.addEventListener('change', () => { if (el.dataset.touched) mark(el); });
  });

  const setStatus = (kind, text) => { status.className = 'cf-status' + (kind ? ' ' + kind : ''); status.textContent = text; };
  const busy = on => { txt.hidden = on; load.hidden = !on; btn.disabled = on; form.setAttribute('aria-busy', on ? 'true' : 'false'); };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    fields.forEach(el => { el.dataset.touched = '1'; });
    const bad = fields.filter(el => !mark(el));
    if (bad.length) {
      setStatus('err', bad.length === 1 ? '✗ One field needs attention.' : `✗ ${bad.length} fields need attention.`);
      bad[0].focus();
      return;
    }

    const val = n => (form.querySelector(`[name="${n}"]`) || {}).value || '';
    const name = val('user_name').trim();
    const email = val('user_email').trim();
    const reason = val('contact_reason') || 'General Inquiry';
    const company = val('company').trim() || 'N/A';
    const subject = val('subject').trim() || 'Portfolio Contact';
    const socialLink = val('social_link').trim() || 'N/A';
    const message = val('message').trim();
    const mailtoUrl = 'mailto:pratyushnandi100@gmail.com?subject=' +
      encodeURIComponent(`[${reason}] ${subject}`) + '&body=' + encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nReason: ${reason}\nCompany: ${company}\nLink: ${socialLink}\n\nMessage:\n${message}`);
    const fallback = reasonText => {
      setStatus('err', `✗ ${reasonText} Your message is still here. `);
      const a = document.createElement('a');
      a.href = mailtoUrl; a.textContent = 'Send it with your email app instead';
      status.appendChild(a);
    };

    // Bots fill every field, including the one people never see.
    if (form.querySelector('[name="botcheck"]').checked) { setStatus('ok', '✓ Message sent successfully.'); form.reset(); return; }
    if (navigator.onLine === false) { fallback("You're offline, so it couldn't be sent."); return; }

    busy(true);
    setStatus('', 'Sending…');
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 15000);
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        signal: ctl.signal,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: 'dd789f34-7888-4300-a4ac-7842d5524490',
          name, email, reason, company,
          social_link: socialLink,
          subject: `[${reason}] ${subject} from ${name}`,
          message,
          botcheck: false
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(res.ok ? 'rejected' : 'http ' + res.status);
      setStatus('ok', `✓ Message sent successfully. I'll reply to ${email}.`);
      form.reset();
      fields.forEach(el => { delete el.dataset.touched; mark(el); });
    } catch (err) {
      // The reason only, never the message: nothing the visitor typed is logged.
      console.warn('Contact form: send failed (' + (err.name === 'AbortError' ? 'timeout' : err.message) + ')');
      fallback(err.name === 'AbortError' ? 'The form service took too long to answer.' : "The message couldn't be sent.");
    } finally {
      clearTimeout(timer);
      busy(false);
    }
  });
})();

/* ══ 15. DOCUMENT VIEWER ══
   Grade cards and certificates are plain links (they work without JS and are
   checked by scripts/check-assets.mjs); on larger screens they open in a modal.
   Phones keep the default new tab, where PDFs actually render. */
(function () {
  const modal = $('#pcModal');
  if (!modal) return;
  const box = $('.pc-modal-box', modal);
  const title = $('#pcModalTitle');
  const openLink = $('#pcModalOpen');
  const frame = $('#pcModalFrame');
  const imgWrap = $('#pcModalImgWrap');
  const img = $('#pcModalImg');
  const toolbar = $('#pcImgToolbar');
  const zoomLabel = $('#pcImgZoomLabel');
  let scale = 1, rot = 0, file = '', lastFocus = null;

  const applyT = () => { img.style.transform = `scale(${scale}) rotate(${rot}deg)`; zoomLabel.textContent = Math.round(scale * 100) + '%'; };

  function open(src, name) {
    const isImage = /\.(jpe?g|png|webp|gif)$/i.test(src);
    file = src; lastFocus = document.activeElement;
    title.textContent = name;
    openLink.href = src;
    frame.style.display = isImage ? 'none' : 'block';
    imgWrap.style.display = isImage ? 'flex' : 'none';
    toolbar.style.display = isImage ? 'flex' : 'none';
    if (isImage) { scale = 1; rot = 0; applyT(); img.src = src; img.alt = name; frame.src = 'about:blank'; }
    else { frame.src = `${src}#zoom=page-width&toolbar=1`; img.removeAttribute('src'); }
    modal.hidden = false;
    root.classList.add('modal-open');
    $('[data-close]:not(.pc-modal-overlay)', modal).focus();
  }
  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    root.classList.remove('modal-open');
    frame.src = 'about:blank';
    if (lastFocus) lastFocus.focus();
  }

  $$('a[data-doc-title]').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    const isPdf = /\.pdf$/i.test(href);
    if (e.metaKey || e.ctrlKey || e.shiftKey || (isPdf && innerWidth < 700)) return;
    e.preventDefault();
    open(href, a.dataset.docTitle);
  }));
  $$('[data-close]', modal).forEach(el => el.addEventListener('click', close));
  modal.addEventListener('keydown', e => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    const f = $$('a[href], button, iframe', box).filter(el => el.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });
  toolbar.addEventListener('click', e => {
    const b = e.target.closest('[data-img]');
    if (!b) return;
    switch (b.dataset.img) {
      case 'zoom-in': scale = Math.min(3, scale + .25); break;
      case 'zoom-out': scale = Math.max(.5, scale - .25); break;
      case 'reset': scale = 1; break;
      case 'rotate': rot = (rot + 90) % 360; break;
      case 'download': {
        const a = document.createElement('a');
        a.href = file; a.download = file.split('/').pop();
        document.body.appendChild(a); a.click(); a.remove();
        return;
      }
      case 'print': {
        const w = window.open(file, '_blank');
        if (w) w.onload = () => w.print();
        return;
      }
    }
    applyT();
  });
})();

/* ══ 16. BACK TO TOP ══ */
(function () {
  const b = $('#topBtn');
  if (!b) return;
  Scroll.add(() => {
    const max = root.scrollHeight - innerHeight;
    b.classList.toggle('show', scrollY > 600);
    b.style.setProperty('--sp', max > 0 ? (scrollY / max).toFixed(4) : '0');
  });
  b.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: REDUCE_MOTION ? 'auto' : 'smooth' });
    $('#main').focus({ preventScroll: true });
  });
  $('#main').setAttribute('tabindex', '-1');
})();

/* ══ 17. FOOTER · year + local time in Kolkata ══ */
(function () {
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
  const t = $('#localTime');
  if (!t || !window.Intl) return;
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
  const tick = () => { t.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 30000);
})();

/* ══ SHARED KNOWLEDGE ══
   One source for the universe, the DNA explorer, the capability
   constellation, the command palette and the assistant. Project keys are the
   slugs of the project titles on the page. A project is linked to a stage or
   a technology only when that project's own evidence shows it. */
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const projectEl = key => $$(PROJECTS).find(p => slug(titleOf(p).textContent) === key);

// Engineering DNA. status: built (a project on this page shows it), partial,
// or concept (architecture I design for, not yet in a public project).
const DNA = {
  product: { letter: 'A', label: 'Digital Product Engineering', stages: [
    { id: 'interface', label: 'Interface', status: 'built',
      does: 'What a person sees and touches: screens, forms, state and accessibility.',
      tech: ['React', 'Next.js', 'React Native', 'TypeScript', 'HTML / CSS'],
      trade: ['Server rendering gives a faster first paint; client rendering keeps hosting simple.', 'Native (React Native) reaches device storage and biometrics; the web reaches everyone through one URL.'],
      demo: [['aspend', 'React Native screens on Android'], ['codeex-space', 'editor tabs and a live preview'], ['campus-recruitment-system', 'separate views for three roles']] },
    { id: 'logic', label: 'Application Logic', status: 'built',
      does: 'The rules of the product: eligibility, money, and how things move from one state to the next.',
      tech: ['TypeScript', 'JavaScript', 'Node.js', 'Python'],
      trade: ['Pure functions and services can be unit-tested without a UI or a database.', 'Rules on the server are one source of truth; rules in the client answer instantly.'],
      demo: [['campus-recruitment-system', 'eligibility engine and application stages'], ['aspend', 'the credit-card ledger']] },
    { id: 'api', label: 'API', status: 'built', sys: 'api',
      does: 'The contract between clients and the system: what can be asked, by whom, and what comes back.',
      tech: ['Node.js', 'Express', 'Fastify', 'REST', 'JWT'],
      trade: ['REST is callable from anything, but chattier than a single tailored query for complex screens.', 'Stateless tokens scale without session storage; revoking them early needs extra work.'],
      demo: [['campus-recruitment-system', 'Express REST API with JWT roles']] },
    { id: 'database', label: 'Database', status: 'built', sys: 'database',
      does: 'Durable, queryable state that outlives any request.',
      tech: ['PostgreSQL', 'MySQL', 'Prisma', 'MongoDB', 'SQLite'],
      trade: ['Relational tables bring integrity and joins; documents bring flexible shapes.', 'SQLite on the device makes an app work offline; a server database lets people share data.'],
      demo: [['aspend', 'SQLite on the device'], ['ambulance-management-system', 'MySQL'], ['campus-recruitment-system', 'a JSON store behind one module']] },
    { id: 'deploy', label: 'Deployment', status: 'built',
      does: 'Shipping safely and repeatably, then checking what people actually received.',
      tech: ['Git', 'GitHub Actions', 'Vercel', 'Playwright', 'Lighthouse'],
      trade: ['Static hosting is fast and cheap, but runs no server code.', 'Automated gates catch regressions before people do, at the cost of slower merges.'],
      demo: [['portfolio', 'this site: CI, browser tests, Lighthouse budgets, post-deploy smoke tests']] }
  ] },
  vision: { letter: 'B', label: 'Visual Intelligence', stages: [
    { id: 'camera', label: 'Camera Input', status: 'concept', sys: 'camera',
      does: 'An IP camera produces the frames everything else reasons about.',
      tech: ['IP cameras', 'RTSP'],
      trade: ['Higher resolution and frame rate see more, but cost bandwidth and compute.', 'Camera placement matters as much as the model.'], demo: [] },
    { id: 'stream', label: 'RTSP Stream', status: 'concept', sys: 'stream',
      does: 'Frames travel as a live stream, re-served to whoever needs them.',
      tech: ['RTSP', 'MediaMTX'],
      trade: ['One relay serving many readers beats every consumer opening the camera.', 'TCP is reliable; UDP is faster but drops frames.'], demo: [] },
    { id: 'video', label: 'Video Processing', status: 'concept',
      does: 'Frames are decoded, resized and normalised before a model sees them.',
      tech: ['OpenCV', 'Python'],
      trade: ['Processing every frame is thorough; sampling frames saves compute.', 'Detectify relies on Ultralytics\' built-in pre-processing; a standalone stage is designed, not published.'], demo: [] },
    { id: 'inference', label: 'AI Inference', status: 'built', sys: 'cv',
      does: 'A trained model runs on each frame and returns what it found.',
      tech: ['YOLOv8', 'Ultralytics', 'Python'],
      trade: ['Bigger models are more accurate but slower; edge devices favour small ones.', 'The confidence threshold trades misses for false alarms.'],
      demo: [['detectify', 'two trained YOLOv8 models, run on unseen test images']] },
    { id: 'detection', label: 'Detection', status: 'built',
      does: 'Boxes, classes and confidence scores: helmets, plates, vehicles and signal state.',
      tech: ['YOLOv8', 'OpenCV'],
      trade: ['A detector can be confidently wrong: the real output in the observatory reads red lights as yellow.'],
      demo: [['detectify', 'real outputs shown in the observatory']] },
    { id: 'event', label: 'Event', status: 'partial', sys: 'alert',
      does: 'Rules turn detections into an event a person should see, such as a red-light violation.',
      tech: ['Python', 'Node.js', 'REST'],
      trade: ['Rules are explainable and easy to change; a trained classifier catches subtler cases but is harder to audit.'],
      demo: [['detectify', 'a red-light-violation model (test mAP50 0.886); event delivery is designed, not published']] }
  ] },
  connected: { letter: 'C', label: 'Connected Intelligence', stages: [
    { id: 'device', label: 'IoT Device', status: 'concept',
      does: 'Sensors and cameras in the field, producing readings and frames.',
      tech: ['Raspberry Pi', 'IoT'],
      trade: ['Cheap, small devices are easy to deploy and hard to maintain at scale.'], demo: [] },
    { id: 'edge', label: 'Edge Processing', status: 'concept', sys: 'edge',
      does: 'Inference on the device itself, next to the sensor.',
      tech: ['Raspberry Pi', 'YOLO', 'OpenCV'],
      trade: ['Lower latency and far less bandwidth, and raw video never leaves the site; the price is smaller models.'], demo: [] },
    { id: 'comms', label: 'Communication', status: 'concept',
      does: 'Events, not raw data, travel from the device to the system.',
      tech: ['REST', 'Node.js'],
      trade: ['Posting events to the same API as the web app keeps everything in one place; very chatty devices may need a message queue.'], demo: [] },
    { id: 'monitoring', label: 'Monitoring', status: 'concept',
      does: 'Knowing that every device is alive and every event arrived.',
      tech: ['Node.js', 'PostgreSQL'],
      trade: ['Health checks and stored events make silent failures visible, at the cost of more data to keep.'], demo: [] },
    { id: 'dashboard', label: 'Intelligent Dashboard', status: 'concept',
      does: 'One place where people see events, act on alerts and spot trends.',
      tech: ['React', 'Next.js', 'TypeScript'],
      trade: ['A dashboard is a product interface: it needs the same care as journey A.'], demo: [] }
  ] }
};
// Where the journeys touch: the "base pairs" of the DNA.
const RUNGS = [['vision.event', 'product.api', 'events post to the API'], ['connected.edge', 'vision.inference', 'the same models, run on site'],
  ['connected.dashboard', 'product.interface', 'a dashboard is a product interface'], ['connected.monitoring', 'product.database', 'telemetry is stored like any other data']];
// Engineering decisions behind the tools, for the assistant's "Why X?".
const WHY = [
  ['Why React + Next.js?', 'Components keep large interfaces maintainable; Next.js adds routing and server rendering when a page has to be fast on first load.'],
  ['Why TypeScript?', 'Types catch contract mismatches with the API at build time instead of in production.'],
  ['Why Fastify?', 'Low per-request overhead and built-in schema validation, so every endpoint checks what comes in and goes out.'],
  ['Why REST?', 'Plain HTTP resources that browsers, devices and scripts can all call without special clients.'],
  ['Why PostgreSQL?', 'Relational integrity, joins and transactions for data that has to stay consistent.'],
  ['Why Prisma?', 'A typed client and versioned migrations, so schema changes are reviewed like code.'],
  ['Why Python?', 'The machine-learning ecosystem lives there, and a model can sit behind the same API as everything else.'],
  ['Why RTSP?', 'It is the protocol IP cameras already speak, so feeds arrive without custom firmware.'],
  ['Why MediaMTX?', 'One camera connection, re-served to many readers: a model and a dashboard share a feed instead of each opening the camera.'],
  ['Why YOLO?', 'A single-pass detector, fast enough to keep up with live video.'],
  ['Why OpenCV?', 'Proven frame decoding and preprocessing before anything reaches the model.'],
  ['Why process at the edge?', 'Frames are analysed next to the camera: lower latency, far less bandwidth, and raw video never has to leave the site.']
];
// Capability constellation: technology → disciplines → projects.
const DISC = {
  frontend: 'Frontend Engineering', backend: 'Backend & API Engineering', data: 'Data Architecture', vision: 'Computer Vision & AI',
  video: 'Real-Time Video Systems', edge: 'Edge Computing & Devices', foundations: 'Foundations & Tooling'
};
const PROJ = {
  detectify: 'Detectify', aspend: 'Aspend', 'campus-recruitment-system': 'Campus Recruitment System',
  'ambulance-management-system': 'Ambulance Management System', 'codeex-space': 'CodeEx Space', portfolio: 'This portfolio'
};
const CAP = {
  react: { d: ['frontend'], p: [], note: 'Component interfaces on the web.' },
  nextjs: { d: ['frontend'], p: [], note: 'Routing and server rendering on top of React.' },
  reactnative: { d: ['frontend'], p: ['aspend'], note: 'Aspend\'s Android screens.' },
  typescript: { d: ['frontend'], p: ['aspend'], note: 'Aspend is written in TypeScript end to end.' },
  javascript: { d: ['frontend', 'backend'], p: ['campus-recruitment-system', 'ambulance-management-system', 'codeex-space', 'portfolio'], note: 'Browser code and Node.js services.' },
  html5: { d: ['frontend'], p: ['campus-recruitment-system', 'ambulance-management-system', 'codeex-space', 'portfolio'], note: 'Semantic, accessible markup and styling.' },
  nodejs: { d: ['backend'], p: ['campus-recruitment-system'], note: 'The Campus Recruitment server.' },
  express: { d: ['backend'], p: ['campus-recruitment-system'], note: 'Campus Recruitment\'s REST API and static hosting.' },
  fastify: { d: ['backend'], p: [], note: 'Schema-validated APIs with low overhead.' },
  rest: { d: ['backend'], p: ['campus-recruitment-system'], note: 'Resource APIs any client can call.' },
  php: { d: ['backend'], p: ['ambulance-management-system'], note: 'PHP powers the Ambulance Management System; Laravel is in my stack.' },
  postgresql: { d: ['data'], p: [], note: 'Relational data with integrity and transactions.' },
  prisma: { d: ['data'], p: [], note: 'A typed client and versioned migrations.' },
  mysql: { d: ['data'], p: ['ambulance-management-system'], note: 'The Ambulance Management System\'s database.' },
  mongodb: { d: ['data'], p: [], note: 'Documents where the shape varies.' },
  sqlite: { d: ['data'], p: ['aspend'], note: 'Aspend keeps everything on the device in SQLite.' },
  python: { d: ['vision'], p: ['detectify'], note: 'Training and evaluating Detectify\'s models.' },
  yolo: { d: ['vision'], p: ['detectify'], note: 'Detectify\'s two YOLOv8 models.' },
  opencv: { d: ['vision'], p: ['detectify'], note: 'Frame handling in the vision pipeline.' },
  rtsp: { d: ['video'], p: [], note: 'The protocol IP cameras speak.' },
  mediamtx: { d: ['video'], p: [], note: 'One camera connection, many readers.' },
  raspberrypi: { d: ['edge'], p: [], note: 'Inference next to the camera.' },
  iot: { d: ['edge'], p: [], note: 'Devices that sense and report.' },
  cpp: { d: ['foundations'], p: [], note: 'Programming foundations.' },
  git: { d: ['foundations'], p: ['detectify', 'codeex-space', 'portfolio'], note: 'Version control on every public repository.' }
};
const capName = k => { const b = $(`.cst-tech [data-t="${k}"]`); return b ? b.textContent.trim() : k; };

/* ══ 18. ENGINEERING DNA ══
   Overview: three strands, joined by rungs where the journeys touch. Choosing
   a journey (or any stage) opens detail mode: the strand straightens and
   takes the space, its pathway fills up to the selected stage, and the detail
   panel explains the stage. ← → walk stages; Esc or "All journeys" goes back. */
(function () {
  const dna = $('#dna');
  if (!dna) return;
  const strands = $$('.dna-strand', dna), wrap = $('#dnaStrands'), detail = $('#dnaDetail'), back = $('#dnaBack'), svg = $('#dnaRungs');
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btnOf = (j, s) => $(`.dna-strand[data-j="${j}"] [data-s="${s}"]`, dna);
  let J = null, S = null;

  // Status lives in the markup too, so it never relies on colour alone.
  Object.entries(DNA).forEach(([j, jr]) => jr.stages.forEach(st => {
    const b = btnOf(j, st.id);
    if (!b) return;
    b.dataset.status = st.status;
    b.setAttribute('aria-describedby', 'dnaDetail');
    b.appendChild(el('span', 'sr-only', `, ${st.status === 'built' ? 'built' : st.status === 'partial' ? 'partly built' : 'concept'}`));
  }));

  function rungs() {
    svg.replaceChildren();
    if (J || innerWidth < 961) return;
    const box = wrap.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    RUNGS.forEach(([a, b, note]) => {
      const [ja, sa] = a.split('.'), [jb, sb] = b.split('.');
      const ea = btnOf(ja, sa), eb = btnOf(jb, sb);
      if (!ea || !eb) return;
      const ra = ea.getBoundingClientRect(), rb = eb.getBoundingClientRect();
      const x1 = ra.left + ra.width / 2 - box.left, y1 = (ra.top < rb.top ? ra.bottom : ra.top) - box.top;
      const x2 = rb.left + rb.width / 2 - box.left, y2 = (ra.top < rb.top ? rb.top : rb.bottom) - box.top;
      const my = (y1 + y2) / 2;
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`);
      path.dataset.a = a; path.dataset.b = b;
      const t = document.createElementNS(NS, 'title'); t.textContent = note; path.appendChild(t);
      svg.appendChild(path);
    });
  }
  // Hovering or focusing a stage in overview lights the rungs it is part of.
  function touch(key) {
    $$('path', svg).forEach(p => p.classList.toggle('lit', !!key && (p.dataset.a === key || p.dataset.b === key)));
  }

  function render() {
    const jr = DNA[J], i = jr.stages.findIndex(s => s.id === S), st = jr.stages[i];
    const w = el('div', 'dd-wrap');
    const head = el('div', 'dd-head');
    head.append(el('span', 'dd-n mono', `${jr.letter}.${i + 1}`), el('h3', null, st.label),
      el('span', `st st-${st.status} mono`, st.status === 'partial' ? 'partly built' : st.status));
    w.appendChild(head);
    w.appendChild(el('p', 'dd-does', st.does));
    const grid = el('div', 'dd-grid');
    const col = (title, node) => { const c = el('div', 'dd-col'); c.append(el('h4', 'mono', title), node); grid.appendChild(c); };
    const tech = el('ul', 'dd-tech mono'); st.tech.forEach(t => tech.appendChild(el('li', null, t)));
    col('technologies', tech);
    const tr = el('ul', 'dd-trade'); st.trade.forEach(t => tr.appendChild(el('li', null, t)));
    col('trade-offs', tr);
    const demo = el('div', 'dd-demo');
    if (st.demo.length) st.demo.forEach(([key, note]) => {
      const b = el('button', 'dd-proj'); b.type = 'button';
      b.append(el('strong', null, PROJ[key]), el('span', null, note));
      b.addEventListener('click', () => {
        if (key === 'portfolio') { const t = $('#process'); if (t) t.scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth' }); return; }
        if ($(`.pj [data-case="${key}"]`)) Case.open(key, b);
        else { const p = projectEl(key); if (p) p.scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth', block: 'center' }); }
      });
      demo.appendChild(b);
    });
    else demo.appendChild(el('p', 'dd-none', 'Not in a public project yet. This is architecture I design for, and one of my current focus areas.'));
    col('demonstrated by', demo);
    w.appendChild(grid);
    const nav = el('div', 'dd-nav');
    const step = (d, label) => {
      const b = el('button', 'dd-step mono', label); b.type = 'button';
      const k = jr.stages[i + d];
      b.disabled = !k;
      if (k) b.addEventListener('click', () => { open(J, k.id); btnOf(J, k.id).focus(); });
      return b;
    };
    nav.append(step(-1, '← previous stage'), step(1, 'next stage →'));
    w.appendChild(nav);
    detail.replaceChildren(w);
  }

  function open(j, s) {
    const first = !J || J !== j;
    J = j; S = s || DNA[j].stages[0].id;
    dna.classList.add('detail');
    dna.dataset.j = J;
    back.hidden = false;
    detail.hidden = false;
    strands.forEach(st => {
      const on = st.dataset.j === J;
      st.classList.toggle('on', on);
      $('.ds-go', st).setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    const idx = DNA[J].stages.findIndex(x => x.id === S);
    $$('.ds-stages button', dna).forEach(b => {
      const mine = b.closest('.dna-strand').dataset.j === J;
      const k = DNA[J].stages.findIndex(x => x.id === b.dataset.s);
      b.setAttribute('aria-pressed', mine && b.dataset.s === S ? 'true' : 'false');
      b.classList.toggle('passed', mine && k <= idx);
    });
    const strand = strands.find(x => x.dataset.j === J);
    // The pathway fills up to the selected stage; on opening it runs from the start.
    const target = ((idx + 1) / DNA[J].stages.length).toFixed(3);
    if (first && !REDUCE_MOTION) { strand.style.setProperty('--p', '0'); void strand.offsetWidth; }
    strand.style.setProperty('--p', target);
    svg.replaceChildren();
    render();
    inspect('layer', `${J}.${S}`, `${DNA[J].label}: ${DNA[J].stages[idx].label}`);
  }
  function close() {
    if (!J) return;
    const was = J;
    J = S = null;
    dna.classList.remove('detail');
    delete dna.dataset.j;
    back.hidden = true; detail.hidden = true;
    strands.forEach(st => { st.classList.remove('on'); $('.ds-go', st).setAttribute('aria-expanded', 'false'); });
    $$('.ds-stages button', dna).forEach(b => { b.setAttribute('aria-pressed', 'false'); b.classList.remove('passed'); });
    requestAnimationFrame(rungs);
    const g = $(`.dna-strand[data-j="${was}"] .ds-go`, dna);
    if (g) g.focus();
  }

  strands.forEach(st => {
    const j = st.dataset.j;
    $('.ds-go', st).addEventListener('click', () => (J === j ? close() : open(j)));
    $$('.ds-stages button', st).forEach((b, i, all) => {
      b.addEventListener('click', () => open(j, b.dataset.s));
      b.addEventListener('pointerenter', () => { if (!J) touch(`${j}.${b.dataset.s}`); });
      b.addEventListener('pointerleave', () => touch(null));
      b.addEventListener('focus', () => { if (!J) touch(`${j}.${b.dataset.s}`); });
      b.addEventListener('blur', () => touch(null));
      b.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const n = all[i + (e.key === 'ArrowRight' ? 1 : -1)];
        if (n) { n.focus(); if (J === j) open(j, n.dataset.s); }
      });
    });
  });
  back.addEventListener('click', close);
  dna.addEventListener('keydown', e => { if (e.key === 'Escape' && J) { e.stopPropagation(); close(); } });

  // Rungs follow the layout.
  if ('ResizeObserver' in window) new ResizeObserver(() => { if (!J) rungs(); }).observe(wrap);
  if (document.fonts) document.fonts.ready.then(rungs);

  // Deep links from the universe, the palette and the assistant.
  const SYS = {};
  Object.entries(DNA).forEach(([j, jr]) => jr.stages.forEach(st => { if (st.sys) SYS[st.sys] = [j, st.id]; }));
  Object.assign(SYS, { frontend: ['product', 'interface'], browser: ['product', 'interface'] });
  const go = (j, s) => {
    open(j, s);
    dna.scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => { const b = btnOf(J, S); if (b) b.focus({ preventScroll: true }); }, REDUCE_MOTION ? 0 : 650);
  };
  window.addEventListener('pn:dna-open', e => go(e.detail.journey, e.detail.stage));
  window.addEventListener('pn:select-node', e => { const m = SYS[e.detail && e.detail.node]; if (m) go(m[0], m[1]); });
})();

/* ══ 18b. CAPABILITY CONSTELLATION ══
   Technologies, disciplines and projects in three columns. Selecting any of
   them lights what it connects to and draws the lines between them; the
   readout says, in words, where it is used. On narrow screens the columns
   stack, the lines step aside, and the readout sticks to the top. */
(function () {
  const cst = $('#cst');
  if (!cst) return;
  const svg = $('#cstLines'), read = $('#cstRead');
  const idle = read.innerHTML;
  const NS = 'http://www.w3.org/2000/svg';
  const tb = k => $(`[data-t="${k}"]`, cst), db = k => $(`[data-dc="${k}"]`, cst), pb = k => $(`[data-p="${k}"]`, cst);
  const all = $$('.cst-list button', cst);
  all.forEach(b => b.setAttribute('aria-pressed', 'false'));
  const projectsOf = d => [...new Set(Object.values(CAP).filter(c => c.d.includes(d)).flatMap(c => c.p))];
  const techOf = d => Object.keys(CAP).filter(k => CAP[k].d.includes(d));
  let sel = null, links = [];

  function draw() {
    svg.replaceChildren();
    if (!links.length || innerWidth < 961) return;
    const box = cst.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    links.forEach(([a, b]) => {
      if (!a || !b) return;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const x1 = ra.right - box.left, y1 = ra.top + ra.height / 2 - box.top;
      const x2 = rb.left - box.left, y2 = rb.top + rb.height / 2 - box.top;
      const mx = (x1 + x2) / 2;
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`);
      p.setAttribute('pathLength', '1');
      svg.appendChild(p);
    });
  }
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  function readout(title, line, projects, note) {
    const w = el('div');
    w.append(el('span', 'card-label mono', 'readout'), el('h3', null, title), el('p', null, line));
    if (projects.length) {
      const ul = el('ul', 'cst-used');
      projects.forEach(k => {
        const li = el('li');
        const b = el('button', null, PROJ[k]); b.type = 'button';
        b.addEventListener('click', () => {
          if (k === 'portfolio') { const t = $('#process'); if (t) t.scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth' }); return; }
          if ($(`.pj [data-case="${k}"]`)) Case.open(k, b);
          else { const p = projectEl(k); if (p) p.scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth', block: 'center' }); }
        });
        li.appendChild(b); ul.appendChild(li);
      });
      w.appendChild(ul);
    } else w.appendChild(el('p', 'cst-none', note || 'Not in a project on this page yet.'));
    read.replaceChildren(w);
  }
  function select(kind, key) {
    const same = sel && sel[0] === kind && sel[1] === key;
    sel = same ? null : [kind, key];
    cst.classList.toggle('has-sel', !!sel);
    all.forEach(b => { b.classList.remove('on', 'rel'); b.setAttribute('aria-pressed', 'false'); });
    links = [];
    if (!sel) { read.innerHTML = idle; draw(); return; }
    const mark = (b, cls) => { if (b) b.classList.add(cls); };
    if (kind === 't') {
      const c = CAP[key], b = tb(key);
      mark(b, 'on'); b.setAttribute('aria-pressed', 'true');
      c.d.forEach(d => { mark(db(d), 'rel'); links.push([b, db(d)]); c.p.forEach(p => links.push([db(d), pb(p)])); });
      c.p.forEach(p => mark(pb(p), 'rel'));
      readout(capName(key), `${c.note} Discipline: ${c.d.map(d => DISC[d]).join(', ')}.`, c.p);
      inspect('tech', key, capName(key));
    } else if (kind === 'd') {
      const b = db(key), techs = techOf(key), ps = projectsOf(key);
      mark(b, 'on'); b.setAttribute('aria-pressed', 'true');
      techs.forEach(t => { mark(tb(t), 'rel'); links.push([tb(t), b]); });
      ps.forEach(p => { mark(pb(p), 'rel'); links.push([b, pb(p)]); });
      readout(DISC[key], `${techs.map(capName).join(', ')}.`, ps, 'No project on this page shows this discipline yet. It is one of my current focus areas.');
      inspect('tech', 'disc-' + key, DISC[key]);
    } else {
      const b = pb(key), techs = Object.keys(CAP).filter(t => CAP[t].p.includes(key));
      const ds = [...new Set(techs.flatMap(t => CAP[t].d))];
      mark(b, 'on'); b.setAttribute('aria-pressed', 'true');
      techs.forEach(t => mark(tb(t), 'rel'));
      ds.forEach(d => { mark(db(d), 'rel'); links.push([db(d), b]); techs.filter(t => CAP[t].d.includes(d)).forEach(t => links.push([tb(t), db(d)])); });
      readout(PROJ[key], `Built with ${techs.map(capName).join(', ')}.`, key === 'portfolio' ? [] : [key], 'This site: HTML, CSS and JavaScript, tested with Playwright and Lighthouse on every change.');
    }
    draw();
  }
  $$('[data-t]', cst).forEach(b => b.addEventListener('click', () => select('t', b.dataset.t)));
  $$('[data-dc]', cst).forEach(b => b.addEventListener('click', () => select('d', b.dataset.dc)));
  $$('[data-p]', cst).forEach(b => b.addEventListener('click', () => select('p', b.dataset.p)));
  cst.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sel) { const b = sel[0] === 't' ? tb(sel[1]) : sel[0] === 'd' ? db(sel[1]) : pb(sel[1]); select(sel[0], sel[1]); if (b) b.focus(); }
  });
  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(cst);
})();

/* ══ 19. VISUAL INTELLIGENCE OBSERVATORY ══
   Real output first: a slider compares a frame as it went into Detectify's
   vehicle model with what came out. Then the rule lab below.
   ── Rule lab ──
   Three drawn sample frames, each with a fixed list of detections (class,
   confidence, box). Nothing is inferred here and the page says so. What is
   real is everything after the model: the confidence threshold filters the
   detections, rules evaluate what survives, and the alerts, the event log and
   the hint follow from that. Lower the threshold and a puddle becomes a "car"
   that trips the red-light rule; raise it and a real violation is missed.
   Stages are stepped with buttons (Run, ‹ ›, or a stage itself); the run plays
   once when the lab first comes into view, never under reduced motion. */
(function () {
  const cmp = $('#obsCompare'), split = $('#obsSplit');
  if (cmp && split) {
    const set = () => cmp.style.setProperty('--split', split.value + '%');
    split.addEventListener('input', set); set();
  }
})();

(function () {
  const lab = $('#lab');
  if (!lab) return;
  const frame = $('#cvFrame');
  const detsEl = $('#cvDets'), zonesEl = $('#cvZones');
  const pipe = $('#pipe', lab);
  const steps = $$('.pipe-step', pipe);
  const N = steps.length;
  const fill = $('.pipe-fill', lab);
  const thr = $('#labThr'), thrOut = $('#labThrOut'), hint = $('#labThrHint');
  const rules = $$('[data-rule]', lab);
  const logEl = $('#labLog'), statusEl = $('#labStatus');
  const runBtn = $('#labRun'), prevBtn = $('#labPrev'), nextBtn = $('#labNext'), posEl = $('#labPos');
  const hud = { name: $('#cvSceneName'), stage: $('#cvStage'), count: $('#cvCount') };
  const alertEl = $('#cvAlert'), alertTitle = $('#cvAlertTitle'), alertSub = $('#cvAlertSub');
  const NS = 'http://www.w3.org/2000/svg';
  const STAGES = ['camera', 'stream', 'model', 'detection', 'event', 'alert'];
  const timeline = $$('#labTimeline li');
  const VEHICLES = ['car', 'motorcycle'];
  const JUNCTION_ZONE = { x: 252, y: 108, w: 66, h: 186 };   // the controlled lane, past the stop line

  /* — sample data (simulated detections; boxes in the 640 × 400 frame) — */
  const SCENES = {
    junction: { name: 'junction · red light', frame: '0142', zone: JUNCTION_ZONE, dets: [
      { cls: 'car', conf: .96, box: [60, 146, 86, 48] },
      { cls: 'car', conf: .94, box: [260, 144, 50, 82] },
      { cls: 'car', conf: .91, box: [464, 206, 88, 48] },
      { cls: 'motorcycle', conf: .88, box: [332, 24, 28, 56] },
      { cls: 'signal', state: 'red', conf: .97, box: [212, 58, 28, 52] },
      { cls: 'person', conf: .62, box: [174, 300, 16, 26] },
      { cls: 'person', conf: .58, box: [558, 82, 16, 26] },
      { cls: 'person', conf: .34, box: [582, 308, 16, 26] },
      { cls: 'car', conf: .31, box: [284, 234, 34, 26], fp: 'a puddle' }
    ] },
    helmet: { name: 'two-wheelers · helmets', frame: '0087', dets: [
      { cls: 'motorcycle', conf: .93, box: [118, 228, 138, 66] },
      { cls: 'rider', conf: .9, box: [160, 148, 52, 100] },
      { cls: 'helmet', conf: .87, box: [168, 150, 32, 32] },
      { cls: 'motorcycle', conf: .89, box: [378, 232, 138, 66] },
      { cls: 'rider', conf: .86, box: [420, 156, 52, 98] },
      { cls: 'no_helmet', conf: .74, box: [428, 156, 32, 30] },
      { cls: 'car', conf: .52, box: [566, 144, 74, 52] },
      { cls: 'person', conf: .29, box: [44, 26, 28, 84], fp: 'a lamp post' }
    ] },
    green: { name: 'junction · green light', frame: '0311', zone: JUNCTION_ZONE, dets: [
      { cls: 'car', conf: .95, box: [260, 184, 50, 82] },
      { cls: 'car', conf: .93, box: [60, 146, 86, 48] },
      { cls: 'car', conf: .9, box: [464, 206, 88, 48] },
      { cls: 'signal', state: 'green', conf: .96, box: [212, 58, 28, 52] },
      { cls: 'person', conf: .61, box: [174, 300, 16, 26] },
      { cls: 'person', conf: .44, box: [558, 82, 16, 26] }
    ] }
  };

  /* — rules: plain functions over the detections that passed the threshold — */
  const center = ([x, y, w, h]) => [x + w / 2, y + h / 2];
  const inside = ([cx, cy], z) => cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h;
  const overlaps = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
  const RULES = {
    red_light: (kept, s) => {
      if (!s.zone) return { note: 'skipped, no stop line in view' };
      const sig = kept.find(d => d.cls === 'signal');
      if (!sig) return { note: 'skipped, no signal detected' };
      if (sig.state !== 'red') return { note: `passed, the signal is ${sig.state}` };
      const hits = kept.filter(d => VEHICLES.includes(d.cls) && inside(center(d.box), s.zone));
      return hits.length ? { hits, title: 'Red-light violation', why: 'past the stop line on red' } : { note: 'passed, nothing past the stop line' };
    },
    no_helmet: kept => {
      const riders = kept.filter(d => d.cls === 'rider');
      if (!riders.length) return { note: 'skipped, no riders detected' };
      const hits = kept.filter(d => d.cls === 'no_helmet' && riders.some(r => overlaps(r.box, d.box)));
      return hits.length ? { hits, title: 'Rider without a helmet', why: 'rider with no helmet' } : { note: 'passed, every rider wears a helmet' };
    }
  };
  const ruleOn = k => { const c = rules.find(r => r.dataset.rule === k); return !c || c.checked; };
  const label = d => (d.cls === 'signal' ? 'signal: ' + d.state : d.cls.replace('_', ' ')) + ' ' + d.conf.toFixed(2);

  function evaluate(t) {
    const s = SCENES[scene];
    const kept = s.dets.filter(d => d.conf >= t - 1e-9);
    const results = Object.keys(RULES).map(k => ({ k, ...(ruleOn(k) ? RULES[k](kept, s) : { note: 'off' }) }));
    const alerts = results.flatMap(r => (r.hits || []).map(det => ({ rule: r.k, title: r.title, why: r.why, det })));
    return { s, kept, results, alerts };
  }

  /* — state — */
  let scene = 'junction', stage = 0, timers = [], userRan = false;
  const t = () => +thr.value;

  function svg(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (parent) parent.appendChild(n);
    return n;
  }
  function drawBoxes(ev) {
    const hit = new Set(ev.alerts.map(a => a.det));
    detsEl.replaceChildren();
    ev.s.dets.forEach((d, i) => {
      const [x, y, w, h] = d.box;
      const cls = ['det', 'det-' + d.cls, d.conf < t() - 1e-9 ? 'below' : '', hit.has(d) ? 'det-hit' : ''].join(' ').trim();
      const g = svg('g', { class: cls, style: `--d:${(i * .07).toFixed(2)}s` }, detsEl);
      svg('rect', { x, y, width: w, height: h, class: 'box' }, g);
      const text = label(d);
      const tw = Math.max(48, text.length * 5.6 + 8);
      const ty = y - 14 < 0 ? y + h : y - 14;
      const tx = Math.min(x, 640 - tw);
      svg('rect', { x: tx, y: ty, width: tw, height: 14, class: 'tag' }, g);
      svg('text', { x: tx + 4, y: ty + 10 }, g).textContent = text;
    });
    zonesEl.replaceChildren();
    if (ev.s.zone) {
      const z = ev.s.zone;
      svg('rect', { x: z.x, y: z.y, width: z.w, height: z.h, class: 'zone' }, zonesEl);
      svg('text', { x: z.x + 4, y: z.y + z.h - 6, class: 'zone-lbl' }, zonesEl).textContent = 'rule zone';
    }
  }
  // Simulated wall-clock timestamps: the run's start plus a small, illustrative
  // offset per stage. Labelled as simulated wherever they appear.
  const OFFSETS = [0, 8, 21, 27, 29, 31];
  let base = Date.now();
  const stamp = i => {
    const d = new Date(base + OFFSETS[i]);
    const p = (n, w = 2) => String(n).padStart(w, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
  };
  function logLines(ev) {
    const s = ev.s, lines = [];
    const at = (i, k, text) => lines.push([k, `${stamp(i)}  ${text}`]);
    if (stage >= 1) at(0, '', `camera · frame ${s.frame} · ${s.name}`);
    if (stage >= 2) at(1, '', 'stream · rtsp://cam-01/main (sample, not a live feed)');
    if (stage >= 3) at(2, '', 'model · detector ready · pre-computed detections');
    if (stage >= 4) at(3, '', `detection · ${s.dets.length} found · ${ev.kept.length} at ≥ ${t().toFixed(2)}`);
    if (stage >= 5) ev.results.forEach(r => (r.hits
      ? at(4, 'bad', `event · ${r.k} → ${r.hits.map(label).join(', ')} ${r.why}`)
      : at(4, r.note === 'off' ? 'off' : 'ok', `event · ${r.k} → ${r.note}`)));
    if (stage >= 6) (ev.alerts.length
      ? at(5, 'bad', `alert · POST /api/alerts (simulated) · ${ev.alerts.length} for human review`)
      : at(5, 'ok', 'alert · none raised'));
    return lines;
  }
  // What the threshold just did, in words: a false alarm, a miss, or neither.
  function explain(ev) {
    if (stage < 4) return 'Detections below the threshold are dropped before any rule sees them.';
    const fp = ev.alerts.find(a => a.det.fp);
    if (fp) return `False alarm: at ${t().toFixed(2)} the detector's "${fp.det.cls}" is really ${fp.det.fp}. Low thresholds trade misses for false alarms.`;
    const all = evaluate(0).alerts.filter(a => !a.det.fp);
    const missed = all.filter(a => !ev.alerts.some(b => b.det === a.det));
    if (missed.length) return `Missed: the threshold dropped a real ${missed[0].det.cls} at ${missed[0].det.conf.toFixed(2)}, so no alert. High thresholds trade false alarms for misses.`;
    const quiet = ev.s.dets.filter(d => d.fp && d.conf < t());
    if (quiet.length) return `At ${t().toFixed(2)}, ${quiet[0].fp} (scored ${quiet[0].conf.toFixed(2)} as a ${quiet[0].cls}) is filtered out. Try lowering the threshold.`;
    return 'Detections below the threshold are dropped before any rule sees them.';
  }

  // Six pipeline stages drive the frame's seven visual states.
  const FRAME = [0, 1, 2, 4, 5, 6, 7];
  function draw() {
    const ev = evaluate(t());
    for (let i = 1; i <= 7; i++) frame.classList.toggle('s' + i, FRAME[stage] >= i);
    drawBoxes(ev);
    hud.name.textContent = 'SAMPLE · ' + ev.s.name;
    hud.stage.textContent = stage ? STAGES[stage - 1] : 'idle';
    hud.count.textContent = stage >= 4 ? `${ev.kept.length} / ${ev.s.dets.length}` : '—';
    const ok = !ev.alerts.length;
    alertEl.classList.toggle('is-ok', ok);
    alertTitle.textContent = ok ? 'No violation' : ev.alerts[0].title + (ev.alerts.length > 1 ? ` +${ev.alerts.length - 1} more` : '');
    alertSub.textContent = ok ? 'every active rule passed' : 'sent for human review · simulated';
    logEl.replaceChildren(...logLines(ev).map(([k, text]) => { const li = document.createElement('li'); if (k) li.className = k; li.textContent = text; return li; }));
    logEl.scrollTop = logEl.scrollHeight;
    timeline.forEach((li, i) => {
      li.classList.toggle('on', i < stage);
      li.classList.toggle('now', i === stage - 1);
      $('time', li).textContent = i < stage ? stamp(i) : '--:--:--.---';
    });
    hint.textContent = explain(ev);
    hint.classList.toggle('warn', /^(False alarm|Missed)/.test(hint.textContent));
    return ev;
  }
  // One spoken summary when a run ends or a control changes the result.
  function announce(ev) {
    statusEl.textContent = `Simulated ${ev.s.name}: ${ev.kept.length} of ${ev.s.dets.length} detections at threshold ${t().toFixed(2)}. ` +
      (ev.alerts.length ? `${ev.alerts.length} alert${ev.alerts.length > 1 ? 's' : ''}: ${[...new Set(ev.alerts.map(a => a.title))].join(', ')}.` : 'No alert raised.');
  }

  function setStage(n, opts = {}) {
    stage = Math.max(0, Math.min(N, n));
    steps.forEach((st, i) => {
      st.classList.toggle('done', i < stage - 1);
      st.classList.toggle('active', i === stage - 1);
      const h = $('.ps-head', st);
      h.setAttribute('aria-expanded', i === stage - 1 ? 'true' : 'false');
      if (i === stage - 1) h.setAttribute('aria-current', 'step'); else h.removeAttribute('aria-current');
    });
    fill.style.setProperty('--f', (stage / N).toFixed(3));
    posEl.textContent = `stage ${stage} / ${N}`;
    prevBtn.disabled = stage <= 1;
    nextBtn.disabled = stage >= N;
    const ev = draw();
    if (stage === N && !opts.quiet) announce(ev);
    if (stage === N && userRan) inspect('pipeline', 'online', 'Vision pipeline, run end to end');
  }
  const stop = () => { timers.forEach(clearTimeout); timers = []; lab.classList.remove('running'); runBtn.disabled = false; };
  function run(byUser) {
    stop();
    if (byUser) userRan = true;
    $('span', runBtn).textContent = 'Run again';
    base = Date.now();
    if (REDUCE_MOTION) { setStage(N); return; }
    lab.classList.add('running');
    runBtn.disabled = true;
    setStage(1, { quiet: true });
    for (let i = 2; i <= N; i++) timers.push(setTimeout(() => setStage(i), (i - 1) * 650));
    timers.push(setTimeout(stop, (N - 1) * 650));
  }

  // Each stage head explains itself and jumps the pipeline to that point.
  steps.forEach((st, i) => {
    const h = $('.ps-head', st), more = $('.ps-more', st);
    $('.ps-name', h).after(document.createTextNode(' '));
    more.id = 'psMore' + i;
    h.setAttribute('aria-controls', more.id);
    h.addEventListener('click', () => { stop(); userRan = true; setStage(i + 1); });
  });
  runBtn.addEventListener('click', () => run(true));
  prevBtn.addEventListener('click', () => { stop(); setStage(stage - 1); });
  nextBtn.addEventListener('click', () => { stop(); userRan = true; setStage(stage + 1); });

  // Controls give an answer at once: if the run hasn't reached the boxes yet,
  // jump to the end so the effect of the change is visible.
  const changed = () => { stop(); base = Date.now(); if (stage < N) setStage(N, { quiet: true }); announce(draw()); };
  thr.addEventListener('input', () => { thrOut.value = t().toFixed(2); thrOut.textContent = t().toFixed(2); changed(); });
  rules.forEach(r => r.addEventListener('change', changed));
  $$('.lab-scene', lab).forEach(b => b.addEventListener('click', () => {
    scene = b.dataset.scene;
    $$('.lab-scene', lab).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    $$('.cv-scene', frame).forEach(g => g.classList.toggle('on', g.dataset.scene === scene));
    if (stage) changed(); else draw();
  }));

  thrOut.textContent = t().toFixed(2);
  setStage(0);
  if (REDUCE_MOTION || !('IntersectionObserver' in window)) { setStage(N, { quiet: true }); return; }
  // Plays once, the first time the frame is properly on screen.
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    if (stage === 0) run(false);
  }, { threshold: .55 });
  io.observe(frame);
})();

/* ══ 20. CASE STUDIES ══
   A native <dialog> drawer (focus trap, Esc and inert background for free).
   Content comes from <template id="case-…">, so it stays in the HTML. */
const Case = (function () {
  const dlg = $('#caseDlg');
  if (!dlg || !dlg.showModal) return { open() {}, keys: [] };
  const body = $('#caseBody');
  let last = null, closing = 0;

  function open(key, from) {
    const tpl = $('#case-' + key);
    if (!tpl) return;
    clearTimeout(closing); dlg.classList.remove('closing');
    body.replaceChildren(tpl.content.cloneNode(true));
    disclose();
    body.scrollTop = 0;
    last = from || document.activeElement;
    if (!dlg.open) dlg.showModal();
    root.classList.add('modal-open');
    $('.case-close', dlg).focus();
    inspect('case', key, `${tpl.content.querySelector('h2').textContent} case study`);
  }
  // Each section heading becomes a disclosure button. Phones open with only
  // Problem and Architecture expanded; wider screens open everything.
  function disclose() {
    const compact = innerWidth < 760;
    $$('.cs-sec', body).forEach((sec, i) => {
      const h = $('h3', sec);
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'cs-toggle';
      btn.textContent = h.textContent;
      const panel = document.createElement('div');
      panel.className = 'cs-panel'; panel.id = 'csPanel' + i;
      while (h.nextSibling) panel.appendChild(h.nextSibling);
      h.replaceChildren(btn);
      sec.appendChild(panel);
      const set = open => { btn.setAttribute('aria-expanded', open ? 'true' : 'false'); panel.hidden = !open; };
      btn.setAttribute('aria-controls', panel.id);
      set(!compact || i < 2);
      btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    });
  }
  function finish() {
    dlg.classList.remove('closing');
    if (dlg.open) dlg.close();
    root.classList.remove('modal-open');
    if (last && last.isConnected) last.focus({ preventScroll: true });
  }
  function close() {
    if (!dlg.open || dlg.classList.contains('closing')) return;
    if (REDUCE_MOTION) { finish(); return; }
    dlg.classList.add('closing');
    closing = setTimeout(finish, 240);
  }

  trapTab(dlg);
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  dlg.addEventListener('click', e => {
    if (e.target === dlg) { close(); return; }
    const c = e.target.closest('[data-close-case]');
    if (!c) return;
    const href = c.getAttribute('href');
    if (href && href.startsWith('#')) {
      // Leave the drawer first, then travel: the page is scroll-locked while open.
      e.preventDefault(); finish();
      $(href).scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth' });
    } else close();
  });
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-case]');
    if (!b || dlg.contains(b)) return;
    e.preventDefault();
    open(b.dataset.case, b);
  });
  return { open, close, keys: $$('template[id^="case-"]').map(t => t.id.slice(5)) };
})();

/* ══ 21. ENGINEERING MODE ══
   The same site, re-read as an engineering interface. A scan line sweeps the
   viewport and each element switches exactly as the line passes over it;
   then the system panel boots row by row. Section metadata is counted from
   the page itself, so it never drifts from the content. */
const Eng = (function () {
  const btn = $('#engToggle');
  const panel = $('#engPanel');
  const sweep = $('.eng-sweep');
  if (!btn || !panel) return { isOn: () => false, set() {}, toggle() {} };
  const bar = sweep && $('span', sweep);
  const isOn = () => root.getAttribute('data-mode') === 'eng';
  const SWEEP_MS = 1000, LINE_SHARE = 1 / 1.4; // the line crosses the viewport in the first ~71%

  /* — one-time decoration: blueprint frames, tags, metadata — */
  const count = sel => $$(sel).length;
  function years() {
    const ys = $$('.gl-date, .disc-date').flatMap(d => (d.textContent.match(/\d{4}/g) || []).map(Number));
    return ys.length ? `${Math.min(...ys)} → ${Math.max(...ys)}` : '';
  }
  const META = {
    about: () => `section#about · ${count('#about .b-card')} modules`,
    experience: () => `${count('.gl-item')} roles + current · ${count('.disc-list > li')} disciplines · ${years()}`,
    thinking: () => `${count('.dna-strand')} journeys · ${count('.ds-stages button')} stages · built / partly built / concept`,
    skills: () => `${count('.cst-tech button')} technologies · ${count('.cst-disc button')} disciplines · ${count('.cst-proj button')} projects`,
    pipeline: () => `${count('.pipe-step')} stages · ${count('.lab-scene')} sample frames · simulated detections, real rules`,
    projects: () => `${count(PROJECTS)} projects · ${count('.pj [data-case]')} case studies · ${$$('#projGrid .pj-link, .pj-mini .pj-link').filter(a => /live|play/i.test(a.textContent)).length} live demos`,
    education: () => `${count('.edu-item')} qualifications · ${count('.cert')} certifications`,
    process: () => `${count('.proc-step')} stages · each evidenced by this site`,
    focus: () => `${count('.focus-grid li')} focus areas`,
    contact: () => 'POST api.web3forms.com · mailto: fallback'
  };
  const TAGS = [
    ['.hero-title', 'h1 · Geist 650 · sees / thinks / acts'],
    ['.b-intro', 'about/intro.md'], ['.b-photo', 'about/photo.jpg'], ['.b-now', 'about/now'],
    ['.b-stats', 'about/stats'], ['.b-json', 'about/profile.json'],
    ['.hero-chapters', 'six chapters'], ['.universe', 'pn universe · 4 domains'],
    ['.exp-current', 'HEAD → current role'],
    ['.form-shell', 'POST api.web3forms.com'], ['.mail-card', 'mailto:']
  ];
  function frame(el, tag) {
    if (!el || el.querySelector(':scope > .eng-frame')) return;
    const f = document.createElement('span');
    f.className = 'eng-frame'; f.setAttribute('aria-hidden', 'true');
    if (tag) { const t = document.createElement('span'); t.className = 'eng-tag mono'; t.textContent = tag; f.appendChild(t); }
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.appendChild(f);
  }
  function collapsible(cls, text) {
    const x = document.createElement('div');
    x.className = 'eng-x'; x.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('div');
    const t = document.createElement('span');
    t.className = cls + ' mono'; t.textContent = text;
    inner.appendChild(t); x.appendChild(inner);
    return x;
  }
  let decorated = false;
  function decorate() {
    if (decorated) return;
    decorated = true;
    TAGS.forEach(([sel, tag]) => frame($(sel), tag));
    $$('.gl-card, .edu-item, .cert').forEach(el => frame(el));
    $$('.stack-group').forEach(g => frame(g, `${$$('.node', g).length} nodes`));
    $$('#projGrid .pj').forEach(p => {
      frame(p, 'project/' + $('h3', p).textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
      const body = $('.pj-body, .w-body', p);
      if (p.dataset.flow && body) body.insertBefore(collapsible('eng-flow', p.dataset.flow), $('.pj-links', body));
    });
    Object.entries(META).forEach(([id, fn]) => {
      const head = $(`#${id} .sec-head`);
      if (head) head.insertBefore(collapsible('eng-meta', '// ' + fn()), head.children[1] || null);
    });
  }

  /* — system panel — */
  const rows = $$('.ep-list li', panel);
  const sysRows = $$('.ep-list:not(.ep-status) li', panel);
  const sum = $('#epSum');
  let bootTimers = [], userTouched = false;
  function tally() { sum.textContent = `${sysRows.filter(r => r.classList.contains('up')).length} layers mapped`; }
  // The panel boots open, holds long enough to be read, then folds down to its
  // one-line summary so it never sits on top of the content.
  function boot(instant) {
    bootTimers.forEach(clearTimeout); bootTimers = [];
    rows.forEach((li, i) => {
      const st = $('.ep-state', li);
      const up = () => { li.classList.add('up'); st.textContent = st.dataset.state; tally(); };
      if (instant) { up(); return; }
      li.classList.remove('up'); st.textContent = '···';
      bootTimers.push(setTimeout(up, 420 + i * 75));
    });
    tally();
    if (!instant) bootTimers.push(setTimeout(() => {
      if (!userTouched && !panel.matches(':hover, :focus-within')) setMin(true);
    }, 420 + rows.length * 75 + 3200));
  }
  panel.addEventListener('pointerdown', () => { userTouched = true; });
  const rt = { section: $('#rtSection'), viewport: $('#rtViewport'), theme: $('#rtTheme'), motion: $('#rtMotion'), local: $('#rtLocal') };
  // The visitor's own clock (no timeZone option), never presented as server time.
  const localFmt = window.Intl ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
  function clock() {
    if (!isOn() || !localFmt) return;
    const now = new Date();
    rt.local.textContent = localFmt.format(now).replace(',', ' ·').toLowerCase();
    rt.local.dateTime = now.toISOString();
  }
  function runtime() {
    if (!isOn()) return;
    rt.section.textContent = '#' + (root.dataset.context || 'hero');
    rt.viewport.textContent = `${innerWidth}×${innerHeight}`;
    rt.theme.textContent = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    rt.motion.textContent = REDUCE_MOTION ? 'reduced' : 'full';
  }
  Scroll.add(runtime);
  window.addEventListener('pn:themechange', runtime);
  window.addEventListener('pn:modechange', clock);
  setInterval(clock, 30000);

  const min = $('#epMin');
  function setMin(m) {
    panel.classList.toggle('min', m);
    min.setAttribute('aria-expanded', m ? 'false' : 'true');
    min.setAttribute('aria-label', m ? 'Expand system panel' : 'Collapse system panel');
    $('i', min).className = m ? 'fas fa-plus' : 'fas fa-minus';
  }
  min.addEventListener('click', () => setMin(!panel.classList.contains('min')));
  // Mobile gets the compact sheet: system list + "View architecture"; the
  // secondary groups start folded.
  if (innerWidth < 700) $$('.ep-group', panel).forEach(d => { d.open = false; });
  $('#epArch').addEventListener('click', () => {
    if (innerWidth < 700) setMin(true);
    const m = $('#sysmap');
    if (m) m.scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth', block: 'start' });
  });
  $('#epClose').addEventListener('click', () => { set(false); btn.focus(); });

  /* — switching — */
  // Each decorated element waits until the scan line reaches its position.
  function syncToSweep(down) {
    $$('.eng-frame, .eng-x').forEach(el => {
      const y = el.getBoundingClientRect().top / innerHeight;
      const at = y < 0 || y > 1 ? 0 : (down ? y : 1 - y);
      el.style.setProperty('--ed', (at * SWEEP_MS * LINE_SHARE / 1000).toFixed(3) + 's');
    });
  }
  function apply(next) {
    if (next) root.setAttribute('data-mode', 'eng'); else root.removeAttribute('data-mode');
    btn.setAttribute('aria-pressed', next ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('pn:modechange', { detail: { eng: next } }));
  }
  function set(next, opts = {}) {
    if (next === isOn() && !opts.force) return;
    try { localStorage.setItem('pn-eng', next ? 'on' : 'off'); } catch (e) {}
    if (next) decorate();
    const animate = !REDUCE_MOTION && !opts.instant && bar;
    if (animate) {
      syncToSweep(next);
      sweep.classList.toggle('up', !next);
      sweep.style.visibility = 'visible';
      bar.animate(
        next ? [{ transform: 'translateY(-40vh)' }, { transform: 'translateY(100vh)' }]
             : [{ transform: 'translateY(100vh)' }, { transform: 'translateY(-40vh)' }],
        { duration: SWEEP_MS, easing: 'linear' }
      ).finished.then(() => { sweep.style.visibility = ''; }, () => { sweep.style.visibility = ''; });
    } else {
      $$('.eng-frame, .eng-x').forEach(el => el.style.setProperty('--ed', '0s'));
    }
    apply(next);
    if (next) {
      userTouched = false;
      setMin(innerWidth < 700);
      boot(!animate);
      runtime();
    } else bootTimers.forEach(clearTimeout);
  }
  btn.addEventListener('click', () => set(!isOn()));

  // Restored from storage by the inline head script: decorate without a sweep.
  if (isOn()) {
    decorate();
    $$('.eng-frame, .eng-x').forEach(el => el.style.setProperty('--ed', '0s'));
    btn.setAttribute('aria-pressed', 'true');
    setMin(true);
    boot(true); runtime(); clock();
  }
  return { isOn, set, toggle: () => set(!isOn()) };
})();

/* ══ 22. PORTFOLIO ASSISTANT ══
   Deterministic, not generative: a question is matched to an intent (or to a
   named technology / project) and the answer is assembled from this page's
   own content. Anything it can't ground in the page gets an honest "I can
   only answer from this portfolio". */
const Assistant = (function () {
  const txt = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const KB = {
    // Grouped by each technology's primary discipline, from the constellation.
    stack: Object.entries(DISC).map(([d, group]) => ({
      group, items: Object.keys(CAP).filter(k => CAP[k].d[0] === d).map(k => {
        const i = $(`.cst-tech [data-t="${k}"] i`);
        return { key: k, name: capName(k), icon: i ? i.className : 'fas fa-circle' };
      })
    })),
    projects: $$(PROJECTS).map(p => ({
      key: slug(txt(titleOf(p))), title: txt(titleOf(p)), cat: txt($('.pj-cat', p)),
      tagline: txt($('.pj-tagline', p)), desc: txt($('.pj-desc', p)), tags: $$('.tags li', p).map(txt),
      links: $$('.pj-links a', p).map(a => ({ label: txt(a), href: a.href })), el: p
    })),
    current: { role: txt($('.exp-current h3')), company: txt($('.ec-co')), desc: txt($('.exp-current > p:not(.ec-co)')) },
    roles: $$('.gl-item').map(i => ({ title: txt($('h3', i)), date: txt($('.gl-date', i)), sub: txt($('.gl-sub', i)) })),
    disciplines: $$('.disc-list > li').map(i => ({ title: txt($('h4', i)), date: txt($('.disc-date', i)), tags: txt($('.disc-tags', i)) })),
    edu: $$('.edu-item').map(i => ({ title: txt($('h4', i)), inst: txt($('.edu-inst', i)), meta: txt($('.edu-meta', i)).replace(/(\d{4}) – (\d{4})/, '$1–$2') })),
    certs: $$('.cert').map(c => ({ title: txt($('h4', c)), note: txt($('.cert-body p', c)) })),
    status: txt($('.hero-meta .status-pill')),
    location: txt($('.contact-list li:nth-child(2) span:last-child'))
  };
  const allTech = KB.stack.flatMap(g => g.items.map(i => ({ ...i, group: g.group })));
  const ALIAS = {
    'React.js': ['react', 'reactjs'], 'Next.js': ['next', 'nextjs'], 'Node.js': ['node', 'nodejs'],
    'Express.js': ['express', 'expressjs'], 'PostgreSQL': ['postgres', 'postgresql', 'psql'], 'MongoDB': ['mongo', 'mongodb'],
    'PHP · Laravel': ['laravel', 'php'], 'REST APIs': ['rest', 'restful'], 'TypeScript': ['typescript', 'ts'],
    'React Native': ['react native', 'expo', 'android', 'mobile'], 'SQLite': ['sqlite'],
    'JavaScript': ['javascript', 'js'], 'HTML5 · CSS3': ['html', 'html5', 'css', 'css3'], 'Java · C · C++': ['java', 'c++', 'cpp'],
    'Raspberry Pi': ['raspberry', 'rpi', 'raspberry pi'], 'Git · GitHub': ['git', 'github'], 'IoT': ['iot']
  };
  const PROJECT_ALIAS = {
    detectify: ['detectify', 'traffic'], 'campus-recruitment-system': ['campus', 'recruitment'],
    'codeex-space': ['codeex', 'code editor', 'editor'], 'web-calculator': ['calculator'], 'rock-paper-scissors': ['rock paper', 'rps'],
    'cyber-calendar': ['calendar'], 'background-changer': ['background changer', 'background'], 'portfolio-website': ['portfolio website'],
    'ambulance-management-system': ['ambulance'], aspend: ['aspend', 'expense']
  };
  const INTENTS = {
    ai: ['ai', 'ml', 'machine', 'learning', 'vision', 'model', 'models', 'detection', 'intelligent', 'inference', 'yolo', 'opencv'],
    systems: ['system', 'systems', 'architecture', 'kind', 'end-to-end', 'pipeline', 'iot', 'edge', 'build', 'think', 'thinking', 'journey', 'journeys', 'dna', 'approach'],
    stack: ['stack', 'technologies', 'technology', 'tech', 'tools', 'languages', 'language', 'skills', 'frameworks', 'use'],
    projects: ['project', 'projects', 'built', 'showcase', 'apps', 'portfolio', 'demos', 'show'],
    experience: ['experience', 'job', 'role', 'roles', 'career', 'worked', 'company', 'current', 'currently', 'position', 'eltern'],
    education: ['education', 'degree', 'study', 'studied', 'university', 'college', 'mca', 'bca', 'cgpa', 'school'],
    certs: ['certification', 'certifications', 'certificate', 'certificates', 'certified', 'course', 'courses'],
    contact: ['contact', 'email', 'reach', 'hire', 'hiring', 'available', 'availability', 'freelance', 'phone', 'talk', 'collaborate', 'linkedin'],
    location: ['where', 'location', 'based', 'city', 'kolkata'],
    about: ['who', 'yourself', 'introduce', 'about'],
    resume: ['resume', 'cv'],
    backend: ['backend', 'back-end', 'server', 'servers', 'database', 'databases'],
    frontend: ['frontend', 'front-end', 'ui', 'interface', 'interfaces'],
    process: ['process', 'workflow', 'deploy', 'deployed', 'deployment', 'testing', 'tested', 'tests', 'ci', 'monitoring', 'optimisation', 'optimization', 'lighthouse'],
    focus: ['focus', 'focused', 'focusing']
  };

  // "/" splits too, so "AI/ML" counts as both "ai" and "ml".
  const tokens = q => q.toLowerCase().split(/[^a-z0-9+#.-]+/).map(t => t.replace(/\.+$/, '')).filter(Boolean);
  const has = (q, phrase) => (' ' + q.toLowerCase().replace(/[^a-z0-9+#./ -]+/g, ' ') + ' ').includes(' ' + phrase + ' ');
  function findTech(q) {
    return allTech.filter(t => {
      const names = ALIAS[t.name] || [t.name.toLowerCase()];
      return names.some(n => has(q, n)) || has(q, t.name.toLowerCase());
    });
  }
  const findProject = q => KB.projects.find(p => (PROJECT_ALIAS[p.key] || [p.title.toLowerCase()]).some(a => has(q, a)));

  /* — answer builders: { title, lead, rows:[[k,v]], chips:[{name,icon}], items:[...], actions:[{label,run}] } — */
  const go = sel => () => { const t = $(sel); if (t) t.scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth', block: 'start' }); };
  const A = {
    stack: () => ({
      title: 'My development stack',
      lead: `${allTech.length} technologies across ${KB.stack.length} areas, from the browser to the edge.`,
      rows: KB.stack.map(g => [g.group, g.items.map(i => i.name).join(', ')]),
      actions: [{ label: 'Explore the capability constellation', run: go('#skills') }, { label: 'Walk the engineering DNA', run: go('#thinking') }]
    }),
    ai: () => ({
      title: 'AI / ML work',
      lead: 'Computer vision is the focus: models that watch live video and turn what they see into decisions.',
      rows: DNA.vision.stages.map(st => [st.label + (st.status === 'built' ? '' : ` (${st.status === 'partial' ? 'partly built' : 'concept'})`), st.does]),
      chips: ['python', 'yolo', 'opencv', 'rtsp', 'mediamtx', 'raspberrypi', 'iot'].map(k => allTech.find(t => t.key === k)).filter(Boolean),
      items: KB.projects.filter(p => p.el.dataset.cat === 'ai').map(p => `${p.title}: ${p.desc}`),
      actions: [{ label: 'Open the observatory', run: go('#pipeline') }, { label: 'Open the Detectify case study', run: () => Case.open('detectify') }]
    }),
    systems: () => ({
      title: 'The systems I build',
      lead: 'End to end: interfaces, APIs and databases, plus vision pipelines that run on edge devices.',
      rows: Object.values(DNA).map(j => [j.label, j.stages.map(st => st.label).join(' → ')]),
      items: RUNGS.map(([, , note]) => `Where they meet: ${note}.`),
      actions: [{ label: 'Walk the engineering DNA', run: go('#thinking') }, { label: 'Open the PN universe', run: go('#universe') }]
    }),
    projects: () => ({
      title: 'Projects',
      lead: `${KB.projects.length} projects. ${Case.keys.length} have full case studies.`,
      rows: KB.projects.map(p => [p.title, `${p.cat} · ${p.tagline || p.desc}`]),
      actions: Case.keys.map(k => ({ label: `${KB.projects.find(p => p.key === k).title} case study`, run: () => Case.open(k) }))
        .concat({ label: 'Go to projects', run: go('#projects') })
    }),
    experience: () => ({
      title: 'Experience',
      lead: `Currently ${KB.current.role} at ${KB.current.company}. ${KB.current.desc}`,
      rows: KB.roles.map(r => [r.title, `${r.date} · ${r.sub}`]),
      items: KB.disciplines.map(d => `${d.title} (${d.date}): ${d.tags}`),
      actions: [{ label: 'See the full timeline', run: go('#experience') }]
    }),
    education: () => ({
      title: 'Education',
      rows: KB.edu.map(e => [e.title, `${e.inst} · ${e.meta}`]),
      items: KB.certs.length ? [`Plus ${KB.certs.length} certifications, including ${KB.certs[0].title}.`] : [],
      actions: [{ label: 'Go to education', run: go('#education') }]
    }),
    certs: () => ({
      title: 'Certifications',
      rows: KB.certs.map(c => [c.title, c.note]),
      actions: [{ label: 'Go to certifications', run: go('#education') }]
    }),
    contact: () => ({
      title: 'Get in touch',
      lead: `${KB.status}. Every channel below is real, and the form sends to my inbox.`,
      rows: [['Email', 'pratyushnandi100@gmail.com'], ['Phone', '+91 7890706472'], ['Location', KB.location],
        ['GitHub', 'github.com/pratyushnandi'], ['LinkedIn', 'linkedin.com/in/pratyushnandi']],
      actions: [{ label: 'Copy email', run: () => $('#copyEmail').click() }, { label: 'Open the contact form', run: () => window.dispatchEvent(new Event('pn:open-form')) }]
    }),
    location: () => ({ title: 'Location', lead: `Based in ${KB.location}.`, actions: [{ label: 'Contact details', run: go('#contact') }] }),
    about: () => ({
      title: 'About Pratyush',
      lead: `${KB.current.role} at ${KB.current.company}, building full-stack products, clean APIs and edge-deployed computer vision.`,
      items: [KB.edu[0] ? `${KB.edu[0].title}, ${KB.edu[0].inst}` : '', KB.location].filter(Boolean),
      actions: [{ label: 'Read the about section', run: go('#about') }]
    }),
    resume: () => ({
      title: 'Resume',
      lead: 'The full CV is a PDF you can download.',
      actions: [{ label: 'Download resume', run: () => { const a = $('.n-resume'); if (a) a.click(); } }]
    }),
    tech: list => {
      const t = list[0];
      const c = CAP[t.key] || { d: [], p: [] };
      const stem = t.name.toLowerCase().split(/[ .·]/)[0];
      const why = WHY.filter(([wq]) => wq.toLowerCase().includes(stem));
      return {
        title: t.name,
        lead: `Yes. ${t.name} is in my stack, under ${t.group}.` + (list.length > 1 ? ` (Also matched: ${list.slice(1).map(x => x.name).join(', ')}.)` : ''),
        rows: [['Discipline', c.d.map(d => DISC[d]).join(', ')],
          ['Used in', c.p.length ? c.p.map(k => PROJ[k]).join(', ') : 'No project on this page uses it yet.']].concat(why),
        actions: [{ label: 'Show it in the constellation', run: () => {
          const b = $(`.cst-tech [data-t="${t.key}"]`);
          go('#skills')();
          if (b && b.getAttribute('aria-pressed') !== 'true') setTimeout(() => b.click(), REDUCE_MOTION ? 0 : 450);
        } }]
      };
    },
    stageRows: (j, ids, title, lead) => ({
      title, lead,
      rows: ids.flatMap(id => {
        const st = DNA[j].stages.find(x => x.id === id);
        return [[st.label, st.tech.join(', ')]].concat(st.trade.map(x => ['Trade-off', x]));
      }),
      actions: [{ label: 'Open it in the engineering DNA', run: () => window.dispatchEvent(new CustomEvent('pn:dna-open', { detail: { journey: j, stage: ids[0] } })) }]
    }),
    backend: () => A.stageRows('product', ['api', 'database'], 'Backend & data', 'APIs on Node.js over relational and on-device data, with the trade-offs behind each choice.'),
    frontend: () => A.stageRows('product', ['interface'], 'Frontend', 'Component-driven interfaces on the web and on Android.'),
    projectsWith: (needles, title) => {
      const hits = KB.projects.filter(p => p.tags.some(tag => needles.some(n => tag.toLowerCase().includes(n))));
      return hits.length ? {
        title, lead: `${hits.length === 1 ? 'One project' : hits.length + ' projects'} on this page.`,
        rows: hits.map(p => [p.title, p.desc]),
        actions: hits.filter(p => Case.keys.includes(p.key)).map(p => ({ label: `${p.title} case study`, run: () => Case.open(p.key) }))
      } : { title, lead: 'No project on this page lists that yet.' };
    },
    process: () => ({
      title: 'How I build',
      lead: 'Every project goes through the same loop. Here it is, evidenced by this portfolio itself.',
      rows: $$('.proc-step').map(s => [txt($('h3', s)), txt($('.proc-proof', s)).replace(/^here\s*/, '')]),
      actions: [{ label: 'See the process', run: go('#process') }]
    }),
    focus: () => ({
      title: 'Current focus',
      lead: 'Building intelligent software systems.',
      rows: $$('.focus-grid li').map(li => [txt($('strong', li)), txt($('strong + span', li))]),
      actions: [{ label: 'See current focus', run: go('#focus') }]
    }),
    project: p => ({
      title: p.title,
      lead: [p.tagline, p.desc].filter(Boolean).join(' '),
      rows: [['Category', p.cat], ['Built with', p.tags.join(', ')]],
      actions: (Case.keys.includes(p.key) ? [{ label: 'Open the case study', run: () => Case.open(p.key) }] : [])
        .concat(p.links.map(l => ({ label: l.label, run: () => window.open(l.href, '_blank', 'noopener') })))
        .concat({ label: 'Show it on the page', run: () => p.el.scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth', block: 'center' }) })
    }),
    // The one thing on this site that no menu links to. The console hints at it.
    hidden: () => ({
      label: 'system message',
      title: 'You found something that wasn’t in the navigation.',
      lead: 'Good engineers look deeper.'
    }),
    fallback: () => ({
      title: 'I can only answer from this portfolio',
      lead: "I couldn't match that to anything on this page. I'm a deterministic assistant, not an AI model, so I won't guess. Try one of these:"
    })
  };

  function answer(q) {
    if (/^\s*ls\s+-(a|la|al)\s*$/i.test(q)) { inspect('hidden', 'ls-a', 'A hidden file'); return A.hidden(); }
    const toks = tokens(q);
    if (!toks.length) return A.fallback();
    const project = findProject(q);
    if (project) return A.project(project);
    const score = Object.fromEntries(Object.entries(INTENTS).map(([k, words]) => [k, toks.filter(t => words.includes(t)).length]));
    if (has(q, 'computer vision') || has(q, 'machine learning')) score.ai += 2;
    if (has(q, 'kind of system') || has(q, 'kind of systems')) score.systems += 2;
    if (has(q, 'this portfolio') || has(q, 'this site') || has(q, 'this website')) score.process += 3;
    if (has(q, 'right now') || has(q, 'working on')) score.focus += 2;
    // "Which projects use X?" — answered by project tags, not by the intent.
    const wantsProjects = toks.some(t => t.startsWith('project'));
    if (wantsProjects && (has(q, 'computer vision') || toks.includes('vision') || toks.includes('cv'))) return A.projectsWith(['computer vision', 'opencv'], 'Computer-vision projects');
    const tech = findTech(q).filter(t => !['AI / ML', 'Visual AI'].includes(t.name) || !score.ai);
    if (wantsProjects && tech.length) return A.projectsWith([tech[0].name.toLowerCase().split(/[ .]/)[0]], `Projects using ${tech[0].name}`);
    const [best, n] = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
    if (tech.length && !(best === 'ai' && n >= 2) && !(['stack', 'systems'].includes(best) && n >= 2)) return A.tech(tech);
    return n > 0 ? A[best]() : A.fallback();
  }
  const SUGGESTED = [
    'What technologies do you use?', 'What AI/ML work do you do?', 'Show me your projects.',
    'What is your development stack?', 'What kind of systems do you build?'
  ];
  // Questions that fit the section the visitor is reading: plain scroll
  // position, nothing inferred about the visitor.
  const BY_CONTEXT = {
    hero: 'What kind of systems do you build?', thinking: 'How do you approach a system?', about: 'What technologies do you use?',
    experience: 'What is your experience?', skills: 'What backend technologies are used?',
    pipeline: 'What AI/ML work do you do?', projects: 'What projects involve computer vision?',
    process: 'How is this portfolio built?', education: 'What certifications do you have?',
    focus: 'What are you focused on right now?', contact: 'How can I contact you?'
  };
  const suggestedFor = ctx => {
    const first = BY_CONTEXT[ctx];
    return first ? [first].concat(SUGGESTED.filter(s => s !== first)).slice(0, 5) : SUGGESTED;
  };
  return { answer, SUGGESTED, suggestedFor };
})();

/* ══ 23. COMMAND PALETTE ══
   Ctrl/⌘ K anywhere. Every command does something real; typing a question
   hands it to the assistant above. */
(function () {
  const dlg = $('#cmdk');
  if (!dlg || !dlg.showModal) return;
  const input = $('#cmdkInput');
  const list = $('#cmdkList');
  const ans = $('#cmdkAnswer');
  const isMac = /mac|iphone|ipad/i.test((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '');
  $$('.cmdk-kbd').forEach(k => { k.textContent = isMac ? '⌘ K' : 'Ctrl K'; });
  // The accessible name leads with the visible shortcut (voice-control users say what they see).
  // Touch devices have no shortcut to advertise, so the name describes the action.
  $('#cmdkBtn').setAttribute('aria-label', FINE_POINTER ? `${isMac ? '⌘ K' : 'Ctrl K'} — command palette` : 'Search and commands');

  const scrollTo = sel => () => { const t = $(sel); if (t) t.scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth', block: 'start' }); };
  // Every command has a dotted id (shown, and searchable: "explore." lists the
  // places, "open." the things that open). ack: what to confirm once it ran.
  const NAV = [
    ['explore.universe', 'The PN universe', '#universe', 'fa-circle-nodes', 'domains software ai vision iot identity'],
    ['explore.about', 'About', '#about', 'fa-user', 'who bio'],
    ['explore.architecture', 'Engineering DNA', '#thinking', 'fa-diagram-project', 'architecture system journeys thinking map'],
    ['explore.process', 'How I build', '#process', 'fa-gears', 'process engineering deploy testing systems'],
    ['explore.capabilities', 'Capability constellation', '#skills', 'fa-layer-group', 'skills stack technologies tech'],
    ['explore.projects', 'Projects', '#projects', 'fa-folder-open', 'work worlds case studies portfolio'],
    ['explore.ai-lab', 'Visual intelligence observatory', '#pipeline', 'fa-eye', 'ai lab pipeline ml computer vision yolo detection threshold'],
    ['explore.focus', 'Current focus', '#focus', 'fa-crosshairs', 'now focus areas'],
    ['explore.experience', 'Experience', '#experience', 'fa-code-branch', 'work roles journey timeline'],
    ['explore.education', 'Education', '#education', 'fa-graduation-cap', 'degree certifications'],
    ['contact.connect', 'Contact', '#contact', 'fa-paper-plane', 'email hire message portal'],
    ['explore.session', 'Your exploration', '#sessEnd', 'fa-route', 'session complete trace route restart clear']
  ];
  // "Suggested here": the commands that fit the section being read.
  const HERE = {
    hero: ['Engineering DNA', 'Turn on Engineering Mode'], about: ['Download resume', 'Experience'],
    thinking: ['Capability constellation', 'Projects'], skills: ['Engineering DNA', 'Visual intelligence observatory'],
    experience: ['Projects', 'Download resume'], process: ['Open GitHub', 'Engineering DNA'],
    pipeline: ['Detectify case study', 'AI / ML projects'], projects: ['Detectify case study', 'Aspend case study'],
    education: ['Download resume', 'Current focus'], focus: ['Contact', 'Download resume'],
    contact: ['Copy email address', 'Start a conversation', 'Send an email']
  };
  function commands() {
    const light = root.getAttribute('data-theme') === 'light';
    const eng = Eng.isOn();
    return [].concat(
      NAV.map(([id, label, sel, icon, kw]) => ({ group: 'Navigate', id, label, icon, kw, run: scrollTo(sel) })),
      [{ group: 'Navigate', id: 'filter.ai-projects', label: 'AI / ML projects', icon: 'fa-brain', kw: 'filter detectify', run: () => { const b = $('.pf[data-f="ai"]'); if (b) b.click(); scrollTo('#projects')(); } }],
      [
        { group: 'Actions', id: 'mode.engineering', label: eng ? 'Turn off Engineering Mode' : 'Turn on Engineering Mode', icon: 'fa-microchip', kw: 'engineering mode eng system blueprint', run: () => Eng.toggle(), ack: () => (Eng.isOn() ? 'Engineering mode on' : 'Engineering mode off') },
        { group: 'Actions', id: 'theme.toggle', label: light ? 'Switch to dark theme' : 'Switch to light theme', icon: light ? 'fa-moon' : 'fa-sun', kw: 'toggle theme dark light mode', run: () => $('#themeToggle').click(), ack: () => (root.getAttribute('data-theme') === 'light' ? 'Light theme' : 'Dark theme') },
        { group: 'Actions', id: 'contact.copy-email', label: 'Copy email address', icon: 'fa-copy', kw: 'email mail clipboard', run: () => $('#copyEmail').click() },
        { group: 'Actions', id: 'open.resume', label: 'Download resume', icon: 'fa-file-arrow-down', kw: 'cv pdf', run: () => $('.n-resume').click(), ack: () => 'Resume download started' },
        { group: 'Actions', id: 'contact.email', label: 'Send an email', icon: 'fa-envelope', kw: 'mail contact', run: () => { location.href = 'mailto:pratyushnandi100@gmail.com'; }, ack: () => 'Opening your email app' },
        { group: 'Actions', id: 'contact.form', label: 'Start a conversation', icon: 'fa-paper-plane', kw: 'contact form message hire', run: () => window.dispatchEvent(new Event('pn:open-form')) },
        { group: 'Actions', id: 'open.github', label: 'Open GitHub', icon: 'fa-github', brand: true, kw: 'code repositories', run: () => window.open('https://github.com/pratyushnandi', '_blank', 'noopener'), ack: () => 'GitHub opened in a new tab' },
        { group: 'Actions', id: 'open.linkedin', label: 'Open LinkedIn', icon: 'fa-linkedin-in', brand: true, kw: 'profile', run: () => window.open('https://www.linkedin.com/in/pratyushnandi/', '_blank', 'noopener'), ack: () => 'LinkedIn opened in a new tab' }
      ],
      Case.keys.map(k => ({ group: 'Case studies', id: 'open.case.' + k, label: `${$('#case-' + k).content.querySelector('h2').textContent} case study`, icon: 'fa-book-open', kw: 'case study project', run: () => Case.open(k) }))
    );
  }

  let items = [], active = 0, mode = 'list';
  const ask = q => ({ group: 'Ask about my work', label: q, icon: 'fa-message', ask: true, run: () => showAnswer(q) });
  const looksLikeQuestion = q => /\?$/.test(q.trim()) || /^(what|which|who|where|how|do|does|did|can|are|is|tell|show|have|why)\b/i.test(q.trim());

  function filter(q) {
    q = q.trim().toLowerCase();
    if (!q) {
      const ctx = root.dataset.context || 'hero';
      const all = commands();
      const picks = (HERE[ctx] || []).map(l => all.find(c => c.label === l || c.label === l.replace('Turn on', 'Turn off'))).filter(Boolean);
      const here = picks.map(c => ({ ...c, group: 'Suggested here' }))
        .concat(ask(Assistant.suggestedFor(ctx)[0])).map(c => ({ ...c, group: 'Suggested here' }));
      const asked = here[here.length - 1].label;
      return here.concat(all.filter(c => !picks.includes(c)), Assistant.suggestedFor(ctx).filter(s => s !== asked).map(ask));
    }
    const words = q.split(/\s+/);
    // Rank like a real launcher: label prefix, then a word in the label, then keywords only.
    const rank = c => {
      const label = c.label.toLowerCase();
      if (label.startsWith(q) || (c.id && c.id.startsWith(q))) return 0;
      if (words.every(w => label.split(/[\s/]+/).some(t => t.startsWith(w)))) return 1;
      if (words.every(w => label.includes(w))) return 2;
      return 3;
    };
    const hits = commands()
      .filter(c => words.every(w => (c.label + ' ' + (c.id || '') + ' ' + c.kw + ' ' + c.group).toLowerCase().includes(w)))
      .map((c, i) => ({ c, r: rank(c), i }))
      .sort((a, b) => a.r - b.r || a.i - b.i)
      .map(x => ({ ...x.c, group: x.r < 3 ? x.c.group : 'Related' }));
    const askItem = ask(input.value.trim());
    return looksLikeQuestion(q) ? [askItem].concat(hits) : hits.concat(askItem);
  }
  function render() {
    list.replaceChildren();
    let group = '';
    items.forEach((c, i) => {
      if (c.group !== group) {
        group = c.group;
        const h = document.createElement('li');
        h.className = 'cmdk-group mono'; h.setAttribute('role', 'presentation'); h.textContent = group;
        list.appendChild(h);
      }
      const li = document.createElement('li');
      li.id = 'cmdk-opt-' + i; li.className = 'cmdk-item' + (c.ask ? ' is-ask' : '');
      li.setAttribute('role', 'option');
      const ico = document.createElement('i');
      ico.className = (c.brand ? 'fab ' : 'fas ') + c.icon; ico.setAttribute('aria-hidden', 'true');
      const lab = document.createElement('span');
      lab.textContent = c.label;
      li.append(ico, lab);
      if (c.ask) { const t = document.createElement('span'); t.className = 'cmdk-tag mono'; t.textContent = 'ask'; li.appendChild(t); }
      else if (c.id) { const t = document.createElement('span'); t.className = 'cmdk-id mono'; t.setAttribute('aria-hidden', 'true'); t.textContent = c.id; li.appendChild(t); }
      li.addEventListener('click', () => run(i));
      li.addEventListener('pointermove', () => setActive(i));
      list.appendChild(li);
    });
    setActive(0);
  }
  function setActive(i) {
    if (!items.length) return;
    active = (i + items.length) % items.length;
    $$('.cmdk-item', list).forEach((li, j) => {
      const on = j === active;
      li.classList.toggle('active', on);
      li.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) li.scrollIntoView({ block: 'nearest' });
    });
    input.setAttribute('aria-activedescendant', 'cmdk-opt-' + active);
  }
  function run(i) {
    const c = items[i];
    if (!c) return;
    if (c.ask) { c.run(); return; }
    close();
    // Let the dialog release the page before scrolling or opening another dialog,
    // then confirm what happened.
    setTimeout(() => { c.run(); if (c.ack) setTimeout(() => ack(c.ack()), 60); }, 30);
  }


  function showAnswer(q) {
    mode = 'answer';
    const a = Assistant.answer(q);
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const wrap = el('div', 'ca-wrap');
    const head = el('div', 'ca-head');
    const back = el('button', 'ca-back');
    back.type = 'button'; back.innerHTML = '<i class="fas fa-arrow-left" aria-hidden="true"></i>';
    back.setAttribute('aria-label', 'Back to commands');
    back.addEventListener('click', () => { input.value = ''; showList(); });
    head.append(back, el('span', 'ca-q', q));
    wrap.appendChild(head);
    const body = el('div', 'ca-body');
    body.appendChild(el('span', 'ca-label mono', a.label || 'portfolio assistant · from this page'));
    body.appendChild(el('h3', null, a.title));
    if (a.lead) body.appendChild(el('p', 'ca-lead', a.lead));
    if (a.rows && a.rows.length) {
      const dl = el('dl', 'ca-rows');
      a.rows.forEach(([k, v]) => { const d = el('div'); d.append(el('dt', null, k), el('dd', null, v)); dl.appendChild(d); });
      body.appendChild(dl);
    }
    if (a.chips && a.chips.length) {
      const ul = el('ul', 'ca-chips');
      a.chips.forEach(c => { const li = el('li'); const i = el('i', c.icon); i.setAttribute('aria-hidden', 'true'); li.append(i, el('span', null, c.name)); ul.appendChild(li); });
      body.appendChild(ul);
    }
    if (a.items && a.items.length) {
      const ul = el('ul', 'ca-items');
      a.items.forEach(t => ul.appendChild(el('li', null, t)));
      body.appendChild(ul);
    }
    const acts = el('div', 'ca-actions');
    (a.actions || []).forEach(x => {
      const b = el('button', 'ca-act', x.label); b.type = 'button';
      b.addEventListener('click', () => { close(); setTimeout(x.run, 30); });
      acts.appendChild(b);
    });
    if (acts.children.length) body.appendChild(acts);
    // Follow-ups: the suggested questions not just asked.
    const more = el('div', 'ca-more');
    more.appendChild(el('span', 'mono', 'ask next'));
    Assistant.SUGGESTED.filter(s => s !== q).slice(0, 3).forEach(s => {
      const b = el('button', 'ca-suggest', s); b.type = 'button';
      b.addEventListener('click', () => { input.value = s; showAnswer(s); });
      more.appendChild(b);
    });
    body.appendChild(more);
    wrap.appendChild(body);
    ans.replaceChildren(wrap);
    list.hidden = true; ans.hidden = false;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }
  function showList() {
    mode = 'list';
    ans.hidden = true; list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    items = filter(input.value); render();
    input.focus();
  }

  let last = null;
  function open(opts = {}) {
    if (dlg.open) return;
    last = document.activeElement;
    input.value = '';
    dlg.showModal();
    root.classList.add('modal-open');
    if (opts.ask) { items = Assistant.suggestedFor(root.dataset.context).map(ask); mode = 'list'; ans.hidden = true; list.hidden = false; render(); }
    else showList();
    input.focus();
  }
  function close() {
    if (!dlg.open) return;
    dlg.close();
    root.classList.remove('modal-open');
    if (last && last.isConnected && !$('#caseDlg').open) last.focus({ preventScroll: true });
  }

  input.addEventListener('input', () => { if (mode === 'answer') showList(); else { items = filter(input.value); render(); } });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (mode === 'list') setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (mode === 'list') setActive(active - 1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (mode === 'list') run(active);
      else if (input.value.trim()) showAnswer(input.value.trim());
    } else if (e.key === 'Backspace' && mode === 'answer' && !input.value) showList();
  });
  trapTab(dlg);
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dlg.open) close(); else if (!$('#caseDlg').open) open();
    }
  });
  $('#cmdkBtn').addEventListener('click', () => open());
  $('#cmdkClose').addEventListener('click', close);
  $$('[data-ask]').forEach(b => b.addEventListener('click', () => open({ ask: true })));
})();

/* ══ 24. PN CURSOR ══
   The native pointer always stays (it is the fallback and the precise one).
   On desktop mice a small PN node follows it, and over things worth naming it
   opens into a ring with a word. Never on touch, never under reduced motion,
   hidden over text fields and dialogs, and the rAF loop stops once caught up. */
(function () {
  const cur = $('.ctx-cursor');
  if (!cur || !FINE_POINTER || REDUCE_MOTION) return;
  const label = $('.cc-label', cur);
  const CONTEXT = [
    ['a[href^="mailto:"], a[href="#contact"], .pa, .copy-btn', "Let's talk"],
    ['.uv-domain', 'Domain'],
    ['.ds-stages button, .ds-go', 'Trace'],
    ['.cst-list button', 'Connect'],
    ['#projGrid .pj, .pj-mini', 'Explore']
  ];
  let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
  function loop() {
    cx += (x - cx) * .28; cy += (y - cy) * .28;
    cur.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > .3 ? requestAnimationFrame(loop) : 0;
  }
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!cur.classList.contains('live')) { cx = x; cy = y; }
    const t = e.target.closest ? e.target : null;
    const quiet = !t || document.querySelector('dialog[open]') || t.closest('input, textarea, select, [contenteditable]');
    let text = '';
    if (!quiet) for (const [sel, word] of CONTEXT) { if (t.closest(sel)) { text = word; break; } }
    if (text && label.textContent !== text) label.textContent = text;
    cur.classList.toggle('live', !quiet);
    cur.classList.toggle('on', !!text);
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => cur.classList.remove('live', 'on'));
})();

/* ══ 25. SESSION ══
   The OS layer. One record of the visitor's route through this page, drawn
   three ways: the rail (where you are), system events (a rare note when
   something is first discovered) and the trace in "Session complete". It lives
   in sessionStorage for this tab only and holds section ids and things opened
   on this page: nothing about the visitor, nothing sent anywhere. */
(function () {
  const MODULES = CHAPTERS.filter(([id]) => document.getElementById(id)).map(([id, n, label]) => ({ id, n, label }));
  const labelOf = id => (MODULES.find(m => m.id === id) || {}).label;
  // Which section a deeper look belongs to on the trace.
  const HOME = { layer: 'thinking', tech: 'thinking', pipeline: 'pipeline', case: 'projects' };
  const KIND = { layer: 'layer', tech: 'tech', pipeline: 'ai lab', case: 'project', eng: 'mode', hidden: 'found' };

  /* — store — */
  const KEY = 'pn-session';
  const blank = () => ({ path: [], inspected: [], events: [] });
  let state = blank();
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY));
    if (s && Array.isArray(s.path) && Array.isArray(s.inspected) && Array.isArray(s.events)) {
      state = { path: s.path.filter(labelOf), inspected: s.inspected.filter(x => x && KIND[x.kind]), events: s.events };
    }
  } catch (e) {}
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
  const subs = [];
  const changed = () => { save(); subs.forEach(f => f()); };

  /* — system events: each at most once, never back to back, four per session — */
  const toast = document.createElement('div');
  toast.className = 'sysev';
  toast.setAttribute('role', 'status');
  toast.innerHTML = '<span class="sysev-k mono">system event</span><span class="sysev-t mono"></span>';
  document.body.appendChild(toast);
  const toastText = $('.sysev-t', toast);
  let lastAt = -Infinity, hideT = 0, pending = null;
  function event(key, text) {
    if (state.events.includes(key) || state.events.length >= 4) return;
    // Under a dialog the note would go unseen: hold it until the dialog closes.
    if (document.querySelector('dialog[open]')) { pending = [key, text]; return; }
    if (performance.now() - lastAt < 12000) return;
    lastAt = performance.now();
    state.events.push(key); save();
    say(text);
  }
  function say(text) {
    toastText.textContent = text;
    toast.classList.add('on');
    clearTimeout(hideT);
    hideT = setTimeout(() => toast.classList.remove('on'), 3600);
  }
  $$('dialog').forEach(d => d.addEventListener('close', () => {
    if (!pending) return;
    const p = pending; pending = null;
    setTimeout(() => event(...p), 450);
  }));

  /* — recording — */
  // A section counts as explored once the visitor stays in it, not when a
  // nav jump merely scrolls through it.
  let current = 'hero', dwell = 0;
  function onContext(section) {
    const id = CHAPTER_OF[section] || section;
    current = id;
    paintRail();
    clearTimeout(dwell);
    if (!labelOf(id) || state.path.includes(id)) return;
    dwell = setTimeout(() => {
      state.path.push(id); changed();
      if (id === 'pipeline') event('ai-lab', 'AI Lab discovered');
    }, 1200);
  }
  window.addEventListener('pn:context', e => onContext(e.detail.context));
  window.addEventListener('pn:inspect', e => {
    const { kind, key, label } = e.detail;
    if (state.inspected.some(x => x.kind === kind && x.key === key)) return;
    state.inspected.push({ kind, key, label });
    if (state.inspected.length > 16) state.inspected.shift();
    changed();
    const first = state.inspected.filter(x => x.kind === kind).length === 1;
    if (first && kind === 'layer') event('arch', 'Architecture expanded');
    if (first && kind === 'case') event('case', 'Project inspected');
  });
  window.addEventListener('pn:modechange', e => {
    if (!e.detail.eng) return;
    inspect('eng', 'on', 'Engineering Mode');
    event('eng', 'Engineering mode enabled');
  });

  /* — rail: a quiet map of the page at the right edge (wide screens only) —
     A visual mirror of the primary nav, so it is hidden from assistive tech
     and kept out of the tab order; the nav and the summary below carry it. */
  const rail = document.createElement('div');
  rail.className = 'srail';
  rail.setAttribute('aria-hidden', 'true');
  rail.innerHTML = '<span class="srail-track"><span class="srail-fill"></span></span>' +
    MODULES.map(m => `<a href="#${m.id}" tabindex="-1" data-m="${m.id}"><span class="srail-lbl mono">${m.n} ${m.label}</span><i></i></a>`).join('');
  document.body.appendChild(rail);
  const railLinks = $$('a', rail);
  function paintRail() {
    const i = MODULES.findIndex(m => m.id === current);
    rail.classList.toggle('on', i >= 0);
    railLinks.forEach((a, j) => {
      a.classList.toggle('cur', j === i);
      a.classList.toggle('seen', state.path.includes(a.dataset.m));
    });
    if (i >= 0) rail.style.setProperty('--p', (i / Math.max(1, MODULES.length - 1)).toFixed(3));
  }
  subs.push(paintRail);

  /* — session complete: the route, drawn — */
  const end = $('#sessEnd');
  if (end) {
    const svg = $('#seSvg'), sum = $('#seSum'), list = $('#seInspected');
    const NS = 'http://www.w3.org/2000/svg';
    const narrow = window.matchMedia('(max-width: 640px)');
    const make = (tag, attrs, parent) => {
      const n = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      if (parent) parent.appendChild(n);
      return n;
    };
    // Desktop: the sections as a left-to-right wave. Phones: a vertical flow.
    function layout() {
      const n = MODULES.length;
      if (narrow.matches) return { w: 300, h: 28 + (n - 1) * 36 + 20, vertical: true,
        pts: MODULES.map((m, i) => [i % 2 ? 36 : 14, 22 + i * 36]) };
      return { w: 640, h: 210, vertical: false,
        pts: MODULES.map((m, i) => [34 + i * (572 / (n - 1)), i % 2 ? 72 : 140]) };
    }
    let raf = 0, drawnSig = null, visible = false;
    function render() {
      cancelAnimationFrame(raf); raf = 0;
      const L = layout();
      const at = id => L.pts[MODULES.findIndex(m => m.id === id)];
      svg.setAttribute('viewBox', `0 0 ${L.w} ${L.h}`);
      svg.replaceChildren();
      make('polyline', { class: 'se-sys', points: L.pts.join(' ') }, svg);
      const route = make('polyline', { class: 'se-route', points: state.path.map(at).join(' ') }, svg);
      const counts = {};
      state.inspected.forEach(x => { if (HOME[x.kind]) counts[HOME[x.kind]] = (counts[HOME[x.kind]] || 0) + 1; });
      const nodes = MODULES.map((m, i) => {
        const [x, y] = L.pts[i];
        const step = state.path.indexOf(m.id);
        const g = make('g', { class: 'se-node' + (step >= 0 ? ' seen' : '') + (step >= 0 && step === state.path.length - 1 ? ' last' : '') }, svg);
        make('circle', { class: 'se-ring', cx: x, cy: y, r: 11 }, g);
        make('circle', { class: 'se-dot', cx: x, cy: y, r: 5 }, g);
        const up = !L.vertical && i % 2;
        const t = make('text', L.vertical
          ? { x: 104, y: y + 4, class: 'se-lbl' }
          : { x, y: up ? y - 22 : y + 30, 'text-anchor': 'middle', class: 'se-lbl' }, g);
        t.textContent = m.label.toUpperCase();
        if (step >= 0) {
          const s = make('text', L.vertical
            ? { x: 94, y: y + 4, 'text-anchor': 'end', class: 'se-step' }
            : { x, y: up ? y - 36 : y + 44, 'text-anchor': 'middle', class: 'se-step' }, g);
          s.textContent = String(step + 1).padStart(2, '0') + (counts[m.id] ? ` · +${counts[m.id]}` : '');
        }
        return g;
      });
      const packet = make('circle', { class: 'se-packet', r: 3.5, cx: 0, cy: 0, visibility: 'hidden' }, svg);
      paintText();
      return { route, nodes, packet, L, at };
    }
    function paintText() {
      const n = state.path.length, k = state.inspected.length;
      sum.textContent = n
        ? `${n} of ${MODULES.length} sections explored` + (k ? `, ${k} thing${k > 1 ? 's' : ''} inspected` : '') +
          `. Route: ${state.path.map(labelOf).join(' → ')}.`
        : 'Nothing explored yet. The route draws itself as you stop to read.';
      list.replaceChildren();
      if (!k) {
        const li = document.createElement('li');
        li.className = 'se-empty';
        li.textContent = 'Nothing yet. Select a system layer or a technology, or open a case study.';
        list.appendChild(li);
      }
      state.inspected.forEach(x => {
        const li = document.createElement('li');
        const kind = document.createElement('span');
        kind.className = 'mono'; kind.textContent = KIND[x.kind];
        li.append(kind, document.createTextNode(' ' + x.label));
        list.appendChild(li);
      });
    }
    // The signal runs the route once, lighting each section as it arrives.
    function draw(v) {
      const sig = state.path.join();
      if (REDUCE_MOTION || state.path.length < 2 || sig === drawnSig) return;
      drawnSig = sig;
      const len = v.route.getTotalLength();
      if (!len) return;
      const seen = v.nodes.filter(g => g.classList.contains('seen'));
      // Where along the route each visited section sits.
      let acc = 0;
      const stops = state.path.map((id, i) => {
        if (i) { const [a, b] = [v.at(state.path[i - 1]), v.at(id)]; acc += Math.hypot(b[0] - a[0], b[1] - a[1]); }
        return acc;
      });
      const order = state.path.map(id => v.nodes[MODULES.findIndex(m => m.id === id)]);
      seen.forEach(g => g.classList.add('dim'));
      v.route.style.strokeDasharray = len;
      v.packet.setAttribute('visibility', 'visible');
      const dur = Math.min(2200, 500 + state.path.length * 180), t0 = performance.now();
      const ease = t => 1 - Math.pow(1 - t, 3);
      const step = now => {
        const p = ease(Math.min((now - t0) / dur, 1)), d = len * p;
        v.route.style.strokeDashoffset = (len - d).toFixed(1);
        const pt = v.route.getPointAtLength(d);
        v.packet.setAttribute('cx', pt.x.toFixed(1)); v.packet.setAttribute('cy', pt.y.toFixed(1));
        order.forEach((g, i) => { if (stops[i] <= d + .5) g.classList.remove('dim'); });
        if (p < 1) raf = requestAnimationFrame(step);
        else { raf = 0; v.packet.setAttribute('visibility', 'hidden'); }
      };
      raf = requestAnimationFrame(step);
    }
    let view = render();
    subs.push(() => { view = render(); if (visible) draw(view); });
    narrow.addEventListener('change', () => { view = render(); });
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) draw(view);
    }, { threshold: .3 }).observe(end);

    $('#seRestart').addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: REDUCE_MOTION ? 'auto' : 'smooth' });
      $('#main').focus({ preventScroll: true });
    });
    // Events already shown stay shown: clearing the route shouldn't replay them.
    $('#seClear').addEventListener('click', () => {
      state = { ...blank(), events: state.events };
      drawnSig = null;
      changed();
      say('Exploration cleared');
    });
  }

  onContext(root.dataset.context || 'hero');
})();

/* ══ 26. LIVING CODE CANVAS ══
   One quiet drawing behind the page, made of the same 28 points throughout.
   Each chapter gives them a new arrangement: an emerging system (identity),
   architectural pathways (thinking, building), a device network (capabilities,
   experience), detection regions (intelligence), and finally the PN monogram
   (connection). Points glide between arrangements over ~1.2s, then the canvas
   stops drawing entirely until the next change. Reduced motion jumps straight
   to each arrangement. Decorative: hidden from assistive tech. */
(function () {
  const host = $('.backdrop');
  if (!host || !document.createElement('canvas').getContext) return;
  const cv = document.createElement('canvas');
  cv.className = 'bd-canvas';
  cv.setAttribute('aria-hidden', 'true');
  host.appendChild(cv);
  const ctx = cv.getContext('2d');
  const N = 28;
  const STATE_OF = { hero: 'emerge', about: 'emerge', thinking: 'architecture', process: 'architecture', skills: 'network',
    projects: 'architecture', pipeline: 'detection', focus: 'detection', experience: 'network', education: 'network', contact: 'resolve' };
  let W = 0, H = 0, dpr = 1, state = null, from = null, to = null, t0 = 0, raf = 0, pts = [];

  // Arrangements, in viewport fractions. Each returns { p: [[x, y]…N], e: [[i, j, style]…], l: [[i, text]…] }.
  const ring = (cx, cy, r, i, n, turn = 0) => [cx + Math.cos(i / n * Math.PI * 2 + turn) * r * H / W, cy + Math.sin(i / n * Math.PI * 2 + turn) * r];
  const SHAPES = {
    emerge() {
      const p = [], e = [];
      // A loose frame around the page, still finding its connections.
      for (let i = 0; i < N; i++) {
        const side = i % 4, f = (Math.floor(i / 4) + .5) / 7;
        p.push(side === 0 ? [.02 + f * .02, .1 + f * .8] : side === 1 ? [.96 + f * .02, .08 + f * .84] : side === 2 ? [.04 + f * .1, .94] : [.86 + f * .1, .05]);
      }
      for (let i = 0; i < 20; i += 4) e.push([i, i + 4, 'solid'], [i + 1, i + 5, 'solid']);
      return { p, e, l: [[4, 'init()'], [9, '0x01'], [17, 'connect']] };
    },
    architecture() {
      const cols = [.025, .09, .91, .975], p = [], e = [];
      for (let i = 0; i < N; i++) p.push([cols[i % 4], .12 + Math.floor(i / 4) * .12]);
      for (let i = 0; i < N - 4; i++) { if (i % 4 === 0 || i % 4 === 2) e.push([i, i + 4, 'solid']); if (i % 8 === 0 || i % 8 === 2) e.push([i, i + 1, 'orth']); }
      return { p, e, l: [[0, 'client'], [9, 'api'], [18, 'db'], [27, 'deploy']] };
    },
    network() {
      const hubs = [[.04, .3], [.96, .26], [.95, .78], [.05, .74]], p = [], e = [];
      for (let i = 0; i < N; i++) {
        const h = hubs[i % 4], k = Math.floor(i / 4);
        p.push(k === 0 ? h : ring(h[0], h[1], .07, k, 6, i));
        if (k > 0) e.push([i % 4, i, 'solid']);
      }
      e.push([0, 1, 'dash'], [1, 2, 'dash'], [2, 3, 'dash'], [3, 0, 'dash']);
      return { p, e, l: [[0, 'edge-01'], [1, 'gateway'], [2, 'sensor'], [3, 'api']] };
    },
    detection() {
      const boxes = [[.01, .18, .07, .16], [.92, .14, .07, .2], [.925, .6, .065, .15], [.015, .62, .075, .18]], p = [], e = [];
      boxes.forEach(([x, y, w, h], b) => {
        p.push([x, y], [x + w, y], [x + w, y + h], [x, y + h]);
        const k = b * 4;
        e.push([k, k + 1, 'solid'], [k + 1, k + 2, 'solid'], [k + 2, k + 3, 'solid'], [k + 3, k, 'solid']);
      });
      for (let i = 16; i < N; i++) { const b = boxes[i % 4]; p.push([b[0] + b[2] * ((i * 37 % 10) / 10), b[1] + b[3] * ((i * 53 % 10) / 10)]); }
      return { p, e, l: [[0, 'car 0.94'], [4, 'person 0.62'], [8, 'signal: red'], [12, 'plate 0.56']] };
    },
    resolve() {
      // The PN monogram: its 8 vertices, then the remaining points along its strokes.
      const V = [[9, 39], [9, 24], [9, 9], [24, 9], [24, 24], [24, 39], [39, 39], [39, 9]];
      const E = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 1], [3, 6], [6, 7]];
      const s = Math.min(.34, .3 * W / H), ox = .93 - s / 2 * H / W, oy = .68 - s / 2;
      const map = ([x, y]) => [ox + (x / 48) * s * H / W, oy + (y / 48) * s];
      const p = V.map(map);
      let k = 0;
      while (p.length < N) { const [a, b] = E[k % E.length], f = (Math.floor(k / E.length) + 1) / 4; p.push(map([V[a][0] + (V[b][0] - V[a][0]) * f, V[a][1] + (V[b][1] - V[a][1]) * f])); k++; }
      return { p, e: E.map(([a, b]) => [a, b, 'mark']), l: [[7, 'PN']], sig: 7 };
    }
  };

  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
  }
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function colours() {
    const cs = getComputedStyle(root);
    return { line: cs.getPropertyValue('--silver').trim() || '#b8bcc4', accent: cs.getPropertyValue('--accent').trim() || '#c8f03c', text: cs.getPropertyValue('--text-3').trim() || '#8f8b81' };
  }
  function edges(shape, alpha, c) {
    shape.e.forEach(([i, j, style]) => {
      const a = pts[i], b = pts[j];
      if (!a || !b) return;
      ctx.globalAlpha = alpha * (style === 'mark' ? .4 : style === 'dash' ? .16 : .2);
      ctx.strokeStyle = style === 'mark' ? c.accent : c.line;
      ctx.setLineDash(style === 'dash' ? [4, 6] : []);
      ctx.lineWidth = style === 'mark' ? 1.6 : 1;
      ctx.beginPath(); ctx.moveTo(a[0] * W, a[1] * H);
      if (style === 'orth') ctx.lineTo(b[0] * W, a[1] * H);
      ctx.lineTo(b[0] * W, b[1] * H); ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.globalAlpha = alpha * .3; ctx.fillStyle = c.text; ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
    // Labels only where the margins can hold them.
    if (W >= 1100) shape.l.forEach(([i, text]) => { const p = pts[i]; if (p) ctx.fillText(text, p[0] * W + 8, p[1] * H - 8); });
  }
  function draw(k) {
    const c = colours();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // Edges of the old arrangement fade out in the first half, the new ones in the second.
    if (from && k < .5) edges(from, 1 - k * 2, c);
    if (to) edges(to, k < .5 ? 0 : (k - .5) * 2, c);
    pts.forEach((p, i) => {
      const sig = to && to.sig === i;
      ctx.globalAlpha = sig ? .7 : .28;
      ctx.fillStyle = sig ? c.accent : c.line;
      ctx.beginPath(); ctx.arc(p[0] * W, p[1] * H, sig ? 3.2 : 1.6, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
  function go(name, instant) {
    if (!SHAPES[name]) return;
    const next = SHAPES[name]();
    const start = pts.length ? pts.map(p => p.slice()) : next.p.map(p => p.slice());
    from = to; to = next; state = name;
    cancelAnimationFrame(raf);
    if (instant || REDUCE_MOTION || !from) { pts = next.p.map(p => p.slice()); from = null; draw(1); return; }
    t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 1200), e = ease(k);
      pts = start.map((p, i) => [p[0] + (next.p[i][0] - p[0]) * e, p[1] + (next.p[i][1] - p[1]) * e]);
      draw(k);
      raf = k < 1 ? requestAnimationFrame(step) : 0;
      if (!raf) from = null;
    };
    raf = requestAnimationFrame(step);
  }

  size();
  go(STATE_OF[root.dataset.context || 'hero'] || 'emerge', true);
  window.addEventListener('pn:context', e => { const s = STATE_OF[e.detail.context]; if (s && s !== state) go(s); });
  window.addEventListener('pn:themechange', () => draw(1));
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { size(); go(state, true); }, 150); }, { passive: true });
})();

/* ══ 27. SMALL RESPONSES ══
   The contact portal's lines light towards the channel being pointed at or
   focused; project imagery shifts a few pixels with the pointer (desktop). */
(function () {
  const mark = $('.portal-mark');
  $$('.pa-row').forEach(row => {
    const on = () => { if (mark) mark.dataset.pa = row.dataset.pa; };
    const off = () => { if (mark) delete mark.dataset.pa; };
    row.addEventListener('pointerenter', on); row.addEventListener('pointerleave', off);
    row.addEventListener('focusin', on); row.addEventListener('focusout', off);
  });
  if (!FINE_POINTER || REDUCE_MOTION) return;
  $$('.world').forEach(w => {
    const media = $$('.w-visual img, .as-phone, .cp-check, .am-flow', w);
    if (!media.length) return;
    w.addEventListener('pointermove', e => {
      const r = w.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      media.forEach(m => m.style.setProperty('--dx', (x * -8).toFixed(1) + 'px'));
      media.forEach(m => m.style.setProperty('--dy', (y * -6).toFixed(1) + 'px'));
    }, { passive: true });
    w.addEventListener('pointerleave', () => media.forEach(m => { m.style.setProperty('--dx', '0px'); m.style.setProperty('--dy', '0px'); }));
  });
})();

/* ══ CONSOLE ══ */
console.log('%cPratyush Nandi%c  Software Developer', 'font:700 14px system-ui;color:#c8f03c', 'font:12px system-ui;color:#8a90a2');
console.log('%cLike what you see? → pratyushnandi100@gmail.com', 'font:12px ui-monospace,monospace;color:#e2ff7a');
console.log('%cNot everything is in the navigation. Ctrl K, then: ls -a', 'font:12px ui-monospace,monospace;color:#8a90a2');
