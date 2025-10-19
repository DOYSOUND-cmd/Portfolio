// ===== cord.js（flipは .card-inner、落下/チルトは .card） =====
(function(){
  const card  = document.querySelector("#cord .card");
  const isIOS = document.documentElement.classList.contains('is-ios');
  const inner = document.querySelector("#cord .card-inner");
  if (!card || !inner) return;

  /* --- スキル & 年齢 --- */
  const ICON_BASE = "./assets/icons/";
  const ICON_MAP = {
    Linux: ICON_BASE+"Linux.png", JavaScript: ICON_BASE+"JS.png",
    CSS: ICON_BASE+"CSS.png", HTML: ICON_BASE+"HTML.png",
    CAD: ICON_BASE+"CAD.jpg", CAE: ICON_BASE+"CAE.png",
    "electronic circuit": ICON_BASE+"electronic_circuit.jpg",
    "Three.js": ICON_BASE+"Threejs.png",
    FPGA: ICON_BASE+"fpga.png", PYNQ: ICON_BASE+"PYNQ.png",
    Python: ICON_BASE+"Python.png", HDL: ICON_BASE+"HDL.png",
    "C++": ICON_BASE+"Cpurapura.png", Processing: ICON_BASE+"Processing.png",
    Go: ICON_BASE+"Go.png", Java: ICON_BASE+"Java.png"
  };
  const SKILLS = [
    "CAD","CAE","electronic circuit","FPGA","HDL","PYNQ",
    "Linux","C++","Python","Go","Java","Processing",
    "HTML","CSS","JavaScript","Three.js"
  ];

  const fallback=(label)=>{
    const d=document.createElement("div");
    d.className="skill--fallback";
    const m=(label.match(/[A-Za-z+#]/g)||[label[0]||"•"]).slice(0,2).join("").toUpperCase();
    d.textContent=m; d.setAttribute("aria-hidden","true");
    return d;
  };
  const render=(ul)=>{
    if(!ul) return;
    const frag=document.createDocumentFragment();
    SKILLS.forEach(lbl=>{
      const li=document.createElement("li"); li.className="skill";
      const src=ICON_MAP[lbl];
      if(src){
        const img=document.createElement("img");
        img.className="skill__icon"; img.alt=`${lbl} アイコン`; img.src=src;
        img.onerror=()=>img.replaceWith(fallback(lbl));
        li.appendChild(img);
      }else{
        li.appendChild(fallback(lbl));
      }
      li.appendChild(document.createTextNode(lbl));
      frag.appendChild(li);
    });
    ul.textContent=""; ul.appendChild(frag);
  };
  const calcAge=(iso)=>{
    const b=new Date(iso+"T00:00:00"), t=new Date();
    let a=t.getFullYear()-b.getFullYear();
    const m=t.getMonth()-b.getMonth();
    if(m<0||(m===0&&t.getDate()<b.getDate())) a--;
    return a;
  };
  (function mount(){
    const age=calcAge("2002-05-08");
    const jp=document.getElementById("age-jp"), en=document.getElementById("age-en");
    if(jp) jp.textContent=`（${age}歳）`;
    if(en) en.textContent=`(${age} years old)`;
    render(document.getElementById("skills-front"));
    render(document.getElementById("skills-back"));
  })();

  /* --- 表裏の ARIA のみ更新（pointer-events は切替しない） --- */
  function setFacesAria(flipped){
    const front = inner.querySelector(".front");
    const back  = inner.querySelector(".back");
    if (front) front.setAttribute("aria-hidden", flipped ? "true" : "false");
    if (back ) back.setAttribute("aria-hidden",  flipped ? "false" : "true");
  }
  const toggleFlip=()=>{
    inner.classList.toggle("is-flipped");
    setFacesAria(inner.classList.contains("is-flipped"));
  };

  // クリックは外側の .card で拾う（リンク/ボタンは除外）
  card.addEventListener("click",(e)=>{
    if (e.target.closest('a,button')) return;
    toggleFlip();
  });
  // キー操作（Enter/Space）
  card.addEventListener("keydown",(e)=>{
    const scrollers=['Space','PageUp','PageDown','ArrowUp','ArrowDown','Home','End'];
    if (e.code==='Enter' || e.code==='NumpadEnter' || e.code==='Space'){ e.preventDefault(); toggleFlip(); }
    else if (scrollers.includes(e.code)){ e.preventDefault(); }
  });
  setFacesAria(false);

  /* __IOS_PATCH__ disable tilt/drop */
  if (isIOS) {
    // Freeze transforms controlled by JS
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--rz', '0deg');
    card.style.setProperty('--dropY', '0vh');
  }

  /* --- ポインタチルト（裏面でも反転しない：表裏共通の直観的挙動） --- */
  const ROT_X_MAX=7, ROT_Y_MAX=7, STIFF=100, DAMP=14;
  let targetRX=0, targetRY=0, curRX=0, curRY=0, vRX=0, vRY=0;
  let shineX=.5, shineY=.5, mx=50, my=50;

  function updateShineAndTilt(clientX, clientY){
    const r = card.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (clientY - r.top ) / r.height));
    shineX = px; shineY = py;
    mx = Math.round(px*100); my = Math.round(py*100);

    // -1..1 に正規化（★ 裏面でも反転しない）
    const nx = px*2 - 1;
    const ny = py*2 - 1;

    // 右に動かせば右へ、下に動かせば手前へ（表裏共通）
    targetRY = nx * ROT_Y_MAX;
    targetRX = -ny * ROT_X_MAX;

    // ハイライトは front/back に同じ px/py を渡す
    const bgFront = inner.querySelector('.front .bg');
    const bgBack  = inner.querySelector('.back  .bg');
    if (bgFront){
      bgFront.style.setProperty('--shineX', Math.round(px*100)+'%');
      bgFront.style.setProperty('--shineY', Math.round(py*100)+'%');
    }
    if (bgBack){
      bgBack.style.setProperty('--shineX', Math.round(px*100)+'%');
      bgBack.style.setProperty('--shineY', Math.round(py*100)+'%');
    }
  }

  const onMove=(ev)=>{
    const t = ('touches' in ev && ev.touches[0]) ? ev.touches[0] : ev;
    updateShineAndTilt(t.clientX, t.clientY);
  };
  card.addEventListener("mousemove", onMove, {passive:true});
  card.addEventListener("touchmove", onMove, {passive:true});

  const resetTilt=()=>{
    targetRX=0; targetRY=0;
    const rect = card.getBoundingClientRect();
    updateShineAndTilt(rect.left + rect.width/2, rect.top + rect.height/2);
  };
  card.addEventListener("mouseleave", resetTilt);
  card.addEventListener("touchend", resetTilt);

  /* --- 物理落下（card に反映） --- */
  let dropping=false, yVH=-120, vY=0;
  const GRAV=400, REST=0.20, STOP_V=10;
  let rz=0, vrz=0; const Kz=80, Cz=14;
  let glossImpact=0; const IMP_DECAY=5.5;

  const pressOn=()=> inner.classList.add('is-pressing');
  const pressOff=()=> inner.classList.remove('is-pressing');
  inner.addEventListener('mousedown', pressOn);
  window.addEventListener('mouseup',   pressOff);
  inner.addEventListener('touchstart', pressOn, {passive:true});
  window.addEventListener('touchend',  pressOff);

  /* --- RAF --- */
  let prev=performance.now();
  function raf(){
    const now=performance.now(); let dt=(now-prev)/1000; prev=now; dt=Math.min(dt,1/30);

    // 落下
    if(dropping){
      vY += GRAV*dt; yVH += vY*dt;
      if(yVH>=0){
        yVH=0; vY = -vY*REST; glossImpact=0.22; vrz += (Math.random()*10 - 5);
        if(Math.abs(vY)<STOP_V){ dropping=false; yVH=0; vY=0; }
      }
      const az=(-Kz*rz - Cz*vrz); vrz += az*dt; rz += vrz*dt;
      glossImpact = Math.max(0, glossImpact - IMP_DECAY*dt);
    }else{
      if(Math.abs(rz)>0.001 || Math.abs(vrz)>0.001){
        const az=(-Kz*rz - Cz*vrz); vrz += az*dt; rz += vrz*dt;
      }else{ rz=0; vrz=0; }
      glossImpact = Math.max(0, glossImpact - IMP_DECAY*dt);
    }

    // チルト（スプリング）
    const axX=(targetRX-curRX)*STIFF - vRX*DAMP; vRX+=axX*dt; curRX+=vRX*dt;
    const axY=(targetRY-curRY)*STIFF - vRY*DAMP; vRY+=axY*dt; curRY+=vRY*dt;

    // CSS反映（card 側）
    card.style.setProperty('--dropY', `${yVH}vh`);
    card.style.setProperty('--rz', `${rz.toFixed(3)}deg`);
    card.style.setProperty('--rx', `${curRX.toFixed(3)}deg`);
    card.style.setProperty('--ry', `${curRY.toFixed(3)}deg`);
    card.style.setProperty('--mx', `${mx}%`);
    card.style.setProperty('--my', `${my}%`);
    card.style.setProperty('--glossImpact', glossImpact.toFixed(3));

    if (!isIOS) requestAnimationFrame(raf);
  }
  if (!isIOS) requestAnimationFrame(raf);

  /* --- Welcome 演出終了で落下開始（無ければ即） --- */
  function startDrop(){ if (isIOS) return; yVH=-120; vY=0; rz=0; vrz=0; dropping=true; resetTilt(); }
  window.addEventListener('welcome:ended', startDrop, {once:true});
  window.addEventListener('load', ()=>{
    const w=document.getElementById('welcome');
    if(!w || w.style.display==='none' || w.classList.contains('hidden')) startDrop();
  }, {once:true});
})();
