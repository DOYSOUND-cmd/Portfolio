import { PROJECTS, ICON_MAP } from './projects-data.js';
import { cardInnerHtml, hasLinks, bindCardActivation, escapeHtml } from './project-card.js';

/* =========================================================
   Productions 一覧
   - 年ごとのグルーピング表示（既存）
   - ★ キーワード検索 + タグ絞り込み + 件数表示 + URL同期
   - ★ カード全体クリックで詳細へ（カルーセルと同じ操作感）
   ========================================================= */

const root = document.querySelector('[data-project-list]');
if (!root) {
  console.warn('project list container not found');
}

const projects = Array.isArray(PROJECTS) ? PROJECTS : [];
if (root && !projects.length) {
  const p = document.createElement('p');
  p.className = 'empty-msg';
  p.textContent = '作品がまだ登録されていません。';
  root.appendChild(p);
}

function createCard(p){
  const linked = hasLinks(p);
  const article = document.createElement('article');
  article.className = `product-card product-card--list${linked ? ' product-card--interactive' : ''}`;
  article.setAttribute('role', 'listitem');
  if (linked){
    article.tabIndex = 0;
    article.setAttribute('data-card-link', 'true');
    article.setAttribute('aria-label', `${p.title}の詳細ページを開く`);
  }
  article.innerHTML = cardInnerHtml(p, { titleTag: 'h3' });
  return article;
}

/* ---------- 一覧の構築 ---------- */
const entries = [];   // { el, p }
const sections = [];  // { el, cards }

if (root) {
  const byYear = projects.reduce((map, p) => {
    const y = p.year || 'その他';
    if (!map[y]) map[y] = [];
    map[y].push(p);
    return map;
  }, {});

  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));
  const frag = document.createDocumentFragment();

  years.forEach(year => {
    const section = document.createElement('section');
    section.className = 'year-section';

    const h = document.createElement('h2');
    h.className = 'year-title';
    h.textContent = String(year);
    section.appendChild(h);

    const grid = document.createElement('div');
    grid.className = 'prod-grid';
    grid.setAttribute('role', 'list');
    grid.setAttribute('aria-label', `${year}年の制作物`);

    const cards = [];
    byYear[year].forEach(p => {
      const card = createCard(p);
      grid.appendChild(card);
      cards.push(card);
      entries.push({ el: card, p });
    });
    section.appendChild(grid);
    frag.appendChild(section);
    sections.push({ el: section, cards });
  });

  root.appendChild(frag);
}

/* ---------- カード全体クリック（カルーセルと同じ操作感） ---------- */
if (root){
  bindCardActivation(root, '[data-card-link="true"]');
}

/* ---------- 検索 + タグフィルタ ---------- */
if (root && projects.length){
  const allTags = [];
  projects.forEach(p => (p.tags || []).forEach(t => {
    if (!allTags.includes(t)) allTags.push(t);
  }));

  const SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.2-4.2"/></svg>';

  const tools = document.createElement('div');
  tools.className = 'plist-tools';
  tools.innerHTML = `
    <label class="plist-search">
      ${SEARCH_ICON}
      <input type="search" placeholder="キーワードで検索（作品名・説明・技術）" aria-label="作品をキーワードで検索" />
    </label>
    <ul class="plist-tags" aria-label="タグで絞り込み">
      ${allTags.map(t => {
        const icon = ICON_MAP?.[t];
        const label = escapeHtml(t);
        return `<li><button type="button" class="plist-tag" aria-pressed="false" data-tag="${label}">${icon ? `<img src="${escapeHtml(icon)}" alt="" loading="lazy" decoding="async" />` : ''}${label}</button></li>`;
      }).join('')}
    </ul>
    <div class="plist-meta">
      <p class="plist-count" role="status" aria-live="polite"></p>
      <button type="button" class="plist-clear">条件をクリア</button>
    </div>`;
  root.before(tools);

  const emptyEl = document.createElement('p');
  emptyEl.className = 'plist-empty';
  emptyEl.textContent = '条件に一致する作品はありません。キーワードやタグを変えてみてください。';
  emptyEl.hidden = true;
  root.before(emptyEl);

  const input = tools.querySelector('input');
  const tagBtns = Array.from(tools.querySelectorAll('.plist-tag'));
  const countEl = tools.querySelector('.plist-count');
  const clearBtn = tools.querySelector('.plist-clear');

  const state = { q: '', tags: new Set() };

  const syncURL = () => {
    try{
      const sp = new URLSearchParams();
      if (state.q.trim()) sp.set('q', state.q.trim());
      if (state.tags.size) sp.set('tags', [...state.tags].join(','));
      const qs = sp.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    }catch(_){}
  };

  let filterTimer;
  let resultCount = 0;
  const reportFilter = (action, tag = '') => {
    clearTimeout(filterTimer);
    const send = () => window.portfolioAnalytics?.track('project_filter', {
      filter_action: action, filter_tag: tag, result_count: resultCount,
      has_query: !!state.q.trim(), tag_count: state.tags.size,
    });
    if (action === 'search') filterTimer = setTimeout(send, 600);
    else send();
  };

  const apply = () => {
    const q = state.q.trim().toLowerCase();
    let visible = 0;
    entries.forEach(({ el, p }) => {
      const hay = [p.title, p.subtitle, p.desc, (p.tags || []).join(' '), String(p.year ?? '')]
        .join(' ').toLowerCase();
      const okQ = !q || hay.includes(q);
      const okT = [...state.tags].every(t => (p.tags || []).includes(t));
      const ok = okQ && okT;
      el.hidden = !ok;
      if (ok) visible++;
    });
    sections.forEach(({ el, cards }) => {
      el.hidden = cards.every(c => c.hidden);
    });
    resultCount = visible;
    const filtering = !!(q || state.tags.size);
    countEl.textContent = filtering
      ? `${visible} / ${projects.length} 件を表示中`
      : `全 ${projects.length} 件`;
    emptyEl.hidden = visible !== 0;
    clearBtn.classList.toggle('is-show', filtering);
    syncURL();
  };

  input.addEventListener('input', () => {
    state.q = input.value;
    apply();
    reportFilter('search');
  });

  tagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.tag;
      if (state.tags.has(t)) state.tags.delete(t);
      else state.tags.add(t);
      btn.setAttribute('aria-pressed', state.tags.has(t) ? 'true' : 'false');
      apply();
      reportFilter(state.tags.has(t) ? 'tag_add' : 'tag_remove', t);
    });
  });

  clearBtn.addEventListener('click', () => {
    state.q = '';
    state.tags.clear();
    input.value = '';
    tagBtns.forEach(b => b.setAttribute('aria-pressed', 'false'));
    apply();
    reportFilter('clear');
    input.focus();
  });

  // URL パラメータから初期状態を復元（?q=...&tags=a,b）
  try{
    const sp = new URLSearchParams(location.search);
    state.q = sp.get('q') || '';
    (sp.get('tags') || '').split(',')
      .map(s => s.trim())
      .filter(t => allTags.includes(t))
      .forEach(t => state.tags.add(t));
    input.value = state.q;
    tagBtns.forEach(b => b.setAttribute('aria-pressed', state.tags.has(b.dataset.tag) ? 'true' : 'false'));
  }catch(_){}

  apply();
}
