/* ===== iOS detection (adds .is-ios on <html>) ===== */
(function(){
  var ua = navigator.userAgent || "";
  var isIOS = /iP(hone|od|ad)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) { document.documentElement.classList.add('is-ios'); }
})();

/* =========================================================
   Global Script (site-wide)
   - スムーススクロール / フェードイン / 外部リンク
   - フォーカスリング制御 / 画像の遅延読み込み
   - Welcome オーバーレイ（毎回表示）
   - Certifications：行一括アコーディオン & 行ごとの高さ統一
   ========================================================= */

/* 1) アンカーのスムーススクロール（scrollMarginTop 単位付き/未定義に強い） */
(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const parsePx = (v) => {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    const m = String(v).match(/(-?\d+(\.\d+)?)px/);
    return m ? parseFloat(m[1]) : parseFloat(v) || 0;
  };

  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a[href^="#"]');
    if(!a) return;
    const id = a.getAttribute('href').slice(1);
    if(!id) return;
    const el = document.getElementById(id);
    if(!el) return;

    e.preventDefault();
    const smt = getComputedStyle(el).scrollMarginTop;
    const offset = parsePx(smt);
    const rect = el.getBoundingClientRect();
    const y = rect.top + window.scrollY - offset;

    window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
    history.pushState(null, '', `#${id}`);

    // アクセシビリティ用
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
    el.addEventListener('blur', ()=> el.removeAttribute('tabindex'), { once:true });
  });
})();

/* 2) フェードイン（[data-animate="fade-up"]） */
(function(){
  const targets = document.querySelectorAll('[data-animate="fade-up"]');
  if(!targets.length || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

  targets.forEach(t=> io.observe(t));
})();

/* 3) 外部リンクを安全に */
(function(){
  const anchors = Array.from(document.querySelectorAll('a[href^="http"]'));
  anchors.forEach(a=>{
    const host = location.hostname.replace(/^www\./,'');
    try{
      const url = new URL(a.href);
      if(url.hostname.replace(/^www\./,'') !== host){
        a.setAttribute('target','_blank');
        a.setAttribute('rel','noopener noreferrer');
      }
    }catch(_){}
  });
})();

/* 4) キーボード操作時のみフォーカスリング常時表示 */
(function(){
  let hadKeyboard = false;
  const onKey = (e)=>{ if(e.key === 'Tab'){ hadKeyboard = true; document.documentElement.classList.add('kb-nav'); } };
  const onMouse = ()=>{ if(hadKeyboard){ document.documentElement.classList.remove('kb-nav'); hadKeyboard = false; } };
  window.addEventListener('keydown', onKey, { passive:true });
  window.addEventListener('mousedown', onMouse, { passive:true });
})();

/* 5) 画像の遅延読み込み（既に属性があれば上書きしない） */
(function(){
  document.querySelectorAll('img').forEach(img=>{
    if(!img.hasAttribute('loading'))  img.setAttribute('loading', 'lazy');
    if(!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
  });
})();

/* 6) Welcome overlay – only once */
(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'welcomeSeen';

  const cameFromProjects = (()=> {
    try{
      if (!document.referrer) return false;
      const ref = new URL(document.referrer);
      return ref.origin === location.origin && ref.pathname.startsWith('/projects/');
    }catch(_){ return false; }
  })();

  const markSeen = ()=>{ try{ sessionStorage.setItem(KEY, '1'); }catch(_){} };
  const hasSeen = ()=> {
    try{ return sessionStorage.getItem(KEY) === '1'; }
    catch(_){ return false; }
  };

  const removeOverlay = ()=>{
    const wrap = document.getElementById('welcome');
    if (wrap) wrap.remove();
  };

  function open(){
    const wrap = document.getElementById('welcome');
    if (!wrap) return;
    if (cameFromProjects || hasSeen()){
      removeOverlay();
      return;
    }

    wrap.style.display = '';
    wrap.style.opacity = '';

    if (prefersReduced) { markSeen(); close(60); return; }

    const title = wrap.querySelector('.w-title');
    if (title) {
      title.animate(
        [
          { opacity: 0, transform: 'translateY(12px) scale(.98)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' }
        ],
        { duration: 680, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }
      );
    }
    markSeen();
    close(2200);
  }

  function close(delay = 0){
    const wrap = document.getElementById('welcome');
    if (!wrap) return;
    setTimeout(()=> {
      const anim = wrap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 460, easing: 'ease' });
      anim.onfinish = ()=>{ wrap.style.display = 'none'; };
    }, delay);
  }

  window.addEventListener('load', open, { once:true });
  window.addEventListener('pageshow', (e)=>{ if (e.persisted) open(); });
})();


/* 7) Certifications accordion
      - Toggle all cards on the same row together
      - Smooth height animation per card */
(function(){
  const grid = document.querySelector('#qualifications .quals');
  if (!grid) return;

  const items = Array.from(grid.querySelectorAll('.qualification-item')).filter(Boolean);
  const EPS = 8; // px tolerance when grouping by row

  const isExpanded = (item) => {
    const btn = item?.querySelector('.q-head');
    return btn?.getAttribute('aria-expanded') === 'true';
  };

  items.forEach((item, index)=>{
    const btn = item.querySelector('.q-head');
    const panel = item.querySelector('.qualification-description');
    if (!btn || !panel) return;
    if (!btn.querySelector('.q-index')){
      const badge = document.createElement('span');
      badge.className = 'q-index';
      badge.textContent = String(index + 1);
      btn.prepend(badge);
    }
    btn.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
    panel.style.height = '0px';
    panel.classList.remove('is-open');
  });

  const onHeightEnd = (panel, cb) => {
    const handler = (e) => {
      if (e.propertyName !== 'height') return;
      panel.removeEventListener('transitionend', handler);
      cb();
    };
    panel.addEventListener('transitionend', handler);
  };

  const closeItem = (item, immediate = false) => {
    if (!item) return;
    const btn = item.querySelector('.q-head');
    const panel = item.querySelector('.qualification-description');
    if (!btn || !panel) return;

    const finish = () => {
      panel.hidden = true;
      panel.style.height = '0px';
    };

    btn.setAttribute('aria-expanded', 'false');
    panel.classList.remove('is-open');

    if (immediate || panel.hidden) {
      finish();
      return;
    }

    const current = panel.scrollHeight;
    panel.style.height = current + 'px';
    panel.getBoundingClientRect();
    panel.style.height = '0px';
    onHeightEnd(panel, finish);
  };

  const openItem = (item) => {
    if (!item) return;
    const btn = item.querySelector('.q-head');
    const panel = item.querySelector('.qualification-description');
    if (!btn || !panel) return;

    btn.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
    panel.style.height = 'auto';
    const target = panel.scrollHeight;
    panel.style.height = '0px';
    panel.getBoundingClientRect();
    panel.classList.add('is-open');
    panel.style.height = target + 'px';
    onHeightEnd(panel, () => { panel.style.height = 'auto'; });
  };

  const getRowItems = (item) => {
    if (!item) return [];
    const ref = item.getBoundingClientRect();
    if (!ref) return [item];
    return items.filter(it => {
      const rect = it.getBoundingClientRect();
      if (!rect) return false;
      return Math.abs(rect.top - ref.top) <= EPS;
    });
  };

  const toggleRow = (item) => {
    const rowItems = getRowItems(item);
    if (!rowItems.length) return;
    const anyClosed = rowItems.some(it => !isExpanded(it));
    rowItems.forEach(it => {
      if (anyClosed) openItem(it);
      else           closeItem(it);
    });
  };

  grid.addEventListener('click', (e)=>{
    const btn = e.target.closest('.q-head');
    if (!btn) return;
    toggleRow(btn.closest('.qualification-item'));
  });

  grid.addEventListener('keydown', (e)=>{
    const btn = e.target.closest('.q-head');
    if (!btn) return;
    if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space'){
      e.preventDefault();
      toggleRow(btn.closest('.qualification-item'));
    }
  });

  window.addEventListener('load', () => {
    items.forEach(it => closeItem(it, true));
  }, { once:true });
})();

/* 8) Scroll hint visibility */
(function(){
  const hint = document.querySelector('.scroll-hint');
  const anchor = document.getElementById('Productions');
  const cord = document.getElementById('cord');
  if (!hint || !anchor || !cord) return;

  const update = ()=>{
    const cordRect = cord.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const pastCord = cordRect.bottom < window.innerHeight * 0.4;
    const reachingNext = anchorRect.top <= window.innerHeight * 0.7;
    const scrolled = window.scrollY > 40;
    const hide = (pastCord || reachingNext) && scrolled;
    hint.classList.toggle('is-off', hide);
  };

  update();
  window.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update, { passive:true });
  window.addEventListener('load', update);
})();

/* ===== Optional: 端末サイズに応じて --font-zoom を自動設定（文字のみ） ===== */
(function(){
  const r = document.documentElement;
  function adjust(){
    const min = Math.min(window.innerWidth, window.innerHeight);
    let z = 1;
    if (min < 360) z = 0.94;
    else if (min < 400) z = 0.98;
    else if (min > 1000) z = 1.06;
    r.style.setProperty('--font-zoom', z.toFixed(2));
  }
  adjust();
  window.addEventListener('resize', adjust, { passive:true });
})();

