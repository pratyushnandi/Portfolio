'use strict';

const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ══ 1. MATRIX RAIN ══ */
(function(){
  const c=document.getElementById('bgCanvas');
  if(!c||REDUCE_MOTION)return;
  const ctx=c.getContext('2d',{alpha:true});
  const ch='01{}[]();=><>ABCDEFabcdef#@$%&*~';
  const fs=12; let cols,drops;
  function resize(){
    const dpr=Math.min(devicePixelRatio||1,1.5);
    c.width=innerWidth*dpr;c.height=innerHeight*dpr;
    c.style.width=innerWidth+'px';c.style.height=innerHeight+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    cols=Math.floor(innerWidth/fs);drops=Array.from({length:cols},()=>Math.random()*-100);
  }
  resize(); window.addEventListener('resize',resize,{passive:true});

  /* The per-frame wash that fades old glyphs has to be the CURRENT theme's
     background. Hardcoding the dark value meant light mode accumulated a grey
     smudge instead of fading to white. Cached because getComputedStyle in the
     draw loop is a forced style read. */
  let trail='rgba(6,8,18,0.055)';
  function readTrail(){
    const v=getComputedStyle(document.documentElement)
      .getPropertyValue('--canvas-trail').trim();
    if(v) trail=v;
  }
  readTrail();
  window.addEventListener('pn:themechange',readTrail);

  let last=0,running=true;
  document.addEventListener('visibilitychange',()=>{running=!document.hidden;});
  function frame(t){
    requestAnimationFrame(frame);
    if(!running||t-last<55)return;
    last=t;
    ctx.fillStyle=trail;ctx.fillRect(0,0,innerWidth,innerHeight);
    ctx.font=`${fs}px "Fira Code",monospace`;
    for(let i=0;i<drops.length;i++){
      const ch2=ch[Math.floor(Math.random()*ch.length)];
      const a=Math.random()>.88?.9:.32;
      ctx.fillStyle=Math.random()>.75?`rgba(6,182,212,${a})`:`rgba(124,58,237,${a})`;
      ctx.fillText(ch2,i*fs,drops[i]*fs);
      if(drops[i]*fs>innerHeight&&Math.random()>.975)drops[i]=0;
      drops[i]+=0.35;
    }
  }
  requestAnimationFrame(frame);
})();

/* ══ 2. PRELOADER ══ */
(function(){
  const loader=document.getElementById('preloader');
  const cmdEl=document.getElementById('preCmd');
  const o1=document.getElementById('pout1'),o2=document.getElementById('pout2'),o3=document.getElementById('pout3');
  const i1=document.getElementById('pico1'),i2=document.getElementById('pico2'),i3=document.getElementById('pico3');
  const bar=document.getElementById('preBar'), num=document.getElementById('preNum');
  const particleWrap=document.getElementById('preParticles'), flash=document.getElementById('preFlash');
  const hexSvg=document.querySelector('.pre-hex-svg'), terminal=document.querySelector('.pre-terminal');
  const skipBtn=document.getElementById('preSkip');
  const root=document.documentElement;

  /* Everything that waits on the intro (hero entrance) listens for this rather
     than guessing a fixed delay. The flag covers listeners attached late. */
  function introDone(){
    if(window.__pnIntroDone)return;
    window.__pnIntroDone=true;
    root.classList.remove('is-loading');
    window.dispatchEvent(new Event('pn:introdone'));
  }
  if(!loader){ introDone(); return; }

  /* The intro always plays, but it adapts instead of being skipped outright:
     - full : first visit in this tab, the whole boot sequence (~3.4s)
     - quick: a reload in the same tab, same sequence at ~40% length
     - calm : prefers-reduced-motion, quick timing with no motion effects
     Any key, click or tap ends it early. */
  let seen=false;
  try{ seen=sessionStorage.getItem('pn-seen')==='1'; }catch(e){}
  try{ sessionStorage.setItem('pn-seen','1'); }catch(e){}
  const mode=REDUCE_MOTION?'calm':(seen?'quick':'full');
  const S=mode==='full'?1:.45;
  loader.classList.add('mode-'+mode);
  root.classList.add('is-loading');

  if(particleWrap&&mode==='full'){
    for(let i=0;i<22;i++){
      const p=document.createElement('span');
      p.className='pre-particle';
      const size=Math.random()*3+1.5;
      p.style.width=p.style.height=size+'px';
      p.style.left=Math.random()*100+'%';
      p.style.animationDuration=(Math.random()*4+4)+'s';
      p.style.animationDelay=(Math.random()*4)+'s';
      p.style.opacity=(Math.random()*.5+.3).toFixed(2);
      particleWrap.appendChild(p);
    }
  }
  /* Every scheduled step goes through here so finish() can cancel the lot —
     otherwise a skipped intro kept typing and revealing lines behind the fade. */
  const timers=[];
  const later=(fn,ms)=>timers.push(setTimeout(fn,ms*S));

  const cmd=mode==='full'?'node server --env=production --port=3000':'node server --resume';
  let ci=0;
  let ti=0;
  later(()=>{
    ti=setInterval(()=>{if(ci<cmd.length){cmdEl.textContent+=cmd[ci++];}else clearInterval(ti);},mode==='full'?55:28);
  },700);

  // Name decodes out of random glyphs, letter by letter, under the logo.
  const title=document.getElementById('preTitle');
  if(title){
    const final=title.dataset.text||'', glyphs='!<>-_\\/[]{}=+*^?#01';
    title.textContent='';
    const spans=[...final].map(ch=>{
      const s=document.createElement('span');
      s.textContent=ch===' '?' ':glyphs[Math.random()*glyphs.length|0];
      title.appendChild(s); return {s,ch};
    });
    const step=mode==='full'?110:45;
    let frame=0;
    const iv=setInterval(()=>{
      let settled=0;
      spans.forEach(({s,ch},i)=>{
        if(ch===' '){settled++;return;}
        if(frame>=i*2+6){ if(!s.classList.contains('in')){s.textContent=ch;s.classList.add('in');} settled++; }
        else s.textContent=glyphs[Math.random()*glyphs.length|0];
      });
      frame++;
      if(settled===spans.length){clearInterval(iv);title.classList.add('done');}
    },step/2);
    title.settle=()=>{clearInterval(iv);spans.forEach(({s,ch})=>{s.textContent=ch===' '?' ':ch;s.classList.add('in');});title.classList.add('done');};
    if(mode==='calm') title.settle();
  }

  if(hexSvg&&mode!=='calm') [400,1100,2600,4200].forEach(t=>later(()=>{
    hexSvg.classList.add('glitch');
    setTimeout(()=>hexSvg.classList.remove('glitch'),260);
  },t));
  const reveal=(el,text,icon)=>{
    if(!el)return;
    if(icon){icon.classList.add('spin');}
    el.textContent=text;
    requestAnimationFrame(()=>el.classList.add('show'));
    setTimeout(()=>{
      if(icon){icon.classList.remove('spin');icon.classList.add('done');icon.textContent='✓';}
    },420*S);
  };
  const ready=()=>{
    if(i3){i3.classList.add('done');i3.textContent='✓';}
    reveal(o3,'Portfolio ready!');
    if(num) num.style.color='var(--g)';
  };
  later(()=>reveal(o1,mode==='full'?'Loading assets...':'Restoring session...',i1),3300);
  later(()=>reveal(o2,'Initialising animations...',i2),4300);
  later(ready,5300);

  /* Progress is no longer pure Math.random(): it follows the sequence clock but is
     held back by what has actually loaded (above-the-fold images + web fonts), so
     a slow connection shows a slow bar instead of a fake one parked at 92%. */
  const imgs=Array.from(document.images).filter(i=>i.loading!=='lazy');
  const totalRes=imgs.length+1;
  let doneRes=0;
  const tick=()=>{ doneRes=Math.min(doneRes+1,totalRes); };
  imgs.forEach(i=>{
    if(i.complete) tick();
    else{ i.addEventListener('load',tick,{once:true}); i.addEventListener('error',tick,{once:true}); }
  });
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(tick,tick); else tick();

  const SEQUENCE_MS=6000*S, HARD_CAP_MS=mode==='full'?9000:4500;
  const t0=performance.now();
  let pct=0, loaded=false, finished=false, rafId=0;
  function drawBar(){
    const timePct=Math.min((performance.now()-t0)/SEQUENCE_MS,1)*100;
    const resPct=loaded?100:60+40*(doneRes/totalRes);
    const target=finished?100:Math.min(timePct,resPct,99);
    pct+=(target-pct)*(finished?.35:.12);
    if(bar){
      bar.style.width=pct.toFixed(1)+'%';
      bar.style.setProperty('--bar-mid',pct<50?'#06b6d4':'#10b981');
    }
    if(num) num.textContent=Math.round(pct);
    if(pct<99.5) rafId=requestAnimationFrame(drawBar);
    else{ if(bar) bar.style.width='100%'; if(num) num.textContent='100'; }
  }
  rafId=requestAnimationFrame(drawBar);

  /* Named so it can be detached on finish. As an anonymous listener this stayed
     bound for the whole session, running getBoundingClientRect() — a forced
     layout read — on every mousemove long after the preloader was hidden. */
  function tiltTerminal(e){
    const r=terminal.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width-.5, py=(e.clientY-r.top)/r.height-.5;
    terminal.style.setProperty('--tilt-x',(px*6)+'deg');
    terminal.style.setProperty('--tilt-y',(-py*6)+'deg');
  }
  const tilt=terminal&&mode==='full'&&!matchMedia('(pointer: coarse)').matches;
  if(tilt) document.addEventListener('mousemove',tiltTerminal,{passive:true});

  // Skip hint shows up only once the intro has run long enough to be "waiting".
  const hintT=setTimeout(()=>loader.classList.add('can-skip'),mode==='full'?1500:500);
  function onKey(e){ if(e.key!=='Tab') finish(); }
  loader.addEventListener('click',finish);
  document.addEventListener('keydown',onKey);

  /* The overlay lifts at the later of (sequence complete, load), never past
     HARD_CAP whatever the network does — or immediately when the visitor skips. */
  let sequenceDone=false;
  function finish(){
    if(finished)return;
    finished=true;
    timers.forEach(clearTimeout); clearInterval(ti); clearTimeout(hintT);
    if(cmdEl) cmdEl.textContent=cmd;
    if(title&&title.settle) title.settle();
    // Fill in any lines a skip jumped past so the terminal never shows a gap.
    if(o1&&!o1.textContent) reveal(o1,mode==='full'?'Loading assets...':'Restoring session...',i1);
    if(o2&&!o2.textContent) reveal(o2,'Initialising animations...',i2);
    ready();
    cancelAnimationFrame(rafId); rafId=requestAnimationFrame(drawBar);
    if(tilt) document.removeEventListener('mousemove',tiltTerminal);
    document.removeEventListener('keydown',onKey);
    loader.removeEventListener('click',finish);
    // Beat 1: logo charges up and a shockwave rings out. Beat 2: flash, then the
    // overlay collapses to a line like a CRT switching off.
    loader.classList.add('complete');
    setTimeout(()=>{
      if(flash&&mode==='full') flash.classList.add('burst');
      loader.classList.add('gone');
      loader.setAttribute('aria-hidden','true');
      loader.setAttribute('aria-busy','false');
      introDone();
      // Drop the subtree once the exit is over so its infinite CSS animations
      // stop costing frames for the rest of the session.
      setTimeout(()=>loader.remove(),1400);
    },mode==='full'?700:120);
  }
  const maybeFinish=()=>{ if(sequenceDone&&loaded) finish(); };
  timers.push(setTimeout(()=>{ sequenceDone=true; maybeFinish(); },SEQUENCE_MS));
  setTimeout(finish,HARD_CAP_MS);
  if(document.readyState==='complete'){ loaded=true; }
  else window.addEventListener('load',()=>{ loaded=true; maybeFinish(); });
  if(skipBtn) skipBtn.addEventListener('click',e=>{ e.stopPropagation(); finish(); });
})();

/* ══ 3. CURSOR ══ */
(function(){
  const dot=document.getElementById('cur-dot');
  const ring=document.getElementById('cur-ring');
  const glow=document.getElementById('cur-glow');
  if(!dot||!ring||!glow||matchMedia('(pointer: coarse)').matches)return;
  /* Signals to CSS that it is now safe to hide the native cursor. Gating it here
     means any failure above this line leaves the normal pointer intact. */
  document.documentElement.classList.add('has-cursor');
  let mx=innerWidth/2,my=innerHeight/2,dx=mx,dy=my,rx=mx,ry=my,gx=mx,gy=my;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;},{passive:true});
  function follow(){
    dx+=(mx-dx)*.55; dy+=(my-dy)*.55;
    const s=document.body.classList.contains('c-hover')?3.5:1;
    dot.style.transform=`translate3d(${dx}px,${dy}px,0) translate(-50%,-50%) scale(${s})`;
    rx+=(mx-rx)*.16; ry+=(my-ry)*.16;
    ring.style.transform=`translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
    gx+=(mx-gx)*.07; gy+=(my-gy)*.07;
    glow.style.transform=`translate3d(${gx}px,${gy}px,0) translate(-50%,-50%)`;
    requestAnimationFrame(follow);
  }
  follow();
  document.querySelectorAll('a,button,.sk-card,.pj-card,.tl-card,.edu-card,.cert-card,.abt-bio-box,input,textarea').forEach(el=>{
    el.addEventListener('mouseenter',()=>document.body.classList.add('c-hover'));
    el.addEventListener('mouseleave',()=>document.body.classList.remove('c-hover'));
  });
})();

/* ══ 3b. THEME TOGGLE ══ */
(function(){
  const btn=document.getElementById('themeToggle');
  if(!btn)return;
  const root=document.documentElement;
  const meta=document.getElementById('themeColor');
  function apply(theme){
    if(theme==='light') root.setAttribute('data-theme','light');
    else root.removeAttribute('data-theme');
    // Keep the mobile browser chrome in step with the theme on screen.
    if(meta) meta.setAttribute('content', theme==='light' ? '#faf8ff' : '#060812');
    // Lets theme-dependent canvas/JS colour re-read its tokens.
    window.dispatchEvent(new CustomEvent('pn:themechange',{detail:{theme}}));
  }
  btn.addEventListener('click',()=>{
    const isLight=root.getAttribute('data-theme')==='light';
    const next=isLight?'dark':'light';
    try{ localStorage.setItem('pn-theme',next); }catch(err){}
    apply(next);
  });

  // Follow the OS while the visitor hasn't made an explicit choice.
  const mq=window.matchMedia('(prefers-color-scheme: light)');
  const onOS=e=>{
    let stored=null;
    try{ stored=localStorage.getItem('pn-theme'); }catch(err){}
    if(!stored) apply(e.matches?'light':'dark');
  };
  if(mq.addEventListener) mq.addEventListener('change',onOS);
})();

/* ══ 4. NAVBAR ══ */
(function(){
  const nav=document.getElementById('nav');
  const burger=document.getElementById('burger');
  const links=document.getElementById('nLinks');
  const topBtn=document.getElementById('topBtn');
  const prog=document.getElementById('navProg');
  const navAs=document.querySelectorAll('.n-links a');
  let ticking=false;
  function syncNavHeight(){
    document.documentElement.style.setProperty('--nav-h',(nav.offsetHeight+10)+'px');
  }
  // Progress bar tracks the nav-links row itself: it fills from the left edge
  // of "home" to the right edge of whichever link is currently active, so it
  // always lines up with the highlighted section pill above it.
  function syncProgBar(){
    if(!navAs.length)return;
    const active=links.querySelector('a.act')||navAs[0];
    const navRect=links.getBoundingClientRect();
    const activeRect=active.getBoundingClientRect();
    prog.style.left=navRect.left+'px';
    prog.style.width=Math.max(0,activeRect.right-navRect.left)+'px';
  }
  // Scroll-spy: the active section is the last one (in document order)
  // whose top has crossed a trigger line near the top of the viewport.
  // Computed directly off live layout on every scroll frame, so there's no
  // batching ambiguity from overlapping IntersectionObserver entries.
  const sections=[...navAs].map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
  function syncActiveSection(){
    if(!sections.length)return;
    const triggerY=innerHeight*.35;
    let active=sections[0];
    // At the very bottom, force the last section: a short final section's top
    // may never cross the trigger line, which would leave the wrong link lit.
    if(innerHeight+scrollY>=document.documentElement.scrollHeight-2){
      active=sections[sections.length-1];
    }else{
      for(const s of sections){
        if(s.getBoundingClientRect().top<=triggerY)active=s; else break;
      }
    }
    const href='#'+active.id;
    navAs.forEach(n=>n.classList.toggle('act',n.getAttribute('href')===href));
  }
  function updateProg(){
    const sy=scrollY;
    const wasScrolled=nav.classList.contains('scrolled');
    nav.classList.toggle('scrolled',sy>60);
    if(wasScrolled!==nav.classList.contains('scrolled'))syncNavHeight();
    topBtn.classList.toggle('show',sy>500);
    syncActiveSection();
    syncProgBar();
    ticking=false;
  }
  syncNavHeight();
  window.addEventListener('resize',()=>{
    // The mobile panel is hidden by a min-width media query on desktop, so its
    // state has to be reset on the way across or the burger stays an X.
    if(innerWidth>768&&links.classList.contains('open'))setMenu(false);
    syncNavHeight();syncActiveSection();syncProgBar();
  });
  // Safety net: a smooth/animated scroll (nav click, scrollIntoView) can end
  // its event stream slightly before the scroll position is truly at rest, so
  // a single fixed-delay "settle" timer can under- or over-shoot depending on
  // how long the browser's scroll-animation tail runs. Instead, poll until
  // scrollY is observed unchanged for two ticks in a row, then do one final
  // authoritative re-sync — this is correct regardless of the tail's length.
  let settlePoll=null,lastSettleSy=null,stableTicks=0;
  function scheduleSettle(){
    clearInterval(settlePoll);
    stableTicks=0;lastSettleSy=scrollY;
    settlePoll=setInterval(()=>{
      if(scrollY===lastSettleSy){
        if(++stableTicks>=2){clearInterval(settlePoll);settlePoll=null;updateProg();}
      }else{
        stableTicks=0;lastSettleSy=scrollY;
      }
    },60);
  }
  window.addEventListener('scroll',()=>{
    if(!ticking){ticking=true;requestAnimationFrame(updateProg);}
    scheduleSettle();
  },{passive:true});
  window.addEventListener('scrollend',updateProg,{passive:true});
  /* Single place that owns the menu's open state. The burger's bars are driven by
     inline styles, so every path that closes the menu has to clear them too —
     previously only the burger click wrote them, while the nav-link click and
     (nothing at all) on resize just dropped the .open class, leaving the burger
     stuck as an X. */
  function setMenu(open){
    links.classList.toggle('open',open);
    burger.setAttribute('aria-expanded',open?'true':'false');
    const sp=burger.querySelectorAll('span');
    if(sp.length<3)return;
    sp[0].style.transform=open?'rotate(45deg) translate(5px,5px)':'';
    sp[1].style.opacity=open?'0':'1';
    sp[2].style.transform=open?'rotate(-45deg) translate(5px,-5px)':'';
  }
  setMenu(false);
  burger.addEventListener('click',()=>setMenu(!links.classList.contains('open')));
  navAs.forEach(a=>a.addEventListener('click',()=>setMenu(false)));
  // Close on Escape, and whenever the layout crosses back to the desktop nav.
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&links.classList.contains('open'))setMenu(false);
  });
  topBtn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
    const href=a.getAttribute('href');
    const t=document.querySelector(href);
    if(t){
      e.preventDefault();
      t.scrollIntoView({behavior:'smooth',block:'start'});
      t.querySelectorAll('.reveal,.reveal-l,.reveal-r,.reveal-u').forEach(el=>el.classList.add('vis'));
      navAs.forEach(n=>n.classList.toggle('act',n.getAttribute('href')===href));
      syncProgBar();
    }
  }));
  // Initial paint: figure out the right section (handles a page load that
  // already has scroll restored or an #anchor in the URL) and lay out the bar.
  syncActiveSection();
  syncProgBar();
})();

/* ══ 5. TYPED TEXT ══ */
(function(){
  const el=document.getElementById('heroTyped');
  if(!el)return;
  const roles=[
    'Software Developer',
    'Full-Stack Developer',
    'Python Developer',
    'React Developer',
    'Data Scientist Enthusiast',
    'passionate Programmer',
    'Web Developer',
    'AI/ML Enthusiast'
  ];
  let ri=0,ci=0,del=false,wait=100;
  function tick(){
    const r=roles[ri];
    el.textContent=del?r.slice(0,--ci):r.slice(0,++ci);
    wait=del?48:108;
    if(!del&&ci===r.length){wait=2200;del=true;}
    else if(del&&ci===0){del=false;ri=(ri+1)%roles.length;wait=380;}
    setTimeout(tick,wait);
  }
  setTimeout(tick,2800);
})();

/* ══ 6. HERO COUNTER STATS ══ */
(function(){
  const ns=document.querySelectorAll('.hst-n[data-c]');
  let done=false;
  const obs=new IntersectionObserver(en=>{
    if(!en[0].isIntersecting||done)return;
    done=true;
    ns.forEach(n=>{
      const t=+n.dataset.c; let cur=0;
      const s=setInterval(()=>{cur=Math.min(cur+Math.ceil(t/40),t);n.textContent=cur;if(cur>=t)clearInterval(s);},25);
    });
  },{threshold:.5});
  const hs=document.querySelector('.hero-stats');
  if(hs)obs.observe(hs);
})();

/* ══ 7. ABOUT COUNTERS ══ */
(function(){
  document.querySelectorAll('.ac-n[data-c]').forEach(el=>{
    const obs=new IntersectionObserver(en=>{
      if(!en[0].isIntersecting)return;
      const t=+el.dataset.c; let cur=0;
      const s=setInterval(()=>{cur=Math.min(cur+Math.ceil(t/50),t);el.textContent=cur;if(cur>=t)clearInterval(s);},22);
      obs.unobserve(el);
    },{threshold:.5});
    obs.observe(el);
  });
})();

/* ══ 8. SCROLL REVEAL ══ */
(function(){
  const els=document.querySelectorAll('.reveal,.reveal-l,.reveal-r,.reveal-u');
  const reveal=e=>{
    const d=parseFloat(getComputedStyle(e).getPropertyValue('--d')||0);
    setTimeout(()=>{
      e.classList.add('vis');
    },d*1000);
  };
  const obs=new IntersectionObserver(en=>{
    en.forEach(e=>{
      if(!e.isIntersecting)return;
      reveal(e.target);
      obs.unobserve(e.target);
    });
  },{threshold:0,rootMargin:'200px 0px -10% 0px'});
  els.forEach(el=>{
    // Anchor-jump / fast-scroll safety net: reveal instantly if already on-screen
    // (or just below it) instead of waiting on the observer, so no blank gap flashes.
    if(el.getBoundingClientRect().top<innerHeight+200){reveal(el);}
    else obs.observe(el);
  });
})();

/* ══ 9. SKILL TABS ══ */
(function(){
  const tabs=document.querySelectorAll('.sk-tab');
  const panels=document.querySelectorAll('.sk-panel');
  tabs.forEach(tab=>{
    tab.addEventListener('click',()=>{
      tabs.forEach(t=>t.classList.remove('active'));
      panels.forEach(p=>p.classList.remove('active'));
      tab.classList.add('active');
      const panel=document.getElementById('p-'+tab.dataset.p);
      if(panel){
        panel.classList.add('active');
        if(!REDUCE_MOTION) panel.querySelectorAll('.sk-card').forEach((c,i)=>{
          c.classList.remove('pop'); void c.offsetWidth;
          c.style.setProperty('--pd',(i*.07)+'s');
          c.classList.add('pop');
          c.onanimationend=e=>{ if(e.animationName==='sk-pop') c.classList.remove('pop'); };
        });
      }
    });
  });
})();

/* ══ 10. PROJECT FILTERS ══ */
(function(){
  const btns=document.querySelectorAll('.pf');
  const cards=document.querySelectorAll('.pj-card');
  btns.forEach(btn=>btn.addEventListener('click',()=>{
    btns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const f=btn.dataset.f;
    // Stagger counts only the cards actually being shown. Using the index into the
    // full card list meant a filter that matched, say, cards 3 and 6 produced a
    // .12s/.24s stagger with a visible gap where the hidden cards' slots were.
    let shown=0;
    cards.forEach(card=>{
      const show=f==='all'||card.dataset.cat===f;
      if(show){
        card.classList.remove('out');
        card.style.transitionDelay=(shown++*.04)+'s';
        setTimeout(()=>card.classList.add('vis'),50);
      }else{
        card.classList.add('out');card.classList.remove('vis');
        card.style.transitionDelay='';
      }
    });
  }));
  // Init reveal
  const obs=new IntersectionObserver(en=>{
    if(en[0].isIntersecting){cards.forEach((c,i)=>setTimeout(()=>c.classList.add('vis'),i*70+80));obs.disconnect();}
  },{threshold:.08});
  const pr=document.getElementById('projects');if(pr)obs.observe(pr);
})();

/* ══ 11. HERO MOUSE GLOW ══ */
(function(){
  const hero=document.getElementById('hero');if(!hero||REDUCE_MOTION)return;
  let ticking=false,lx=0,ly=0;
  hero.addEventListener('mousemove',e=>{
    lx=e.clientX;ly=e.clientY;
    if(ticking)return;
    ticking=true;
    requestAnimationFrame(()=>{
      // Feed .hero::before instead of replacing .hero's own background, so the
      // glow layer stays transparent and #bgCanvas keeps showing through.
      hero.style.setProperty('--glow-x',((lx/innerWidth)*100).toFixed(1)+'%');
      hero.style.setProperty('--glow-y',((ly/innerHeight)*100).toFixed(1)+'%');
      ticking=false;
    });
  },{passive:true});
})();

/* ══ 12. MAGNETIC BUTTONS ══ */
(function(){
  document.querySelectorAll('.btn-primary,.btn-outline,.btn-res,.hs-link').forEach(btn=>{
    btn.addEventListener('mousemove',e=>{
      const r=btn.getBoundingClientRect();
      const x=((e.clientX-r.left-r.width/2)*.3).toFixed(1);
      const y=((e.clientY-r.top-r.height/2)*.3).toFixed(1);
      btn.style.transform=`translate(${x}px,${y}px)`;
    });
    btn.addEventListener('mouseleave',()=>btn.style.transform='');
  });
})();

/* ══ 13. PHOTO 3D TILT ══ */
(function(){
  const frame=document.getElementById('phFrame');if(!frame)return;
  if(matchMedia('(pointer: coarse)').matches)return;
  const inner=frame.querySelector('.ph-inner');
  frame.addEventListener('mousemove',e=>{
    const r=frame.getBoundingClientRect();
    const x=((e.clientX-r.left)/r.width-.5)*14;
    const y=((e.clientY-r.top)/r.height-.5)*-14;
    inner.style.transform=`perspective(700px) rotateX(${y}deg) rotateY(${x}deg) scale(1.04)`;
  });
  frame.addEventListener('mouseleave',()=>inner.style.transform='');
})();

/* ══ 14. TIMELINE DRAG SCROLL ══ */
(function(){
  const el=document.querySelector('.timeline-scroll-wrap');if(!el)return;
  let isDown=false,sx,sl;
  el.addEventListener('mousedown',e=>{isDown=true;sx=e.pageX-el.offsetLeft;sl=el.scrollLeft;el.style.cursor='grabbing';});
  el.addEventListener('mouseleave',()=>{isDown=false;el.style.cursor='';});
  el.addEventListener('mouseup',()=>{isDown=false;el.style.cursor='';});
  el.addEventListener('mousemove',e=>{if(!isDown)return;e.preventDefault();const x=e.pageX-el.offsetLeft;el.scrollLeft=sl-(x-sx);});
})();

/* ══ 15. ORB PARALLAX ══ */
(function(){
  const orbs=document.querySelectorAll('.bg-orb');
  if(!orbs.length||REDUCE_MOTION)return;
  let ticking=false,lx=0,ly=0;
  window.addEventListener('mousemove',e=>{
    lx=e.clientX;ly=e.clientY;
    if(ticking)return;
    ticking=true;
    requestAnimationFrame(()=>{
      const x=(lx/innerWidth-.5)*35, y=(ly/innerHeight-.5)*35;
      orbs.forEach((o,i)=>{const s=(i+1)*.4;o.style.transform=`translate3d(${x*s}px,${y*s}px,0)`;});
      ticking=false;
    });
  },{passive:true});
})();

/* ══ 16. SKILL CARD PARTICLE BURST ══ */
(function(){
  document.querySelectorAll('.sk-card').forEach(card=>{
    card.addEventListener('click',()=>{
      const r=card.getBoundingClientRect();
      for(let i=0;i<10;i++){
        const p=document.createElement('div');
        const angle=(i/10)*Math.PI*2;
        const speed=45+Math.random()*35;
        p.style.cssText=`
          position:fixed;pointer-events:none;z-index:99999;
          width:5px;height:5px;border-radius:50%;
          background:${Math.random()>.5?'#7c3aed':'#06b6d4'};
          left:${r.left+r.width/2}px;top:${r.top+r.height/2}px;
          transition:all .65s cubic-bezier(.4,0,.2,1);opacity:1;
        `;
        document.body.appendChild(p);
        requestAnimationFrame(()=>{p.style.transform=`translate(${Math.cos(angle)*speed}px,${Math.sin(angle)*speed}px)`;p.style.opacity='0';});
        setTimeout(()=>p.remove(),680);
      }
    });
  });
})();

/* ══ 17. LOGO GLITCH ══ */
(function(){
  document.querySelectorAll('.n-logo').forEach(l=>{
    setInterval(()=>{
      l.style.textShadow=`${(Math.random()*6-3).toFixed(1)}px 0 #06b6d4,${(Math.random()*-6+3).toFixed(1)}px 0 #7c3aed`;
      setTimeout(()=>l.style.textShadow='',80);
    },2600+Math.random()*2400);
  });
})();

/* ══ 17b. LETTER-SPLIT HERO NAME ══ */
(function(){
  if(REDUCE_MOTION)return;
  function splitChars(el,extraClass){
    if(!el||!el.firstChild||el.firstChild.nodeType!==3)return;
    const text=el.firstChild.textContent;
    const frag=document.createDocumentFragment();
    [...text].forEach(ch=>{
      const s=document.createElement('span');
      s.className='char '+extraClass;
      s.textContent=ch===' '?' ':ch;
      frag.appendChild(s);
    });
    el.replaceChild(frag,el.firstChild);
  }
  splitChars(document.querySelector('.h1-main'),'char-first');
  splitChars(document.querySelector('.h1-last'),'char-last');
})();

/* ══ 18. GSAP ANIMATIONS ══ */
window.addEventListener('load',function(){
  if(typeof gsap==='undefined')return;
  gsap.registerPlugin(ScrollTrigger);

  // Nav entrance — if the tab was backgrounded while this ran, rAF-driven tweens can
  // stall for a long time (browsers throttle rAF heavily on hidden tabs), leaving nav
  // links/Resume stuck at low opacity. Force full visibility after 2s no matter what.
  if(!REDUCE_MOTION){
    gsap.from('.nav-inner a',{opacity:0,y:-12,duration:.4,stagger:.05,ease:'power2.out'});
  }
  setTimeout(()=>gsap.set('.nav-inner a',{clearProps:'opacity,transform'}),2000);

  // Hero entrance — starts as the preloader fades rather than after a fixed guess,
  // which ran either behind the overlay (slow load) or late (quick/skipped intro).
  const htl=gsap.timeline({paused:true});
  const playHero=()=>{ if(!htl.isActive()&&htl.progress()===0) htl.play(); };
  if(window.__pnIntroDone) gsap.delayedCall(.05,playHero);
  else window.addEventListener('pn:introdone',playHero,{once:true});
  setTimeout(playHero,11000);
  htl
    .from('.hero-chip',     {opacity:0,y:-14,duration:.5,ease:'power2.out'})
    .from('.h1-sub',        {opacity:0,y:14,duration:.4,ease:'power2.out'},'-=.2')
    .from('.char-first', {opacity:0,y:40,rotateX:-80,transformOrigin:'50% 100%',duration:.6,stagger:.035,ease:'back.out(1.8)'},'-=.15')
    .from('.char-last',  {opacity:0,y:40,rotateX:-80,transformOrigin:'50% 100%',duration:.6,stagger:.035,ease:'back.out(1.8)'},'-=.5')
    .from('.h1-dot',        {opacity:0,scale:0,duration:.4,ease:'back.out(3)'},'-=.2')
    .from('.hero-tagline',  {opacity:0,y:18,duration:.5,ease:'power2.out'},'-=.3')
    .from('.hero-typed-row',{opacity:0,y:18,duration:.5,ease:'power2.out'},'-=.35')
    .from('.hero-bio',      {opacity:0,y:16,duration:.5,ease:'power2.out'},'-=.35')
    .from('.hero-actions',  {opacity:0,y:14,duration:.45,ease:'power2.out'},'-=.3')
    .from('.hero-socials',  {opacity:0,y:12,duration:.4,ease:'power2.out'},'-=.28')
    .from('.hero-stats',    {opacity:0,y:12,duration:.4,ease:'power2.out'},'-=.25')
    .from('#hRight',        {opacity:0,x:55,duration:.9,ease:'power3.out'},'-=.9');

  if(!REDUCE_MOTION){
    htl
      .from('.tb',          {opacity:0,scale:.4,y:20,duration:.5,stagger:.08,ease:'back.out(1.7)'},'-=.4')
      .from('.orbit-ring .od',{opacity:0,scale:0,duration:.4,stagger:.1,ease:'back.out(1.7)'},'-=.3');
  }

  // Photo parallax
  gsap.to('.photo-scene',{
    scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:true},
    y:-70,ease:'none'
  });
  gsap.to('#hLeft',{
    scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:true},
    y:30,ease:'none'
  });

  // Sections
  gsap.utils.toArray('.tl-card').forEach((el,i)=>{
    gsap.from(el,{scrollTrigger:{trigger:el,start:'top 92%'},opacity:0,y:24,duration:.55,delay:i*.07,ease:'power2.out'});
  });
  gsap.utils.toArray('.ef-tags span').forEach((el,i)=>{
    gsap.from(el,{scrollTrigger:{trigger:el,start:'top 95%'},opacity:0,scale:.8,duration:.4,delay:i*.06,ease:'back.out(2)'});
  });
  gsap.utils.toArray('.cf-grp').forEach((el,i)=>{
    gsap.from(el,{scrollTrigger:{trigger:el,start:'top 95%'},opacity:0,y:18,duration:.5,delay:i*.07,ease:'power2.out'});
  });

  // Footer wave
  gsap.from('.foot-wave path',{
    scrollTrigger:{trigger:'.footer',start:'top bottom'},
    attr:{d:'M0,60 C360,60 1080,60 1440,60 L1440,60 L0,60 Z'},
    duration:1.2,ease:'power3.out'
  });
});

/* ══ 19. VANILLA TILT ══ */
window.addEventListener('load',function(){
  if(typeof VanillaTilt==='undefined')return;
  VanillaTilt.init(document.querySelectorAll('.sk-card[data-tilt],.abt-photo-wrap[data-tilt]'),{
    max:12,speed:400,glare:true,'max-glare':.15,easing:'cubic-bezier(.03,.98,.52,.99)'
  });
  VanillaTilt.init(document.querySelectorAll('.pj-card[data-tilt]'),{
    max:12,speed:400,glare:false,easing:'cubic-bezier(.03,.98,.52,.99)'
  });
});

/* ══ 20. (removed) SECTION ACTIVE LINK ══
   This was a second, independent scroll-spy writing the same .act class as the
   navbar module above, but using a different trigger line (nav height + 10px vs
   35% of viewport height). Both ran on every scroll; this one was queued second
   so it won the class, while the navbar module had already sized #navProg from
   its own answer. Between the two trigger lines the lit pill and the progress
   bar therefore pointed at different sections — permanently, not as a flicker.
   Its only unique behaviour (force the last section at page bottom) now lives in
   syncActiveSection(), so deleting it loses nothing. */

/* ══ 21. CONTACT FORM ══ */
(function(){
  const form=document.getElementById('contactForm');if(!form)return;
  const btn=document.getElementById('cfBtn');
  const txt=document.getElementById('cfTxt'), load=document.getElementById('cfLoad');
  const status=document.getElementById('cfStatus');
  /* The form carries `novalidate` so the browser's default bubbles don't break the
     terminal styling — but nothing replaced the validation it switched off, so an
     entirely empty form would POST and come back as "Send failed". These checks use
     the constraint-validation API, so `required`, type=email and type=url are all
     honoured without duplicating their rules. */
  const FIELD_LABELS={
    user_name:'name', user_email:'email', contact_reason:'reason',
    subject:'subject', social_link:'profileLink', message:'message'
  };
  function firstInvalid(){
    for(const el of form.querySelectorAll('input,textarea,select')){
      if(!el.checkValidity())return el;
    }
    return null;
  }
  function showInvalid(el){
    const label=FIELD_LABELS[el.name]||el.name||'field';
    const empty=!el.value.trim();
    status.textContent = empty
      ? `✗ ${label} is required.`
      : `✗ ${label} is not valid.`;
    status.className='cf-status err';
    el.classList.add('cf-invalid');
    el.focus();
  }
  form.querySelectorAll('input,textarea,select').forEach(el=>{
    el.addEventListener('input',()=>el.classList.remove('cf-invalid'));
    el.addEventListener('change',()=>el.classList.remove('cf-invalid'));
  });

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const bad=firstInvalid();
    if(bad){ showInvalid(bad); return; }
    form.querySelectorAll('.cf-invalid').forEach(el=>el.classList.remove('cf-invalid'));
    txt.hidden=true; load.hidden=false; btn.disabled=true;
    status.textContent=''; status.className='cf-status';
    const done=()=>{txt.hidden=false;load.hidden=true;btn.disabled=false;};

    const name = form.querySelector('[name="user_name"]')?.value || '';
    const email = form.querySelector('[name="user_email"]')?.value || '';
    const reason = form.querySelector('[name="contact_reason"]')?.value || 'General Inquiry';
    const company = form.querySelector('[name="company"]')?.value || 'N/A';
    const subject = form.querySelector('[name="subject"]')?.value || 'Portfolio Contact';
    const socialLink = form.querySelector('[name="social_link"]')?.value || 'N/A';
    const message = form.querySelector('[name="message"]')?.value || '';

    const uSub = encodeURIComponent(`[${reason}] ${subject}`);
    const uMsg = encodeURIComponent(
      `Name: ${name}\n` +
      `Email: ${email}\n` +
      `Reason: ${reason}\n` +
      `Company: ${company}\n` +
      `Link: ${socialLink}\n\n` +
      `Message:\n${message}`
    );
    const mailtoUrl = `mailto:pratyushnandi100@gmail.com?subject=${uSub}&body=${uMsg}`;

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          access_key: "dd789f34-7888-4300-a4ac-7842d5524490",
          name: name,
          email: email,
          reason: reason,
          company: company,
          social_link: socialLink,
          subject: `[${reason}] ${subject} from ${name}`,
          message: message
        })
      });
      const data = await res.json();
      if(data.success) {
        status.textContent = "✓ Message sent successfully! I'll get back to you soon.";
        status.className = 'cf-status ok';
        form.reset();
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch(err) {
      console.error('Contact Form Error:', err);
      status.innerHTML = `✗ Send failed. <a href="${mailtoUrl}" style="color:var(--c);text-decoration:underline;font-weight:600;">Click to send via Email app</a>`;
      status.className = 'cf-status err';
    } finally {
      done();
    }
  });
  form.querySelectorAll('input,textarea,select').forEach(inp=>{
    inp.addEventListener('focus',()=>{const l=inp.previousElementSibling;if(l)l.style.color='var(--c)';});
    inp.addEventListener('blur', ()=>{const l=inp.previousElementSibling;if(l)l.style.color='';});
  });
})();

/* ══ 22. PAGE FADE-IN ══
   Was: body opacity 0 until `load` + 2300ms. Two problems with that. #preloader is
   itself a body child, so opacity on body hid the preloader as well — its first
   ~2.3s played completely invisibly, against a bare html background. And because
   only JS ever restored the opacity, a visitor with JS disabled got a blank page.
   Removed rather than rewritten: #preloader already covers the viewport at
   z-index 99999 and fades, blurs and scales away over .8s via its .gone
   transition, which is the reveal this was duplicating. Reintroducing it would
   need a content wrapper, and wrapping the page in an opacity/transform layer
   risks re-parenting every position:fixed layer here (cursor, orbs, canvas,
   nav) — not worth it for a redundant fade. */

/* ══ 23. TIMELINE ENTRANCE ══ */
(function(){
  const items=document.querySelectorAll('.tl-item');
  const obs=new IntersectionObserver(en=>{
    en.forEach((e,i)=>{
      if(e.isIntersecting){
        setTimeout(()=>{e.target.style.opacity='1';e.target.style.transform='none';},i*80);
        obs.unobserve(e.target);
      }
    });
  },{threshold:.15});
  items.forEach(i=>{i.style.opacity='0';i.style.transform='translateY(20px)';i.style.transition='opacity .55s ease,transform .55s ease';obs.observe(i);});
})();

/* ══ 24. RIPPLE EFFECT ══ */
(function(){
  document.querySelectorAll('.btn-primary,.btn-outline,.btn-res,.cf-btn,.pf,.sk-tab').forEach(btn=>{
    btn.style.position=btn.style.position||'relative';
    btn.style.overflow='hidden';
    btn.addEventListener('click',e=>{
      const r=btn.getBoundingClientRect();
      const d=Math.max(r.width,r.height);
      const ink=document.createElement('span');
      ink.className='ripple-ink';
      ink.style.width=ink.style.height=d+'px';
      ink.style.left=(e.clientX-r.left-d/2)+'px';
      ink.style.top=(e.clientY-r.top-d/2)+'px';
      btn.appendChild(ink);
      setTimeout(()=>ink.remove(),650);
    });
  });
})();

/* ══ 25. SPOTLIGHT CARDS ══ */
(function(){
  if(matchMedia('(pointer: coarse)').matches)return;
  document.querySelectorAll('.sk-card,.pj-card,.tl-card,.edu-card,.cert-card').forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect();
      card.style.setProperty('--mx',(e.clientX-r.left)+'px');
      card.style.setProperty('--my',(e.clientY-r.top)+'px');
    });
  });
})();

/* ══ 26. FOOTER PARTICLES ══ */
(function(){
  const wrap=document.getElementById('footParticles');
  if(!wrap||REDUCE_MOTION)return;
  const obs=new IntersectionObserver(en=>{
    en.forEach(e=>{
      if(!e.isIntersecting||wrap.childElementCount)return;
      for(let i=0;i<16;i++){
        const p=document.createElement('span');
        p.className='foot-particle';
        const size=Math.random()*3+1.5;
        p.style.width=p.style.height=size+'px';
        p.style.left=Math.random()*100+'%';
        p.style.animationDuration=(Math.random()*5+5)+'s';
        p.style.animationDelay=(Math.random()*5)+'s';
        p.style.opacity=(Math.random()*.4+.25).toFixed(2);
        wrap.appendChild(p);
      }
      obs.disconnect();
    });
  },{threshold:.1});
  obs.observe(wrap);
})();

/* ══ 27. SECTION LABEL DECODE ══
   "// 01. about_me" resolves out of random glyphs, left to right, the first time
   it scrolls into view. Mono font, so the width never jitters. */
(function(){
  if(REDUCE_MOTION)return;
  const glyphs='!<>-_\\/[]{}=+*^?#01';
  function scramble(el){
    const final=el.textContent, len=final.length, total=26;
    let frame=0;
    const iv=setInterval(()=>{
      let out='';
      for(let i=0;i<len;i++){
        const settleAt=Math.floor(i/len*total*.8)+4;
        out+=(frame>=settleAt||final[i]===' ')?final[i]:glyphs[Math.random()*glyphs.length|0];
      }
      el.textContent=out;
      if(++frame>total){clearInterval(iv);el.textContent=final;}
    },38);
  }
  const obs=new IntersectionObserver(en=>en.forEach(e=>{
    if(!e.isIntersecting)return;
    scramble(e.target); obs.unobserve(e.target);
  }),{threshold:.6});
  document.querySelectorAll('.sec-lbl').forEach(l=>obs.observe(l));
})();

/* ══ 28. TIMELINE PROGRESS LINE ══ */
(function(){
  const t=document.getElementById('timelineTrack');if(!t)return;
  const obs=new IntersectionObserver(en=>{
    if(en[0].isIntersecting){t.classList.add('lit');obs.disconnect();}
  },{threshold:.2});
  obs.observe(t);
})();

/* ══ 29. BACK-TO-TOP PROGRESS RING ══ */
(function(){
  const b=document.getElementById('topBtn');if(!b)return;
  let ticking=false;
  function upd(){
    const max=document.documentElement.scrollHeight-innerHeight;
    b.style.setProperty('--sp',max>0?(scrollY/max).toFixed(4):'0');
    ticking=false;
  }
  window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(upd);}},{passive:true});
  upd();
})();

/* ══ 30. SECTION NUMBER PARALLAX ══
   Drives --ny on each heading; the outlined "01" behind it reads it in CSS. */
window.addEventListener('load',function(){
  if(typeof gsap==='undefined'||typeof ScrollTrigger==='undefined'||REDUCE_MOTION)return;
  gsap.utils.toArray('.sec-h2[data-num]').forEach(h=>{
    gsap.fromTo(h,{'--ny':'40px'},{'--ny':'-40px',ease:'none',
      scrollTrigger:{trigger:h,start:'top bottom',end:'bottom top',scrub:true}});
  });
});

/* ══ CONSOLE BRANDING ══
   No console.clear() here: it ran after every other module and wiped anything
   already logged, including real errors and warnings from this page's own scripts,
   which made anything failing during init effectively invisible. */
console.log('%c██████╗ ███╗   ██╗\n██╔══██╗████╗  ██║\n██████╔╝██╔██╗ ██║\n██╔═══╝ ██║╚██╗██║\n██║     ██║ ╚████║\n╚═╝     ╚═╝  ╚═══╝','font-size:11px;color:#7c3aed;font-family:monospace;line-height:1.4;');
console.log('%c⚡ Pratyush Nandi | Software Developer','font-size:14px;font-weight:900;color:#a78bfa;');
console.log('%c🏢 Eltern Segen Technologie Pvt. Ltd.','font-size:11px;color:#06b6d4;');
console.log('%c💻 Full-Stack · Python · React · Node.js','font-size:11px;color:#94a3b8;');
console.log('%c📍 Kolkata, West Bengal, India','font-size:11px;color:#94a3b8;');
console.log('%c📧 pratyushnandi100@gmail.com','font-size:11px;color:#94a3b8;');
