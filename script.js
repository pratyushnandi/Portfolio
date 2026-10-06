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

/* ══ 1. PRELOADER ══
   Short by design: ~1.3s on a first visit, ~0.45s on a reload in the same
   tab, near-instant with reduced motion. Any click or key skips it. Everything
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
  try { seen = sessionStorage.getItem('pn-seen') === '1'; } catch (e) {}
  try { sessionStorage.setItem('pn-seen', '1'); } catch (e) {}
  const mode = REDUCE_MOTION ? 'calm' : (seen ? 'quick' : 'full');
  const DURATION = { full: 1300, quick: 450, calm: 150 }[mode];
  loader.classList.add('mode-' + mode);
  root.classList.add('is-loading');

  const bar = $('#plBar');
  const cmd = $('#plCmd');
  if (bar) {
    bar.style.transition = `transform ${DURATION}ms cubic-bezier(.65,0,.35,1)`;
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transform = 'scaleX(1)'; }));
  }
  const cmdT = setTimeout(() => { if (cmd) cmd.textContent = 'ready ✓'; }, DURATION * .75);

  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(cmdT);
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

  // Lift at the later of (animation done, web fonts ready), never past 2.4s,
  // so the hero reveal never runs with a font swap under it.
  let timeUp = false, fontsUp = !document.fonts;
  const maybe = () => { if (timeUp && fontsUp) finish(); };
  setTimeout(() => { timeUp = true; maybe(); }, DURATION);
  if (document.fonts) document.fonts.ready.then(() => { fontsUp = true; maybe(); }, () => { fontsUp = true; maybe(); });
  setTimeout(finish, 2400);
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
  }
  function apply(theme) {
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f6f3' : '#07080c');
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
  const sections = navAs.map(a => $(a.getAttribute('href'))).filter(Boolean);
  let current = null;

  function moveIndicator(a) {
    if (!ind || !a) return;
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
  // Active section = the last one whose top has crossed 35% of the viewport.
  // At the very bottom force the last one: a short final section may never cross.
  function spy() {
    if (!sections.length) return;
    let active = sections[0];
    if (innerHeight + scrollY >= root.scrollHeight - 2) active = sections[sections.length - 1];
    else for (const s of sections) { if (s.getBoundingClientRect().top <= innerHeight * .35) active = s; else break; }
    setActive(navAs.find(a => a.getAttribute('href') === '#' + active.id));
  }
  function onScroll() {
    nav.classList.toggle('scrolled', scrollY > 40);
    const max = root.scrollHeight - innerHeight;
    if (prog) prog.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : '0');
    spy();
  }

  function setMenu(open) {
    links.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    root.classList.toggle('modal-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  }
  burger.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  navAs.forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && links.classList.contains('open')) { setMenu(false); burger.focus(); }
  });
  window.addEventListener('resize', () => {
    if (innerWidth > 960 && links.classList.contains('open')) setMenu(false);
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
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
  window.addEventListener('resize', () => requestAnimationFrame(run), { passive: true });
  requestAnimationFrame(run);
  return { add: f => { subs.push(f); f(); } };
})();

/* ══ 5. HERO ══ */
(function () {
  const hero = $('#hero');
  if (!hero) return;

  // Stagger order for the entrance.
  $$('[data-hero]', hero).forEach((el, i) => el.style.setProperty('--hi', i));
  $$('.hv-layer', hero).forEach((el, i) => el.style.setProperty('--vi', i));

  // Code lines reveal one by one; the cursor rests on `available: true`.
  const code = $('#ideCode code');
  if (code) {
    code.innerHTML = code.innerHTML.split('\n')
      .map((l, i) => `<span class="ln${i === 6 ? ' cur' : ''}" style="--l:${i}">${l || ' '}</span>`).join('');
  }

  // Loops only run while the hero is on screen.
  let heroVisible = true;
  new IntersectionObserver(([e]) => {
    heroVisible = e.isIntersecting;
    hero.classList.toggle('paused', !heroVisible);
    if (heroVisible) Net.start(); else Net.stop();
  }).observe(hero);

  /* Typed role */
  const typed = $('#heroTyped');
  if (typed && !REDUCE_MOTION) {
    const roles = [
      'Software Developer', 'Full-Stack Developer', 'Python Developer', 'React Developer',
      'Edge AI Engineer', 'passionate Programmer', 'Web Developer', 'AI/ML Enthusiast'
    ];
    let ri = 0, ci = roles[0].length, del = false;
    const tick = () => {
      if (!heroVisible || document.hidden) return setTimeout(tick, 600);
      const r = roles[ri];
      ci += del ? -1 : 1;
      typed.textContent = r.slice(0, ci);
      let wait = del ? 38 : 85;
      if (!del && ci === r.length) { wait = 2200; del = true; }
      else if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; wait = 320; }
      setTimeout(tick, wait);
    };
    const start = () => setTimeout(() => { del = true; tick(); }, 2600);
    if (window.__pnIntroDone) start(); else window.addEventListener('pn:introdone', start, { once: true });
  }

  /* Pointer parallax + spotlight (desktop only) */
  if (FINE_POINTER && !REDUCE_MOTION) {
    const layers = $$('.hv-layer', hero);
    let raf = 0, lx = 0, ly = 0;
    hero.addEventListener('pointermove', e => {
      lx = e.clientX; ly = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = hero.getBoundingClientRect();
        const nx = (lx - r.left) / r.width - .5, ny = (ly - r.top) / r.height - .5;
        hero.style.setProperty('--hx', ((nx + .5) * 100).toFixed(1) + '%');
        hero.style.setProperty('--hy', ((ny + .5) * 100).toFixed(1) + '%');
        layers.forEach(l => {
          const d = +l.dataset.depth || 10;
          l.style.setProperty('--px', (-nx * d).toFixed(1) + 'px');
          l.style.setProperty('--py', (-ny * d).toFixed(1) + 'px');
        });
      });
    }, { passive: true });
    hero.addEventListener('pointerleave', () => layers.forEach(l => { l.style.setProperty('--px', '0px'); l.style.setProperty('--py', '0px'); }));
  }
})();

/* ══ 6. HERO NETWORK CANVAS ══
   Drifting nodes joined by faint edges, leaning toward the pointer. Capped
   node count, DPR ≤ 1.5, stops whenever the hero or tab is hidden. */
const Net = (function () {
  const cv = $('#heroCanvas');
  const hero = $('#hero');
  const noop = { start() {}, stop() {} };
  if (!cv || !hero) return noop;
  const ctx = cv.getContext('2d');
  if (!ctx) return noop;

  let w = 0, h = 0, nodes = [], rgb = '150,140,255', raf = 0, running = false;
  const mouse = { x: -9999, y: -9999 };
  const LINK = 130, LINK2 = LINK * LINK, MLINK = 180;

  function readColor() {
    const v = getComputedStyle(root).getPropertyValue('--net-rgb').trim();
    if (v) rgb = v.replace(/\s+/g, '');
  }
  function size() {
    const r = hero.getBoundingClientRect();
    w = r.width; h = r.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(70, (w * h) / 19000) * (FINE_POINTER ? 1 : .55));
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
      r: Math.random() * 1.3 + .7
    }));
  }
  function draw(move) {
    ctx.clearRect(0, 0, w, h);
    for (const p of nodes) {
      if (move) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
      }
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 < LINK2) {
          ctx.strokeStyle = `rgba(${rgb},${((1 - Math.sqrt(d2) / LINK) * .22).toFixed(3)})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const mx = a.x - mouse.x, my = a.y - mouse.y, md = Math.sqrt(mx * mx + my * my);
      if (md < MLINK) {
        ctx.strokeStyle = `rgba(${rgb},${((1 - md / MLINK) * .5).toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
    ctx.fillStyle = `rgba(${rgb},.65)`;
    for (const p of nodes) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
  }
  function loop() {
    if (!running) return;
    draw(true);
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (REDUCE_MOTION || running || document.hidden) return;
    running = true; raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  readColor(); size();
  if (REDUCE_MOTION) draw(false);
  window.addEventListener('pn:themechange', () => { readColor(); if (!running) draw(false); });
  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { size(); if (!running) draw(false); }, 150);
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (hero.getBoundingClientRect().bottom > 0) start(); });
  if (FINE_POINTER) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  }
  return { start, stop };
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

/* ══ 10. ARCHITECTURE DIAGRAM · data flow animates only while visible ══ */
(function () {
  const arch = $('.arch');
  if (!arch || REDUCE_MOTION) return;
  new IntersectionObserver(([e]) => arch.classList.toggle('live', e.isIntersecting)).observe(arch);
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
    cards.forEach(card => {
      const show = f === 'all' || card.dataset.cat === f;
      card.classList.toggle('is-hidden', !show);
      card.classList.remove('filter-in');
      if (show && !REDUCE_MOTION) {
        card.classList.add('is-in');
        card.style.setProperty('--fi', shown++);
        void card.offsetWidth;
        card.classList.add('filter-in');
      }
    });
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
      btn.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * .22).toFixed(1) + 'px');
      btn.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + 'px');
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
    btn.classList.toggle('copied', ok);
    clearTimeout(t);
    t = setTimeout(() => { label.textContent = 'Copy email'; btn.classList.remove('copied'); }, 2200);
  });
})();

/* ══ 14. CONTACT FORM ══
   `novalidate` keeps native bubbles off, so constraint validation is checked
   here (required, type=email, type=url all honoured). Web3Forms first, with a
   prefilled mailto: link as the fallback if the request fails. */
(function () {
  const form = $('#contactForm');
  if (!form) return;
  const btn = $('#cfBtn');
  const txt = $('#cfTxt'), load = $('#cfLoad');
  const status = $('#cfStatus');
  const FIELD_LABELS = {
    user_name: 'name', user_email: 'email', contact_reason: 'reason',
    subject: 'subject', social_link: 'profile link', message: 'message'
  };
  const fields = $$('input, textarea, select', form);
  const firstInvalid = () => fields.find(el => !el.checkValidity()) || null;
  function showInvalid(el) {
    const label = FIELD_LABELS[el.name] || el.name || 'field';
    status.textContent = !el.value.trim() ? `✗ ${label} is required.` : `✗ ${label} is not valid.`;
    status.className = 'cf-status err';
    el.classList.add('cf-invalid');
    el.setAttribute('aria-invalid', 'true');
    el.focus();
  }
  fields.forEach(el => {
    const clear = () => { el.classList.remove('cf-invalid'); el.removeAttribute('aria-invalid'); };
    el.addEventListener('input', clear);
    el.addEventListener('change', clear);
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const bad = firstInvalid();
    if (bad) { showInvalid(bad); return; }
    txt.hidden = true; load.hidden = false; btn.disabled = true;
    status.textContent = ''; status.className = 'cf-status';

    const val = n => (form.querySelector(`[name="${n}"]`) || {}).value || '';
    const name = val('user_name');
    const email = val('user_email');
    const reason = val('contact_reason') || 'General Inquiry';
    const company = val('company') || 'N/A';
    const subject = val('subject') || 'Portfolio Contact';
    const socialLink = val('social_link') || 'N/A';
    const message = val('message');

    const mailtoUrl = 'mailto:pratyushnandi100@gmail.com?subject=' +
      encodeURIComponent(`[${reason}] ${subject}`) + '&body=' + encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nReason: ${reason}\nCompany: ${company}\nLink: ${socialLink}\n\nMessage:\n${message}`);

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: 'dd789f34-7888-4300-a4ac-7842d5524490',
          name, email, reason, company,
          social_link: socialLink,
          subject: `[${reason}] ${subject} from ${name}`,
          message
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Submission failed');
      status.textContent = "✓ Message sent successfully! I'll get back to you soon.";
      status.className = 'cf-status ok';
      form.reset();
    } catch (err) {
      console.error('Contact Form Error:', err);
      status.textContent = '✗ Send failed. ';
      const a = document.createElement('a');
      a.href = mailtoUrl; a.textContent = 'Send it with your email app instead';
      status.appendChild(a);
      status.className = 'cf-status err';
    } finally {
      txt.hidden = false; load.hidden = true; btn.disabled = false;
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

/* ══ CONSOLE ══ */
console.log('%cPratyush Nandi%c  Software Developer', 'font:700 14px system-ui;color:#8b7bff', 'font:12px system-ui;color:#8a90a2');
console.log('%cLike what you see? → pratyushnandi100@gmail.com', 'font:12px ui-monospace,monospace;color:#22d3ee');
