// ===============================
// 無限ループ + 中央強調 + 自動再生 + タグ4つ以上で改行 + アイコン
// ===============================

// 0) タグ→アイコン画像に対応（必要に応じて追加）
const ICON_BASE = "./assets/icons/";
const ICON_MAP = {
  "Linux": ICON_BASE + "Linux.png",
  "JavaScript": ICON_BASE + "JS.png",
  "CSS": ICON_BASE + "CSS.png",
  "HTML": ICON_BASE + "HTML.png",
  "CAD": ICON_BASE + "CAD.jpg",
  "CAE": ICON_BASE + "CAE.png",
  "electronic circuit": ICON_BASE + "electronic_circuit.jpg",
  "Three.js": ICON_BASE + "Threejs.png",
  "FPGA": ICON_BASE + "fpga.png",
  "PYNQ": ICON_BASE + "PYNQ.png",
  "Python": ICON_BASE + "Python.png",
  "HDL": ICON_BASE + "HDL.png",         // <- 追加で提供された画像
  "C++": ICON_BASE + "Cpurapura.png",
  "Processing": ICON_BASE + "Processing.png"
};

// 1) PROJECTS = ユーザー提供の最新版！
export const PROJECTS = [
  {
    id:"fpga-fx",
    title:"FPGAギターエフェクター",
    desc:"リアルタイム処理に強いFPGAでオーディオエフェクトを実現(開発中)",
    img:"./assets/work_fpga_fx.png",
    tags:["FPGA","PYNQ","Linux","HDL","Python","C++"],
    links:[{label:"詳細",href:"./projects/fpga-guitar-fx.html"}]
  },
  {
    id:"web-cae",
    title:"Web CAEアプリ",
    desc:"NASA Space Apps Challenge 2025提出作品",
    img:"./assets/work_web_cae.png",
    tags:["CAE","Python","HTML","CSS","JavaScript","Three.js"],
    links:[{label:"詳細",href:"./projects/web-cae-app.html"}]
  },
  {
    id:"web-nenga",
    title:"Web年賀状",
    desc:"ブラウザ上で表示できる年賀状",
    img:"./assets/work_web_nenga.png",
    tags:["HTML","CSS","JavaScript"],
    links:[{label:"詳細",href:"./projects/web-new-year-card.html"}]
  },
  { id:"nameplate", title:"リアルVRネームプレート",
    desc:"VR空間のネームプレートを現実世界で再現",
    img:"./assets/nameplate.png", tags:["CAE","HTML","CSS","JavaScript","Three.js"], links:[{label:"詳細",href:"./projects/vr-nameplate.html"}] 
  },
  {
    id:"strat",
    title:"ストラトキャスタータイプギター",
    desc:"桐材を使用したストラトキャスタータイプギター",
    img:"./assets/work_strat.jpg",
    tags:["CAD","electronic circuit"],
    links:[{label:"詳細",href:"./projects/stratocaster-build.html"}]
  },
  {
    id:"tube-booster",
    title:"真空管クリーンブースター",
    desc:"真空管を用いたアナログギターエフェクター",
    img:"./assets/work_tube_booster.jpg",
    tags:["electronic circuit"],
    links:[{label:"詳細",href:"./projects/tube-clean-booster.html"}]
  },
  /*
  {
    id:"megaphone-v2",
    title:"ライブ用メガホン Ver.2",
    desc:"Ver.1のアナログ構成からデジタル化し、ESP32を用いた音声処理へアップデート",
    img:"./assets/work_megaphone_v2.jpg",
    tags:["electronic circuit","C++"],
    links:[{label:"詳細",href:"./megaphone_v2.html"}]
  },
  {
    id:"jazzmaster",
    title:"ジャズマスタータイプギター",
    desc:"LEDメーターとセンサーを用いたキルスイッチを搭載したギター",
    img:"./assets/work_jazzmaster.jpg",
    tags:["electronic circuit"],
    links:[{label:"詳細",href:"./jazzmaster.html"}]
  },
  {
    id:"glove-drum",
    title:"手袋型電子ドラム",
    desc:"直感的・省スペースな演奏。センサ処理から音源まで一貫設計。",
    img:"./assets/work_glove_drum.jpg",
    tags:["electronic circuit","C++"],
    links:[{label:"詳細",href:"./glove_drum.html"}]
  },
  {
    id:"megaphone-v1",
    title:"ライブ用メガホン Ver.1",
    desc:"ライン出力機能付きシールドプラグでミキシングを容易に。",
    img:"./assets/work_megaphone_v1.jpg",
    tags:["electronic circuit"],
    links:[{label:"詳細",href:"./megaphone_v1.html"}]
  },
  {
    id:"shooting-edu",
    title:"学習用シューティングゲーム",
    subtitle:"Processing / 教育イベント",
    desc:"ゲーム要素で中学生がプログラミング基礎を学べる教材。",
    img:"./assets/work_shooting.jpg",
    tags:["Processing"],
    links:[{label:"詳細",href:"./shooting.html"}]
  },
  {
    id:"falcon-guitar",
    title:"ミレニアムファルコン型ギター",
    desc:"宇宙船プラモデルをギター化。エンジン/コクピットにLEDを搭載。",
    img:"./assets/work_millennium.jpg",
    tags:["electronic circuit"],
    links:[{label:"詳細",href:"./falcon_guitar.html"}]
  },
  {
    id:"lespaul",
    title:"レスポールタイプギター",
    desc:"メタル志向デザイン。配線とLED群で存在感を強化。",
    img:"./assets/work_lespaul.jpg",
    tags:["electronic circuit"],
    links:[{label:"詳細",href:"./lespaul.html"}]
  }
  */
];
// 2) 1カードHTML生成：タグ4つ以上で改行マーカーを挿入
function createCard(p){
  const li = document.createElement('li');
  li.className = 'product-slide';
  li.setAttribute('role','option');
  li.setAttribute('aria-selected','false');
  li.id = `prod-${p.id}`;

  const tags = Array.isArray(p.tags) ? p.tags : [];
  const links = Array.isArray(p.links) ? p.links : [];
  const hasLinks = links.length > 0;
  const cardAttrs = hasLinks
    ? ` tabindex="0" role="link" data-card-link="true" aria-label="${p.title}の詳細ページを開く"`
    : '';
  const cardClass = `product-card${hasLinks ? ' product-card--interactive' : ''}`;
  const tagParts = [];
  tags.forEach((t, i) => {
    const icon = ICON_MAP[t];
    const item = icon
      ? `<li class="tag"><img src="${icon}" alt="${t} アイコン" />${t}</li>`
      : `<li class="tag">${t}</li>`;
    tagParts.push(item);
    if (tags.length >= 4 && i === 2) {
      // 3個目の直後に強制改行
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

  li.innerHTML = `
    <article class="${cardClass}"${cardAttrs}>
      <figure class="product-media">
        <img src="${p.img}" alt="${p.title}" loading="lazy" />
      </figure>
      <div class="product-body">
        <h3 class="product-title clamp-1">${p.title}</h3>
        ${p.subtitle ? `<p class="product-sub clamp-1">${p.subtitle}</p>` : ''}
        <p class="product-desc clamp-3">${p.desc}</p>
        ${tagHtml ? `<ul class="tags">${tagHtml}</ul>` : ''}
        ${actionsHtml}
      </div>
    </article>
  `;
  return li;
}

function activateCardLink(card){
  if (!card) return;
  const primaryBtn = card.querySelector('.btn--primary') || card.querySelector('.btn');
  if (!primaryBtn) return;
  primaryBtn.click();
}

function bindCardInteractions(track){
  const CARD_SELECTOR = '.product-card[data-card-link="true"]';

  track.addEventListener('click', evt => {
    const target = evt.target;
    if (!(target instanceof Element)) return;
    if (!target.closest(CARD_SELECTOR) || target.closest('.btn')) return;
    activateCardLink(target.closest(CARD_SELECTOR));
  });

  track.addEventListener('keydown', evt => {
    if (evt.key !== 'Enter' && evt.key !== ' ') return;
    const target = evt.target;
    if (!(target instanceof Element)) return;
    if (!target.closest(CARD_SELECTOR) || target.closest('.btn')) return;
    evt.preventDefault();
    activateCardLink(target.closest(CARD_SELECTOR));
  });
}

function equalizeCardHeights(track){
  const cards = track.querySelectorAll('.product-card');
  if (!cards.length) return;
  cards.forEach(card => card.style.height = 'auto');
  let max = 0;
  cards.forEach(card => {
    const h = card.getBoundingClientRect().height;
    if (h > max) max = h;
  });
  if (!max) return;
  const targetHeight = `${Math.ceil(max)}px`;
  cards.forEach(card => { card.style.height = targetHeight; });
}

function setupCardHeightSync(track){
  let raf = null;
  const schedule = ()=>{
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(()=>{
      raf = null;
      equalizeCardHeights(track);
    });
  };

  const resizeHandler = ()=>schedule();
  window.addEventListener('resize', resizeHandler);

  const imgs = track.querySelectorAll('img');
  imgs.forEach(img=>{
    if (img.complete) return;
    img.addEventListener('load', schedule, { once: true });
  });

  schedule();
}

// 3) メトリクス
function getMetrics(track){
  const first = track.children[0];
  const style = first ? getComputedStyle(track) : null;
  const gap = first ? parseFloat(style.columnGap || style.gap || 0) : 0;
  const slideW = first ? first.getBoundingClientRect().width : 0;
  return { slideW, gap, step: slideW + gap };
}

// 4) 画面中央に最も近いスライド（幾何学ベース）
function nearestCenterIndex(viewport, slides){
  const vp = viewport.getBoundingClientRect();
  const vpCenter = vp.left + vp.width/2;
  let best = { i: 0, d: Infinity };
  for (let i=0;i<slides.length;i++){
    const r = slides[i].getBoundingClientRect();
    const center = r.left + r.width/2;
    const d = Math.abs(center - vpCenter);
    if (d < best.d) best = { i, d };
  }
  return best.i;
}

// 5) 無限ループ：両端にクローンを付与
function buildLoop(track, items, cloneCount){
  items.forEach(p => track.appendChild(createCard(p)));
  const realSlides = Array.from(track.children);
  for (let i=0; i<cloneCount; i++){
    track.appendChild(realSlides[i].cloneNode(true));                         // 後尾へ
    track.insertBefore(realSlides[realSlides.length-1-i].cloneNode(true),     // 先頭へ
                       track.firstChild);
  }
}

// 6) カルーセル本体（無限ループ + オートプレイ + 中央強調）
function initCarousel(rootEl){
  const viewport = rootEl.querySelector('.car-viewport');
  const track = rootEl.querySelector('#track');
  const prevBtn = rootEl.querySelector('[data-prev]');
  const nextBtn = rootEl.querySelector('[data-next]');
  const dotsWrap = rootEl.querySelector('[data-dots]');
  const live = rootEl.querySelector('.sr-live');
  const CLONES = 2;                 // �e�[�ɗp�ӂ���N���[�����B2����
  const AUTOPLAY_MS = 3500;         // �I�[�g�v���C�̃p�[�e�B�N���E
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  buildLoop(track, PROJECTS, CLONES);
  bindCardInteractions(track);
  setupCardHeightSync(track);

  const slides = Array.from(track.children); // クローン含む
  const realLen = PROJECTS.length;
  const startReal = CLONES;
  const endReal = CLONES + realLen - 1;
  let idx = startReal;                 // 実スライドの先頭
  let isAnimating = false;
  let autoplayId = null;
  let metrics = getMetrics(track);

  // ドット（実スライドのみ）
  for (let i=0;i<realLen;i++){
    const b = document.createElement('button');
    b.className = 'car-dot'; b.type = 'button';
    b.setAttribute('role','tab');
    b.setAttribute('aria-selected', i===0 ? 'true':'false');
    b.addEventListener('click', ()=>go(startReal + i, true));
    dotsWrap.appendChild(b);
  }

  function announce(){ if (live) live.textContent = `スライド${((idx - startReal + realLen) % realLen)+1} / ${realLen}`; }
  function setCenterByIndex(i){ slides.forEach((li,j)=> li.classList.toggle('is-center', j===i)); }
  function updateDots(){
    const realIndex = (idx - startReal + realLen) % realLen;
    dotsWrap.querySelectorAll('.car-dot').forEach((d,i)=>d.setAttribute('aria-selected', i===realIndex ? 'true' : 'false'));
  }
  function jumpIfClone(){
    if (idx > endReal){
      idx = startReal + (idx - endReal - 1);
      const left = slides[idx].offsetLeft - track.offsetLeft;
      viewport.scrollTo({ left, behavior:'auto' });
    } else if (idx < startReal){
      idx = endReal - (startReal - idx - 1);
      const left = slides[idx].offsetLeft - track.offsetLeft;
      viewport.scrollTo({ left, behavior:'auto' });
    }
  }
  function updateUI(){ updateDots(); setCenterByIndex(idx); announce(); }

  function go(targetIndex, userAction=false){
    if (isAnimating) return;
    isAnimating = true;
    if (userAction) pauseAutoplayTemp();

    metrics = getMetrics(track);
    const dist = (slides[targetIndex].offsetLeft - slides[idx].offsetLeft);

    if (reduceMotion){
      viewport.scrollLeft += dist;
      idx = targetIndex; jumpIfClone();
      isAnimating = false; updateUI();
      return;
    }

    viewport.scrollBy({ left: dist, behavior: 'smooth' });

    let ended = false;
    const unlock = ()=>{
      if (ended) return; ended = true;
      idx = nearestCenterIndex(viewport, slides);
      jumpIfClone();
      isAnimating = false; updateUI();
    };
    const dur = Math.min(700, Math.max(260, Math.abs(dist) * 0.55));
    const t = setTimeout(unlock, dur + 120);
    const onEnd = ()=>{ clearTimeout(t); unlock(); viewport.removeEventListener('scrollend', onEnd); };
    viewport.addEventListener('scrollend', onEnd, { once:true });
  }

  // スクロール中も見た目だけ中央強調を更新
  let ticking = false;
  viewport.addEventListener('scroll', ()=>{
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(()=>{ setCenterByIndex(nearestCenterIndex(viewport, slides)); ticking = false; });
  }, { passive:true });

  // ボタンとキー
  prevBtn.addEventListener('click', ()=>go(idx-1, true));
  nextBtn.addEventListener('click', ()=>go(idx+1, true));
  viewport.addEventListener('keydown', (e)=>{
    if (e.key==='ArrowRight'){ e.preventDefault(); go(idx+1, true); }
    if (e.key==='ArrowLeft' ){ e.preventDefault(); go(idx-1, true); }
  });

  // リサイズで現スライドを中央に再配置
  window.addEventListener('resize', ()=>{
    metrics = getMetrics(track);
    const left = slides[idx].offsetLeft - track.offsetLeft;
    viewport.scrollTo({ left, behavior:'auto' });
    idx = nearestCenterIndex(viewport, slides);
    jumpIfClone(); updateUI();
  });

  // ====== 自動再生 ======
  function startAutoplay(){
    if (reduceMotion || autoplayId) return;
    autoplayId = setInterval(()=>{ if (!isAnimating) go(idx+1); }, AUTOPLAY_MS);
  }
  function stopAutoplay(){ if (autoplayId){ clearInterval(autoplayId); autoplayId = null; } }
  let pauseTimer = null;
  function pauseAutoplayTemp(){
    stopAutoplay();
    clearTimeout(pauseTimer);
    pauseTimer = setTimeout(()=>startAutoplay(), 3000);  // 3遘貞ｾ後↓蜀埼幕
  }
  ['mouseenter','focusin','pointerdown','touchstart'].forEach(evt=>{
    rootEl.addEventListener(evt, ()=>pauseAutoplayTemp(), { passive:true });
  });
  ['mouseleave','focusout'].forEach(evt=>{
    rootEl.addEventListener(evt, ()=>startAutoplay(), { passive:true });
  });

  // 初期配置：最初の実スライドを中央へ
  const initLeft = slides[idx].offsetLeft - track.offsetLeft;
  viewport.scrollTo({ left: initLeft, behavior:'auto' });
  updateUI();
  startAutoplay();
}

// 実行
document.querySelectorAll('[data-carousel]').forEach(initCarousel);

