/* =========================================================
   theme-init.js — 初回描画前にテーマを確定させる
   - ?sctheme=dark|light > localStorage > OSの設定 の順で決定
   - <head> で同期読み込みすること（描画後だと一瞬ちらつく）
   - 以前は全ページに同じ内容がインラインで書かれていたため、
     ここへ集約した。site-chrome.js とペア。
   ========================================================= */
(function () {
  try {
    var q = location.search.match(/[?&]sctheme=(dark|light)/);
    var t = q ? q[1] : localStorage.getItem("theme");
    if (t !== "dark" && t !== "light") {
      t = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.classList.add("sc-js");
  } catch (e) {}
})();
