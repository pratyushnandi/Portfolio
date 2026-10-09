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
  const DURATION = { full: 1500, quick: 450, calm: 150 }[mode];
  loader.classList.add('mode-' + mode);
  root.classList.add('is-loading');

  const bar = $('#plBar');
  const cmd = $('#plCmd');
  if (bar) {
    bar.style.transition = `transform ${DURATION}ms cubic-bezier(.65,0,.35,1)`;
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transform = 'scaleX(1)'; }));
  }
  const timers = [];
  if (mode === 'full') $$('#plLog li').forEach((li, i) => timers.push(setTimeout(() => li.classList.add('up'), 220 + i * 140)));
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
    btn.title = isLight() ? 'Light theme · switch to dark' : 'Dark theme · switch to light';
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
  let cur = null;
  Scroll.add(() => {
    let a = 'hero';
    if (innerHeight + scrollY >= root.scrollHeight - 2) a = secs[secs.length - 1].id;
    else for (const s of secs) { if (s.getBoundingClientRect().top <= innerHeight * .4) a = s.id; else break; }
    if (a === cur) return;
    cur = a;
    root.dataset.context = a;
    window.dispatchEvent(new CustomEvent('pn:context', { detail: { context: a } }));
  });
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

  // Looping CSS (request-path packet, bee chips) pauses while the hero is off screen.
  new IntersectionObserver(([e]) => hero.classList.toggle('paused', !e.isIntersecting)).observe(hero);

  // Request path: each layer opens the System Map with that node selected.
  $$('[data-goto-node]', hero).forEach(b => b.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('pn:select-node', { detail: { node: b.dataset.gotoNode, from: b } }));
  }));

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

/* ══ 6. (removed) The decorative hero canvas gave way to the request-path band. ══ */

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
    // The experiment rows follow the same filter; their block hides when empty.
    const minis = $$('.pj-mini');
    minis.forEach(m => { m.hidden = !(f === 'all' || m.dataset.cat === f); });
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

/* ══ SHARED KNOWLEDGE ══
   One source for the system map, the case studies, the command palette and
   the assistant. Technologies are only ones listed in the Stack section;
   project keys are the slugs of the project titles on the page. */
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const TECH = {
  react: 'React.js', nextjs: 'Next.js', typescript: 'TypeScript', javascript: 'JavaScript', html5: 'HTML5', css3: 'CSS3',
  nodejs: 'Node.js', fastify: 'Fastify', express: 'Express.js', rest: 'REST APIs', python: 'Python', laravel: 'Laravel / PHP',
  postgresql: 'PostgreSQL', mysql: 'MySQL', prisma: 'Prisma', mongodb: 'MongoDB',
  aiml: 'AI / ML', opencv: 'OpenCV', yolo: 'YOLO', visualai: 'Visual AI', rtsp: 'RTSP', mediamtx: 'MediaMTX',
  raspberrypi: 'Raspberry Pi', edge: 'Edge Computing', iot: 'IoT'
};
const SYSTEM = {
  user: { label: 'User', layer: 'client', tagline: 'Where every request begins',
    desc: 'A person in a browser. Everything downstream exists to make that moment fast and reliable.',
    tech: [], projects: [] },
  frontend: { label: 'Frontend', layer: 'client', tagline: 'Interfaces people enjoy using',
    desc: 'Component-driven interfaces in React and Next.js, typed with TypeScript and responsive from the start.',
    tech: ['react', 'nextjs', 'typescript', 'javascript', 'html5', 'css3'], projects: ['code-editor', 'portfolio-website', 'cyber-calendar'] },
  api: { label: 'API', layer: 'service', tagline: 'The contract between client and system',
    desc: 'REST APIs on Node.js with Fastify or Express, plus Python where the work is data or ML.',
    tech: ['nodejs', 'fastify', 'express', 'rest', 'python', 'laravel'], projects: ['campus-recruitment-system', 'ambulance-management-system', 'web-calculator', 'background-changer'] },
  database: { label: 'Database', layer: 'service', tagline: 'Durable, queryable state',
    desc: 'Relational data in PostgreSQL or MySQL through Prisma, and MongoDB where documents fit better.',
    tech: ['postgresql', 'mysql', 'prisma', 'mongodb'], projects: ['campus-recruitment-system', 'ambulance-management-system'] },
  aiml: { label: 'AI / ML', layer: 'intelligence', tagline: 'Learning from data',
    desc: 'Python machine learning that turns raw input into predictions the rest of the system can act on.',
    tech: ['python', 'aiml', 'opencv'], projects: ['detectify'] },
  stream: { label: 'Stream', layer: 'intelligence', tagline: 'Live video, delivered',
    desc: 'Camera feeds over RTSP, routed through MediaMTX so models and dashboards read the same stream.',
    tech: ['rtsp', 'mediamtx'], projects: [] },
  cv: { label: 'Computer Vision', layer: 'intelligence', tagline: 'Real-time visual intelligence',
    desc: 'Detection with YOLO and image processing with OpenCV, working on live feeds rather than stored footage.',
    tech: ['yolo', 'opencv', 'python', 'rtsp', 'visualai'], projects: ['detectify'] },
  edge: { label: 'Edge AI', layer: 'edge', tagline: 'Inference next to the camera',
    desc: 'Models deployed on Raspberry Pi so detection happens on site instead of in a distant data centre.',
    tech: ['raspberrypi', 'edge', 'yolo'], projects: [] },
  iot: { label: 'IoT', layer: 'edge', tagline: 'Connected hardware',
    desc: 'Devices that sense and report, wired back to the API so events land where people can see them.',
    tech: ['iot', 'raspberrypi'], projects: [] },
  world: { label: 'Real World', layer: 'physical', tagline: 'Where the output matters',
    desc: 'Results leave the screen: a violation flagged, an alert raised, a person informed.',
    tech: [], projects: ['detectify'] }
};
// Engineering decisions: why each tool earns its place in the stack. This is
// reasoning about the tools, not a claim about how a specific project was built.
const WHY = {
  frontend: [
    ['Why React + Next.js?', 'Components keep large interfaces maintainable; Next.js adds routing and server rendering when a page has to be fast on first load.'],
    ['Why TypeScript?', 'Types catch contract mismatches with the API at build time instead of in production.']
  ],
  api: [
    ['Why Fastify?', 'Low per-request overhead and built-in schema validation, so every endpoint checks what comes in and goes out.'],
    ['Why REST?', 'Plain HTTP resources that browsers, devices and scripts can all call without special clients.']
  ],
  database: [
    ['Why PostgreSQL?', 'Relational integrity, joins and transactions for data that has to stay consistent.'],
    ['Why Prisma?', 'A typed client and versioned migrations, so schema changes are reviewed like code.']
  ],
  aiml: [
    ['Why Python?', 'The machine-learning ecosystem lives there, and a model can sit behind the same API as everything else.']
  ],
  stream: [
    ['Why RTSP?', 'It is the protocol IP cameras already speak, so feeds arrive without custom firmware.'],
    ['Why MediaMTX?', 'One camera connection, re-served to many readers: a model and a dashboard share a feed instead of each opening the camera.']
  ],
  cv: [
    ['Why YOLO?', 'A single-pass detector, fast enough to keep up with live video.'],
    ['Why OpenCV?', 'Proven frame decoding and preprocessing before anything reaches the model.']
  ],
  edge: [
    ['Why process at the edge?', 'Frames are analysed next to the camera: lower latency, far less bandwidth, and raw video never has to leave the site.']
  ],
  iot: [
    ['Why report through the API?', 'Devices post events to the same API as the web app, so everything lands in one place people can see.']
  ]
};
Object.entries(WHY).forEach(([k, w]) => { SYSTEM[k].why = w; });
const EDGES = [['user', 'frontend'], ['frontend', 'api'], ['api', 'database'], ['api', 'aiml'], ['aiml', 'cv'],
  ['stream', 'cv'], ['cv', 'edge'], ['edge', 'iot'], ['iot', 'world']];
// Stack chips by technology key, so other modules can reuse their icons.
const techNode = key => $$('.stack-group .node').find(n => $('span', n).textContent.trim() === TECH[key]);
const projectEl = key => $$(PROJECTS).find(p => slug(titleOf(p).textContent) === key);

/* ══ 18. SYSTEM MAP ══
   Selecting a node lights the route a request takes to reach it (every
   ancestor) plus what it feeds next, runs data along those edges only, mutes
   the rest, and fills the inspector. Hover previews; click or tap pins. */
(function () {
  const map = $('#sysmap');
  if (!map) return;
  const canvas = $('#smCanvas');
  const insp = $('#smInspector');
  const nodes = $$('.sm-node', map);
  const edgeEls = $$('.sm-edges path, .sm-flows path', map);
  const stackGrid = $('.stack-grid');
  const defaultView = insp.innerHTML;
  let pinned = null, shown = null;

  const parents = k => EDGES.filter(([, to]) => to === k).map(([from]) => from);
  const children = k => EDGES.filter(([from]) => from === k).map(([, to]) => to);
  function ancestors(k, acc = new Set()) {
    parents(k).forEach(p => { if (!acc.has(p)) { acc.add(p); ancestors(p, acc); } });
    return acc;
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function chip(key) {
    const c = el('li', 'smi-chip');
    const src = techNode(key);
    if (src) c.appendChild($('i', src).cloneNode(true));
    c.appendChild(el('span', null, TECH[key]));
    return c;
  }
  function render(k) {
    const d = SYSTEM[k];
    const wrap = el('div', 'smi-node');
    wrap.appendChild(el('span', 'card-label mono', `layer · ${d.layer}`));
    wrap.appendChild(el('h3', null, d.label));
    wrap.appendChild(el('p', 'smi-tagline', d.tagline));
    wrap.appendChild(el('p', null, d.desc));
    // The request path follows each node's primary (first) parent back to the
    // user; any other parent is a side input, listed separately.
    const path = [k];
    for (let p = parents(k)[0]; p; p = parents(p)[0]) path.unshift(p);
    const routeEl = el('p', 'smi-route mono', path.map(a => SYSTEM[a].label).join(' → '));
    const side = parents(k).slice(1);
    if (side.length) routeEl.appendChild(el('span', 'smi-side', `+ fed by ${side.map(a => SYSTEM[a].label).join(', ')}`));
    wrap.appendChild(routeEl);
    if (d.tech.length) {
      wrap.appendChild(el('h4', 'mono', 'related'));
      const ul = el('ul', 'smi-chips');
      d.tech.forEach(t => ul.appendChild(chip(t)));
      wrap.appendChild(ul);
    }
    if (d.why) {
      wrap.appendChild(el('h4', 'mono', 'engineering decisions'));
      const dl = el('dl', 'smi-why');
      d.why.forEach(([q, a]) => { const row = el('div'); row.append(el('dt', null, q), el('dd', null, a)); dl.appendChild(row); });
      wrap.appendChild(dl);
    }
    const projects = d.projects.map(projectEl).filter(Boolean);
    if (projects.length) {
      wrap.appendChild(el('h4', 'mono', 'seen in'));
      const ul = el('ul', 'smi-projects');
      projects.forEach(p => {
        const li = el('li');
        const b = el('button', 'smi-proj', titleOf(p).textContent);
        b.type = 'button';
        b.addEventListener('click', () => {
          const key = slug(titleOf(p).textContent);
          if ($(`[data-case="${key}"]`)) Case.open(key, b);
          else p.scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth', block: 'center' });
        });
        li.appendChild(b); ul.appendChild(li);
      });
      wrap.appendChild(ul);
    }
    insp.replaceChildren(wrap);
  }

  function show(k) {
    if (k === shown) return;
    shown = k;
    if (!k) {
      map.classList.remove('has-focus');
      nodes.forEach(n => n.classList.remove('active', 'lit'));
      edgeEls.forEach(e => e.classList.remove('lit'));
      stackGrid && stackGrid.classList.remove('sm-focus');
      $$('.node.sm-hit').forEach(n => n.classList.remove('sm-hit'));
      insp.innerHTML = defaultView;
      return;
    }
    const lit = ancestors(k); lit.add(k); children(k).forEach(c => lit.add(c));
    map.classList.add('has-focus');
    nodes.forEach(n => {
      n.classList.toggle('active', n.dataset.node === k);
      n.classList.toggle('lit', lit.has(n.dataset.node));
    });
    edgeEls.forEach(e => {
      const [a, b] = e.dataset.e.split('-');
      e.classList.toggle('lit', lit.has(a) && lit.has(b) && (b === k || a === k || ancestors(k).has(b)));
    });
    // Related technologies light up in the stack grid below as well.
    $$('.node.sm-hit').forEach(n => n.classList.remove('sm-hit'));
    SYSTEM[k].tech.forEach(t => { const n = techNode(t); if (n) n.classList.add('sm-hit'); });
    stackGrid && stackGrid.classList.toggle('sm-focus', SYSTEM[k].tech.length > 0);
    render(k);
  }

  // Screen readers hear what a node is for, not only its name.
  nodes.forEach(n => {
    // A real space between the name and its subtitle ("Database PostgreSQL…").
    const strong = $('strong', n);
    if (strong) strong.after(document.createTextNode(' '));
    const s = el('span', 'sr-only', `, ${SYSTEM[n.dataset.node].tagline}`);
    n.appendChild(s);
    n.setAttribute('aria-controls', 'smInspector');
  });

  // Phones get a linear list (CSS) and the inspector opens inline under the
  // selected node, like an accordion. Wider screens keep it beside the graph.
  const narrow = window.matchMedia('(max-width: 640px)');
  const home = insp.parentNode;
  function place() {
    const n = pinned && nodes.find(x => x.dataset.node === pinned);
    if (narrow.matches && n) { n.after(insp); insp.classList.add('inline'); }
    else if (insp.parentNode !== home) { home.appendChild(insp); insp.classList.remove('inline'); }
  }
  narrow.addEventListener('change', place);

  function pin(k) {
    pinned = pinned === k ? null : k;
    nodes.forEach(n => n.setAttribute('aria-pressed', n.dataset.node === pinned ? 'true' : 'false'));
    show(pinned);
    place();
    if (pinned) inspect('layer', pinned, SYSTEM[pinned].label);
  }
  nodes.forEach(n => {
    const k = n.dataset.node;
    // Hover previews belong to the side-by-side graph; in the phone list the
    // layout shifts under the pointer as details open, so selection is click-only.
    n.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !narrow.matches) show(k); });
    n.addEventListener('focus', () => { if (!narrow.matches) show(k); });
    n.addEventListener('click', () => {
      pin(k);
      if (pinned && !narrow.matches && innerWidth < 960) {
        const r = insp.getBoundingClientRect();
        if (r.top > innerHeight - 120) insp.scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth', block: 'nearest' });
      }
    });
  });
  canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !narrow.matches) show(pinned); });
  canvas.addEventListener('focusout', e => { if (!canvas.contains(e.relatedTarget)) show(pinned); });
  // Arrow keys walk the nodes in flow order; Escape clears the selection.
  canvas.addEventListener('keydown', e => {
    const i = nodes.indexOf(document.activeElement);
    if (i < 0 || !['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    e.preventDefault();
    const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
    nodes[(i + d + nodes.length) % nodes.length].focus();
  });
  map.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !(pinned || shown)) return;
    const was = pinned;
    pinned = null;
    nodes.forEach(n => n.setAttribute('aria-pressed', 'false'));
    show(null); place();
    if (was) { const n = nodes.find(x => x.dataset.node === was); if (n) n.focus(); }
  });

  // Data only flows while the map is on screen.
  if (!REDUCE_MOTION) new IntersectionObserver(([e]) => map.classList.toggle('live', e.isIntersecting)).observe(map);

  // Deep links (hero request path, assistant, palette): select a node and go to it.
  window.addEventListener('pn:select-node', e => {
    const k = e.detail && e.detail.node;
    const n = nodes.find(x => x.dataset.node === k);
    if (!n) return;
    if (pinned !== k) pin(k);
    (narrow.matches ? n : map).scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth', block: narrow.matches ? 'start' : 'center' });
    setTimeout(() => n.focus({ preventScroll: true }), REDUCE_MOTION ? 0 : 650);
  });
})();

/* ══ 18b. TECHNOLOGY NODES ══
   Every chip is a toggle button. Hover previews (mouse only); tap, click,
   Enter or Space pins; tap again or Escape clears. The selected technology
   lights its system layers on the map, its neighbours in the grid, and a
   plain-text readout says where it fits and which projects use it. */
(function () {
  const grid = $('.stack-grid');
  const readout = $('#techReadout');
  if (!grid || !readout) return;
  const items = $$('.node', grid);
  const label = $('span', readout);
  const idle = label.textContent;
  const name = li => $('span', li).textContent.trim();
  items.forEach(li => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'node-btn'; b.setAttribute('aria-pressed', 'false');
    while (li.firstChild) b.appendChild(li.firstChild);
    li.appendChild(b);
  });
  const projectsUsing = n => $$(PROJECTS).filter(p => $$('.tags li', p).some(t => {
    const tag = t.textContent.trim().toLowerCase();
    return tag === n.toLowerCase() || n.toLowerCase().startsWith(tag);
  })).map(p => titleOf(p).textContent.trim());

  let pinned = null;
  function show(li) {
    if (!li) {
      grid.classList.remove('tech-focus');
      items.forEach(x => x.classList.remove('tech-on', 'tech-rel'));
      $$('.sm-node.tech-layer').forEach(n => n.classList.remove('tech-layer'));
      label.textContent = idle;
      return;
    }
    const n = name(li);
    const key = Object.keys(TECH).find(k => TECH[k] === n);
    const layers = key ? Object.entries(SYSTEM).filter(([, s]) => s.tech.includes(key)) : [];
    const near = new Set(layers.flatMap(([, s]) => s.tech).map(t => TECH[t]));
    grid.classList.add('tech-focus');
    items.forEach(x => {
      x.classList.toggle('tech-on', x === li);
      x.classList.toggle('tech-rel', x !== li && near.has(name(x)));
    });
    $$('.sm-node').forEach(sn => sn.classList.toggle('tech-layer', layers.some(([k]) => k === sn.dataset.node)));
    const group = $('.sg-title', li.closest('.stack-group')).textContent.trim();
    const used = projectsUsing(n);
    label.textContent = `${n} · ` +
      (layers.length ? `layer: ${layers.map(([, s]) => s.label).join(', ')}` : `group: ${group}`) +
      (used.length ? ` · used in ${used.join(', ')}` : '');
  }
  function pin(li) {
    pinned = pinned === li ? null : li;
    items.forEach(x => $('.node-btn', x).setAttribute('aria-pressed', x === pinned ? 'true' : 'false'));
    show(pinned);
    if (pinned) inspect('tech', name(pinned), name(pinned));
  }
  items.forEach(li => {
    const b = $('.node-btn', li);
    b.addEventListener('click', () => pin(li));
    li.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') show(li); });
    li.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') show(pinned); });
  });
  grid.addEventListener('keydown', e => {
    if (e.key === 'Escape' && pinned) { const b = $('.node-btn', pinned); pin(pinned); b.focus(); }
  });
})();

/* ══ 19. AI PIPELINE ══
   Scroll-driven, never looping. While the section is pinned, scroll progress
   moves a signal down the rail; each stage it reaches switches on and changes
   the illustrated camera frame (raw → patches → wireframe → detector →
   boxes → verdict → alert). Scrolling back rewinds it. Falls back to plain
   in-flow scrolling when the pinned block would not fit the viewport. */
(function () {
  const scroller = $('#pipeScroll');
  if (!scroller) return;
  const sticky = $('#pipeSticky');
  const frame = $('#cvFrame');
  const pipe = $('#pipe');
  const steps = $$('.pipe-step', pipe);
  const rail = $('.pipe-rail');
  const fill = $('.pipe-fill');
  const dot = $('.pipe-dot');
  const conf = $('#cvConf');
  const status = $('#cvStatus');
  const N = steps.length;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  let stage = -1, pinned = true;

  // Stage state is spoken, not only coloured: each head carries a hidden
  // "completed" / "current stage" suffix and aria-expanded for its detail.
  const heads = steps.map((st, i) => {
    const h = $('.ps-head', st);
    const more = $('.ps-more', st);
    $('.ps-name', h).after(document.createTextNode(' '));
    more.id = 'psMore' + i;
    h.setAttribute('aria-controls', more.id);
    const sr = document.createElement('span');
    sr.className = 'sr-only ps-state';
    h.appendChild(sr);
    return h;
  });
  function syncA11y() {
    steps.forEach((st, i) => {
      const open = pipe.classList.contains('all-on') || st.classList.contains('active') || st.classList.contains('open');
      heads[i].setAttribute('aria-expanded', open ? 'true' : 'false');
      $('.ps-state', heads[i]).textContent = st.classList.contains('active') ? ', current stage' : st.classList.contains('done') ? ', completed' : '';
    });
  }
  function setStage(s) {
    if (s === stage) return;
    stage = s;
    steps.forEach((st, i) => {
      st.classList.toggle('done', i < s - 1);
      st.classList.toggle('active', i === s - 1);
    });
    syncA11y();
    for (let i = 1; i <= N; i++) frame.classList.toggle('s' + i, s >= i);
    const cur = steps[s - 1];
    status.textContent = cur ? cur.dataset.status : 'idle';
    conf.textContent = (cur && cur.dataset.conf) || '—';
    scroller.classList.toggle('online', s === N);
    // Reduced motion starts on the finished state, so only a scrolled-through run counts.
    if (s === N && !REDUCE_MOTION) inspect('pipeline', 'online', 'Vision pipeline, run end to end');
  }

  function measure() {
    sticky.style.position = '';
    const top = parseFloat(getComputedStyle(sticky).top) || 0;
    pinned = !REDUCE_MOTION && sticky.offsetHeight + top + 16 <= innerHeight;
    scroller.classList.toggle('is-static', !pinned);
    // Scroll room for the story: one and a half screens while pinned.
    scroller.style.height = pinned ? Math.round(sticky.offsetHeight + innerHeight * 1.5) + 'px' : '';
  }

  function update() {
    const r = scroller.getBoundingClientRect();
    if (r.bottom < -80 || r.top > innerHeight + 80) return;
    const top = parseFloat(getComputedStyle(sticky).top) || 0;
    const p = pinned
      ? clamp((top - r.top) / Math.max(1, r.height - sticky.offsetHeight), 0, 1)
      : clamp((innerHeight * .75 - r.top) / Math.max(1, r.height), 0, 1);
    const t = clamp(p * 1.12 - .04, 0, 1) * (N - 1);   // 0 … N-1, a little dwell at both ends
    const entered = pinned ? r.top <= top + 1 : r.top < innerHeight * .75;
    setStage(entered ? Math.min(N, Math.floor(t + 1e-6) + 1) : 0);
    scroller.classList.toggle('running', entered);
    // Signal position: interpolate between the centres of the stage markers.
    const rr = rail.getBoundingClientRect();
    const c = steps.map(st => { const n = $('.ps-node', st).getBoundingClientRect(); return n.top + n.height / 2 - rr.top; });
    const i = Math.min(Math.floor(t), N - 2), f = t - i;
    const y = entered ? c[i] + (c[i + 1] - c[i]) * f : 0;
    dot.style.setProperty('--y', y.toFixed(1) + 'px');
    fill.style.setProperty('--f', (rr.height ? y / rr.height : 0).toFixed(4));
  }

  // Tap / click / Enter on a stage. Pinned: travel to that point in the story.
  // In-flow (reduced motion, or too short to pin): open or close its detail.
  heads.forEach((h, i) => h.addEventListener('click', () => {
    if (pinned && !REDUCE_MOTION) {
      const top = parseFloat(getComputedStyle(sticky).top) || 0;
      const p = ((Math.min(i + .35, N - 1) / (N - 1)) + .04) / 1.12;
      const y = scroller.getBoundingClientRect().top + scrollY - top + p * (scroller.offsetHeight - sticky.offsetHeight);
      window.scrollTo({ top: y, behavior: 'smooth' });
    } else {
      steps[i].classList.toggle('open');
      syncA11y();
    }
  }));

  if (REDUCE_MOTION) {
    // The finished state, every stage open and readable (each still toggles).
    scroller.classList.add('is-static', 'running');
    setStage(N);
    steps.forEach(st => st.classList.add('open'));
    syncA11y();
    fill.style.setProperty('--f', '1');
    return;
  }
  measure();
  Scroll.add(update);
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { measure(); update(); }, 150); }, { passive: true });
  if (document.fonts) document.fonts.ready.then(() => { measure(); update(); });
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
    skills: () => `${count('.stack-group .node')} technologies · ${count('.stack-group')} groups · ${count('.sm-node')} system nodes`,
    pipeline: () => `${count('.pipe-step')} stages · scroll-driven · illustrative data`,
    projects: () => `${count(PROJECTS)} projects · ${count('.pj [data-case]')} case studies · ${$$('#projGrid .pj-link, .pj-mini .pj-link').filter(a => /live|play/i.test(a.textContent)).length} live demos`,
    education: () => `${count('.edu-item')} qualifications · ${count('.cert')} certifications`,
    process: () => `${count('.proc-step')} stages · each evidenced by this site`,
    focus: () => `${count('.focus-grid li')} focus areas`,
    contact: () => 'POST api.web3forms.com · mailto: fallback'
  };
  const TAGS = [
    ['.hero-title', 'h1 · Geist 680 · −0.055em'],
    ['.b-intro', 'about/intro.md'], ['.b-photo', 'about/photo.jpg'], ['.b-now', 'about/now'],
    ['.b-stats', 'about/stats'], ['.b-json', 'about/profile.json'],
    ['.hero-system', 'request path · select a layer'],
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
      if (p.dataset.flow) $('.pj-body', p).insertBefore(collapsible('eng-flow', p.dataset.flow), $('.pj-links', p));
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
  function tally() { sum.textContent = `${sysRows.filter(r => r.classList.contains('up')).length}/${sysRows.length} layers ready`; }
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
    stack: $$('.stack-group').map(g => ({
      group: txt($('.sg-title', g)).replace(/^\w/, c => c.toUpperCase()), items: $$('.node', g).map(n => ({ name: txt($('span', n)), icon: $('i', n).className }))
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
    'Laravel / PHP': ['laravel', 'php'], 'REST APIs': ['rest', 'restful'], 'TypeScript': ['typescript', 'ts'],
    'JavaScript': ['javascript', 'js'], 'HTML5': ['html', 'html5'], 'CSS3': ['css', 'css3'], 'C++': ['c++', 'cpp'],
    'AI / ML': ['machine learning'], 'Raspberry Pi': ['raspberry', 'rpi'], 'Edge Computing': ['edge computing'],
    'Visual AI': ['visual ai'], 'Computer Vision': ['computer vision']
  };
  const PROJECT_ALIAS = {
    detectify: ['detectify', 'traffic'], 'campus-recruitment-system': ['campus', 'recruitment'],
    'code-editor': ['code editor', 'editor'], 'web-calculator': ['calculator'], 'rock-paper-scissors': ['rock paper', 'rps'],
    'cyber-calendar': ['calendar'], 'background-changer': ['background changer', 'background'], 'portfolio-website': ['portfolio website'],
    'ambulance-management-system': ['ambulance']
  };
  const INTENTS = {
    ai: ['ai', 'ml', 'machine', 'learning', 'vision', 'model', 'models', 'detection', 'intelligent', 'inference', 'yolo', 'opencv'],
    systems: ['system', 'systems', 'architecture', 'kind', 'end-to-end', 'pipeline', 'iot', 'edge', 'build'],
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
      actions: [{ label: 'Explore the system map', run: go('#sysmap') }, { label: 'See the tech stack', run: go('#skills') }]
    }),
    ai: () => ({
      title: 'AI / ML work',
      lead: 'Computer vision is the focus: models that watch live video and turn what they see into decisions.',
      rows: ['aiml', 'cv', 'edge'].map(k => [SYSTEM[k].label, SYSTEM[k].desc]),
      chips: ['python', 'aiml', 'opencv', 'yolo', 'visualai', 'rtsp', 'mediamtx', 'raspberrypi', 'edge', 'iot']
        .map(k => allTech.find(t => t.name === TECH[k])).filter(Boolean),
      items: KB.projects.filter(p => p.el.dataset.cat === 'ai').map(p => `${p.title}: ${p.desc}`),
      actions: [{ label: 'Watch the AI pipeline', run: go('#pipeline') }, { label: 'Open the Detectify case study', run: () => Case.open('detectify') }]
    }),
    systems: () => ({
      title: 'The systems I build',
      lead: 'End to end: interfaces, APIs and databases, plus vision pipelines that run on edge devices.',
      rows: Object.values(SYSTEM).filter(s => s.tech.length).map(s => [s.label, s.tagline]),
      items: ['User → Frontend → API → Database', 'API → AI / ML → Computer Vision → Edge AI → IoT → Real World'],
      actions: [{ label: 'Explore the system map', run: go('#sysmap') }]
    }),
    projects: () => ({
      title: 'Projects',
      lead: `${KB.projects.length} projects. Two have full case studies.`,
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
      lead: `${KB.status}. Open to freelance, full-time roles and collaborations.`,
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
      const key = Object.keys(TECH).find(k => TECH[k] === t.name);
      const layers = key ? Object.values(SYSTEM).filter(s => s.tech.includes(key)).map(s => s.label) : [];
      const names = (ALIAS[t.name] || []).concat(t.name.toLowerCase());
      const used = KB.projects.filter(p => p.tags.some(tag => names.some(n => tag.toLowerCase().includes(n.split(' ')[0]))));
      const stem = t.name.toLowerCase().split(/[ .]/)[0];
      const why = Object.values(SYSTEM).flatMap(s => s.why || []).filter(([wq]) => wq.toLowerCase().includes(stem));
      return {
        title: t.name,
        lead: `Yes. ${t.name} is in my stack, under ${t.group}.` + (list.length > 1 ? ` (Also matched: ${list.slice(1).map(x => x.name).join(', ')}.)` : ''),
        rows: [].concat(layers.length ? [['System layer', layers.join(', ')]] : [],
          used.length ? [['Used in', used.map(p => p.title).join(', ')]] : [['Used in', 'No project on this page lists it yet.']],
          why.map(([wq, wa]) => [wq, wa])),
        actions: [{ label: 'See the tech stack', run: go('#skills') }]
      };
    },
    layers: (keys, title, lead) => ({
      title, lead,
      rows: keys.flatMap(k => [[SYSTEM[k].label, SYSTEM[k].tech.map(t => TECH[t]).join(', ')]].concat(SYSTEM[k].why || [])),
      actions: [{ label: 'Open it on the system map', run: () => window.dispatchEvent(new CustomEvent('pn:select-node', { detail: { node: keys[0] } })) }]
    }),
    backend: () => A.layers(['api', 'database'], 'Backend & data', 'APIs on Node.js and Fastify over relational data, with the reasoning behind each choice.'),
    frontend: () => A.layers(['frontend'], 'Frontend', 'Component-driven interfaces in React and Next.js.'),
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
    hero: 'What kind of systems do you build?', about: 'What technologies do you use?',
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
  const NAV = [
    ['About', '#about', 'fa-user', 'who bio'], ['Experience', '#experience', 'fa-code-branch', 'work roles journey timeline'],
    ['Tech stack', '#skills', 'fa-layer-group', 'skills technologies'], ['System architecture', '#sysmap', 'fa-diagram-project', 'map nodes system'],
    ['AI pipeline', '#pipeline', 'fa-eye', 'ai lab ml computer vision yolo'], ['Projects', '#projects', 'fa-folder-open', 'work portfolio'],
    ['How I build', '#process', 'fa-gears', 'process engineering deploy testing systems'],
    ['Education', '#education', 'fa-graduation-cap', 'degree certifications'],
    ['Current focus', '#focus', 'fa-crosshairs', 'now focus areas'], ['Contact', '#contact', 'fa-paper-plane', 'email hire message'],
    ['Your exploration', '#sessEnd', 'fa-route', 'session complete trace route restart clear']
  ];
  // "Suggested here": the commands that fit the section being read.
  const HERE = {
    hero: ['System architecture', 'Turn on Engineering Mode'], about: ['Download resume', 'Experience'],
    experience: ['Projects', 'Download resume'], skills: ['System architecture', 'AI pipeline'],
    pipeline: ['Detectify case study', 'AI / ML projects'], projects: ['Detectify case study', 'Campus Recruitment System case study'],
    process: ['Open GitHub', 'System architecture'], education: ['Download resume', 'Current focus'],
    focus: ['Contact', 'Download resume'], contact: ['Copy email address', 'Start a conversation', 'Send an email']
  };
  function commands() {
    const light = root.getAttribute('data-theme') === 'light';
    const eng = Eng.isOn();
    return [].concat(
      NAV.map(([label, sel, icon, kw]) => ({ group: 'Navigate', label, icon, kw, run: scrollTo(sel) })),
      [{ group: 'Navigate', label: 'AI / ML projects', icon: 'fa-brain', kw: 'filter detectify', run: () => { const b = $('.pf[data-f="ai"]'); if (b) b.click(); scrollTo('#projects')(); } }],
      [
        { group: 'Actions', label: eng ? 'Turn off Engineering Mode' : 'Turn on Engineering Mode', icon: 'fa-microchip', kw: 'engineering mode eng system blueprint', run: () => Eng.toggle() },
        { group: 'Actions', label: light ? 'Switch to dark theme' : 'Switch to light theme', icon: light ? 'fa-moon' : 'fa-sun', kw: 'toggle theme dark light mode', run: () => $('#themeToggle').click() },
        { group: 'Actions', label: 'Copy email address', icon: 'fa-copy', kw: 'email mail clipboard', run: () => $('#copyEmail').click() },
        { group: 'Actions', label: 'Download resume', icon: 'fa-file-arrow-down', kw: 'cv pdf', run: () => $('.n-resume').click() },
        { group: 'Actions', label: 'Send an email', icon: 'fa-envelope', kw: 'mail contact', run: () => { location.href = 'mailto:pratyushnandi100@gmail.com'; } },
        { group: 'Actions', label: 'Start a conversation', icon: 'fa-paper-plane', kw: 'contact form message hire', run: () => window.dispatchEvent(new Event('pn:open-form')) },
        { group: 'Actions', label: 'Open GitHub', icon: 'fa-github', brand: true, kw: 'code repositories', run: () => window.open('https://github.com/pratyushnandi', '_blank', 'noopener') },
        { group: 'Actions', label: 'Open LinkedIn', icon: 'fa-linkedin-in', brand: true, kw: 'profile', run: () => window.open('https://www.linkedin.com/in/pratyushnandi/', '_blank', 'noopener') }
      ],
      Case.keys.map(k => ({ group: 'Case studies', label: `${$('#case-' + k).content.querySelector('h2').textContent} case study`, icon: 'fa-book-open', kw: 'case study project', run: () => Case.open(k) }))
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
      if (label.startsWith(q)) return 0;
      if (words.every(w => label.split(/[\s/]+/).some(t => t.startsWith(w)))) return 1;
      if (words.every(w => label.includes(w))) return 2;
      return 3;
    };
    const hits = commands()
      .filter(c => words.every(w => (c.label + ' ' + c.kw + ' ' + c.group).toLowerCase().includes(w)))
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
    // Let the dialog release the page before scrolling or opening another dialog.
    setTimeout(c.run, 30);
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

/* ══ 24. CONTEXTUAL CURSOR ══
   The native pointer stays; a small label joins it only over things worth
   naming. Desktop pointers only, never under reduced motion, and the rAF loop
   stops as soon as the label has caught up. */
(function () {
  const cur = $('.ctx-cursor');
  if (!cur || !FINE_POINTER || REDUCE_MOTION) return;
  const label = $('.cc-label', cur);
  const CONTEXT = [
    ['a[href^="mailto:"], a[href="#contact"], .soc-btn, .mail-link', "Let's talk"],
    ['.node, .sm-node, .smi-chip', 'Tech'],
    ['#projGrid .pj, .pj-mini', 'Explore']
  ];
  let x = 0, y = 0, cx = 0, cy = 0, raf = 0, shown = false;
  function loop() {
    cx += (x - cx) * .22; cy += (y - cy) * .22;
    cur.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > .3 ? requestAnimationFrame(loop) : 0;
  }
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX + 16; y = e.clientY + 18;
    if (!shown) { cx = x; cy = y; }
    let text = '';
    if (!document.querySelector('dialog[open]')) {
      for (const [sel, t] of CONTEXT) { if (e.target.closest && e.target.closest(sel)) { text = t; break; } }
    }
    if (text) { if (label.textContent !== text) label.textContent = text; }
    shown = !!text;
    cur.classList.toggle('on', shown);
    if (shown && !raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { shown = false; cur.classList.remove('on'); });
})();

/* ══ 25. SESSION ══
   The OS layer. One record of the visitor's route through this page, drawn
   three ways: the rail (where you are), system events (a rare note when
   something is first discovered) and the trace in "Session complete". It lives
   in sessionStorage for this tab only and holds section ids and things opened
   on this page: nothing about the visitor, nothing sent anywhere. */
(function () {
  const MODULES = [
    ['about', 'About'], ['experience', 'Experience'], ['skills', 'Technology'], ['pipeline', 'AI Lab'],
    ['projects', 'Projects'], ['process', 'Process'], ['education', 'Education'], ['focus', 'Focus'], ['contact', 'Contact']
  ].filter(([id]) => document.getElementById(id)).map(([id, label]) => ({ id, label }));
  const labelOf = id => (MODULES.find(m => m.id === id) || {}).label;
  // Which section a deeper look belongs to on the trace.
  const HOME = { layer: 'skills', tech: 'skills', pipeline: 'pipeline', case: 'projects' };
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
  function onContext(id) {
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
    MODULES.map(m => `<a href="#${m.id}" tabindex="-1" data-m="${m.id}"><span class="srail-lbl mono">${m.label}</span><i></i></a>`).join('');
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

/* ══ CONSOLE ══ */
console.log('%cPratyush Nandi%c  Software Developer', 'font:700 14px system-ui;color:#8b7bff', 'font:12px system-ui;color:#8a90a2');
console.log('%cLike what you see? → pratyushnandi100@gmail.com', 'font:12px ui-monospace,monospace;color:#22d3ee');
console.log('%cNot everything is in the navigation. Ctrl K, then: ls -a', 'font:12px ui-monospace,monospace;color:#8a90a2');
