(() => {
  const pages = window.BOOK_PAGES || [];
  const pageEl = document.getElementById('bookPage');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageNumber = document.getElementById('pageNumber');
  const pagePart = document.getElementById('pagePart');
  const progressBar = document.getElementById('progressBar');
  const tocBtn = document.getElementById('tocBtn');
  const tocCloseBtn = document.getElementById('tocCloseBtn');
  const tocPanel = document.getElementById('tocPanel');
  const tocList = document.getElementById('tocList');
  const scrim = document.getElementById('scrim');

  let current = Math.max(0, Math.min(pages.length - 1, Number(location.hash.replace('#p','')) - 1 || 0));

  const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));

  function opening(p){
    return `
      <span class="eyebrow">${esc(p.part)} · OPENING</span>
      <h1 class="page-title">${esc(p.title)}</h1>
      <p class="subtitle">${esc(p.subtitle)}</p>
      <div class="hero-visual" aria-hidden="true">
        <div class="lifeguard"><div class="cap"></div><div class="head"></div><div class="body"></div><div class="cross"></div><div class="tower"></div></div>
        <div class="sea"></div>
      </div>
      <p class="lead">${esc(p.lead)}</p>
      <div class="triad">${p.triad.map((t,i)=>`<div><b>0${i+1}</b>${esc(t)}</div>`).join('')}</div>
      <div class="quote-box">${esc(p.quote)}</div>
      <div class="memory-box"><small>10초 암기</small><strong>${esc(p.memory)}</strong></div>
      <div class="footer-meta"><span>${esc(p.related)}</span><span>문제은행 기반 학습용 재구성</span></div>`;
  }

  function coreMap(p){
    return `
      <span class="eyebrow">${esc(p.part)} · STUDY MAP</span>
      <h1 class="page-title">${esc(p.title)}</h1>
      <p class="subtitle">${esc(p.subtitle)}</p>
      <p class="lead">${esc(p.lead)}</p>
      <div class="core-grid">${p.cards.map(c=>`
        <article class="core-card"><span class="core-icon" aria-hidden="true">${esc(c[3])}</span><span class="num">${esc(c[0])}</span><h3>${esc(c[1])}</h3><p>${esc(c[2])}</p></article>`).join('')}</div>
      <div class="memory-box"><small>10초 암기</small><strong>${esc(p.memory)}</strong></div>
      <div class="footer-meta"><span>${esc(p.related)}</span><span>8개 축으로 개념 압축</span></div>`;
  }

  function priority(p){
    return `
      <span class="eyebrow">${esc(p.part)} · CORE 01</span>
      <h1 class="page-title">${esc(p.title)}</h1>
      <p class="subtitle">${esc(p.subtitle)}</p>
      <p class="lead">${esc(p.lead)}</p>
      <div class="priority" aria-label="임무 우선순위">
        ${p.priority.map((x,i)=>`<div class="layer l${i+1}">${i+1}. ${esc(x)}</div>`).join('')}
      </div>
      <div class="duty-compare">
        <section class="duty-box primary"><h3>1차적 임무</h3><ul>${p.primary.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>
        <section class="duty-box secondary"><h3>2차적 임무</h3><ul>${p.secondary.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>
      </div>
      <div class="trap-box"><strong>시험에서는 이렇게 바꿔 묻는다</strong>${p.traps.map(t=>`<div class="trap-row"><span>${esc(t[0])}</span><b class="${t[1]==='O'?'ok':'no'}">${t[1]}</b></div>`).join('')}</div>
      <div class="memory-box"><small>10초 암기</small><strong>${esc(p.memory)}</strong></div>
      <div class="footer-meta"><span>${esc(p.related)}</span><span>문제은행 해설을 개념형으로 재구성</span></div>`;
  }

  function render(){
    const p = pages[current];
    if(!p) return;
    pageEl.className = `book-page ${p.type}`;
    pageEl.innerHTML = p.type === 'opening' ? opening(p) : p.type === 'core-map' ? coreMap(p) : priority(p);
    pageNumber.textContent = `${current + 1} / ${pages.length}`;
    pagePart.textContent = p.part;
    progressBar.style.width = `${((current + 1) / pages.length) * 100}%`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === pages.length - 1;
    location.hash = `p${current + 1}`;
    [...tocList.querySelectorAll('button')].forEach((b,i)=>b.classList.toggle('active',i===current));
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function go(n){ current = Math.max(0,Math.min(pages.length-1,n)); render(); }
  prevBtn.addEventListener('click',()=>go(current-1));
  nextBtn.addEventListener('click',()=>go(current+1));
  document.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft') go(current-1);
    if(e.key==='ArrowRight' || e.key===' ') go(current+1);
    if(e.key==='Escape') closeToc();
  });

  pages.forEach((p,i)=>{
    const li=document.createElement('li');
    const b=document.createElement('button');
    b.type='button'; b.textContent=`${i+1}. ${p.toc}`;
    b.addEventListener('click',()=>{go(i);closeToc();});
    li.appendChild(b);tocList.appendChild(li);
  });

  function openToc(){tocPanel.classList.add('open');tocPanel.setAttribute('aria-hidden','false');scrim.hidden=false;}
  function closeToc(){tocPanel.classList.remove('open');tocPanel.setAttribute('aria-hidden','true');scrim.hidden=true;}
  tocBtn.addEventListener('click',openToc);tocCloseBtn.addEventListener('click',closeToc);scrim.addEventListener('click',closeToc);
  window.addEventListener('hashchange',()=>{
    const n=Number(location.hash.replace('#p',''))-1;
    if(Number.isInteger(n)&&n>=0&&n<pages.length&&n!==current){current=n;render();}
  });
  render();
})();
