/* =========================================================
   Project Card — カルーセルと一覧で共通のカード生成
   - 以前は project-carousel.js と project-listing.js に
     ほぼ同一の createCard が二重にあったため、ここへ集約した。
   - 差分（見出しレベル / 外側の要素）は options で吸収する。
   ========================================================= */
import { ICON_MAP } from './projects-data.js';

export const escapeHtml = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* タグ列。4つ以上のときは3つ目の後ろで折り返す */
function tagsHtml(tags){
  const parts = [];
  tags.forEach((t, i) => {
    const icon = ICON_MAP?.[t];
    const label = escapeHtml(t);
    parts.push(icon
      ? `<li class="tag"><img src="${escapeHtml(icon)}" alt="${label} アイコン" loading="lazy" decoding="async" />${label}</li>`
      : `<li class="tag">${label}</li>`);
    if (tags.length >= 4 && i === 2){
      parts.push('<li class="br" aria-hidden="true"></li>');
    }
  });
  return parts.join('');
}

function actionsHtml(links){
  if (!links.length) return '';
  const buttons = links.map((l, idx) => {
    const external = /^https?:/i.test(l.href);
    const targetAttr = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    const variant = (l.primary ?? idx === 0) ? 'btn--primary' : 'btn--ghost';
    return `<a class="btn ${variant}" href="${escapeHtml(l.href)}"${targetAttr}>${escapeHtml(l.label)}</a>`;
  }).join('');
  return `<div class="actions">${buttons}</div>`;
}

/* カード中身（figure + body）。titleTag で見出しレベルを切り替える */
export function cardInnerHtml(p, { titleTag = 'h3', imgAlt } = {}){
  const tags = Array.isArray(p.tags) ? p.tags : [];
  const links = Array.isArray(p.links) ? p.links : [];
  const tagList = tagsHtml(tags);
  const alt = escapeHtml(imgAlt ?? p.title ?? 'Project thumbnail');

  return `
    <figure class="product-media">
      <img src="${escapeHtml(p.img)}" alt="${alt}" loading="lazy" decoding="async" />
    </figure>
    <div class="product-body">
      <${titleTag} class="product-title clamp-1">${escapeHtml(p.title)}</${titleTag}>
      ${p.subtitle ? `<p class="product-sub clamp-1">${escapeHtml(p.subtitle)}</p>` : ''}
      <p class="product-desc clamp-3">${escapeHtml(p.desc)}</p>
      ${tagList ? `<ul class="tags">${tagList}</ul>` : ''}
      ${actionsHtml(links)}
    </div>`;
}

export const hasLinks = (p) => Array.isArray(p.links) && p.links.length > 0;

/* カード全体クリック／Enter・Space で主ボタンを発火させる共通ハンドラ */
export function bindCardActivation(root, cardSelector){
  const activate = (card) => {
    const btn = card.querySelector('.btn--primary') || card.querySelector('.btn');
    if (btn) btn.click();
  };
  const pick = (evt) => {
    const target = evt.target;
    if (!(target instanceof Element)) return null;
    const card = target.closest(cardSelector);
    if (!card || target.closest('a, .btn')) return null;
    return card;
  };

  root.addEventListener('click', (evt) => {
    const card = pick(evt);
    if (card) activate(card);
  });

  root.addEventListener('keydown', (evt) => {
    if (evt.key !== 'Enter' && evt.key !== ' ') return;
    const card = pick(evt);
    if (!card) return;
    evt.preventDefault();
    activate(card);
  });
}
