/* =========================================================
   product-3d.js — Three.js 共通ビューワ（glTF / STL）
   - glTF：読み込み時にバウンディングで中心化 → Pivotで自転
   - STL ：従来の見え方・回転を維持
   - data-role + data-target ボタン（再生/停止・リセット）対応
   - ローディングオーバーレイ表示
   依存: three.min.js, OrbitControls.js,
         STLLoader.js, GLTFLoader.js
   ========================================================= */

(function () {
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const DEFAULTS = {
    glb: "../assets/tube_effector.glb",
    stl: "../assets/StratocasterType.stl",
  };

  // ---------- Loading overlay ----------
  function attachLoading(stageEl) {
    const overlay = document.createElement("div");
    overlay.className = "pd-3d__loading";
    overlay.innerHTML = `
      <span class="pd-3d__spinner" aria-hidden="true"></span>
      <span class="pd-3d__text">Now Loading…</span>`;
    stageEl.appendChild(overlay);
    const api = {
      show() { overlay.classList.add("is-active"); },
      hide() { overlay.classList.remove("is-active"); setTimeout(()=>overlay.remove(), 300); }
    };
    requestAnimationFrame(api.show);
    return api;
  }

  // ---------- Three base ----------
  function makeRenderer(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (renderer.xr) renderer.xr.enabled = false; // XRは使わない
    return renderer;
  }

  function makeScene(kind = "generic") {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f141d);

    if (kind === "gltf") {
      // ★ 明るめプリセット（スキャン/ブースター）
      const amb  = new THREE.AmbientLight(0xffffff, 1.10);
      const hemi = new THREE.HemisphereLight(0xffffff, 0x2a3444, 0.60);
      const key  = new THREE.DirectionalLight(0xffffff, 1.00); key.position.set( 3, 5,  2);
      const fill = new THREE.DirectionalLight(0xffffff, 0.90); fill.position.set(-3, 2, -2);
      const rim  = new THREE.DirectionalLight(0xffffff, 0.65); rim.position.set( 0, 4, -4);
      scene.add(amb, hemi, key, fill, rim);
    } else {
      // STL：従来の見え方
      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const dir = new THREE.DirectionalLight(0xffffff, 0.8);
      dir.position.set(3, 5, 2);
      dir.castShadow = true;
      scene.add(dir);
    }
    return scene;
  }

  function makeCamera(renderer) {
    const v = renderer.getSize(new THREE.Vector2());
    return new THREE.PerspectiveCamera(45, v.x / v.y, 0.1, 2000);
  }

  function makeControls(camera, canvas) {
    const controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.15;
    controls.rotateSpeed = 0.85;
    controls.zoomSpeed   = 0.85;
    return controls;
  }

  function handleResize(renderer, camera) {
    const onResize = () => {
      const parent = renderer.domElement.parentElement;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w > 0 && h > 0) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    };
    window.addEventListener("resize", onResize);
    onResize();
  }

  // ---------- Camera fit (斜め見下ろし) ----------
  function positionCameraOblique(camera, center, distance, yawDeg = 30, pitchDeg = 20) {
    const yaw   = THREE.MathUtils.degToRad(yawDeg);
    const pitch = THREE.MathUtils.degToRad(pitchDeg);
    const x = center.x + distance * Math.sin(yaw) * Math.cos(pitch);
    const y = center.y + distance * Math.sin(pitch);
    const z = center.z + distance * Math.cos(yaw) * Math.cos(pitch);
    camera.position.set(x, y, z);
    camera.lookAt(center);
  }

  function fitCameraToObject(camera, object, controls, margin = 1.6, yawDeg = 30, pitchDeg = 20, forceCenter = null) {
    // object のバウンディングから距離算出、center は forceCenter 優先（pivotを原点に置く場合）
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = forceCenter ?? box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = THREE.MathUtils.degToRad(camera.fov);
    let dist = Math.abs((maxDim / 2) / Math.tan(fov / 2)) * margin;
    dist = Math.max(dist, 0.1);

    camera.near = dist / 100;
    camera.far  = dist * 100;
    camera.updateProjectionMatrix();

    positionCameraOblique(camera, center, dist, yawDeg, pitchDeg);
    controls.target.copy(center);
    controls.update();

    return { center, dist };
  }

  function getAnglesFromCanvas(canvas) {
    const yaw   = canvas.dataset.yaw   ? parseFloat(canvas.dataset.yaw)   : 30;
    const pitch = canvas.dataset.pitch ? parseFloat(canvas.dataset.pitch) : 20;
    return { yaw, pitch };
  }

  function getButtonsForCanvas(canvas) {
    const idSel = canvas.id ? `#${CSS.escape(canvas.id)}` : "";
    const wrap = canvas.closest(".pd-3d") || document;
    let btnRotate = idSel ? wrap.querySelector(`[data-role="toggle-rotate"][data-target="${idSel}"]`) : null;
    let btnReset  = idSel ? wrap.querySelector(`[data-role="reset-view" ][data-target="${idSel}"]`) : null;
    if (!btnRotate && idSel) btnRotate = document.querySelector(`[data-role="toggle-rotate"][data-target="${idSel}"]`);
    if (!btnReset  && idSel) btnReset  = document.querySelector(`[data-role="reset-view" ][data-target="${idSel}"]`);
    if (!btnRotate) btnRotate = wrap.querySelector("#btn-rotate") || document.querySelector("#btn-rotate");
    if (!btnReset)  btnReset  = wrap.querySelector("#btn-reset")  || document.querySelector("#btn-reset");
    return { btnRotate, btnReset };
  }

  // ---------- glTF（中心化して Pivot で自転＝以前の正常挙動に合わせる） ----------
  function initGLBViewer(canvas) {
    if (!canvas || !THREE.GLTFLoader) return;

    const stage    = canvas.closest(".pd-3d__stage") || canvas.parentElement;
    const loading  = attachLoading(stage);
    const renderer = makeRenderer(canvas);
    const scene    = makeScene("gltf");

    // 明るさ（glTF のみ）：既定 1.72
    const exposure = canvas.dataset.exposure ? parseFloat(canvas.dataset.exposure) : 1.72;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = Math.max(exposure, 1.60);

    const camera   = makeCamera(renderer);
    const controls = makeControls(camera, canvas);
    handleResize(renderer, camera);

    const src = canvas.dataset.src?.trim() || DEFAULTS.glb;

    // 回転・角度
    let isRotating = (canvas.dataset.autoRotate !== "false");
    const rotSpeed = canvas.dataset.rotationSpeed ? parseFloat(canvas.dataset.rotationSpeed) : 0.35;
    const { yaw, pitch } = getAnglesFromCanvas(canvas);

    // ★ Pivot グループ（原点を回転中心にする）
    const pivot = new THREE.Group();
    scene.add(pivot);

    let model = null;   // 実体（gltf.scene）
    let normed = null;  // 原点中心化後のモデル（pivotの子）

    new THREE.GLTFLoader().load(
      src,
      (gltf) => {
        model = gltf.scene || gltf.scenes[0];

        // バウンディングから中心化
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        // モデル座標を「原点中心」に移動してから pivot に入れる
        model.position.sub(center);

        normed = model;
        pivot.add(normed);

        // カメラ・ターゲットは常に原点（0,0,0）を見る
        const fit = fitCameraToObject(camera, normed, controls, 1.6, yaw, pitch, new THREE.Vector3(0,0,0));
        controls.target.set(0,0,0);
        controls.update();

        loading.hide();
      },
      undefined,
      (err) => { console.error(`glTF load error: ${src}`, err); loading.hide(); }
    );

    const { btnRotate, btnReset } = getButtonsForCanvas(canvas);
    btnRotate && btnRotate.addEventListener("click", () => { isRotating = !isRotating; });
    btnReset  && btnReset.addEventListener("click", () => {
      // Pivot を初期姿勢へ
      pivot.rotation.set(0, 0, 0);
      // 見下ろしカメラへ戻す（原点を注視）
      positionCameraOblique(camera, new THREE.Vector3(0,0,0),
        camera.position.distanceTo(new THREE.Vector3(0,0,0)),
        yaw, pitch
      );
      controls.target.set(0,0,0);
      controls.update();
    });

    (function animate() {
      requestAnimationFrame(animate);
      if (normed && isRotating) {
        // ★ モデル本体ではなく pivot を回す＝常に原点中心の自転
        pivot.rotation.y -= (rotSpeed * 0.01);
      }
      controls.update();
      renderer.render(scene, camera);
    })();
  }

  // ---------- STL（据え置き） ----------
  function initSTLViewer(canvas) {
    if (!canvas || !THREE.STLLoader) return;
    const stage    = canvas.closest(".pd-3d__stage") || canvas.parentElement;
    const loading  = attachLoading(stage);
    const renderer = makeRenderer(canvas);
    const scene    = makeScene("stl"); // 従来
    const camera   = makeCamera(renderer);
    const controls = makeControls(camera, canvas);
    handleResize(renderer, camera);

    const src = canvas.dataset.src?.trim() || DEFAULTS.stl;
    let mesh = null;
    let isRotating = (canvas.dataset.autoRotate !== "false");
    const rotSpeed = canvas.dataset.rotationSpeed ? parseFloat(canvas.dataset.rotationSpeed) : 0.30;
    const color    = canvas.dataset.color || "#f0c9a2";
    const { yaw, pitch } = getAnglesFromCanvas(canvas);

    new THREE.STLLoader().load(
      src,
      (geom) => {
        geom.computeVertexNormals();
        const mat = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.55,
          metalness: 0.05,
          side: THREE.DoubleSide,
        });
        mesh = new THREE.Mesh(geom, mat);
        mesh.castShadow = true;
        scene.add(mesh);
        fitCameraToObject(camera, mesh, controls, 1.6, yaw, pitch);
        loading.hide();
      },
      undefined,
      (err) => { console.error(`STL load error: ${src}`, err); loading.hide(); }
    );

    const { btnRotate, btnReset } = getButtonsForCanvas(canvas);
    btnRotate && btnRotate.addEventListener("click", () => { isRotating = !isRotating; });
    btnReset  && btnReset.addEventListener("click", () => {
      if (!mesh) return;
      mesh.rotation.set(0, 0, 0);
      fitCameraToObject(camera, mesh, controls, 1.6, yaw, pitch);
    });

    (function animate() {
      requestAnimationFrame(animate);
      if (mesh && isRotating) mesh.rotation.y -= (rotSpeed * 0.01);
      controls.update();
      renderer.render(scene, camera);
    })();
  }

  // ---------- Entry ----------
  window.addEventListener("DOMContentLoaded", () => {
    // glTF 用（booster.html / スキャンなど）
    // 互換性: id="glb-canvas" だけでも glb として扱う
    const glbCanvases = $$("canvas[data-type='glb'], #glb-canvas");
    glbCanvases.forEach((c) => {
      if (c.id === "glb-canvas" || c.dataset.type === "glb") initGLBViewer(c);
    });

    // STL 用（strat.html の CAD 等）
    const stlCanvas = $("#stl-canvas");
    if (stlCanvas) initSTLViewer(stlCanvas);
    $$("canvas[data-type='stl']").forEach((c) => { if (c !== stlCanvas) initSTLViewer(c); });
  });
})();
