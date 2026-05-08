// ===== Profile card script: flip and tilt are controlled by .card/.card-inner =====
(function(){
  const card  = document.querySelector("#cord .card");
  const isIOS = document.documentElement.classList.contains('is-ios');
  const inner = document.querySelector("#cord .card-inner");
  const mobileFactsQuery = window.matchMedia("(max-width: 640px)");
  if (!card || !inner) return;

  /* --- skills and age badges --- */
  const ICON_BASE = "./assets/icons/";
  const ICON_MAP = {
    Linux: ICON_BASE+"Linux.jpg", JavaScript: ICON_BASE+"JS.jpg",
    CSS: ICON_BASE+"CSS.jpg", HTML: ICON_BASE+"HTML.jpg",
    CAD: ICON_BASE+"CAD.jpg", CAE: ICON_BASE+"CAE.jpg",
    "electronic circuit": ICON_BASE+"electronic_circuit.jpg",
    "Three.js": ICON_BASE+"Threejs.jpg",
    FPGA: ICON_BASE+"fpga.jpg", PYNQ: ICON_BASE+"PYNQ.jpg",
    Python: ICON_BASE+"Python.jpg", HDL: ICON_BASE+"HDL.jpg",
    "C++": ICON_BASE+"Cpurapura.jpg", Processing: ICON_BASE+"Processing.jpg",
    Go: ICON_BASE+"Go.jpg", Java: ICON_BASE+"Java.jpg"
  };
  const SKILLS = [
    "CAD","CAE","electronic circuit","FPGA","HDL","PYNQ",
    "Linux","C++","Python","Go","Java","Processing",
    "HTML","CSS","JavaScript","Three.js"
  ];

  const fallback=(label)=>{
    const d=document.createElement("div");
    d.className="skill--fallback";
    const m=(label.match(/[A-Za-z+#]/g)||[label[0]||"?"]).slice(0,2).join("").toUpperCase();
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
        img.className="skill__icon"; img.alt=`${lbl} icon`; img.src=src;
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

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const textFaces = () => Array.from(card.querySelectorAll(".front .text, .back .text"));
  const hasTextOverflow = () => textFaces().some((el)=>{
    return el.scrollHeight - el.clientHeight > 1 || el.scrollWidth - el.clientWidth > 1;
  });
  const fitCardFont = ()=>{
    const w = card.clientWidth;
    const h = card.clientHeight;
    if (!w || !h) return;

    // Width-driven baseline zoom (small screens shrink, desktop gently enlarge).
    const minW = 320;
    const maxW = 1120;
    const t = clamp((w - minW) / (maxW - minW), 0, 1);
    let zoom = 0.84 + (1.06 - 0.84) * t;

    // If card height gets tight, nudge down slightly.
    if (h < 360) zoom -= 0.03;
    else if (h > 620) zoom += 0.01;

    zoom = clamp(zoom, 0.82, 1.08);
    card.style.setProperty("--font-zoom", zoom.toFixed(3));

    // Overflow guard: shrink stepwise until both sides fit.
    let guard = 0;
    while (guard < 10 && hasTextOverflow() && zoom > 0.78){
      zoom -= 0.02;
      card.style.setProperty("--font-zoom", zoom.toFixed(3));
      guard++;
    }
  };
  let fitRaf = 0;
  const scheduleFitCardFont = ()=>{
    if (fitRaf) cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(()=>{
      fitRaf = 0;
      fitCardFont();
    });
  };

  (function mount(){
    updateAgeBadges();
    if(typeof mobileFactsQuery.addEventListener==="function"){
      mobileFactsQuery.addEventListener("change", ()=>{
        updateAgeBadges();
        scheduleFitCardFont();
      });
    }else if(typeof mobileFactsQuery.addListener==="function"){
      mobileFactsQuery.addListener(()=>{
        updateAgeBadges();
        scheduleFitCardFont();
      });
    }
    render(document.getElementById("skills-front"));
    render(document.getElementById("skills-back"));
    scheduleFitCardFont();
  })();

  /* --- flip state and ARIA updates; inactive face is non-interactive --- */
  function setFacesAria(flipped){
    const front = inner.querySelector(".front");
    const back  = inner.querySelector(".back");
    if (front) front.setAttribute("aria-hidden", flipped ? "true" : "false");
    if (back ) back.setAttribute("aria-hidden",  flipped ? "false" : "true");
  }
  const toggleFlip=()=>{
    inner.classList.toggle("is-flipped");
    setFacesAria(inner.classList.contains("is-flipped"));
    scheduleFitCardFont();
  };

  // Flip the card when clicking on card surface (ignore nested buttons/links).
  card.addEventListener("click",(e)=>{
    if (e.target.closest('a,button')) return;
    toggleFlip();
  });
  // Keyboard accessibility: Enter/Space flips the card.
  card.addEventListener("keydown",(e)=>{
    const scrollers=['Space','PageUp','PageDown','ArrowUp','ArrowDown','Home','End'];
    if (e.code==='Enter' || e.code==='NumpadEnter' || e.code==='Space'){ e.preventDefault(); toggleFlip(); }
    else if (scrollers.includes(e.code)){ e.preventDefault(); }
  });
  setFacesAria(false);
  scheduleFitCardFont();

  window.addEventListener("resize", scheduleFitCardFont, { passive:true });
  window.addEventListener("orientationchange", scheduleFitCardFont, { passive:true });
  window.addEventListener("load", scheduleFitCardFont, { once:true });
  if ("ResizeObserver" in window){
    const ro = new ResizeObserver(scheduleFitCardFont);
    ro.observe(card);
  }

  /* __IOS_PATCH__ disable tilt/drop */
  if (isIOS) {
    // Freeze transforms controlled by JS
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--rz', '0deg');
    card.style.setProperty('--dropY', '0vh');
  }

  /* --- pointer-driven tilt and highlight tracking --- */
  const ROT_X_MAX=7, ROT_Y_MAX=7, STIFF=100, DAMP=14;
  let targetRX=0, targetRY=0, curRX=0, curRY=0, vRX=0, vRY=0;
  let shineX=.5, shineY=.5, mx=50, my=50;

  function updateShineAndTilt(clientX, clientY){
    const r = card.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (clientY - r.top ) / r.height));
    shineX = px; shineY = py;
    mx = Math.round(px*100); my = Math.round(py*100);

    // Normalize pointer position to range -1..1.
    const nx = px*2 - 1;
    const ny = py*2 - 1;

    // Convert normalized pointer position into rotation targets.
    targetRY = nx * ROT_Y_MAX;
    targetRX = -ny * ROT_X_MAX;

    // Share highlight coordinates with both front/back background layers.
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

  /* --- drop-in animation and impact spring --- */
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

    // Vertical drop simulation.
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

    // Critically damped spring toward target rotation.
    const axX=(targetRX-curRX)*STIFF - vRX*DAMP; vRX+=axX*dt; curRX+=vRX*dt;
    const axY=(targetRY-curRY)*STIFF - vRY*DAMP; vRY+=axY*dt; curRY+=vRY*dt;

    // Push animation values to CSS custom properties.
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

  /* --- Start drop after welcome overlay disappears --- */
  function startDrop(){ if (isIOS) return; yVH=-120; vY=0; rz=0; vrz=0; dropping=true; resetTilt(); }
  window.addEventListener('welcome:ended', startDrop, {once:true});
  window.addEventListener('load', ()=>{
    const w=document.getElementById('welcome');
    if(!w || w.style.display==='none' || w.classList.contains('hidden')) startDrop();
  }, {once:true});
})();
