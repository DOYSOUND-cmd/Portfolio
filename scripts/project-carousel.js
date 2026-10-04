import { PROJECTS, HOME_FEATURED } from './projects-data.js';
import { cardInnerHtml, hasLinks, bindCardActivation, escapeHtml } from './project-card.js';

// ===============================
// Infinite loop + center emphasis + autoplay + tag wrapping + icons
// ===============================

function createCard(p) {
  const li = document.createElement("li");
  li.className = "product-slide";
  li.setAttribute("role", "option");
  li.setAttribute("aria-selected", "false");
  li.id = `prod-${p.id}`;

  const linked = hasLinks(p);
  const cardAttrs = linked
    ? ` tabindex="0" role="link" data-card-link="true" aria-label="${escapeHtml(p.title)}の詳細ページを開く"`
    : "";
  const cardClass = `product-card${linked ? " product-card--interactive" : ""}`;

  li.innerHTML = `
    <article class="${cardClass}"${cardAttrs}>
      ${cardInnerHtml(p, { titleTag: "h3" })}
    </article>
  `;
  return li;
}

function bindCardInteractions(track) {
  bindCardActivation(track, '.product-card[data-card-link="true"]');
}

function equalizeCardHeights(track) {
  const cards = track.querySelectorAll(".product-card");
  if (!cards.length) return;
  cards.forEach(card => (card.style.height = "auto"));
  let max = 0;
  cards.forEach(card => {
    const h = card.getBoundingClientRect().height;
    if (h > max) max = h;
  });
  if (!max) return;
  const targetHeight = `${Math.ceil(max)}px`;
  cards.forEach(card => {
    card.style.height = targetHeight;
  });
}

function setupCardHeightSync(track) {
  let raf = null;
  const schedule = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      raf = null;
      equalizeCardHeights(track);
    });
  };

  window.addEventListener("resize", () => schedule());

  const imgs = track.querySelectorAll("img");
  imgs.forEach(img => {
    if (img.complete) return;
    img.addEventListener("load", schedule, { once: true });
  });

  schedule();
}

// Metrics
function getMetrics(track) {
  const first = track.children[0];
  const style = first ? getComputedStyle(track) : null;
  const gap = first ? parseFloat(style.columnGap || style.gap || 0) : 0;
  const slideW = first ? first.getBoundingClientRect().width : 0;
  return { slideW, gap, step: slideW + gap };
}

// nearest slide to center
function nearestCenterIndex(viewport, slides) {
  const vp = viewport.getBoundingClientRect();
  const vpCenter = vp.left + vp.width / 2;
  let best = { i: 0, d: Infinity };
  for (let i = 0; i < slides.length; i++) {
    const r = slides[i].getBoundingClientRect();
    const center = r.left + r.width / 2;
    const d = Math.abs(center - vpCenter);
    if (d < best.d) best = { i, d };
  }
  return best.i;
}

/* 無限ループ用の複製。id はページ内で一意でなければならないため、
   複製側では id を剥がし、支援技術からも二重に見えないようにする。 */
function cloneSlide(slide) {
  const copy = slide.cloneNode(true);
  copy.removeAttribute("id");
  copy.dataset.clone = "true";
  copy.setAttribute("aria-hidden", "true");
  copy.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
  copy.querySelectorAll('[tabindex="0"]').forEach(el => el.setAttribute("tabindex", "-1"));
  return copy;
}

function buildLoop(track, items, cloneCount) {
  items.forEach(p => track.appendChild(createCard(p)));
  const realSlides = Array.from(track.children);
  for (let i = 0; i < cloneCount; i++) {
    track.appendChild(cloneSlide(realSlides[i])); // append tail
    track.insertBefore(cloneSlide(realSlides[realSlides.length - 1 - i]), track.firstChild); // prepend head
  }
}

function initCarousel(rootEl) {
  const viewport = rootEl.querySelector(".car-viewport");
  const track = rootEl.querySelector("#track");
  const prevBtn = rootEl.querySelector("[data-prev]");
  const nextBtn = rootEl.querySelector("[data-next]");
  const dotsWrap = rootEl.querySelector("[data-dots]");
  const live = rootEl.querySelector(".sr-live");
  const CLONES = 2;
  const AUTOPLAY_MS = 3500;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scope = rootEl.dataset.scope || "all";
  const items = scope === "home" && HOME_FEATURED.length ? HOME_FEATURED : PROJECTS;

  buildLoop(track, items, CLONES);
  bindCardInteractions(track);
  setupCardHeightSync(track);

  const slides = Array.from(track.children); // clones included
  const realLen = items.length;
  const startReal = CLONES;
  const endReal = CLONES + realLen - 1;
  let idx = startReal; // first real slide
  let isAnimating = false;
  let autoplayId = null;
  let metrics = getMetrics(track);

  // dots
  for (let i = 0; i < realLen; i++) {
    const b = document.createElement("button");
    b.className = "car-dot";
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", i === 0 ? "true" : "false");
    b.setAttribute("aria-label", `${i + 1}枚目へ移動`);
    b.addEventListener("click", () => go(startReal + i, true));
    dotsWrap.appendChild(b);
  }

  function announce() {
    if (live) live.textContent = `スライド${((idx - startReal + realLen) % realLen) + 1} / ${realLen}`;
  }
  function setCenterByIndex(i) {
    slides.forEach((li, j) => {
      const isCenter = j === i;
      li.classList.toggle("is-center", isCenter);
      // 複製スライドは aria-hidden なので選択状態を持たせない
      if (!li.dataset.clone) li.setAttribute("aria-selected", isCenter ? "true" : "false");
    });
  }
  function updateDots() {
    const realIndex = (idx - startReal + realLen) % realLen;
    dotsWrap.querySelectorAll(".car-dot").forEach((d, i) => {
      const selected = i === realIndex;
      d.setAttribute("aria-selected", selected ? "true" : "false");
      d.setAttribute("aria-current", selected ? "true" : "false");
    });
  }
  function jumpIfClone() {
    if (idx > endReal) {
      idx = startReal + (idx - endReal - 1);
      const left = slides[idx].offsetLeft - track.offsetLeft;
      viewport.scrollTo({ left, behavior: "auto" });
    } else if (idx < startReal) {
      idx = endReal - (startReal - idx - 1);
      const left = slides[idx].offsetLeft - track.offsetLeft;
      viewport.scrollTo({ left, behavior: "auto" });
    }
  }
  function updateUI() {
    updateDots();
    setCenterByIndex(idx);
    announce();
  }

  function go(targetIndex, userAction = false) {
    if (isAnimating) return;
    isAnimating = true;
    if (userAction) pauseAutoplayTemp();

    metrics = getMetrics(track);
    const dist = slides[targetIndex].offsetLeft - slides[idx].offsetLeft;

    if (reduceMotion) {
      viewport.scrollLeft += dist;
      idx = targetIndex;
      jumpIfClone();
      isAnimating = false;
      updateUI();
      return;
    }

    viewport.scrollBy({ left: dist, behavior: "smooth" });

    let ended = false;
    const unlock = () => {
      if (ended) return;
      ended = true;
      idx = nearestCenterIndex(viewport, slides);
      jumpIfClone();
      isAnimating = false;
      updateUI();
    };
    const dur = Math.min(700, Math.max(260, Math.abs(dist) * 0.55));
    const t = setTimeout(unlock, dur + 120);
    const onEnd = () => {
      clearTimeout(t);
      unlock();
      viewport.removeEventListener("scrollend", onEnd);
    };
    viewport.addEventListener("scrollend", onEnd, { once: true });
  }

  // Update center visual during scroll
  let ticking = false;
  viewport.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setCenterByIndex(nearestCenterIndex(viewport, slides));
        ticking = false;
      });
    },
    { passive: true }
  );

  // buttons and keys
  prevBtn.addEventListener("click", () => go(idx - 1, true));
  nextBtn.addEventListener("click", () => go(idx + 1, true));
  viewport.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(idx + 1, true);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(idx - 1, true);
    }
    if (e.key === "Home") {
      e.preventDefault();
      go(startReal, true);
    }
    if (e.key === "End") {
      e.preventDefault();
      go(endReal, true);
    }
  });

  // resize re-center
  window.addEventListener("resize", () => {
    metrics = getMetrics(track);
    const left = slides[idx].offsetLeft - track.offsetLeft;
    viewport.scrollTo({ left, behavior: "auto" });
    idx = nearestCenterIndex(viewport, slides);
    jumpIfClone();
    updateUI();
  });

  // autoplay
  function startAutoplay() {
    if (reduceMotion || autoplayId) return;
    autoplayId = setInterval(() => {
      if (!isAnimating) go(idx + 1);
    }, AUTOPLAY_MS);
  }
  function stopAutoplay() {
    if (autoplayId) {
      clearInterval(autoplayId);
      autoplayId = null;
    }
  }
  let pauseTimer = null;
  function pauseAutoplayTemp() {
    stopAutoplay();
    clearTimeout(pauseTimer);
    pauseTimer = setTimeout(() => startAutoplay(), 3000);
  }
  ["mouseenter", "focusin", "pointerdown", "touchstart"].forEach(evt => {
    rootEl.addEventListener(evt, () => pauseAutoplayTemp(), { passive: true });
  });
  ["mouseleave", "focusout"].forEach(evt => {
    rootEl.addEventListener(evt, () => startAutoplay(), { passive: true });
  });

  // 非表示タブで自動送りを回し続けない
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  // initial position
  const initLeft = slides[idx].offsetLeft - track.offsetLeft;
  viewport.scrollTo({ left: initLeft, behavior: "auto" });
  updateUI();
  startAutoplay();
}

// run in browser only
if (typeof document !== "undefined") {
  document.querySelectorAll("[data-carousel]").forEach(initCarousel);
}
