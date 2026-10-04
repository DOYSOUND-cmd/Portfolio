/* =========================================================
   Site Theatre — 2026-07 リデザイン演出スクリプト
   styles/site-theatre.css とペア。site-chrome.js の後に読み込む
   （フッター注入がフッター生成後である前提）。

   構成:
     1. 環境フラグ / 定数
     2. 背景・導入演出   … buildBgFx / setupParticles / buildIntroWipe
     3. トップヒーロー   … setupHeroParallax
     4. 詳細ページ       … buildDetailHero / buildSectionNav / setupLightbox
     5. ナビ・操作       … buildSkipLink / setupSearchHotkey / setupCursor
     6. フッター・データ … fillAutoCounts
     7. リビール         … setupSplit / setupReveals + 保険
     8. init（各ステップは故障隔離。1つ失敗しても他は動く）
   ========================================================= */
import { PROJECTS } from './projects-data.js';

/* ---------------------------------------------------------
   1) 環境フラグ / 定数
   --------------------------------------------------------- */
const IN_PROJECTS = /\/projects\//.test(location.pathname);
const BASE = IN_PROJECTS ? '../' : './';
const PAGE = location.pathname.split('/').pop() || 'index.html';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(pointer: fine)').matches;
/* アンカー直行時は目的地を隠さないよう入場演出をスキップする */
const skipEntrance = reduceMotion || !!location.hash;

const REVEAL_SAFETY_MS = 3000;   // リビール保険の発動タイミング
const WIPE_LIFETIME_MS = 1300;   // 赤ワイプ要素を DOM から片付けるまで
const DUST_COUNT = 46;           // 塵パーティクルの数

/* ---------------------------------------------------------
   2) 背景・導入演出
   --------------------------------------------------------- */

/* 照明・等高線・ビネット・オーロラブロブのコンテナ（CSS が描画） */
function buildBgFx(){
  if (document.querySelector('.thx-bg')) return;
  const bg = document.createElement('div');
  bg.className = 'thx-bg';
  bg.setAttribute('aria-hidden', 'true');
  bg.innerHTML = '<i></i><i></i>'; // オーロラブロブ
  document.body.prepend(bg);
}

/* 塵パーティクル（背景を漂う微粒子。テーマ切替に色が追従） */
function setupParticles(){
  if (reduceMotion) return;
  const bg = document.querySelector('.thx-bg');
  if (!bg) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'thx-bg__dust';
  bg.append(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  let parts = [];

  const spawn = () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: (0.7 + Math.random() * 1.6) * DPR,   // 半径
    v: (0.1 + Math.random() * 0.32) * DPR,  // 上昇速度
    dx: (Math.random() - 0.5) * 0.18 * DPR, // 横流れ
    tw: Math.random() * Math.PI * 2,        // 明滅の位相
    red: Math.random() < 0.2
  });
  const resize = () => {
    W = canvas.width = Math.floor(innerWidth * DPR);
    H = canvas.height = Math.floor(innerHeight * DPR);
    parts = Array.from({ length: DUST_COUNT }, spawn);
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const themeColors = () => {
    const cs = getComputedStyle(document.documentElement);
    return {
      dust: cs.getPropertyValue('--thx-dust').trim() || 'rgba(128,128,128,.4)',
      red: cs.getPropertyValue('--brand').trim() || '#cc0000'
    };
  };
  let colors = themeColors();
  new MutationObserver(() => { colors = themeColors(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  let t = 0;
  let raf = 0;
  function loop(){
    t += 0.016;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts){
      p.y -= p.v;
      p.x += p.dx;
      if (p.y < -4){ p.y = H + 4; p.x = Math.random() * W; }
      if (p.x < -4) p.x = W + 4;
      else if (p.x > W + 4) p.x = -4;
      const glow = 0.35 + 0.3 * Math.sin(t * 1.4 + p.tw);
      ctx.globalAlpha = p.red ? glow + 0.15 : glow;
      ctx.fillStyle = p.red ? colors.red : colors.dust;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(loop);
  }
  loop();

  // 非表示タブでは描画を止める（バッテリー消費を抑える）
  document.addEventListener('visibilitychange', () => {
    if (document.hidden){
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf){
      raf = requestAnimationFrame(loop);
    }
  });
}

/* 赤ワイプ導入（トップページのみ。カーテン→赤→背景色の順は CSS 側） */
function buildIntroWipe(){
  if (reduceMotion || IN_PROJECTS) return;
  if (PAGE !== '' && PAGE !== 'index.html') return;
  const w = document.createElement('div');
  w.className = 'thx-wipe';
  w.setAttribute('aria-hidden', 'true');
  document.body.append(w);
  setTimeout(() => w.remove(), WIPE_LIFETIME_MS);
}

/* ---------------------------------------------------------
   3) トップヒーロー：ポインタパララックス
   （--px/--py を更新し、CSS 側でゴーストタイポと枠が追従）
   --------------------------------------------------------- */
function setupHeroParallax(){
  const stage = document.querySelector('#cord .container');
  if (!stage || reduceMotion || !finePointer()) return;
  let raf = 0;
  stage.addEventListener('mousemove', (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r = stage.getBoundingClientRect();
      stage.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      stage.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    });
  }, { passive: true });
  stage.addEventListener('mouseleave', () => {
    stage.style.setProperty('--px', '0');
    stage.style.setProperty('--py', '0');
  });
}

/* ---------------------------------------------------------
   4) 詳細ページ
   --------------------------------------------------------- */

/* シネマティックヒーロー: projects-data.js とファイル名を突合して
   背景画像とメタ行（パンくず + 年 + No.）を注入する。
   レイアウトは CSS がプリペイントで適用済み（FOUC対策）。 */
function buildDetailHero(){
  if (!IN_PROJECTS) return;
  const hero = document.querySelector('.pd-hero');
  if (!hero || hero.classList.contains('pd-hero--theatre')) return;

  const fileOf = (href) => String(href || '').split('/').pop();
  const detailLink = (p) => (p.links || []).find(l => !/^https?:/i.test(l.href));
  const idx = PROJECTS.findIndex(p => {
    const l = detailLink(p);
    return l && fileOf(l.href) === PAGE;
  });
  const proj = idx >= 0 ? PROJECTS[idx] : null;

  // 背景画像：heroImg があればそれを使い、無ければ作品データの img、
  // それも無ければページ先頭のスクリーンショット
  let imgSrc = proj ? BASE + String(proj.heroImg || proj.img || '').replace(/^\.\//, '') : '';
  if (!imgSrc){
    const firstShot = document.querySelector('.pd-shot img');
    if (firstShot) imgSrc = firstShot.getAttribute('src') || '';
  }
  if (!imgSrc) return; // 背景が無ければ現状維持

  hero.classList.add('pd-hero--theatre');

  const bg = document.createElement('div');
  bg.className = 'thx-pdbg';
  bg.setAttribute('aria-hidden', 'true');
  const img = document.createElement('img');
  img.src = imgSrc;
  img.alt = '';
  img.decoding = 'async';
  img.fetchPriority = 'high';
  bg.appendChild(img);
  hero.prepend(bg);

  const container = hero.querySelector('.container');
  if (container){
    const pad2 = (n) => String(n).padStart(2, '0');
    const meta = document.createElement('p');
    meta.className = 'thx-pdmeta';
    const no = idx >= 0
      ? `<span class="thx-pdmeta__no">NO.${pad2(PROJECTS.length - idx)} / ${pad2(PROJECTS.length)}</span><span class="thx-pdmeta__sep">/</span>`
      : '';
    const year = proj?.year ? `<span>${proj.year}</span><span class="thx-pdmeta__sep">/</span>` : '';
    meta.innerHTML = `
      <a href="../productions.html">Productions</a>
      <span class="thx-pdmeta__sep">/</span>
      ${year}${no}
      <span>DOYSOUND</span>`;
    container.prepend(meta);
  }
}

/* ページ内目次: セクションが4つ以上の詳細ページにチップナビを生成し、
   IntersectionObserver で現在地をハイライトする */
function buildSectionNav(){
  if (!IN_PROJECTS) return;
  const hero = document.querySelector('.pd-hero');
  if (!hero) return;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const items = Array.from(document.querySelectorAll('.pd-section')).map(sec => {
    const h = sec.querySelector('.pd-section__title');
    if (!h || !h.id) return null;
    return { sec, id: h.id, label: h.textContent.trim().replace(/\s+/g, ' ') };
  }).filter(Boolean);
  if (items.length < 4) return;

  const nav = document.createElement('nav');
  nav.className = 'thx-secnav';
  nav.setAttribute('aria-label', 'ページ内目次');
  nav.innerHTML = `<div class="container thx-secnav__inner">${
    items.map(it => `<a href="#${it.id}">${esc(it.label)}</a>`).join('')
  }</div>`;
  hero.after(nav);
  document.documentElement.classList.add('thx-has-secnav');

  if (!('IntersectionObserver' in window)) return;
  const anchors = Array.from(nav.querySelectorAll('a'));
  const linkOf = new Map(items.map((it, i) => [it.sec, anchors[i]]));
  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { en.isIntersecting ? visible.add(en.target) : visible.delete(en.target); });
    // 見えているセクションのうち最上部のものを現在地とする
    let top = null, topY = Infinity;
    visible.forEach(sec => {
      const y = sec.getBoundingClientRect().top;
      if (y < topY){ topY = y; top = sec; }
    });
    linkOf.forEach((a, sec) => a.classList.toggle('is-active', sec === top));
  }, { rootMargin: '-15% 0px -55% 0px' });
  items.forEach(it => io.observe(it.sec));
}

/* 画像ライトボックス: リンクに包まれていない .pd-shot img を
   クリック/Enter で拡大。←→で前後、Esc/背景クリックで閉じる。 */
function setupLightbox(){
  const imgs = Array.from(document.querySelectorAll('.pd-shot img')).filter(im => !im.closest('a'));
  if (!imgs.length) return;

  const lb = document.createElement('div');
  lb.className = 'thx-lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', '画像の拡大表示');
  lb.innerHTML = `
    <p class="thx-lightbox__count" aria-hidden="true"></p>
    <button type="button" class="thx-lightbox__btn thx-lightbox__close" aria-label="閉じる">✕</button>
    <button type="button" class="thx-lightbox__btn thx-lightbox__prev" aria-label="前の画像">←</button>
    <figure class="thx-lightbox__fig">
      <img alt="" decoding="async">
      <figcaption class="thx-lightbox__cap"></figcaption>
    </figure>
    <button type="button" class="thx-lightbox__btn thx-lightbox__next" aria-label="次の画像">→</button>`;
  document.body.append(lb);

  const big = lb.querySelector('.thx-lightbox__fig img');
  const cap = lb.querySelector('.thx-lightbox__cap');
  const count = lb.querySelector('.thx-lightbox__count');
  const closeBtn = lb.querySelector('.thx-lightbox__close');
  const prevBtn = lb.querySelector('.thx-lightbox__prev');
  const nextBtn = lb.querySelector('.thx-lightbox__next');
  if (imgs.length < 2){
    prevBtn.hidden = true;
    nextBtn.hidden = true;
    count.hidden = true;
  }

  let idx = 0;
  let opener = null; // 閉じた時にフォーカスを戻す先

  const render = () => {
    const im = imgs[idx];
    big.src = im.currentSrc || im.src;
    big.alt = im.alt || '';
    const fc = im.closest('.pd-shot')?.querySelector('figcaption');
    cap.textContent = fc ? fc.textContent.trim() : '';
    cap.hidden = !fc;
    count.textContent = `${idx + 1} / ${imgs.length}`;
  };
  const open = (i, trigger) => {
    idx = i;
    opener = trigger;
    window.portfolioAnalytics?.track('gallery_open', { image_index: i + 1 });
    render();
    lb.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
    closeBtn.focus();
  };
  const close = () => {
    lb.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    if (opener && typeof opener.focus === 'function') opener.focus();
  };
  const step = (d) => {
    idx = (idx + d + imgs.length) % imgs.length;
    render();
  };

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  imgs.forEach((im, i) => {
    im.classList.add('thx-zoomable');
    im.setAttribute('tabindex', '0');
    im.setAttribute('role', 'button');
    im.setAttribute('aria-label', `${im.alt || '画像'}（クリックで拡大）`);
    const act = () => open(i, im);
    im.addEventListener('click', act);
    im.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); act(); }
    });
  });
}

/* ---------------------------------------------------------
   5) ナビ・操作
   --------------------------------------------------------- */

/* テーマ切替を View Transition の円形リビールでラップする。
   document のキャプチャ段階で横取りし、site-chrome 側のリスナーには
   届かせない（非対応ブラウザでは何もせず従来動作のまま）。 */
function setupThemeReveal(){
  if (reduceMotion || typeof document.startViewTransition !== 'function') return;
  document.addEventListener('click', (e) => {
    const btn = e.target instanceof Element && e.target.closest('.sc-theme-toggle');
    if (!btn) return;
    e.stopPropagation(); // site-chrome のトグル処理を抑止（こちらで代替する）

    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    const r = btn.getBoundingClientRect();
    const root = document.documentElement;
    root.style.setProperty('--thx-vt-x', `${r.left + r.width / 2}px`);
    root.style.setProperty('--thx-vt-y', `${r.top + r.height / 2}px`);
    root.classList.add('thx-vt-theme');

    const apply = () => {
      root.setAttribute('data-theme', next);
      try{ localStorage.setItem('theme', next); }catch(_){}
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'dark' ? '#0f1115' : '#f4f4f4');
      const label = next === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    };
    const vt = document.startViewTransition(apply);
    vt.finished.finally(() => root.classList.remove('thx-vt-theme'));
  }, true);
}

/* クリックリップル（fine pointer のみ） */
function setupClickRipple(){
  if (reduceMotion || !finePointer()) return;
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const s = document.createElement('span');
    s.className = 'thx-ripple';
    s.style.left = `${e.clientX}px`;
    s.style.top = `${e.clientY}px`;
    document.body.append(s);
    s.addEventListener('animationend', () => s.remove());
    setTimeout(() => s.remove(), 900); // 保険
  }, { passive: true });
}

/* スキップリンク（キーボード利用者向け。フォーカス時のみ表示） */
function buildSkipLink(){
  if (!document.getElementById('main') || document.querySelector('.thx-skip')) return;
  const a = document.createElement('a');
  a.className = 'thx-skip';
  a.href = '#main';
  a.textContent = '本文へスキップ';
  document.body.prepend(a);
}

/* 一覧ページ: / キーで検索ボックスへフォーカス */
function setupSearchHotkey(){
  const input = document.querySelector('.plist-search input');
  if (!input) return;
  input.setAttribute('aria-keyshortcuts', '/');
  input.title = 'ショートカット: / キーで検索へ移動';
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t instanceof Element && t.closest('input, textarea, select, [contenteditable="true"]')) return;
    e.preventDefault();
    input.focus();
    input.select();
  });
}

/* カスタムカーソル（赤ドット + 追従リング。fine pointer のみ） */
function setupCursor(){
  if (reduceMotion || !finePointer()) return;

  const wrap = document.createElement('div');
  wrap.className = 'thx-cursor';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = '<span class="thx-cursor__dot"></span><span class="thx-cursor__ring"></span>';
  document.body.append(wrap);
  const dot = wrap.firstElementChild;
  const ring = wrap.lastElementChild;

  let x = innerWidth / 2, y = innerHeight / 2;
  let rx = x, ry = y;
  let seen = false;

  document.addEventListener('mousemove', (e) => {
    x = e.clientX;
    y = e.clientY;
    if (!seen){
      seen = true;
      rx = x; ry = y;
      document.documentElement.classList.add('thx-cursor-on');
    }
  }, { passive: true });
  document.addEventListener('mouseleave', () => {
    document.documentElement.classList.remove('thx-cursor-on');
    seen = false;
  });

  const HOVER = 'a, button, [role="button"], input, select, textarea, .thx-zoomable, [tabindex="0"]';
  document.addEventListener('mouseover', (e) => {
    const t = e.target;
    const hit = t instanceof Element && t.closest(HOVER);
    document.documentElement.classList.toggle('thx-cursor-hover', !!hit);
  }, { passive: true });

  (function loop(){
    rx += (x - rx) * 0.16;
    ry += (y - ry) * 0.16;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  })();
}

/* ---------------------------------------------------------
   6) フッター・データ
   --------------------------------------------------------- */

/* 作品数を PROJECTS から自動反映（統計バンド・一覧タイトル） */
function fillAutoCounts(){
  document.querySelectorAll('[data-count="auto-works"]').forEach(el => {
    el.dataset.count = String(PROJECTS.length);
  });
  document.querySelectorAll('[data-works-count]').forEach(el => {
    el.textContent = String(PROJECTS.length);
  });
}

/* ---------------------------------------------------------
   7) リビール（split / reveal / count + 保険）
   --------------------------------------------------------- */

/* 見出しの文字ばらし: [data-split] のテキストを1文字ずつ span 化 */
function setupSplit(){
  document.querySelectorAll('[data-split]').forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    el.classList.add('thx-split');
    Array.from(text).forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'thx-ch' + (ch === ' ' ? ' thx-ch--sp' : '');
      span.style.setProperty('--i', String(i));
      span.textContent = ch;
      el.appendChild(span);
    });
  });
}

/* リビール監視。戻り値はすべてを強制表示する関数（保険で使用） */
function setupReveals(){
  const targets = [
    ...document.querySelectorAll('.thx-split'),
    ...document.querySelectorAll('[data-reveal]')
  ];

  const activate = (el) => {
    el.classList.add('is-in');
  };
  // theatre のリビール対象 + site-chrome の .sc-reveal をまとめて強制表示
  const activateAll = () => {
    targets.forEach(activate);
    document.querySelectorAll('.sc-reveal:not(.is-in)').forEach(el => el.classList.add('is-in'));
  };

  if (!targets.length) return activateAll;

  if (skipEntrance || !('IntersectionObserver' in window)){
    activateAll();
    return activateAll;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        activate(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

  const vh = window.innerHeight;
  targets.forEach(el => {
    // 初期表示で見えているものは少し遅らせて発火（ロード直後の演出）
    if (el.getBoundingClientRect().top < vh * 0.9){
      setTimeout(() => activate(el), 120);
    } else {
      io.observe(el);
    }
  });
  return activateAll;
}

/* ---------------------------------------------------------
   8) init — 各ステップを故障隔離して実行
   --------------------------------------------------------- */
[
  buildBgFx,
  setupParticles,
  buildIntroWipe,
  buildSkipLink,
  buildDetailHero,
  setupHeroParallax,
  setupCursor,
  buildSectionNav,
  setupLightbox,
  setupSearchHotkey,
  setupThemeReveal,
  setupClickRipple,
  fillAutoCounts,
  setupSplit
].forEach(step => {
  try{ step(); }
  catch (err){ console.error(`[site-theatre] ${step.name} failed:`, err); }
});

let thxActivateAll = null;
try{ thxActivateAll = setupReveals(); }
catch (err){ console.error('[site-theatre] setupReveals failed:', err); }

/* リビール保険:
   IntersectionObserver が発火しない環境（bfcache 復帰、拡張機能の
   干渉など）でも本文が隠れたままにならないよう、一定時間後と
   ページ復帰時に未リビール要素を強制表示する。 */
if (typeof thxActivateAll === 'function'){
  setTimeout(thxActivateAll, REVEAL_SAFETY_MS);
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) thxActivateAll();
  });
}
