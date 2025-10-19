/* =========================================================
   product-3d.js — Three.js 共通ビューワ
   - Strat( STL ) / Booster( glTF ) の両方に対応
   - モデルの既定パスは ../assets/ を参照
   - <canvas data-src="..."> があればそれを優先
   - WebXR は明示的に無効化
   - 依存: three.min.js, OrbitControls.js,
           STLLoader.js（STLを使うページのみ）
           GLTFLoader.js（glTFを使うページのみ）
   ========================================================= */

(function () {
  // ユーティリティ
  const $ = (sel, root = document) => root.querySelector(sel);

  // 既定パス（詳細ページは productions/ 配下で動く想定）
  const DEFAULTS = {
    glb: "../assets/tube_effector.glb",
    stl: "../assets/StratocasterType.stl",
  };

  // ========= 共通：シーン初期化 =========
  function makeRenderer(canvas) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (renderer.xr) renderer.xr.enabled = false; // XRは使わない
    return renderer;
  }

  function makeScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f141d);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(3, 5, 2);
    dir.castShadow = true;
    scene.add(dir);

    return scene;
  }

  function fitCameraToObject(camera, object, controls, margin = 1.5) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = THREE.MathUtils.degToRad(camera.fov);
    let camZ = Math.abs((maxDim / 2) / Math.tan(fov / 2)) * margin;

    // 正の距離に保つ
    camZ = Math.max(camZ, 0.1);

    camera.position.set(center.x, center.y, center.z + camZ);
    camera.near = camZ / 100;
    camera.far = camZ * 100;
    camera.updateProjectionMatrix();

    controls.target.copy(center);
    controls.update();
  }

  function makeCamera(renderer) {
    const { width, height } = renderer.getSize(new THREE.Vector2());
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    return camera;
  }

  function makeControls(camera, canvas) {
    const controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.15;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 0.8;
    return controls;
  }

  function handleResize(renderer, camera) {
    const onResize = () => {
      const parent = renderer.domElement.parentElement;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);
    onResize(); // 初回適用
  }

  // ========= glTF ビューア（真空管ブースター） =========
  function initGLBViewer(canvas) {
    if (!canvas || !THREE.GLTFLoader) return;

    const renderer = makeRenderer(canvas);
    const scene = makeScene();
    const camera = makeCamera(renderer);
    const controls = makeControls(camera, canvas);
    handleResize(renderer, camera);

    const src = canvas.dataset.src && canvas.dataset.src.trim()
      ? canvas.dataset.src.trim()
      : DEFAULTS.glb;

    let root = null;
    let isRotating = true;

    const loader = new THREE.GLTFLoader();
    loader.load(
      src,
      (gltf) => {
        root = gltf.scene || gltf.scenes[0];
        scene.add(root);

        // 尺度を揃えたい場合は調整（必要なければ削除可）
        // root.scale.set(1, 1, 1);

        fitCameraToObject(camera, root, controls, 1.6);
      },
      undefined,
      (err) => {
        console.error(`glTF load error: ${src}`, err);
      }
    );

    // UI（任意のボタンがページにある場合のみ機能）
    const toolbar = canvas.closest(".pd-3d") || document;
    const btnRotate = $("#btn-rotate", toolbar);
    const btnReset = $("#btn-reset", toolbar);

    btnRotate && btnRotate.addEventListener("click", () => {
      isRotating = !isRotating;
    });

    btnReset && btnReset.addEventListener("click", () => {
      if (root) {
        root.rotation.set(0, 0, 0);
        fitCameraToObject(camera, root, controls, 1.6);
      }
    });

    function animate() {
      requestAnimationFrame(animate);
      if (root && isRotating) {
        root.rotation.y -= 0.0035;
      }
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
  }

  // ========= STL ビューア（ストラト） =========
  function initSTLViewer(canvas) {
    if (!canvas || !THREE.STLLoader) return;

    const renderer = makeRenderer(canvas);
    const scene = makeScene();
    const camera = makeCamera(renderer);
    const controls = makeControls(camera, canvas);
    handleResize(renderer, camera);

    const src = canvas.dataset.src && canvas.dataset.src.trim()
      ? canvas.dataset.src.trim()
      : DEFAULTS.stl;

    let mesh = null;
    let isRotating = true;

    const loader = new THREE.STLLoader();
    loader.load(
      src,
      (geom) => {
        geom.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({
          color: 0xf0c9a2,
          roughness: 0.55,
          metalness: 0.05,
          side: THREE.DoubleSide,
        });

        mesh = new THREE.Mesh(geom, mat);
        mesh.castShadow = true;
        scene.add(mesh);

        // サイズに応じてカメラ合わせ
        fitCameraToObject(camera, mesh, controls, 1.6);
      },
      undefined,
      (err) => {
        console.error(`STL load error: ${src}`, err);
      }
    );

    // UI（任意）
    const toolbar = canvas.closest(".pd-3d") || document;
    const btnRotate = $("#btn-rotate", toolbar);
    const btnReset = $("#btn-reset", toolbar);

    btnRotate && btnRotate.addEventListener("click", () => {
      isRotating = !isRotating;
    });

    btnReset && btnReset.addEventListener("click", () => {
      if (mesh) {
        mesh.rotation.set(0, 0, 0);
        fitCameraToObject(camera, mesh, controls, 1.6);
      }
    });

    function animate() {
      requestAnimationFrame(animate);
      if (mesh && isRotating) {
        mesh.rotation.y -= 0.0035;
      }
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
  }

  // ========= エントリ =========
  window.addEventListener("DOMContentLoaded", () => {
    // glTF 用（booster.html 等）
    const glbCanvas = document.getElementById("glb-canvas");
    if (glbCanvas) initGLBViewer(glbCanvas);

    // STL 用（strat.html 等）
    const stlCanvas = document.getElementById("stl-canvas");
    if (stlCanvas) initSTLViewer(stlCanvas);
  });
})();
