/* =========================================================
   Site Chrome — 全ページ共通の「枠」を注入する
   - 固定ヘッダー（About / Productions / Certifications + テーマ切替）
   - フッター（サイト内リンク / GitHub / メール）
   - ページ先頭へ戻るボタン + 読了プログレスバー
   - 詳細ページ（projects/*.html）の前後作品ナビ
   - スクロールリビール
   ※ styles/site-chrome.css とペア。<head> のブートスクリプトが
     data-theme と html.sc-js を事前に設定している前提。
   ========================================================= */
import { PROJECTS } from './projects-data.js';

const IN_PROJECTS = /\/projects\//.test(location.pathname);
const BASE = IN_PROJECTS ? '../' : './';
const PAGE = location.pathname.split('/').pop() || 'index.html';
const THEME_KEY = 'theme';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- SVG（インライン・依存なし） ---------- */
const ICONS = {
  sun: '<svg class="sc-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6"/></svg>',
  moon: '<svg class="sc-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20.6 14.2A8.6 8.6 0 0 1 9.8 3.4a8.6 8.6 0 1 0 10.8 10.8Z"/></svg>',
  github: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 14l6-6 6 6"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.2-4.2"/></svg>'
};

/* ---------- テーマ ---------- */
function currentTheme(){
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}
function applyTheme(theme, persist){
  document.documentElement.setAttribute('data-theme', theme);
  if (persist){
    try{ localStorage.setItem(THEME_KEY, theme); }catch(_){}
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f1115' : '#f4f4f4');
  const btn = document.querySelector('.sc-theme-toggle');
  if (btn){
    const label = theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  }
}

/* ---------- ヘッダー ---------- */
function buildHeader(){
  const isTop = !IN_PROJECTS && (PAGE === '' || PAGE === 'index.html');
  const isList = !IN_PROJECTS && PAGE === 'productions.html';
  const active = (on) => (on ? ' class="is-active" aria-current="page"' : '');

  const header = document.createElement('header');
  header.className = 'sc-header';
  header.innerHTML = `
    <div class="container sc-header__inner">
      <a class="sc-brand" href="${BASE}index.html" aria-label="トップページへ戻る">
        <span class="sc-brand__name">DOYSOUND<span class="sc-dot">.</span></span>
      </a>
      <nav class="sc-nav" aria-label="サイト内ナビゲーション">
        <a href="${BASE}index.html"${active(isTop)}>About</a>
        <a href="${BASE}productions.html"${active(isList || IN_PROJECTS)}>Productions</a>
        <a href="${BASE}index.html#qualifications">Certifications</a>
      </nav>
      <button class="sc-theme-toggle" type="button">${ICONS.sun}${ICONS.moon}</button>
    </div>
    <div class="sc-progress" aria-hidden="true"><span></span></div>`;
  document.body.prepend(header);

  header.querySelector('.sc-theme-toggle').addEventListener('click', () => {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
  });
  applyTheme(currentTheme(), false); // aria-label / theme-color を初期化
  return header;
}

/* ---------- フッター ---------- */
function buildFooter(){
  const year = new Date().getFullYear();
  const footer = document.createElement('footer');
  footer.className = 'sc-footer';
  footer.innerHTML = `
    <div class="container sc-footer__inner">
      <div>
        <p class="sc-footer__name">DOYSOUND<span>.</span></p>
        <p class="sc-footer__tag">CAE解析エンジニア。個人では楽器制作とWebフロント開発に取り組んでいます。</p>
      </div>
      <nav aria-label="フッターナビゲーション">
        <h2 class="sc-footer__title">Site</h2>
        <div class="sc-footer__links">
          <a href="${BASE}index.html">About</a>
          <a href="${BASE}productions.html">Productions</a>
          <a href="${BASE}index.html#qualifications">Certifications</a>
        </div>
      </nav>
    </div>
    <div class="sc-footer__bottom">
      <div class="container">
        <small>
          <span>&copy; 2019&ndash;${year} DOYSOUND. All rights reserved.</span>
          <span>Handcrafted with HTML / CSS / JavaScript</span>
        </small>
      </div>
    </div>`;
  document.body.append(footer);
}

/* ---------- ページ先頭へ戻る ---------- */
function buildTopButton(){
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'sc-top';
  btn.setAttribute('aria-label', 'ページの先頭へ戻る');
  btn.innerHTML = ICONS.arrowUp;
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  document.body.append(btn);
  return btn;
}

/* ---------- スクロール連動（ヘッダー影 / プログレス / 上へ戻る） ---------- */
function bindScrollUI(header, topBtn){
  const bar = header.querySelector('.sc-progress span');
  let handle = 0;
  const update = () => {
    handle = 0;
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    header.classList.toggle('is-scrolled', y > 8);
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    bar.style.transform = `scaleX(${Math.min(1, y / max).toFixed(4)})`;
    topBtn.classList.toggle('is-show', y > 560);
  };
  // 予約フラグ方式だとコールバック未発火のまま固まったとき復帰できないため、
  // 取り消して入れ直す（常に最新の1件だけが残る）
  const request = () => {
    if (handle) cancelAnimationFrame(handle);
    handle = requestAnimationFrame(update);
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  update();
}

/* ---------- 詳細ページ：前後の作品ナビ ---------- */
function buildProjectNav(){
  if (!IN_PROJECTS) return;
  const fileOf = (href) => String(href || '').split('/').pop();
  const detailLink = (p) => (p.links || []).find(l => !/^https?:/i.test(l.href));
  const idx = PROJECTS.findIndex(p => {
    const l = detailLink(p);
    return l && fileOf(l.href) === PAGE;
  });
  if (idx < 0) return;

  const newer = PROJECTS[idx - 1];
  const older = PROJECTS[idx + 1];
  if (!newer && !older) return;

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const card = (p, dir) => {
    if (!p) return '<span aria-hidden="true"></span>';
    const href = './' + fileOf(detailLink(p).href);
    const img = BASE + String(p.img || '').replace(/^\.\//, '');
    const label = dir === 'prev' ? '&larr; Newer' : 'Older &rarr;';
    return `
      <a class="sc-projnav__link sc-projnav__link--${dir}" href="${href}">
        <img class="sc-projnav__thumb" src="${img}" alt="" loading="lazy" decoding="async" />
        <span class="sc-projnav__body">
          <span class="sc-projnav__dir">${label}</span>
          <span class="sc-projnav__title">${esc(p.title)}</span>
          <span class="sc-projnav__meta">${p.year ?? ''}</span>
        </span>
      </a>`;
  };

  const nav = document.createElement('nav');
  nav.className = 'sc-projnav container';
  nav.setAttribute('aria-label', '前後の作品');
  nav.innerHTML = `
    <div class="sc-projnav__grid">${card(newer, 'prev')}${card(older, 'next')}</div>
    <div class="sc-projnav__all"><a class="btn btn--ghost" href="../productions.html">作品一覧を見る</a></div>`;
  const main = document.querySelector('main') || document.body;
  main.append(nav);
}

/* ---------- スクロールリビール ---------- */
function setupReveal(){
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  // ハッシュ付きで直接開いたときは目的のセクションへ即座に飛ぶため演出しない
  if (location.hash) return;
  const targets = document.querySelectorAll(
    '.pd-section, #qualifications .qualification-item, .year-section, .sc-projnav'
  );
  if (!targets.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  const vh = window.innerHeight;
  targets.forEach(el => {
    // 初期表示で既に見えているものはアニメーションさせない（ちらつき防止）
    if (el.getBoundingClientRect().top < vh * 0.85) return;
    el.classList.add('sc-reveal');
    io.observe(el);
  });
}

/* ---------- init ---------- */
const header = buildHeader();
buildProjectNav();
buildFooter();
const topBtn = buildTopButton();
bindScrollUI(header, topBtn);
setupReveal();

export { ICONS };
