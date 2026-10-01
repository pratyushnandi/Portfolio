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
  let last=0,running=true;
  document.addEventListener('visibilitychange',()=>{running=!document.hidden;});
  function frame(t){
    requestAnimationFrame(frame);
    if(!running||t-last<55)return;
    last=t;
    ctx.fillStyle='rgba(6,8,18,0.055)';ctx.fillRect(0,0,innerWidth,innerHeight);
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
  const bar=document.getElementById('preBar'), num=document.getElementById('preNum');
  if(!loader)return;
  const cmd='node server --env=production --port=3000';
  let ci=0;
  const ti=setInterval(()=>{if(ci<cmd.length){cmdEl.textContent+=cmd[ci++];}else clearInterval(ti);},30);
  let pct=0;
  const pb=setInterval(()=>{pct=Math.min(pct+Math.random()*3,92);bar.style.width=pct+'%';num.textContent=Math.floor(pct);},45);
  setTimeout(()=>{o1.textContent='> Loading assets...';},500);
  setTimeout(()=>{o2.textContent='> Initialising animations...';},1100);
  setTimeout(()=>{o3.textContent='✓ Portfolio ready!';bar.style.width='100%';num.textContent='100';clearInterval(pb);},1900);
  const hide=()=>setTimeout(()=>loader.classList.add('gone'),2400);
  if(document.readyState==='complete')hide();else window.addEventListener('load',hide);
})();

/* ══ 3. CURSOR ══ */
(function(){
  const dot=document.getElementById('cur-dot');
  const ring=document.getElementById('cur-ring');
  const glow=document.getElementById('cur-glow');
  if(!dot||matchMedia('(pointer: coarse)').matches)return;
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

/* ══ 4. NAVBAR ══ */
(function(){
  const nav=document.getElementById('nav');
  const burger=document.getElementById('burger');
  const links=document.getElementById('nLinks');
  const topBtn=document.getElementById('topBtn');
  const prog=document.getElementById('navProg');
  const navAs=document.querySelectorAll('.n-links a');
  let ticking=false;
  function updateProg(){
    const sy=scrollY;
    nav.classList.toggle('scrolled',sy>60);
    topBtn.classList.toggle('show',sy>500);
    const max=document.documentElement.scrollHeight-innerHeight;
    prog.style.width=(max>0?(sy/max)*100:0)+'%';
    ticking=false;
  }
  window.addEventListener('scroll',()=>{
    if(ticking)return;
    ticking=true;
    requestAnimationFrame(updateProg);
  },{passive:true});
  window.addEventListener('scrollend',updateProg,{passive:true});
  burger.addEventListener('click',()=>{
    links.classList.toggle('open');
    const o=links.classList.contains('open');
    const sp=burger.querySelectorAll('span');
    sp[0].style.transform=o?'rotate(45deg) translate(5px,5px)':'';
    sp[1].style.opacity=o?'0':'1';
    sp[2].style.transform=o?'rotate(-45deg) translate(5px,-5px)':'';
  });
  navAs.forEach(a=>a.addEventListener('click',()=>links.classList.remove('open')));
  topBtn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
    const href=a.getAttribute('href');
    const t=document.querySelector(href);
    if(t){
      e.preventDefault();
      t.scrollIntoView({behavior:'smooth'});
      t.querySelectorAll('.reveal,.reveal-l,.reveal-r,.reveal-u').forEach(el=>el.classList.add('vis'));
      navAs.forEach(n=>n.classList.toggle('act',n.getAttribute('href')===href));
    }
  }));
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
      if(panel)panel.classList.add('active');
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
    cards.forEach((card,i)=>{
      const show=f==='all'||card.dataset.cat===f;
      if(show){card.classList.remove('out');card.style.transitionDelay=(i*.04)+'s';setTimeout(()=>card.classList.add('vis'),50);}
      else{card.classList.add('out');card.classList.remove('vis');}
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
      const x=((lx/innerWidth)*100).toFixed(1);
      const y=((ly/innerHeight)*100).toFixed(1);
      hero.style.background=`radial-gradient(ellipse at ${x}% ${y}%, rgba(124,58,237,.14) 0%, var(--bg) 55%)`;
      ticking=false;
    });
  },{passive:true});
  hero.addEventListener('mouseleave',()=>hero.style.background='');
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
  const inner=frame.querySelector('.ph-inner');
  frame.addEventListener('mousemove',e=>{
    const r=frame.getBoundingClientRect();
    const x=((e.clientX-r.left)/r.width-.5)*14;
    const y=((e.clientY-r.top)/r.height-.5)*-14;
    inner.style.transform=`perspective(700px) rotateX(${y}deg) rotateY(${x}deg)`;
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

  // Hero entrance
  const htl=gsap.timeline({delay:2.6});
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

  // Photo parallax
  gsap.to('.photo-scene',{
    scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:true},
    y:-70,ease:'none'
  });

  // Sections
  gsap.utils.toArray('.tl-card').forEach((el,i)=>{
    gsap.from(el,{scrollTrigger:{trigger:el,start:'top 92%'},opacity:0,y:24,duration:.55,delay:i*.07,ease:'power2.out'});
  });
  gsap.utils.toArray('.ef-tags span').forEach((el,i)=>{
    gsap.from(el,{scrollTrigger:{trigger:el,start:'top 95%'},opacity:0,scale:.8,duration:.4,delay:i*.06,ease:'back.out(2)'});
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
});

/* ══ 20. SECTION ACTIVE LINK ══ */
(function(){
  const navAs=document.querySelectorAll('.n-links a');
  const secs=Array.from(document.querySelectorAll('section[id]'));
  if(!secs.length||!navAs.length)return;
  const nav=document.getElementById('nav');
  let ticking=false;
  function setActive(){
    ticking=false;
    const offset=(nav?nav.offsetHeight:0)+10;
    let current=secs[0];
    for(const s of secs){
      if(s.getBoundingClientRect().top-offset<=0)current=s;
    }
    const id=current.getAttribute('id');
    navAs.forEach(a=>a.classList.toggle('act',a.getAttribute('href')==='#'+id));
  }
  window.addEventListener('scroll',()=>{
    if(ticking)return;
    ticking=true;
    requestAnimationFrame(setActive);
  },{passive:true});
  window.addEventListener('scrollend',setActive,{passive:true});
  setActive();
})();

/* ══ 21. CONTACT FORM ══ */
(function(){
  const form=document.getElementById('contactForm');if(!form)return;
  const btn=document.getElementById('cfBtn');
  const txt=document.getElementById('cfTxt'), load=document.getElementById('cfLoad');
  const status=document.getElementById('cfStatus');
  form.addEventListener('submit',async e=>{
    e.preventDefault();
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

/* ══ 22. PAGE FADE-IN ══ */
(function(){
  document.body.style.opacity='0';document.body.style.transition='opacity .5s ease';
  window.addEventListener('load',()=>setTimeout(()=>document.body.style.opacity='1',2300));
})();

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
  document.querySelectorAll('.sk-card,.pj-card,.tl-card').forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect();
      card.style.setProperty('--mx',(e.clientX-r.left)+'px');
      card.style.setProperty('--my',(e.clientY-r.top)+'px');
    });
  });
})();

/* ══ CONSOLE BRANDING ══ */
console.clear();
console.log('%c██████╗ ███╗   ██╗\n██╔══██╗████╗  ██║\n██████╔╝██╔██╗ ██║\n██╔═══╝ ██║╚██╗██║\n██║     ██║ ╚████║\n╚═╝     ╚═╝  ╚═══╝','font-size:11px;color:#7c3aed;font-family:monospace;line-height:1.4;');
console.log('%c⚡ Pratyush Nandi | Software Developer','font-size:14px;font-weight:900;color:#a78bfa;');
console.log('%c🏢 Eltern Segen Technologie Pvt. Ltd.','font-size:11px;color:#06b6d4;');
console.log('%c💻 Full-Stack · Python · React · Node.js','font-size:11px;color:#94a3b8;');
console.log('%c📍 Kolkata, West Bengal, India','font-size:11px;color:#94a3b8;');
console.log('%c📧 pratyushnandi100@gmail.com','font-size:11px;color:#94a3b8;');
