/* =========================================================
   Welcome — Flashy+ (長め表示 / スキップ無 / シャイン&回転なし / 強グリッチ)
   - 文字分割 + 強グリッチ
   - Canvas1: パーティクル（光粒）、Canvas2: コンフェッティ
   - クリック/タップで大バースト、マウス移動で小バースト
   - bfcache 復帰でも再生
   - ★ 終了時に window へ 'welcome:ended' を dispatch
   ========================================================= */
(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wrap = document.getElementById('welcome');
  if (!wrap) return;

  const title = wrap.querySelector('.w-title');
  const sub   = wrap.querySelector('.w-sub');

  // キャンバスを2枚
  const canvas1 = document.getElementById('welcome-canvas');
  const c1 = canvas1.getContext('2d', { alpha: true });
  const canvas2 = document.createElement('canvas');
  canvas2.className = 'w-canvas';
  wrap.insertBefore(canvas2, wrap.querySelector('.w-overlay'));
  const c2 = canvas2.getContext('2d', { alpha: true });

  function resize(){
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    [canvas1, canvas2].forEach(cv=>{
      cv.width  = cv.clientWidth  * dpr;
      cv.height = cv.clientHeight * dpr;
      const ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }
  resize();
  window.addEventListener('resize', resize);

  function splitText(el){
    const text = el.getAttribute('data-text') || el.textContent;
    el.textContent = '';
    const frag = document.createDocumentFragment();
    for (const ch of text){
      const sp = document.createElement('span');
      sp.className = 'w-char';
      sp.textContent = ch;
      frag.appendChild(sp);
    }
    el.appendChild(frag);
    return el.querySelectorAll('.w-char');
  }
  const chars = splitText(title);

  const TAU = Math.PI * 2;
  const palette = ['#6be7ff', '#9a7bff', '#22d3ee', '#f0abfc', '#a7f3d0', '#fde68a'];
  const rand=(a,b)=>Math.random()*(b-a)+a, pick=a=>a[(Math.random()*a.length)|0];

  class Particle{
    constructor(x,y,v,a,life,size){ this.x=x; this.y=y; this.vx=v*Math.cos(a); this.vy=v*Math.sin(a); this.t=0; this.life=life; this.size=size; this.color=pick(palette); }
    step(dt){ this.t+=dt; this.vy+=0.12*dt; this.vx*=0.994; this.vy*=0.994; this.x+=this.vx*(60*dt); this.y+=this.vy*(60*dt); return this.t<this.life; }
    draw(ctx){ const k=1-(this.t/this.life); ctx.globalAlpha=Math.max(k,0)*0.9; ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,TAU); ctx.fill(); ctx.globalAlpha=1; }
  }
  class Confetti{
    constructor(x,y){ this.x=x; this.y=y; this.w=rand(6,11); this.h=rand(8,14); this.a=rand(0,TAU); this.va=rand(-6,6); this.vx=rand(-1.8,1.8); this.vy=rand(-3.2,-1.2); this.color=pick(palette); this.t=0; this.life=rand(1.2,2.2); this.shape=pick(['rect','tri','circle']); }
    step(dt){ this.t+=dt; this.vy+=0.22*dt; this.vx*=0.995; this.vy*=0.995; this.x+=this.vx*(60*dt); this.y+=this.vy*(60*dt); this.a+=this.va*dt; return this.t<this.life; }
    draw(ctx){ const k=1-(this.t/this.life); ctx.save(); ctx.globalAlpha=Math.max(k,0.9)*.9; ctx.translate(this.x,this.y); ctx.rotate(this.a); ctx.fillStyle=this.color;
      if(this.shape==='rect'){ ctx.fillRect(-this.w/2,-this.h/2,this.w,this.h*(0.6+0.4*Math.sin(this.t*8))); }
      else if(this.shape==='tri'){ ctx.beginPath(); ctx.moveTo(0,-this.h/2); ctx.lineTo(this.w/2,this.h/2); ctx.lineTo(-this.w/2,this.h/2); ctx.closePath(); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(0,0,this.w*0.5,0,TAU); ctx.fill(); }
      ctx.restore(); ctx.globalAlpha=1;
    }
  }

  let particles=[], confettis=[], raf1=null, raf2=null;
  let last1=performance.now(), last2=performance.now();

  function burst(x,y,count=220,speed=rand(2.6,3.4)){ for(let i=0;i<count;i++){ particles.push(new Particle(x,y,speed*rand(0.6,1.2),rand(0,TAU),rand(0.6,1.3),rand(1.2,2.6))); } }
  function confettiBurst(x,y,count=120){ for(let i=0;i<count;i++){ confettis.push(new Confetti(x+rand(-16,16), y+rand(-8,8))); } }

  function loopParticles(now){
    const dt=Math.min((now-last1)/1000,0.033); last1=now;
    c1.fillStyle='rgba(11,15,22,0.30)'; c1.fillRect(0,0,canvas1.clientWidth,canvas1.clientHeight);
    particles=particles.filter(p=>p.step(dt)); for(const p of particles) p.draw(c1);
    raf1=requestAnimationFrame(loopParticles);
  }
  function loopConfetti(now){
    const dt=Math.min((now-last2)/1000,0.033); last2=now;
    c2.clearRect(0,0,canvas2.clientWidth,canvas2.clientHeight);
    confettis=confettis.filter(cf=>cf.step(dt)); for(const cf of confettis) cf.draw(c2);
    raf2=requestAnimationFrame(loopConfetti);
  }

  function play(){
    if (prefersReduced){ sub.style.opacity=1; return stop(300); }

    const spans=Array.from(chars);
    spans.forEach((sp,i)=>{
      setTimeout(()=>{ sp.animate(
        [{opacity:0,transform:'translateY(18px) scale(.98)',filter:'blur(6px)'},{opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0px)'}],
        {duration:520,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'}
      ); }, 80*i);
    });

    setTimeout(()=>{ sub.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'}); }, 80*spans.length-80);

    const rect=canvas1.getBoundingClientRect(); const cx=rect.width/2, cy=rect.height/2;
    burst(cx,cy,220,3.0); confettiBurst(cx,cy-20,120);
    setTimeout(()=>burst(cx,cy,120,2.6),260);
    setTimeout(()=>confettiBurst(cx,cy-30,80),420);

    last1=performance.now(); last2=last1; raf1=requestAnimationFrame(loopParticles); raf2=requestAnimationFrame(loopConfetti);

    setTimeout(()=>{ title.classList.add('glitch'); setTimeout(()=>title.classList.remove('glitch'), 1200); }, 900);

    stop(3500); // 表示時間を長めに
  }

  function stop(delay=0){
    setTimeout(()=>{
      wrap.classList.add('fade-out');
      setTimeout(()=>{
        cancelAnimationFrame(raf1); cancelAnimationFrame(raf2);
        particles.length=0; confettis.length=0;
        wrap.classList.remove('fade-out'); wrap.classList.add('hidden');

        // ★ Welcome 終了を通知（カード落下をトリガ）
        window.dispatchEvent(new CustomEvent('welcome:ended'));

      }, 420);
    }, delay);
  }

  // 追い演出
  const clientXY=(e)=> e.touches&&e.touches[0] ? [e.touches[0].clientX,e.touches[0].clientY] : [e.clientX,e.clientY];
  let lastBurst=0;
  wrap.addEventListener('pointermove',(e)=>{ const now=performance.now(); if(now-lastBurst<60) return; lastBurst=now; const [x,y]=clientXY(e); const r=canvas1.getBoundingClientRect(); burst(x-r.left,y-r.top,14,1.8); }, {passive:true});
  wrap.addEventListener('click',(e)=>{ const [x,y]=clientXY(e); const r=canvas1.getBoundingClientRect(); burst(x-r.left,y-r.top,220,3.2); confettiBurst(x-r.left,y-r.top-20,140); title.classList.add('glitch'); setTimeout(()=>title.classList.remove('glitch'),800); }, {passive:true});

  window.addEventListener('load', play, { once:true });
  window.addEventListener('pageshow', (e)=>{ if(e.persisted){ cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); particles.length=0; confettis.length=0; wrap.classList.remove('hidden'); if(!title.querySelector('.w-char')) splitText(title); resize(); play(); } });
})();
