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
  const footer = p => `<div class="memory-box"><small>핵심 기억</small><strong>${esc(p.memory)}</strong></div><div class="footer-meta"><span>${esc(p.related)}</span><span>문제은행 역분석 기반 독립 재구성</span></div>`;

  function opening(p){
    return `<span class="eyebrow">${esc(p.part)} · OPENING</span><h1 class="page-title">${esc(p.title)}</h1><p class="subtitle">${esc(p.subtitle)}</p><div class="hero-visual" aria-hidden="true"><div class="lifeguard"><div class="cap"></div><div class="head"></div><div class="body"></div><div class="cross"></div><div class="tower"></div></div><div class="sea"></div></div><p class="lead">${esc(p.lead)}</p><div class="triad">${p.triad.map((t,i)=>`<div><b>0${i+1}</b>${esc(t)}</div>`).join('')}</div><div class="quote-box">${esc(p.quote)}</div>${footer(p)}`;
  }

  function coreMap(p){
    return `<span class="eyebrow">${esc(p.part)} · CONCEPT MAP</span><h1 class="page-title">${esc(p.title)}</h1><p class="subtitle">${esc(p.subtitle)}</p><p class="lead">${esc(p.lead)}</p><div class="core-grid">${p.cards.map(c=>`<article class="core-card"><span class="core-icon" aria-hidden="true">${esc(c[3])}</span><span class="num">${esc(c[0])}</span><h3>${esc(c[1])}</h3><p>${esc(c[2])}</p></article>`).join('')}</div>${footer(p)}`;
  }

  function framework(p){
    return `<span class="eyebrow">${esc(p.part)} · DECISION FRAME</span><h1 class="page-title">${esc(p.title)}</h1><p class="subtitle">${esc(p.subtitle)}</p><p class="lead">${esc(p.lead)}</p><div class="stage-flow">${p.stages.map((s,i)=>`<article class="stage-card"><span class="stage-num">${esc(s[0])}</span><div><h3>${esc(s[1])}</h3><p>${esc(s[2])}</p><small>${esc(s[3])}</small></div>${i < p.stages.length-1 ? '<span class="stage-arrow">→</span>' : ''}</article>`).join('')}</div><div class="rule-panel"><strong>정답을 가르는 6개의 판단 규칙</strong><div class="rule-grid">${p.rules.map((r,i)=>`<div><b>${i+1}</b><span>${esc(r)}</span></div>`).join('')}</div></div>${footer(p)}`;
  }

  function conceptModule(p){
    return `<span class="eyebrow">${esc(p.label)}</span><h1 class="page-title">${esc(p.title)}</h1><p class="subtitle">${esc(p.subtitle)}</p><p class="lead">${esc(p.lead)}</p><div class="section-kicker">${esc(p.conceptTitle)}</div><div class="concept-layers">${p.layers.map((x,i)=>`<article class="concept-layer layer-${i+1}"><span class="layer-code">${esc(x[0])}</span><div><h3>${esc(x[1])}</h3><p>${esc(x[2])}</p></div></article>`).join('')}</div><div class="analysis-box"><small>역분석 포인트</small><strong>${esc(p.insight)}</strong></div><div class="source-note"><b>문제은행 안에서 이렇게 연결된다</b><p>${esc(p.sourceNote)}</p></div>${footer(p)}`;
  }

  function decisionPage(p){
    return `<span class="eyebrow">${esc(p.label)}</span><h1 class="page-title">${esc(p.title)}</h1><p class="subtitle">${esc(p.subtitle)}</p><p class="lead">${esc(p.lead)}</p><div class="decision-axis">${p.axis.map((x,i)=>`<article><span>${esc(x[0])}</span><div><h3>${esc(x[1])}</h3><p>${esc(x[2])}</p></div></article>`).join('')}</div><div class="pattern-panel"><div class="section-kicker">선택지에서 자주 걸리는 함정</div>${p.patterns.map(x=>`<div class="pattern-row"><div><b>${esc(x[0])}</b><small>${esc(x[1])}</small></div><p>${esc(x[2])}</p></div>`).join('')}</div>${footer(p)}`;
  }

  function preventionLoop(p){
    return `<span class="eyebrow">${esc(p.label)}</span><h1 class="page-title">${esc(p.title)}</h1><p class="subtitle">${esc(p.subtitle)}</p><p class="lead">${esc(p.lead)}</p><div class="prevention-flow">${p.loop.map((x,i)=>`<article class="prevention-step"><span class="step-num">${esc(x[0])}</span><div><h3>${esc(x[1])}</h3><p>${esc(x[2])}</p></div>${i < p.loop.length-1 ? '<span class="flow-arrow">↓</span>' : ''}</article>`).join('')}</div>${footer(p)}`;
  }

  function renderPage(p){
    if(p.type === 'opening') return opening(p);
    if(p.type === 'core-map') return coreMap(p);
    if(p.type === 'framework') return framework(p);
    if(p.type === 'concept-module') return conceptModule(p);
    if(p.type === 'decision-page') return decisionPage(p);
    if(p.type === 'prevention-loop') return preventionLoop(p);
    return `<h1>${esc(p.title)}</h1>`;
  }

  function render(){
    const p = pages[current];
    if(!p) return;
    pageEl.className = `book-page ${p.type}`;
    pageEl.innerHTML = renderPage(p);
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
