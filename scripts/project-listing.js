import { PROJECTS, ICON_MAP } from './projects-data.js';

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
  const tags = Array.isArray(p.tags) ? p.tags : [];
  const links = Array.isArray(p.links) ? p.links : [];
  const hasLinks = links.length > 0;
  const tagParts = [];
  tags.forEach((t, i) => {
    const icon = ICON_MAP?.[t];
    const item = icon
      ? `<li class="tag"><img src="${icon}" alt="${t} アイコン" />${t}</li>`
      : `<li class="tag">${t}</li>`;
    tagParts.push(item);
    if (tags.length >= 4 && i === 2) {
      tagParts.push(`<li class="br" aria-hidden="true"></li>`);
    }
  });

  const tagHtml = tagParts.join('');
  const actionsHtml = hasLinks ? `
        <div class="actions">
          ${
            links.map((l, idx) => {
              const external = /^https?:/i.test(l.href);
              const targetAttr = external ? ` target="_blank" rel="noopener"` : '';
              const isPrimary = l.primary ?? idx === 0;
              const variant = isPrimary ? 'btn--primary' : 'btn--ghost';
              return `<a class="btn ${variant}" href="${l.href}"${targetAttr}>${l.label}</a>`;
            }).join('')
          }
        </div>` : '';

  const article = document.createElement('article');
  article.className = `product-card product-card--list${hasLinks ? ' product-card--interactive' : ''}`;
  article.setAttribute('role', 'listitem');
  const alt = p.title || 'Project thumbnail';
  article.innerHTML = `
    <figure class="product-media">
      <img src="${p.img}" alt="${alt}" loading="lazy" />
    </figure>
    <div class="product-body">
      <h2 class="product-title clamp-1">${p.title || ''}</h2>
      ${p.subtitle ? `<p class="product-sub clamp-1">${p.subtitle}</p>` : ''}
      <p class="product-desc clamp-3">${p.desc || ''}</p>
      ${tagHtml ? `<ul class="tags">${tagHtml}</ul>` : ''}
      ${actionsHtml}
    </div>
  `;
  return article;
}

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

    byYear[year].forEach(p => grid.appendChild(createCard(p)));
    section.appendChild(grid);
    frag.appendChild(section);
  });

  root.appendChild(frag);
}
