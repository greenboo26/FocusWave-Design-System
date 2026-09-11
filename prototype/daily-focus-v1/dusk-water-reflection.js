/* FocusWave dusk visual — sunset reflected on water.
 * State is expressed only by horizontal motion of the reflection lines:
 * stable = still, drift = gentle lateral motion, dispersed = stronger/faster motion.
 * No MutationObserver and no global polling.
 */
(() => {
  if (window.FocusWaveDuskReflection) return;

  const warm = [181,119,102];
  let installed = false;
  let baseDrawField = null;

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

  function modeFor(key){
    if(key==='stable') return {
      shift:.000, speed:0,
      reflectionAlpha:.44, waterAlpha:.09, horizonAlpha:.18
    };
    if(key==='drift') return {
      shift:.010, speed:.48,
      reflectionAlpha:.43, waterAlpha:.095, horizonAlpha:.18
    };
    if(key==='dispersed') return {
      shift:.038, speed:1.35,
      reflectionAlpha:.42, waterAlpha:.105, horizonAlpha:.20
    };
    return {
      shift:.006, speed:.30,
      reflectionAlpha:.43, waterAlpha:.095, horizonAlpha:.18
    };
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

    // Keep the water grammar quiet and horizontal. Motion belongs to the
    // reflected light, so the attention-state difference is visually legible.
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

  function rowShift(row,q,m,t,w){
    if(m.shift===0) return 0;
    // Each reflection row has its own deterministic amplitude, speed and phase.
    // This looks random, but remains smooth rather than jittering frame-to-frame.
    const amp=m.shift*w*(.42+.58*noise(3100+row))*(.30+.70*q);
    const speed=m.speed*(.72+.62*noise(3200+row));
    const phase=noise(3300+row)*Math.PI*2;
    const primary=Math.sin(t*speed+phase);
    const secondary=Math.sin(t*speed*.47+phase*1.73)*.22;
    return amp*(primary+secondary);
  }

  function drawReflection(ctx,w,h,c,m,t,sun,water){
    const {horizon,bottom,rowCount}=water;
    const centerX=sun.sx;

    for(let row=0;row<rowCount;row++){
      const q=row/(rowCount-1);
      const y=lerp(horizon+h*.010,bottom,q);
      const widen=smooth01(q);
      const half=w*lerp(.022,.120,widen)*(.88+.24*noise(500+row));
      const shift=rowShift(row,q,m,t,w);
      const center=centerX+shift;

      // Reflection stays a set of straight horizontal line fragments. Their
      // only time-dependent property is lateral position.
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
    const {w,h}=canvasSize(canvas);
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,w,h);
    const key=stateKey(opt.state);
    const m=modeFor(key);
    // Stable deliberately ignores time: every reflection line is motionless.
    const t=key==='stable' ? 0 : (opt.t||0);
    const sun=drawSun(ctx,w,h,warm);
    const water=drawWater(ctx,w,h,warm,m);
    drawReflection(ctx,w,h,warm,m,t,sun,water);
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

  document.querySelector('#beginLive')?.addEventListener('click',install,{capture:true});
  document.querySelector('#themeGroup')?.addEventListener('click',()=>requestAnimationFrame(installAndRefresh));
  document.querySelector('#startFocus')?.addEventListener('click',()=>setTimeout(installAndRefresh,120));

  window.FocusWaveDuskReflection={install,drawDusk,get installed(){return installed;}};
})();
