/* FocusWave dusk visual — sunset reflected on water.
 * Deliberately side-effect-light: no MutationObserver, no polling loop.
 * It only intercepts the dusk renderer after the canonical visual engine exists.
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
    return {w,h,d};
  }

  function modeFor(key){
    // stable deliberately has zero time-dependent movement.
    if(key==='stable') return {
      amp:0, speed:0, freq:1.6, second:0,
      reflectionSway:0, rowJitter:0, pieces:1, gap:.02,
      waterAlpha:.095, reflectionAlpha:.43, horizonAlpha:.18
    };
    if(key==='drift') return {
      amp:.0042, speed:.42, freq:2.05, second:.34,
      reflectionSway:.010, rowJitter:.0025, pieces:2, gap:.10,
      waterAlpha:.105, reflectionAlpha:.41, horizonAlpha:.18
    };
    if(key==='dispersed') return {
      amp:.0145, speed:1.08, freq:3.25, second:.78,
      reflectionSway:.040, rowJitter:.008, pieces:4, gap:.27,
      waterAlpha:.12, reflectionAlpha:.38, horizonAlpha:.20
    };
    return {
      amp:.0022, speed:.24, freq:1.8, second:.20,
      reflectionSway:.005, rowJitter:.0015, pieces:2, gap:.06,
      waterAlpha:.10, reflectionAlpha:.42, horizonAlpha:.18
    };
  }

  function waveY(xn,q,row,m,t,h){
    if(m.amp===0) return 0;
    const perspective=.34+.92*q;
    const phase=t*m.speed+row*.21;
    const primary=Math.sin(xn*Math.PI*2*m.freq+phase);
    const secondary=Math.sin(xn*Math.PI*2*(m.freq*1.73)-phase*.71+row*.43)*m.second;
    return h*m.amp*perspective*(primary+secondary);
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
    return {sx,sy,r};
  }

  function drawWater(ctx,w,h,c,m,t,sun){
    const horizon=h*.385;
    const bottom=h*.89;
    const rowCount=48;

    // Horizon remains quiet; state is expressed by the water below it.
    ctx.strokeStyle=rgba(c,m.horizonAlpha);
    ctx.lineWidth=Math.max(.75,w*.0007);
    ctx.beginPath(); ctx.moveTo(w*.07,horizon); ctx.lineTo(w*.94,horizon); ctx.stroke();

    for(let row=0;row<rowCount;row++){
      const q=row/(rowCount-1);
      const y0=lerp(horizon+h*.014,bottom,q);
      const alpha=m.waterAlpha*(.74+.26*(1-q));
      ctx.strokeStyle=rgba(c,alpha);
      ctx.lineWidth=Math.max(.55,w*(.00045+.00022*q));
      ctx.lineCap='round';
      ctx.beginPath();
      const samples=110;
      for(let i=0;i<=samples;i++){
        const xn=.055+(i/samples)*.89;
        const x=xn*w;
        const y=y0+waveY(xn,q,row,m,t,h);
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.stroke();
    }

    drawReflection(ctx,w,h,c,m,t,sun,horizon,bottom,rowCount);
  }

  function drawReflection(ctx,w,h,c,m,t,sun,horizon,bottom,rowCount){
    const sx=sun.sx;
    for(let row=0;row<rowCount;row++){
      const q=row/(rowCount-1);
      const y0=lerp(horizon+h*.010,bottom,q);
      const widen=smooth01(q);
      const halfBase=w*lerp(.020,.118,widen);
      const staticWidth=.90+noise(500+row)*.22;
      const half=halfBase*staticWidth;
      const moving=m.reflectionSway===0 ? 0 : Math.sin(t*m.speed*.86+row*.61)*w*m.reflectionSway*(.22+.78*q);
      const staticOffset=(noise(700+row)-.5)*w*(m.rowJitter*(.25+.75*q));
      const center=sx+moving+staticOffset;
      const pieces=m.pieces+(stateKeyFromMode(m)==='dispersed' && row%5===0 ? 1 : 0);
      const block=(half*2)/pieces;

      for(let p=0;p<pieces;p++){
        if(pieces>1 && noise(900+row*13+p)<m.gap*(.35+.65*q)) continue;
        const edge=center-half+p*block;
        const trim=.05+.18*noise(1100+row*17+p);
        const trim2=.05+.20*noise(1300+row*19+p);
        const x1=edge+block*trim;
        const x2=edge+block*(1-trim2);
        if(x2<=x1) continue;

        const mid=(x1+x2)/2;
        const xn=mid/w;
        const y=y0+waveY(xn,q,row,m,t,h);
        const alpha=m.reflectionAlpha*(1-.18*q)*(.86+.17*noise(1500+row*11+p));
        const thickness=Math.max(1,w*(.0010+.00085*(1-q)));
        const bend=m.amp===0 ? 0 : h*m.amp*.20*Math.sin(t*m.speed+row*.33+p);

        ctx.strokeStyle=rgba(c,alpha);
        ctx.lineWidth=thickness;
        ctx.lineCap='round';
        ctx.beginPath();
        ctx.moveTo(x1,y);
        ctx.quadraticCurveTo(mid,y+bend,x2,y);
        ctx.stroke();
      }
    }
  }

  // Tiny helper keeps the reflection fragmentation rule explicit without
  // storing user-facing state anywhere outside the current draw call.
  function stateKeyFromMode(m){
    if(m.amp===0) return 'stable';
    if(m.amp>.01) return 'dispersed';
    return 'drift';
  }

  function drawDusk(canvas,opt={}){
    const {w,h}=canvasSize(canvas);
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,w,h);
    const key=stateKey(opt.state);
    const m=modeFor(key);
    // Stable ignores t entirely so the sunset reflection is perfectly still.
    const t=key==='stable' ? 0 : (opt.t||0);
    const sun=drawSun(ctx,w,h,warm);
    drawWater(ctx,w,h,warm,m,t,sun);
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
