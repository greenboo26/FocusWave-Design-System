/* FocusWave dusk visual — sunset reflected on water.
 * State is expressed only by horizontal motion of the reflection lines:
 * stable = still; drift and dispersed use the exact same lateral-slide grammar,
 * differing only in motion amplitude and speed.
 * Dusk owns a dedicated live requestAnimationFrame loop so the reflection is
 * guaranteed to keep sliding during the real focus session.
 * No MutationObserver and no global polling.
 */
(() => {
  if (window.FocusWaveDuskReflection) return;

  const warm = [181,119,102];
  let installed = false;
  let baseDrawField = null;
  let motionPhase = 0;
  let lastMotionT = null;
  let duskRaf = 0;

  function rgba(c,a){ return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
  function clamp01(x){ return Math.max(0,Math.min(1,x)); }
  function smooth01(x){ x=clamp01(x); return x*x*(3-2*x); }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function noise(n){
    const x=Math.sin(n*12.9898+78.233)*43758.5453123;
    return x-Math.floor(x);
  }
  function stateKey(st){ return st?.key || 'stable'; }

  function canvasSize(canvas){
    const d=Math.min(window.devicePixelRatio||1,2);
    const r=canvas.getBoundingClientRect();
    const w=Math.max(10,Math.floor(r.width*d));
    const h=Math.max(10,Math.floor(r.height*d));
    if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; }
    return {w,h};
  }

  const movingAppearance={
    reflectionAlpha:.42,
    waterAlpha:.10,
    horizonAlpha:.19
  };

  function modeFor(key){
    if(key==='stable') return {
      shift:0,
      speed:0,
      reflectionAlpha:.44,
      waterAlpha:.09,
      horizonAlpha:.18
    };
    if(key==='drift') return {
      // Half of the prior drift amplitude and speed.
      shift:.032,
      speed:1.74,
      ...movingAppearance
    };
    if(key==='dispersed') return {
      // Uses the prior drift animation level.
      shift:.064,
      speed:3.48,
      ...movingAppearance
    };
    return {
      shift:.006,
      speed:.42,
      ...movingAppearance
    };
  }

  function advanceMotionClock(t,speed){
    if(lastMotionT===null || t<lastMotionT){
      lastMotionT=t;
      return motionPhase;
    }
    const dt=Math.min(.05,Math.max(0,t-lastMotionT));
    lastMotionT=t;
    motionPhase+=dt*speed;
    return motionPhase;
  }

  function drawSun(ctx,w,h,c){
    const sx=w*.63, sy=h*.255, r=Math.min(w,h)*.058;
    const halo=ctx.createRadialGradient(sx,sy,r*.20,sx,sy,r*2.45);
    halo.addColorStop(0,rgba(c,.10));
    halo.addColorStop(.42,rgba(c,.045));
    halo.addColorStop(1,rgba(c,0));
    ctx.fillStyle=halo;
    ctx.beginPath(); ctx.arc(sx,sy,r*2.45,0,Math.PI*2); ctx.fill();

    ctx.fillStyle=rgba(c,.095);
    ctx.beginPath(); ctx.arc(sx,sy,r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=rgba(c,.30);
    ctx.lineWidth=Math.max(1,Math.min(w,h)*.00115);
    ctx.beginPath(); ctx.arc(sx,sy,r,0,Math.PI*2); ctx.stroke();
    return {sx};
  }

  function drawWater(ctx,w,h,c,m){
    const horizon=h*.385;
    const bottom=h*.89;
    const rowCount=48;

    ctx.strokeStyle=rgba(c,m.horizonAlpha);
    ctx.lineWidth=Math.max(.75,w*.0007);
    ctx.beginPath(); ctx.moveTo(w*.07,horizon); ctx.lineTo(w*.94,horizon); ctx.stroke();

    // The water guide lines stay horizontal; only the reflected-light fragments move.
    for(let row=0;row<rowCount;row++){
      const q=row/(rowCount-1);
      const y=lerp(horizon+h*.014,bottom,q);
      const alpha=m.waterAlpha*(.72+.28*(1-q));
      ctx.strokeStyle=rgba(c,alpha);
      ctx.lineWidth=Math.max(.55,w*(.00042+.00018*q));
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(w*.055,y);
      ctx.lineTo(w*.945,y);
      ctx.stroke();
    }
    return {horizon,bottom,rowCount};
  }

  function rowShift(row,q,m,phase,w){
    if(m.shift===0) return 0;
    // Every reflection row repeatedly slides left/right. Rows keep small phase/rate
    // differences so the reflection feels like water without adding vertical motion.
    const amp=m.shift*w*(.82+.18*noise(3100+row))*(.72+.28*q);
    const rowRate=.94+.12*noise(3200+row);
    const seedPhase=noise(3300+row)*Math.PI*2;
    return amp*Math.sin(phase*rowRate+seedPhase);
  }

  function drawReflection(ctx,w,h,c,m,phase,sun,water){
    const {horizon,bottom,rowCount}=water;
    const centerX=sun.sx;

    for(let row=0;row<rowCount;row++){
      const q=row/(rowCount-1);
      const y=lerp(horizon+h*.010,bottom,q);
      const widen=smooth01(q);
      const half=w*lerp(.022,.120,widen)*(.88+.24*noise(500+row));
      const center=centerX+rowShift(row,q,m,phase,w);

      const pieces=q<.22 ? 1 : (q<.62 ? 2 : 3);
      const block=(half*2)/pieces;
      for(let p=0;p<pieces;p++){
        const edge=center-half+p*block;
        const trimL=.08+.15*noise(1100+row*17+p);
        const trimR=.08+.17*noise(1300+row*19+p);
        const x1=edge+block*trimL;
        const x2=edge+block*(1-trimR);
        if(x2<=x1) continue;

        const alpha=m.reflectionAlpha*(1-.16*q)*(.88+.14*noise(1500+row*11+p));
        const thickness=Math.max(1,w*(.0010+.00080*(1-q)));
        ctx.strokeStyle=rgba(c,alpha);
        ctx.lineWidth=thickness;
        ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(x1,y);
        ctx.lineTo(x2,y);
        ctx.stroke();
      }
    }
  }

  function drawDusk(canvas,opt={}){
    if(!canvas) return;
    const {w,h}=canvasSize(canvas);
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,w,h);
    const key=stateKey(opt.state);
    const m=modeFor(key);
    const phase=Number.isFinite(opt.phase)
      ? opt.phase
      : advanceMotionClock(opt.t||0,key==='stable'?0:m.speed);
    const sun=drawSun(ctx,w,h,warm);
    const water=drawWater(ctx,w,h,warm,m);
    drawReflection(ctx,w,h,warm,m,phase,sun,water);
  }

  function stopDuskLiveLoop(){
    if(duskRaf){
      cancelAnimationFrame(duskRaf);
      duskRaf=0;
    }
  }

  function startDuskLiveLoop(){
    stopDuskLiveLoop();
    if(typeof activeTheme==='undefined' || activeTheme!=='dusk') return;
    if(typeof currentPage==='undefined' || currentPage!=='live') return;

    // startLive() has already scheduled the generic live loop by the time this
    // zero-delay callback runs. Cancel that loop so only the dusk renderer owns
    // #liveCanvas while the dusk theme is active.
    try{ cancelAnimationFrame(raf); }catch(_){ }

    motionPhase=0;
    lastMotionT=null;
    let lastNow=performance.now();

    const loop=now=>{
      if(currentPage!=="live" || activeTheme!=="dusk"){
        duskRaf=0;
        return;
      }

      const st=states[stateIndex];
      const m=modeFor(stateKey(st));
      const dt=Math.min(.05,Math.max(0,(now-lastNow)/1000));
      lastNow=now;
      if(m.speed>0) motionPhase+=dt*m.speed;

      drawDusk(document.querySelector('#liveCanvas'),{
        state:st,
        phase:motionPhase
      });
      duskRaf=requestAnimationFrame(loop);
    };

    duskRaf=requestAnimationFrame(loop);
  }

  function install(){
    if(installed) return true;
    const engine=window.FocusWaveVisualEngine;
    if(!engine?.drawField || typeof window.drawField!=='function') return false;
    baseDrawField=engine.drawField.bind(engine);
    const wrapped=(canvas,opt={})=>{
      const theme=opt.theme||(typeof activeTheme!=='undefined'?activeTheme:'ocean');
      if(theme==='dusk') return drawDusk(canvas,opt);
      return baseDrawField(canvas,opt);
    };
    engine.drawField=wrapped;
    window.drawField=wrapped;
    installed=true;
    return true;
  }

  function installAndRefresh(){
    if(!install()) return;
    if(typeof renderStatic==='function') requestAnimationFrame(renderStatic);
  }

  document.querySelector('#beginLive')?.addEventListener('click',()=>{
    install();
    // Run after the page's onclick=startLive handler so we can take ownership of
    // the actual live canvas animation rather than only patching a function name.
    setTimeout(startDuskLiveLoop,0);
  },{capture:true});

  document.querySelector('#themeGroup')?.addEventListener('click',()=>requestAnimationFrame(installAndRefresh));
  document.querySelector('#startFocus')?.addEventListener('click',()=>setTimeout(installAndRefresh,120));

  window.FocusWaveDuskReflection={
    install,
    drawDusk,
    startDuskLiveLoop,
    stopDuskLiveLoop,
    get installed(){return installed;}
  };
})();
