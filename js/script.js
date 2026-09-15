(function(){
'use strict';

let lang = 'en';
let allProjects = [];

/* ── Fetch projects.json ── */
async function loadProjects(){
  try{
    const saved = localStorage.getItem('sp_projects');
    if(saved){ allProjects = JSON.parse(saved); }
    else {
      const res = await fetch('projects.json');
      const data = await res.json();
      allProjects = data.projects || [];
    }
  } catch(e){
    allProjects = [];
  }
  renderProjects();
  renderShop();
  updateStats();
}

/* ── Language ── */
function setLang(l){
  lang = l;
  document.querySelectorAll('[data-'+l+']').forEach(el=>{
    const val = el.getAttribute('data-'+l);
    if(el.tagName==='INPUT'||el.tagName==='TEXTAREA') el.placeholder=val;
    else el.textContent=val;
  });
  document.getElementById('langToggle').textContent = l==='en'?'ES':'EN';
  document.documentElement.lang = l==='en'?'en':'es';
  if(allProjects.length){ renderProjects(getActiveFilter()); renderShop(); }
}
document.getElementById('langToggle').addEventListener('click',()=>setLang(lang==='en'?'es':'en'));

function getActiveFilter(){
  const active = document.querySelector('.filter-btn.active');
  return active ? active.dataset.filter : 'all';
}

/* ── Stats counter ── */
function updateStats(){
  const el = document.getElementById('statProjects');
  if(!el) return;
  const target = allProjects.length;
  let count = 0;
  const tick = setInterval(()=>{
    count = Math.min(count+1, target);
    el.textContent = count;
    if(count>=target) clearInterval(tick);
  }, 80);
}

/* ── Render project cards ── */
function renderProjects(filter='all'){
  const grid = document.getElementById('projectsGrid');
  if(!grid) return;
  const list = filter==='all' ? allProjects : allProjects.filter(p=>(p.category||[]).includes(filter));
  if(list.length===0){
    grid.innerHTML='<div class="no-projects"><p>No projects found.</p></div>';
    return;
  }
  grid.innerHTML = list.map(p=>buildProjectCard(p)).join('');
  grid.querySelectorAll('.btn-live-preview:not(:disabled)').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      openPreview(parseInt(btn.closest('.project-card').dataset.id));
    });
  });
  grid.querySelectorAll('.project-buy:not(:disabled)').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      openPurchaseModal(parseInt(btn.dataset.id));
    });
  });
  grid.querySelectorAll('.reveal').forEach(el=>revealObs.observe(el));
}

function buildProjectCard(p){
  const desc = lang==='es' && p.description_es ? p.description_es : p.description;
  const techStr = (p.tech||[]).join(' · ');
  const cats = (p.category||[]).map(c=>`<span>${c}</span>`).join('');
  const soon = p.published===false;
  const priceLabel = soon
    ? (lang==='en'?'Coming soon':'Próximamente')
    : p.type==='custom'
      ? (lang==='en'?'Custom only':'Solo a medida')
      : p.type==='free' ? (lang==='en'?'Free':'Gratis')
      : '$'+p.price;
  const buyClass = (p.type==='custom'?'project-buy project-custom':'project-buy') + (soon?' project-soon':'');

  const overlayBtn = soon
    ? `<button class="btn-live-preview btn-coming-soon" disabled>${lang==='en'?'Coming soon':'Próximamente'}</button>`
    : `<button class="btn-live-preview">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          ${lang==='en'?'Live preview':'Ver en vivo'}
        </button>`;

  return `
  <div class="project-card reveal ${p.featured?'project-featured':''} ${soon?'project-card--soon':''}" data-id="${p.id}" data-category="${(p.category||[]).join(' ')}">
    ${p.featured?`<div class="featured-ribbon">${lang==='en'?'Featured':'Destacado'}</div>`:''}
    <div class="project-preview" style="background:${p.thumbnail_color||'#1a1a1a'}">
      <div class="project-mockup-dynamic">
        <div class="pmd-bar"><span></span><span></span><span></span></div>
        <div class="pmd-body">
          <div class="pmd-hero" style="background:linear-gradient(135deg,${p.accent_color||'#E8FF47'}22,${p.thumbnail_color||'#1a1a1a'})"></div>
          <div class="pmd-rows"><div></div><div style="width:70%"></div><div style="width:50%"></div></div>
          <div class="pmd-grid"><div></div><div></div><div></div></div>
        </div>
      </div>
      <div class="project-overlay">
        ${overlayBtn}
      </div>
    </div>
    <div class="project-info">
      <div class="project-tags">${cats}</div>
      <h3>${p.title}</h3>
      <p>${desc||''}</p>
      <div class="project-footer">
        <span class="project-tech">${techStr}</span>
        <button class="${buyClass}" data-id="${p.id}" ${soon?'disabled':''}>${priceLabel}</button>
      </div>
    </div>
  </div>`;
}

/* ── Render shop ── */
function renderShop(){
  const grid = document.getElementById('shopGrid');
  if(!grid) return;
  const forSale = allProjects.filter(p=>p.type==='sale');
  if(forSale.length===0){
    grid.innerHTML='<p style="color:var(--fg3);text-align:center;padding:40px;grid-column:1/-1;">No templates for sale yet.</p>';
    return;
  }
  grid.innerHTML = forSale.map(p=>{
    const desc = lang==='es' && p.description_es ? p.description_es : p.description;
    const techList = (p.tech||[]).map(t=>`<li>✓ ${t}</li>`).join('');
    const soon = p.published===false;
    return `
    <div class="shop-card reveal ${p.featured?'featured-card':''} ${soon?'shop-card--soon':''}">
      ${soon
        ? `<div class="shop-badge soon-badge">${lang==='en'?'Coming soon':'Próximamente'}</div>`
        : p.featured?`<div class="shop-badge featured-badge">${lang==='en'?'Featured':'Destacado'}</div>`:''}
      <div class="shop-icon" style="color:${p.accent_color||'#E8FF47'}">${getIcon(p.category)}</div>
      <h3>${p.title}</h3>
      <p>${desc||''}</p>
      <ul>${techList}</ul>
      <div class="shop-price" style="color:${p.accent_color||'#E8FF47'}">$${p.price} <sub>CAD</sub></div>
      <button class="btn-buy" data-id="${p.id}" style="background:${soon?'':(p.accent_color||'#E8FF47')}" ${soon?'disabled':''}>${soon?(lang==='en'?'Coming soon':'Próximamente'):(lang==='en'?'Buy now':'Comprar ahora')}</button>
    </div>`;
  }).join('');
  grid.querySelectorAll('.btn-buy:not(:disabled)').forEach(btn=>{
    btn.addEventListener('click',()=>openPurchaseModal(parseInt(btn.dataset.id)));
  });
  grid.querySelectorAll('.reveal').forEach(el=>revealObs.observe(el));
}

function getIcon(cats=[]){
  if(cats.includes('fullstack')) return '🚀';
  if(cats.includes('design')) return '🎨';
  if(cats.includes('template')) return '⚡';
  return '💻';
}

/* ── Filters ── */
document.querySelectorAll('.filter-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderProjects(btn.dataset.filter);
  });
});

/* ── Live preview ── */
function openPreview(id){
  const p = allProjects.find(x=>x.id===id);
  if(!p || p.published===false) return;
  const overlay = document.getElementById('previewOverlay');
  const iframe = document.getElementById('previewIframe');
  document.getElementById('previewProjectTitle').textContent = p.title;
  iframe.src = '';
  overlay.classList.add('open');
  document.body.style.overflow='hidden';
  setTimeout(()=>{ iframe.src = p.preview_url; }, 200);
  const buyBtn = document.getElementById('previewBuyBtn');
  if(p.type==='custom'){
    buyBtn.textContent = lang==='en'?'Request custom':'Solicitar a medida';
    buyBtn.onclick=()=>{ closePreview(); document.querySelector('#contact').scrollIntoView({behavior:'smooth'}); };
  } else {
    buyBtn.textContent = lang==='en'?`Buy — $${p.price}`:`Comprar — $${p.price}`;
    buyBtn.onclick=()=>openPurchaseModal(p.id);
  }
}
function closePreview(){
  const overlay = document.getElementById('previewOverlay');
  overlay.classList.remove('open');
  document.body.style.overflow='';
  setTimeout(()=>{ document.getElementById('previewIframe').src=''; },300);
}
document.getElementById('previewBack').addEventListener('click', closePreview);

document.querySelectorAll('.dev-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.dev-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const wrap = document.getElementById('previewFrameWrap');
    const iframe = document.getElementById('previewIframe');
    const w = btn.dataset.width;
    if(w==='100%'){ iframe.style.width='100%'; wrap.classList.remove('device-narrow'); }
    else { iframe.style.width=w; wrap.classList.add('device-narrow'); }
  });
});

document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ closePreview(); closePurchaseModal(); }});

/* ── Purchase modal ── */
function openPurchaseModal(id){
  const p = allProjects.find(x=>x.id===id);
  if(!p || p.published===false) return;
  document.getElementById('modalTitle').textContent = p.title;
  document.getElementById('modalPrice').textContent = '$'+p.price+' CAD';
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow='hidden';
}
function closePurchaseModal(){
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow='';
}
document.getElementById('modalClose').addEventListener('click', closePurchaseModal);
document.getElementById('modalOverlay').addEventListener('click',e=>{ if(e.target===document.getElementById('modalOverlay')) closePurchaseModal(); });
document.querySelectorAll('.method-btn[data-url]').forEach(btn=>{
  btn.addEventListener('click',()=>window.open(btn.dataset.url,'_blank','noopener'));
});
document.getElementById('stripeBtn').addEventListener('click',e=>e.preventDefault());

/* ── Custom cursor (desktop only) ── */
const cursor = document.getElementById('cursor');
const cursorDot = document.getElementById('cursorDot');
if(cursor && window.matchMedia('(pointer:fine)').matches){
  let mx=0,my=0,cx=0,cy=0;
  document.addEventListener('mousemove',e=>{ mx=e.clientX; my=e.clientY; cursorDot.style.left=mx+'px'; cursorDot.style.top=my+'px'; });
  (function anim(){ cx+=(mx-cx)*.15; cy+=(my-cy)*.15; cursor.style.left=cx+'px'; cursor.style.top=cy+'px'; requestAnimationFrame(anim); })();
  document.body.addEventListener('mouseover',e=>{
    if(e.target.closest('a,button,.project-card,.shop-card')) cursor.classList.add('hovering');
  });
  document.body.addEventListener('mouseout',e=>{
    if(e.target.closest('a,button,.project-card,.shop-card')) cursor.classList.remove('hovering');
  });
}

/* ── Reveal observer ── */
const revealObs = new IntersectionObserver(entries=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); revealObs.unobserve(e.target); }});
},{threshold:.08,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal').forEach(el=>revealObs.observe(el));

/* ── Nav ── */
const nav = document.getElementById('nav');
const scrollTopBtn = document.getElementById('scrollTop');
window.addEventListener('scroll',()=>{
  nav.classList.toggle('scrolled',window.scrollY>60);
  scrollTopBtn.classList.toggle('visible',window.scrollY>500);
});
scrollTopBtn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));

/* ── Hamburger ── */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click',()=>{ const o=navLinks.classList.toggle('open'); document.body.style.overflow=o?'hidden':''; });
navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{ navLinks.classList.remove('open'); document.body.style.overflow=''; }));

/* ── Smooth scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',function(e){
    const t=document.querySelector(this.getAttribute('href'));
    if(t){ e.preventDefault(); window.scrollTo({top:t.getBoundingClientRect().top+window.scrollY-80,behavior:'smooth'}); }
  });
});

/* ── Contact form ──
   Replace FORMSPREE_ID with your real Formspree form ID (formspree.io — free tier)
   so this form actually sends emails. Until then, it simulates success. */
const form = document.getElementById('contactForm');
if(form){
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const btn=document.getElementById('submitBtn');
    const txtBtn=document.getElementById('btn-text');
    const txtLoad=document.getElementById('btn-load');
    const successEl=document.getElementById('formSuccess');
    const errorEl=document.getElementById('formError');
    successEl.style.display='none'; errorEl.style.display='none';
    const name=form.querySelector('[name=name]').value.trim();
    const email=form.querySelector('[name=email]').value.trim();
    const type=form.querySelector('[name=type]').value;
    const msg=form.querySelector('[name=message]').value.trim();
    if(!name||!email||!type||!msg||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      errorEl.style.display='block'; return;
    }
    btn.disabled=true; txtBtn.style.display='none'; txtLoad.style.display='inline';
    try{
      const FORMSPREE='FORMSPREE_ID';
      if(FORMSPREE!=='FORMSPREE_ID'){
        const fd=new FormData(form);
        const r=await fetch(`https://formspree.io/f/${FORMSPREE}`,{method:'POST',body:fd,headers:{Accept:'application/json'}});
        if(!r.ok) throw new Error();
      } else { await new Promise(r=>setTimeout(r,1000)); }
      successEl.style.display='block'; form.reset();
    } catch{ errorEl.style.display='block'; }
    finally{ btn.disabled=false; txtBtn.style.display='inline'; txtLoad.style.display='none'; }
  });
}

/* ── Footer year ── */
const yearEl = document.getElementById('year');
if(yearEl) yearEl.textContent = new Date().getFullYear();

/* ── Init ── */
loadProjects();

})();