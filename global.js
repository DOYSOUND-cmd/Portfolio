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
   - ★ 開く/閉じる直前にその行の「目標高さ」を算出し全カードを同じ高さに
   ========================================================= */

/* 1) アンカーのスムーススクロール */
(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a[href^="#"]');
    if(!a) return;
    const id = a.getAttribute('href').slice(1);
    if(!id) return;
    const el = document.getElementById(id);
    if(!el) return;

    e.preventDefault();
    const offset = parseInt(getComputedStyle(el).scrollMarginTop || '0', 10);
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
    history.pushState(null, '', `#${id}`);
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

/* 5) 画像の遅延読み込み */
(function(){
  document.querySelectorAll('img:not([loading])').forEach(img=>{
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
  });
})();

/* 6) Welcome overlay — always show */
(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function open(){
    const wrap = document.getElementById('welcome');
    if (!wrap) return;

    // 初期状態復帰
    wrap.style.display = '';
    wrap.style.opacity = '';

    if (prefersReduced) { close(60); return; }

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
    close(2200);
  }
  function close(delay = 0){
    const wrap = document.getElementById('welcome');
    if (!wrap) return;
    setTimeout(()=> {
      wrap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 460, easing: 'ease' })
        .onfinish = ()=>{ wrap.style.display = 'none'; };
    }, delay);
  }
  window.addEventListener('load', open, { once:true });
  window.addEventListener('pageshow', (e)=>{ if (e.persisted) open(); });
})();

/* 7) Certifications：行一括アコーディオン + 行ごとの高さ統一
      ＆ 開く/閉じる直前に“行内全カードが同じ高さ”になるよう min-height を確定 */
(function(){
  const grid = document.querySelector('#qualifications .quals');
  if (!grid) return;

  /* --- 同じ「行」のアイテム群を取得（top の差で判定） --- */
  const getRowGroupByItem = (item) => {
    const items = Array.from(grid.querySelectorAll('.qualification-item'));
    const rects = items.map(it => ({ it, r: it.getBoundingClientRect() }));
    const target = rects.find(x => x.it === item);
    if (!target) return [item];
    const EPS = 6; // px
    return rects
      .filter(x => Math.abs(x.r.top - target.r.top) <= EPS)
      .sort((a,b) => a.r.left - b.r.left)
      .map(x => x.it);
  };

  /* --- 行の「目標高さ」を算出して一括適用 --- */
  const applyRowMinHeight = (rowItems, mode /* 'open' | 'closed' */) => {
    // まず全て一旦解除（ズレ防止）
    rowItems.forEach(it => it.style.minHeight = 'auto');

    // 目標高さを算出
    let target = 0;
    rowItems.forEach(it => {
      const head  = it.querySelector('.q-head');
      const panel = it.querySelector('.qualification-description');
      const headH = head ? head.getBoundingClientRect().height : 0;
      const openExtra = (mode === 'open' && panel) ? panel.scrollHeight : 0; // 内容の自然高を加算
      const h = Math.ceil(headH + openExtra);
      if (h > target) target = h;
    });

    // 少し余白（ボーダー・内部マージン分の保険）
    target += 2;
    rowItems.forEach(it => it.style.minHeight = `${target}px`);
  };

  /* --- パネル開閉（元の状態に完全復帰） --- */
  const openPanel = (btn, panel) => {
    if (!panel.hidden && panel.style.height === 'auto') return;
    btn.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
    panel.style.height = 'auto';
    const h = panel.scrollHeight;
    panel.style.height = '0px';
    panel.getBoundingClientRect();      // reflow
    panel.style.height = h + 'px';
    panel.addEventListener('transitionend', function onEnd(e){
      if (e.propertyName !== 'height') return;
      panel.style.height = 'auto';      // 開いた後は自然高
      panel.removeEventListener('transitionend', onEnd);
    });
  };

  const closePanel = (btn, panel) => {
    if (panel.hidden) return;
    btn.setAttribute('aria-expanded', 'false');
    const h = panel.scrollHeight;
    panel.style.height = h + 'px';
    panel.getBoundingClientRect();
    panel.style.height = '0px';
    panel.addEventListener('transitionend', function onEnd(e){
      if (e.propertyName !== 'height') return;
      panel.hidden = true;
      panel.style.height = null;        // ★ 完全に元へ戻す
      panel.removeEventListener('transitionend', onEnd);
    });
  };

  /* --- クリックした行だけ一括トグル --- */
  const toggleRow = (btn) => {
    const item = btn.closest('.qualification-item');
    const rowItems = getRowGroupByItem(item);

    // 行内の「開いていない」パネルが1つでもあれば → 開くモード
    const anyClosed = rowItems.some(it => it.querySelector('.q-head')?.getAttribute('aria-expanded') !== 'true');

    // ★ 先に min-height を「行内で統一」してから開閉開始（アニメ中も揃う）
    applyRowMinHeight(rowItems, anyClosed ? 'open' : 'closed');

    // 実際の開閉
    rowItems.forEach(it => {
      const b = it.querySelector('.q-head');
      const p = it.querySelector('.qualification-description');
      if (!b || !p) return;
      if (anyClosed) openPanel(b, p);
      else           closePanel(b, p);
    });
  };

  /* --- イベント --- */
  grid.addEventListener('click', (e)=>{
    const btn = e.target.closest('.q-head');
    if (!btn) return;
    toggleRow(btn);
  });
  grid.addEventListener('keydown', (e)=>{
    const btn = e.target.closest('.q-head');
    if (!btn) return;
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      toggleRow(btn);
    }
  });

  /* --- 初期：全閉 & 行ごとに「閉じた状態の高さ」で統一 --- */
  const items = Array.from(grid.querySelectorAll('.qualification-item'));
  items.forEach((it, i)=>{
    const btn = it.querySelector('.q-head');
    const panel = it.querySelector('.qualification-description');
    if (!btn || !panel) return;
    // インデックスバッジを付与（先頭）
    if (!btn.querySelector('.q-index')) {
      const badge = document.createElement('span');
      badge.className = 'q-index';
      badge.textContent = String(i + 1);
      btn.prepend(badge);
    }
    btn.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
    panel.style.height = null;
  });

  // 初期は各行を「閉じた高さ」で統一
  const unifyClosedAllRows = () => {
    // 行ごとにグループ化（rect 情報を rows に保持）
    const rects = items.map(it => ({ it, r: it.getBoundingClientRect() }));
    const rows = [];
    const EPS = 6;
    rects.forEach(x => {
      const row = rows.find(arr => Math.abs(arr[0].r.top - x.r.top) <= EPS);
      if (row) row.push(x);          // ← rect オブジェクトを保持
      else rows.push([x]);
    });
    // apply 時に DOM 要素配列へ変換
    rows.forEach(row => applyRowMinHeight(row.map(o => o.it), 'closed'));
  };

  // 正しい debounce 実装
  const debounce = (fn, ms = 120) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };

  const onResize = debounce(unifyClosedAllRows, 120);

  window.addEventListener('load', unifyClosedAllRows, { once:true });
  window.addEventListener('resize', onResize);
  window.addEventListener('pageshow', ()=> setTimeout(unifyClosedAllRows, 0));
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(unifyClosedAllRows); }
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
