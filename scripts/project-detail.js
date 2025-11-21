/* =========================================================
   Product Detail 共通スクリプト（軽量）
   - ギャラリー画像へ安全な遅延読み込み属性を付与
   - 画像の縦長/横長に応じて figure を少しだけ調整（任意）
   ========================================================= */

(function enhanceGallery(){
  document.querySelectorAll('.pd-shot img').forEach(img=>{
    if(!img.hasAttribute('loading')) img.setAttribute('loading','lazy');
    if(!img.hasAttribute('decoding')) img.setAttribute('decoding','async');

    // 読み込み後にサイズを検出して、縦長は少し余白を詰める（任意）
    img.addEventListener('load', ()=>{
      const fig = img.closest('.pd-shot');
      if(!fig) return;
      const isPortrait = img.naturalHeight > img.naturalWidth;
      fig.style.padding = isPortrait ? '10px' : '12px';
    }, { once:true });
  });
})();
