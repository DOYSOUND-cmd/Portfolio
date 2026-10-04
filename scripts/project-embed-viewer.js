/* =========================================================
   project-embed-viewer.js — 3Dビューアの読み込み順を制御する
   - ビューアはページを開いた時点で自動的に読み込む（クリック不要）
   - ただし同時に走らせると、点群(.spz)を複数のiframeが
     別々にダウンロードしてしまう。そこで [data-embed-after] を
     持つiframeは、指定したモードのビューアが読み込み終わって
     から src を入れる。2本目以降はビューア側の Cache Storage に乗る。
   - メッセージが来ない場合に備えて、一定時間で必ず読み込む
   ========================================================= */

const FALLBACK_MS = 45000;

const pending = Array.from(document.querySelectorAll("iframe[data-embed-after][data-src]"));

if (pending.length) {
  const start = (frame) => {
    if (!frame || frame.dataset.started) return;
    frame.dataset.started = "1";
    frame.src = frame.dataset.src;
  };

  window.addEventListener("message", (ev) => {
    const data = ev.data;
    if (!data || typeof data !== "object" || !data.ldkViewer) return;
    // ready でも error でも、次のビューアは読み込む
    pending.filter((f) => f.dataset.embedAfter === data.mode).forEach(start);
  });

  // 保険：メッセージが届かなくても必ず読み込む
  pending.forEach((f) => setTimeout(() => start(f), FALLBACK_MS));
}
