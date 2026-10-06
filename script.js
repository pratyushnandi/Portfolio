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
  /* Circular wipe: a flat layer in the NEXT theme's background grows out of the
     click point, the tokens swap underneath it while it covers the screen, then
     it fades away. Deliberately not the View Transitions API (see note in CSS). */
  let busy=false;
  btn.addEventListener('click',e=>{
    if(busy)return;
    const isLight=root.getAttribute('data-theme')==='light';
    const next=isLight?'dark':'light';
    try{ localStorage.setItem('pn-theme',next); }catch(err){}
    if(REDUCE_MOTION){ apply(next); return; }
    busy=true;
    const r=btn.getBoundingClientRect();
    // e.detail is 0 for keyboard / programmatic clicks, which report clientX 0.
    const x=e.detail?e.clientX:r.left+r.width/2, y=e.detail?e.clientY:r.top+r.height/2;
    const wipe=document.createElement('div');
    wipe.className='theme-wipe';
    wipe.style.setProperty('--x',x+'px');
    wipe.style.setProperty('--y',y+'px');
    wipe.style.background=next==='light'?'#faf8ff':'#060812';
    document.body.appendChild(wipe);
    void wipe.offsetWidth;
    wipe.classList.add('grow');
    setTimeout(()=>{
      apply(next);
      wipe.classList.add('fade');
      setTimeout(()=>{ wipe.remove(); busy=false; },520);
    },600);
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
    card.addEventListener('click',e=>{
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

/* ══ 31. HERO CONSTELLATION ══
   Mouse-reactive node network drawn only while the hero is on screen. */
(function(){
  const cv=document.getElementById('heroNet'), hero=document.getElementById('hero');
  if(!cv||!hero||REDUCE_MOTION)return;
  const ctx=cv.getContext('2d');
  let w=0,h=0,pts=[],visible=true,running=!document.hidden,colA,colB,mul;
  const mouse={x:-9999,y:-9999};
  function readColors(){
    const light=document.documentElement.getAttribute('data-theme')==='light';
    colA=light?'124,58,237':'167,139,250';
    colB=light?'8,145,178':'34,211,238';
    mul=light?1.3:1;
  }
  function resize(){
    const dpr=Math.min(devicePixelRatio||1,2);
    w=hero.clientWidth; h=hero.clientHeight;
    cv.width=w*dpr; cv.height=h*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const n=Math.min(90,Math.floor(w*h/16000));
    pts=Array.from({length:n},()=>({
      x:Math.random()*w, y:Math.random()*h,
      vx:(Math.random()-.5)*.35, vy:(Math.random()-.5)*.35,
      r:Math.random()*1.6+.6, b:Math.random()>.6
    }));
  }
  readColors(); resize();
  let rt=0;
  window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(resize,150);},{passive:true});
  window.addEventListener('pn:themechange',readColors);
  document.addEventListener('visibilitychange',()=>{running=!document.hidden;});
  new IntersectionObserver(en=>{visible=en[0].isIntersecting;}).observe(hero);
  hero.addEventListener('mousemove',e=>{
    const r=hero.getBoundingClientRect();
    mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top;
  },{passive:true});
  hero.addEventListener('mouseleave',()=>{mouse.x=mouse.y=-9999;});

  const L=130, L2=L*L, M=170;
  function draw(){
    requestAnimationFrame(draw);
    if(!visible||!running)return;
    ctx.clearRect(0,0,w,h);
    for(const p of pts){
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>w)p.vx*=-1;
      if(p.y<0||p.y>h)p.vy*=-1;
      const dx=p.x-mouse.x, dy=p.y-mouse.y, d=Math.hypot(dx,dy);
      if(d<110&&d>0){ p.x+=dx/d*.8; p.y+=dy/d*.8; }
    }
    ctx.lineWidth=1;
    for(let i=0;i<pts.length;i++){
      const a=pts[i];
      for(let j=i+1;j<pts.length;j++){
        const b=pts[j], dx=a.x-b.x, dy=a.y-b.y, d2=dx*dx+dy*dy;
        if(d2<L2){
          ctx.strokeStyle=`rgba(${colA},${((1-d2/L2)*.32*mul).toFixed(3)})`;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
      const md=Math.hypot(a.x-mouse.x,a.y-mouse.y);
      if(md<M){
        ctx.strokeStyle=`rgba(${colB},${((1-md/M)*.65*mul).toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(mouse.x,mouse.y); ctx.stroke();
      }
    }
    for(const p of pts){
      ctx.fillStyle=`rgba(${p.b?colB:colA},${(.75*Math.min(mul,1.15)).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    }
  }
  requestAnimationFrame(draw);
})();

/* ══ 32. COMMAND PALETTE + INTERACTIVE TERMINAL + TOASTS ══ */
(function(){
  const pal=document.getElementById('cmdk'), input=document.getElementById('cmdkInput');
  const list=document.getElementById('cmdkList'), openBtn=document.getElementById('cmdkBtn');
  const term=document.getElementById('term'), tIn=document.getElementById('termIn');
  const tOut=document.getElementById('termOut'), tBody=document.getElementById('termBody');
  const toasts=document.getElementById('toasts'), themeBtn=document.getElementById('themeToggle');
  if(!pal||!term)return;

  const EMAIL='pratyushnandi100@gmail.com', PHONE='+91-7890706472';
  const GH='https://github.com/pratyushnandi', LI='https://www.linkedin.com/in/pratyushnandi/';
  const resLink=document.querySelector('.btn-res');
  const CV=resLink?resLink.getAttribute('href'):'';
  if(/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent)){
    const m=document.getElementById('cmdkMod'); if(m)m.textContent='⌘';
  }
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const txt=el=>el?el.textContent.replace(/\s+/g,' ').trim():'';

  function toast(msg,icon){
    if(!toasts)return;
    const t=document.createElement('div');
    t.className='toast';
    t.innerHTML=`<i class="fas ${icon||'fa-circle-check'}"></i><span></span>`;
    t.querySelector('span').textContent=msg;
    toasts.appendChild(t);
    setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>t.remove(),360); },2600);
  }
  async function copyEmail(){
    try{ await navigator.clipboard.writeText(EMAIL); toast('Email copied to clipboard'); }
    catch(e){ toast(EMAIL,'fa-envelope'); }
  }
  function downloadCV(){
    if(!CV)return;
    const a=document.createElement('a'); a.href=CV; a.download='';
    document.body.appendChild(a); a.click(); a.remove();
    toast('Résumé download started','fa-file-arrow-down');
  }
  // Route through the nav link so the existing smooth-scroll + reveal logic runs.
  function go(id){
    const a=document.querySelector(`.n-links a[href="#${id}"]`);
    if(a) a.click();
    else { const s=document.getElementById(id); if(s) s.scrollIntoView({behavior:'smooth'}); }
  }
  function setTheme(t){
    const isLight=document.documentElement.getAttribute('data-theme')==='light';
    if(!t||(t==='light')!==isLight) themeBtn&&themeBtn.click();
  }

  /* ── Palette ── */
  const SECTIONS=[['hero','Home','fa-house'],['about','About','fa-user'],['experience','Experience','fa-briefcase'],
    ['skills','Tech Stack','fa-layer-group'],['projects','Projects','fa-code-branch'],
    ['education','Education','fa-graduation-cap'],['contact','Contact','fa-paper-plane']];
  const CMDS=[
    ...SECTIONS.map(([id,label,ic])=>({g:'Navigate',label:'Go to '+label,ic,hint:'#'+id,run:()=>go(id)})),
    {g:'Actions',label:'Toggle light / dark theme',ic:'fa-circle-half-stroke',hint:'theme',run:()=>setTheme()},
    {g:'Actions',label:'Open interactive terminal',ic:'fa-terminal',hint:'`',run:()=>openTerm()},
    {g:'Actions',label:'Download résumé (PDF)',ic:'fa-file-arrow-down',hint:'cv',run:downloadCV},
    {g:'Actions',label:'Copy email address',ic:'fa-copy',hint:'email',run:copyEmail},
    {g:'Connect',label:'Open GitHub profile',ic:'fa-github',brand:true,hint:'github',run:()=>window.open(GH,'_blank','noopener')},
    {g:'Connect',label:'Open LinkedIn profile',ic:'fa-linkedin-in',brand:true,hint:'linkedin',run:()=>window.open(LI,'_blank','noopener')},
    {g:'Connect',label:'Send an email',ic:'fa-envelope',hint:'mailto',run:()=>{location.href='mailto:'+EMAIL;}}
  ];
  // Subsequence match: returns the matched character indices, or null.
  function match(q,s){
    const t=s.toLowerCase(), idx=[]; let i=0;
    for(const ch of q.toLowerCase()){
      if(ch===' ')continue;
      i=t.indexOf(ch,i); if(i<0)return null;
      idx.push(i++);
    }
    return idx;
  }
  function highlight(s,m){
    const set=new Set(m);
    return [...s].map((ch,i)=>{
      if(!set.has(i))return document.createTextNode(ch);
      const k=document.createElement('mark'); k.textContent=ch; return k;
    });
  }
  let items=[],sel=0;
  function setSel(i){
    const opts=list.querySelectorAll('.cmdk-item');
    if(!opts.length)return;
    sel=(i+opts.length)%opts.length;
    opts.forEach((o,k)=>o.setAttribute('aria-selected',k===sel?'true':'false'));
    input.setAttribute('aria-activedescendant',opts[sel].id);
    opts[sel].scrollIntoView({block:'nearest'});
  }
  function render(){
    const q=input.value.trim(), ql=q.toLowerCase();
    const res=[];
    CMDS.forEach(c=>{
      const m=q?match(q,c.label):[];
      if(m) res.push({c,m,s:c.label.toLowerCase().includes(ql)?0:1});
      else if(c.hint.toLowerCase().includes(ql)) res.push({c,m:[],s:2});
    });
    if(q) res.sort((a,b)=>a.s-b.s);
    items=res; list.innerHTML='';
    if(!res.length){
      list.innerHTML='<li class="cmdk-empty" role="presentation">No matching commands. Try “terminal”.</li>';
      input.removeAttribute('aria-activedescendant');
      return;
    }
    let lastG=null;
    res.forEach((r,i)=>{
      if(!q&&r.c.g!==lastG){
        const h=document.createElement('li');
        h.className='cmdk-group'; h.setAttribute('role','presentation'); h.textContent=r.c.g;
        list.appendChild(h); lastG=r.c.g;
      }
      const li=document.createElement('li');
      li.className='cmdk-item'; li.id='cmdk-o'+i; li.setAttribute('role','option');
      li.style.setProperty('--n',i);
      li.innerHTML=`<span class="cmdk-ico"><i class="${r.c.brand?'fab':'fas'} ${r.c.ic}"></i></span><span class="cmdk-lbl"></span><span class="cmdk-hint"></span>`;
      li.querySelector('.cmdk-lbl').append(...highlight(r.c.label,r.m));
      li.querySelector('.cmdk-hint').textContent=r.c.hint;
      li.addEventListener('mousemove',()=>{ if(sel!==i)setSel(i); });
      li.addEventListener('click',()=>runSel(i));
      list.appendChild(li);
    });
    setSel(0);
  }
  let palFocus=null;
  function openPal(){
    if(pal.classList.contains('open'))return;
    closeTerm(false);
    palFocus=document.activeElement;
    input.value=''; render();
    pal.classList.add('open'); pal.setAttribute('aria-hidden','false');
    setTimeout(()=>input.focus(),30);
  }
  function closePal(restore){
    if(!pal.classList.contains('open'))return;
    pal.classList.remove('open'); pal.setAttribute('aria-hidden','true');
    input.blur();
    if(restore!==false&&palFocus&&palFocus.focus&&palFocus!==document.body) palFocus.focus({preventScroll:true});
  }
  function runSel(i){
    const r=items[i]; if(!r)return;
    closePal(false);
    setTimeout(()=>r.c.run(),80);
  }
  input.addEventListener('input',render);
  input.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'){e.preventDefault();setSel(sel+1);}
    else if(e.key==='ArrowUp'){e.preventDefault();setSel(sel-1);}
    else if(e.key==='Enter'){e.preventDefault();runSel(sel);}
    else if(e.key==='Tab'){e.preventDefault();}
  });
  pal.querySelector('[data-close]').addEventListener('click',()=>closePal());
  if(openBtn) openBtn.addEventListener('click',openPal);

  /* ── Terminal ── */
  let booted=false,termFocus=null;
  const hist=[]; let hIdx=0;
  function print(html,cls){
    const d=document.createElement('div');
    if(cls)d.className=cls;
    d.innerHTML=html;
    tOut.appendChild(d);
    tBody.scrollTop=tBody.scrollHeight;
  }
  function openTerm(){
    closePal(false);
    if(!term.classList.contains('open')) termFocus=document.activeElement;
    term.classList.add('open'); term.setAttribute('aria-hidden','false');
    if(!booted){ booted=true; boot(); }
    setTimeout(()=>tIn.focus({preventScroll:true}),60);
  }
  function closeTerm(restore){
    if(!term.classList.contains('open'))return;
    term.classList.remove('open'); term.setAttribute('aria-hidden','true');
    tIn.blur();
    if(restore!==false&&termFocus&&termFocus.focus&&termFocus!==document.body) termFocus.focus({preventScroll:true});
  }
  document.getElementById('termClose').addEventListener('click',()=>closeTerm());
  tBody.addEventListener('click',()=>{ if(!getSelection().toString()) tIn.focus({preventScroll:true}); });

  const ART=[
    '██████╗ ███╗   ██╗',
    '██╔══██╗████╗  ██║',
    '██████╔╝██╔██╗ ██║',
    '██╔═══╝ ██║╚██╗██║',
    '██║     ██║ ╚████║',
    '╚═╝     ╚═╝  ╚═══╝'
  ];
  function boot(){
    print(`<span class="t-art">${ART.join('\n')}</span>`);
    print(`<span class="t-dim">pn-shell v5 · last login: ${esc(new Date().toLocaleString())}</span>`);
    print(`Welcome! Type <span class="t-acc">help</span> to see what this terminal can do.\n`);
  }
  const row=(c,d)=>`  <span class="t-p">${esc(c.padEnd(20))}</span><span class="t-dim">${esc(d)}</span>`;
  const SEC_ALIAS={home:'hero',hero:'hero',top:'hero',about:'about',me:'about',exp:'experience',experience:'experience',
    work:'experience',journey:'experience',skills:'skills',stack:'skills',tech:'skills',projects:'projects',
    edu:'education',education:'education',certs:'education',contact:'contact',hire:'contact'};
  const FILES={'about.md':'about','experience.json':'experience','stack.yml':'skills','projects':'projects',
    'education.json':'education','contact.sh':'contact','resume.pdf':'resume'};

  const C={
    help:()=>[
      '<span class="t-acc">Available commands</span>',
      row('whoami','who am I talking to?'),
      row('about','short bio'),
      row('experience','work history'),
      row('skills','tech stack'),
      row('projects','things I have built'),
      row('education','degrees & certifications'),
      row('contact','how to reach me'),
      row('socials','GitHub / LinkedIn'),
      row('resume','download my CV'),
      row('neofetch','system info, developer edition'),
      row('goto <section>','scroll to a section'),
      row('theme [light|dark]','switch the colour theme'),
      row('ls / cat <file>','browse the portfolio as files'),
      row('history · date · echo','the usual'),
      row('clear · exit','clear screen / close terminal'),
      '<span class="t-dim">Tip: ↑/↓ recalls history, Tab autocompletes.</span>'
    ].join('\n'),
    whoami:()=>`<span class="t-ok">Pratyush Nandi</span> — Software Developer @ <span class="t-acc">Eltern Segen Technologie Pvt. Ltd.</span>\nMCA @ Adamas University · Kolkata, India`,
    about:()=>esc(txt(document.querySelector('.abb-body'))),
    experience:()=>{
      const out=[`<span class="t-ok">▸ ${esc(txt(document.querySelector('.ef-top h3')))}</span> <span class="t-y">[current]</span> — ${esc(txt(document.querySelector('.ef-co')))}`];
      document.querySelectorAll('.tl-item').forEach(it=>{
        out.push(`  <span class="t-acc">${esc(txt(it.querySelector('.tl-year')).padEnd(13))}</span>${esc(txt(it.querySelector('h4')))} <span class="t-dim">· ${esc(txt(it.querySelector('.tl-sub')))}</span>`);
      });
      return out.join('\n');
    },
    skills:()=>[...document.querySelectorAll('.sk-panel')].map(p=>{
      const name=p.id.replace('p-','');
      const s=[...p.querySelectorAll('.sk-name')].map(txt).join(', ');
      return `  <span class="t-p">${esc(name.padEnd(11))}</span>${esc(s)}`;
    }).join('\n'),
    projects:()=>[...document.querySelectorAll('.pj-card')].map(c=>{
      const a=c.querySelector('.pj-link-btn');
      const tech=[...c.querySelectorAll('.pj-tech span')].map(txt).join(' · ');
      return `  <span class="t-ok">◆ ${esc(txt(c.querySelector('h3')))}</span> <span class="t-dim">[${esc(tech)}]</span>`+
        (a?`\n    <a href="${esc(a.href)}" target="_blank" rel="noopener noreferrer">${esc(a.href)}</a>`:'');
    }).join('\n'),
    education:()=>{
      const ed=[...document.querySelectorAll('.edu-card')].map(c=>{
        const row2=[...c.querySelectorAll('.ec-row span')].map(txt);
        return `  <span class="t-acc">${esc((row2[0]||'').padEnd(13))}</span>${esc(txt(c.querySelector('h4')))} <span class="t-y">${esc(row2[1]||'')}</span>\n  ${' '.repeat(13)}<span class="t-dim">${esc(txt(c.querySelector('.ec-inst')))}</span>`;
      });
      const ce=[...document.querySelectorAll('.cert-card h4')].map(h=>`  <span class="t-ok">✓</span> ${esc(txt(h))}`);
      return ed.join('\n')+'\n\n<span class="t-p">Certifications</span>\n'+ce.join('\n');
    },
    contact:()=>[
      `  <span class="t-p">email   </span><a href="mailto:${EMAIL}">${EMAIL}</a>`,
      `  <span class="t-p">phone   </span><a href="tel:${PHONE.replace(/-/g,'')}">${PHONE}</a>`,
      `  <span class="t-p">location</span> Kolkata, West Bengal, India`,
      `<span class="t-dim">Open to freelance, full-time & collaborations. Try </span><span class="t-acc">goto contact</span>`
    ].join('\n'),
    socials:()=>`  <span class="t-p">github  </span><a href="${GH}" target="_blank" rel="noopener noreferrer">${GH}</a>\n  <span class="t-p">linkedin</span><a href="${LI}" target="_blank" rel="noopener noreferrer">${LI}</a>`,
    resume:()=>{ downloadCV(); return '<span class="t-ok">✓ Downloading résumé…</span>'; },
    neofetch:()=>{
      const up=Math.round(performance.now()/1000);
      const theme=document.documentElement.getAttribute('data-theme')==='light'?'Light':'Dark';
      const info=[
        `<span class="t-ok">pratyush</span>@<span class="t-acc">portfolio</span>`,
        '<span class="t-dim">──────────────────</span>',
        `<span class="t-p">Role</span>: Software Developer`,
        `<span class="t-p">Company</span>: Eltern Segen Technologie`,
        `<span class="t-p">Degree</span>: MCA, Adamas University`,
        `<span class="t-p">Stack</span>: React · Node.js · Python`,
        `<span class="t-p">Shell</span>: pn-shell v5`,
        `<span class="t-p">Theme</span>: ${theme}`,
        `<span class="t-p">Uptime</span>: ${Math.floor(up/60)}m ${up%60}s`,
        '<span style="color:#7c3aed">███</span><span style="color:#06b6d4">███</span><span style="color:#10b981">███</span><span style="color:#f59e0b">███</span><span style="color:#ec4899">███</span>'
      ];
      return ART.map((l,i)=>`<span class="t-art">${l}</span>   ${info[i]||''}`).concat(info.slice(ART.length).map(l=>' '.repeat(21)+l)).join('\n');
    },
    goto:args=>{
      const k=(args[0]||'').toLowerCase().replace(/^#/,'');
      const id=SEC_ALIAS[k];
      if(!id)return `<span class="t-err">goto: unknown section "${esc(k)}"</span>\n<span class="t-dim">try: home, about, experience, skills, projects, education, contact</span>`;
      setTimeout(()=>{ closeTerm(false); go(id); },250);
      return `<span class="t-ok">→ navigating to #${id}</span>`;
    },
    theme:args=>{
      const t=(args[0]||'').toLowerCase();
      if(t&&t!=='light'&&t!=='dark')return '<span class="t-err">usage: theme [light|dark]</span>';
      setTheme(t||null);
      return `<span class="t-ok">✓ theme switched</span>`;
    },
    ls:()=>Object.keys(FILES).map(f=>f==='projects'?`<span class="t-acc">${f}/</span>`:f==='resume.pdf'?`<span class="t-y">${f}</span>`:f).join('   '),
    cat:args=>{
      const f=(args[0]||'').replace(/\/$/,'');
      if(!f)return '<span class="t-err">usage: cat &lt;file&gt;</span> <span class="t-dim">(see ls)</span>';
      const c=FILES[f];
      if(!c)return `<span class="t-err">cat: ${esc(f)}: No such file or directory</span>`;
      return C[c]([]);
    },
    pwd:()=>'/home/pratyush/portfolio',
    date:()=>esc(new Date().toString()),
    echo:args=>esc(args.join(' ')),
    history:()=>hist.map((h,i)=>`  <span class="t-dim">${String(i+1).padStart(3)}</span>  ${esc(h)}`).join('\n')||'<span class="t-dim">(empty)</span>',
    sudo:()=>'<span class="t-err">[sudo] permission denied</span> — nice try 😄 You can <span class="t-acc">hire</span> me instead.',
    hire:()=>{ setTimeout(()=>{ closeTerm(false); go('contact'); },300); return '<span class="t-ok">Great choice! Opening the contact form…</span>'; },
    clear:()=>{ tOut.innerHTML=''; return null; },
    exit:()=>{ setTimeout(()=>closeTerm(),150); return '<span class="t-dim">logout</span>'; }
  };
  C.cls=C.clear; C.man=C.help; C['?']=C.help; C.cv=C.resume; C.stack=C.skills; C.work=C.projects;

  function exec(raw){
    const line=raw.trim();
    print(`<span class="t-ok">➜</span> <span class="t-acc">~</span> <span class="t-cmd">${esc(line)}</span>`);
    if(!line)return;
    hist.push(line); hIdx=hist.length;
    const [cmd,...args]=line.split(/\s+/);
    const fn=C[cmd.toLowerCase()];
    if(!fn){ print(`<span class="t-err">command not found: ${esc(cmd)}</span> <span class="t-dim">— type</span> <span class="t-acc">help</span>`); return; }
    const out=fn(args);
    if(out!=null) print(out);
  }
  tIn.addEventListener('keydown',e=>{
    if(e.key==='Enter'){ e.preventDefault(); exec(tIn.value); tIn.value=''; }
    else if(e.key==='ArrowUp'){ e.preventDefault(); if(hIdx>0){hIdx--;tIn.value=hist[hIdx];} }
    else if(e.key==='ArrowDown'){ e.preventDefault(); if(hIdx<hist.length-1){hIdx++;tIn.value=hist[hIdx];}else{hIdx=hist.length;tIn.value='';} }
    else if(e.key==='Tab'){
      e.preventDefault();
      const v=tIn.value.trim().toLowerCase();
      if(!v)return;
      const hits=Object.keys(C).filter(k=>k.startsWith(v)&&k.length>1);
      if(hits.length===1) tIn.value=hits[0]+' ';
      else if(hits.length>1) print(`<span class="t-dim">${hits.map(esc).join('   ')}</span>`);
    }
    else if(e.key==='l'&&e.ctrlKey){ e.preventDefault(); tOut.innerHTML=''; }
  });

  /* ── Global shortcuts ── */
  document.addEventListener('keydown',e=>{
    if(document.documentElement.classList.contains('is-loading'))return;
    const k=e.key;
    if((e.ctrlKey||e.metaKey)&&k&&k.toLowerCase()==='k'){
      e.preventDefault();
      pal.classList.contains('open')?closePal():openPal();
      return;
    }
    if(k==='Escape'){
      if(pal.classList.contains('open'))closePal();
      else if(term.classList.contains('open'))closeTerm();
      return;
    }
    const t=e.target, tag=(t.tagName||'').toLowerCase();
    if(k==='`'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!['input','textarea','select'].includes(tag)&&!t.isContentEditable){
      e.preventDefault();
      term.classList.contains('open')?closeTerm():openTerm();
    }
  });

  window.PN={openPal,openTerm,toast};
})();

/* ══ 33. IDE STATUS BAR ══
   File / language follow the active section; Ln tracks scroll, Col tracks the mouse. */
(function(){
  const bar=document.getElementById('ideBar');if(!bar)return;
  const file=document.getElementById('ibFile'), lang=document.getElementById('ibLang');
  const pos=document.getElementById('ibPos'), clock=document.getElementById('ibClock');
  const MAP={hero:['home.tsx','{ } TypeScript React'],about:['about.md','Markdown'],
    experience:['experience.json','{ } JSON'],skills:['stack.yml','YAML'],projects:['projects.tsx','{ } TypeScript React'],
    education:['education.json','{ } JSON'],contact:['contact.sh','Shell Script']};
  let cur='hero',mx=0,ticking=false;
  function flash(el){ el.classList.remove('ib-flash'); void el.offsetWidth; el.classList.add('ib-flash'); }
  function upd(){
    ticking=false;
    const a=document.querySelector('.n-links a.act');
    const id=a?a.getAttribute('href').slice(1):'hero';
    if(id!==cur&&MAP[id]){
      cur=id; file.textContent=MAP[id][0]; lang.textContent=MAP[id][1];
      flash(file); flash(lang);
    }
    pos.textContent=`Ln ${Math.floor(scrollY/24)+1}, Col ${Math.floor(mx/9)+1}`;
  }
  const req=()=>{ if(!ticking){ticking=true;requestAnimationFrame(upd);} };
  window.addEventListener('scroll',req,{passive:true});
  document.addEventListener('mousemove',e=>{mx=e.clientX;req();},{passive:true});
  function tick(){
    const d=new Date();
    clock.textContent=d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  }
  tick(); setInterval(tick,15000); upd();
  const ibCmd=document.getElementById('ibCmd'), ibTerm=document.getElementById('ibTerm');
  if(ibCmd) ibCmd.addEventListener('click',()=>window.PN&&window.PN.openPal());
  if(ibTerm) ibTerm.addEventListener('click',()=>window.PN&&window.PN.openTerm());
})();

/* ══ 34. NAV LINK SCRAMBLE ON HOVER ══ */
(function(){
  if(REDUCE_MOTION)return;
  const glyphs='!<>-_\\/[]{}=+*^?#01';
  document.querySelectorAll('.n-links a').forEach(a=>{
    const final=a.textContent; let iv=0;
    a.addEventListener('mouseenter',()=>{
      clearInterval(iv); let f=0;
      iv=setInterval(()=>{
        a.textContent=[...final].map((c,i)=>i<f/2?c:glyphs[Math.random()*glyphs.length|0]).join('');
        if(++f>final.length*2){clearInterval(iv);a.textContent=final;}
      },28);
    });
    a.addEventListener('mouseleave',()=>{clearInterval(iv);a.textContent=final;});
  });
})();

/* ══ 35. CLICK SPARKS ══ */
(function(){
  if(REDUCE_MOTION)return;
  document.addEventListener('pointerdown',e=>{
    if(e.button!==0||e.target.closest('input,textarea,select,.term,.cmdk,#preloader'))return;
    const b=document.createElement('div');
    b.className='spark-burst';
    b.style.left=e.clientX+'px'; b.style.top=e.clientY+'px';
    for(let i=0;i<8;i++){
      const s=document.createElement('i');
      s.style.setProperty('--a',(i*45+Math.random()*14)+'deg');
      b.appendChild(s);
    }
    document.body.appendChild(b);
    setTimeout(()=>b.remove(),620);
  },{passive:true});
})();

/* ══ 36. MARQUEE SCROLL-VELOCITY SKEW ══ */
(function(){
  const wrap=document.querySelector('.marquee-wrap');
  if(!wrap||REDUCE_MOTION)return;
  let lastY=scrollY,lastT=performance.now(),raf=0,reset=0;
  window.addEventListener('scroll',()=>{
    if(raf)return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      const now=performance.now(), dt=Math.max(16,now-lastT), v=(scrollY-lastY)/dt*6;
      lastY=scrollY; lastT=now;
      wrap.style.setProperty('--mq-skew',(-Math.max(-10,Math.min(10,v))).toFixed(2)+'deg');
      clearTimeout(reset);
      reset=setTimeout(()=>wrap.style.setProperty('--mq-skew','0deg'),140);
    });
  },{passive:true});
})();

/* ══ 37. CURSOR CONTEXT LABELS ══ */
(function(){
  const t=document.getElementById('cur-txt');
  if(!t||matchMedia('(pointer: coarse)').matches)return;
  const bind=(sel,label)=>document.querySelectorAll(sel).forEach(el=>{
    el.addEventListener('mouseenter',()=>{t.textContent=label;document.body.classList.add('c-view');});
    el.addEventListener('mouseleave',()=>document.body.classList.remove('c-view'));
  });
  bind('.pj-card','view');
  bind('.timeline-scroll-wrap','drag');
  bind('.ec-strip-view','open');
})();

/* ══ 38. HERO SCROLL-OUT ══ */
window.addEventListener('load',function(){
  if(typeof gsap==='undefined'||typeof ScrollTrigger==='undefined'||REDUCE_MOTION)return;
  gsap.to('.hero-wrap',{
    scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:true},
    opacity:.2,scale:.95,ease:'none'
  });
  gsap.to('.hero-net',{
    scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:true},
    opacity:0,ease:'none'
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
