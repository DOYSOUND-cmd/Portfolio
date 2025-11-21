// ===== cord.js・・lip縺ｯ .card-inner縲∬誠荳・繝√Ν繝医・ .card・・=====
(function(){
  const card  = document.querySelector("#cord .card");
  const isIOS = document.documentElement.classList.contains('is-ios');
  const inner = document.querySelector("#cord .card-inner");
  const mobileFactsQuery = window.matchMedia("(max-width: 640px)");
  if (!card || !inner) return;

  /* --- 繧ｹ繧ｭ繝ｫ & 蟷ｴ鮨｢ --- */
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
    const m=(label.match(/[A-Za-z+#]/g)||[label[0]||"窶｢"]).slice(0,2).join("").toUpperCase();
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
        img.className="skill__icon"; img.alt=`${lbl} 繧｢繧､繧ｳ繝ｳ`; img.src=src;
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
  const updateAgeBadges=()=>{
    const jp=document.getElementById("age-jp");
    const en=document.getElementById("age-en");
    if(mobileFactsQuery.matches){
      if(jp) jp.textContent="";
      if(en) en.textContent="";
      return;
    }
    const age=calcAge("2002-05-08");
    if(jp) jp.textContent=`（${age}歳）`;
    if(en) en.textContent=`(${age} years old)`;
  };
  (function mount(){
    updateAgeBadges();
    if(typeof mobileFactsQuery.addEventListener==="function"){
      mobileFactsQuery.addEventListener("change", updateAgeBadges);
    }else if(typeof mobileFactsQuery.addListener==="function"){
      mobileFactsQuery.addListener(updateAgeBadges);
    }
    render(document.getElementById("skills-front"));
    render(document.getElementById("skills-back"));
  })();

  /* --- 陦ｨ陬上・ ARIA 縺ｮ縺ｿ譖ｴ譁ｰ・・ointer-events 縺ｯ蛻・崛縺励↑縺・ｼ・--- */
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

  // 繧ｯ繝ｪ繝・け縺ｯ螟門・縺ｮ .card 縺ｧ諡ｾ縺・ｼ医Μ繝ｳ繧ｯ/繝懊ち繝ｳ縺ｯ髯､螟厄ｼ・
  card.addEventListener("click",(e)=>{
    if (e.target.closest('a,button')) return;
    toggleFlip();
  });
  // 繧ｭ繝ｼ謫堺ｽ懶ｼ・nter/Space・・
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

  /* --- 繝昴う繝ｳ繧ｿ繝√Ν繝茨ｼ郁｣城擇縺ｧ繧ょ渚霆｢縺励↑縺・ｼ夊｡ｨ陬丞・騾壹・逶ｴ隕ｳ逧・嫌蜍包ｼ・--- */
  const ROT_X_MAX=7, ROT_Y_MAX=7, STIFF=100, DAMP=14;
  let targetRX=0, targetRY=0, curRX=0, curRY=0, vRX=0, vRY=0;
  let shineX=.5, shineY=.5, mx=50, my=50;

  function updateShineAndTilt(clientX, clientY){
    const r = card.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (clientY - r.top ) / r.height));
    shineX = px; shineY = py;
    mx = Math.round(px*100); my = Math.round(py*100);

    // -1..1 縺ｫ豁｣隕丞喧・遺・ 陬城擇縺ｧ繧ょ渚霆｢縺励↑縺・ｼ・
    const nx = px*2 - 1;
    const ny = py*2 - 1;

    // 蜿ｳ縺ｫ蜍輔°縺帙・蜿ｳ縺ｸ縲∽ｸ九↓蜍輔°縺帙・謇句燕縺ｸ・郁｡ｨ陬丞・騾夲ｼ・
    targetRY = nx * ROT_Y_MAX;
    targetRX = -ny * ROT_X_MAX;

    // 繝上う繝ｩ繧､繝医・ front/back 縺ｫ蜷後§ px/py 繧呈ｸ｡縺・
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

  /* --- 迚ｩ逅・誠荳具ｼ・ard 縺ｫ蜿肴丐・・--- */
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

    // 關ｽ荳・
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

    // 繝√Ν繝茨ｼ医せ繝励Μ繝ｳ繧ｰ・・
    const axX=(targetRX-curRX)*STIFF - vRX*DAMP; vRX+=axX*dt; curRX+=vRX*dt;
    const axY=(targetRY-curRY)*STIFF - vRY*DAMP; vRY+=axY*dt; curRY+=vRY*dt;

    // CSS蜿肴丐・・ard 蛛ｴ・・
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

  /* --- Welcome 貍泌・邨ゆｺ・〒關ｽ荳矩幕蟋具ｼ育┌縺代ｌ縺ｰ蜊ｳ・・--- */
  function startDrop(){ if (isIOS) return; yVH=-120; vY=0; rz=0; vrz=0; dropping=true; resetTilt(); }
  window.addEventListener('welcome:ended', startDrop, {once:true});
  window.addEventListener('load', ()=>{
    const w=document.getElementById('welcome');
    if(!w || w.style.display==='none' || w.classList.contains('hidden')) startDrop();
  }, {once:true});
})();
