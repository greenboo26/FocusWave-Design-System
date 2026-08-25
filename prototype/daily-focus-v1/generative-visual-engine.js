/* FocusWave generative visual engine v10
 * One fine-line language, four distinct natural grammars.
 * - rain (internal key: ocean): ripple circles only; no horizontal background field.
 * - mountain: immutable cached contour geometry; only lateral fog erases/reveals it.
 * - incense: organic smoke strands keep the approved folding grammar.
 * - dusk: every line describes water; sunset is visible only as a vertical reflection path.
 */
(() => {
  let sessionSeed = Math.floor(Math.random() * 0x7fffffff);
  let mountainCache = null;

  const palettes = {
    ocean:    [93, 139, 160],
    mountain: [93, 127, 101],
    incense:  [164, 116, 75],
    dusk:     [181, 119, 102]
  };

  function reseed(){
    if (window.crypto?.getRandomValues) {
      const a = new Uint32Array(1); window.crypto.getRandomValues(a); sessionSeed = a[0];
    } else sessionSeed = Math.floor(Math.random()*0xffffffff);
    mountainCache = null;
  }
  function hash(n){
    n=Math.imul(n^(n>>>16),0x45d9f3b);
    n=Math.imul(n^(n>>>16),0x45d9f3b);
    return ((n^(n>>>16))>>>0)/4294967295;
  }
  function rnd(k){ return hash((sessionSeed + Math.imul(k+1,2654435761))|0); }
  function eventRnd(epoch,k){ return hash((sessionSeed ^ Math.imul(epoch+11,1597334677) ^ Math.imul(k+17,3812015801))|0); }
  function size(c){
    const d=Math.min(devicePixelRatio||1,2),r=c.getBoundingClientRect();
    const w=Math.max(10,Math.floor(r.width*d)),h=Math.max(10,Math.floor(r.height*d));
    if(c.width!==w||c.height!==h){c.width=w;c.height=h}
    return {w,h,d};
  }
  function rgba(c,a){ return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
  function stroke(ctx,c,a=.24,width=1){
    ctx.strokeStyle=rgba(c,a);ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
  }
  function stateKey(st){ return st?.key || 'stable'; }
  function stateScale(key){ return key==='stable'?.50:key==='drift'?.78:key==='dispersed'?1.12:.68; }
  function smooth01(x){ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); }
  function gaussian(x,m,s){ return Math.exp(-Math.pow((x-m)/s,2)); }
  function lerp(a,b,t){ return a+(b-a)*t; }

  // ---------------------------------------------------------------------------
  // RAIN — circles only. The former horizontal sea field is intentionally gone.
  // Stable attention: many fine, similarly scaled ripples with quiet spacing.
  // Drift/dispersed: mixed diameters, overlaps and asynchronous expansion —
  // "嘈嘈切切错杂弹" without adding any background strokes.
  // ---------------------------------------------------------------------------
  function rainMode(key){
    if(key==='stable') return {sources:11,min:.028,max:.075,rings:[3,5],speed:.032,alpha:.22,variance:.28};
    if(key==='drift') return {sources:9,min:.025,max:.115,rings:[2,5],speed:.050,alpha:.23,variance:.62};
    if(key==='dispersed') return {sources:13,min:.014,max:.170,rings:[1,5],speed:.078,alpha:.25,variance:1.00};
    return {sources:10,min:.025,max:.090,rings:[3,5],speed:.040,alpha:.23,variance:.38};
  }

  function drawRain(ctx,w,h,c,st,t){
    const key=stateKey(st),m=rainMode(key),minDim=Math.min(w,h);
    for(let s=0;s<m.sources;s++){
      const sx=w*(.08+rnd(100+s*13)*.84);
      const sy=h*(.10+rnd(101+s*13)*.80);
      const phase=(t*m.speed*(.72+rnd(102+s*13)*.62)+rnd(103+s*13))%1;
      const maxR=minDim*lerp(m.min,m.max,Math.pow(rnd(104+s*13),key==='dispersed'?.58:1.15));
      const baseR=minDim*(.010+rnd(105+s*13)*.018);
      const radius=baseR+maxR*smooth01(phase);
      const fade=Math.sin(Math.PI*phase);
      const ringCount=m.rings[0]+Math.floor(rnd(106+s*13)*(m.rings[1]-m.rings[0]+1));
      const gap=minDim*(.016+rnd(107+s*13)*(.014+.012*m.variance));

      for(let r=0;r<ringCount;r++){
        const rr=radius-r*gap;
        if(rr<minDim*.008) continue;
        const irregular=m.variance*(.004+rnd(108+s*13+r)*.009);
        const flatten=1-(key==='stable'?.015:key==='drift'?.028:key==='dispersed'?.045:.020)*rnd(109+s*13+r);
        ctx.beginPath();
        const steps=110;
        for(let i=0;i<=steps;i++){
          const a=i/steps*Math.PI*2;
          const wobble=1+Math.sin(a*(3+r%3)+s*.71)*irregular+Math.sin(a*7+s*.43)*irregular*.38;
          const x=sx+Math.cos(a)*rr*wobble;
          const y=sy+Math.sin(a)*rr*wobble*flatten;
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }
        const hierarchy=1-r/(ringCount+1)*.28;
        stroke(ctx,c,m.alpha*fade*hierarchy,.55+rnd(1400+s*17+r)*.72);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // MOUNTAIN — geometry is rendered ONCE into an offscreen cache.
  // Animation never recalculates a ridge coordinate. A moving fog mask only removes
  // pixels from a copied static mountain layer, then the untouched geometry is shown.
  // ---------------------------------------------------------------------------
  const mountainLayers=[
    {base:.28,spacing:.0062,lines:10,rough:.0010,peaks:[{x:.20,a:.060,l:.13,r:.20},{x:.72,a:.035,l:.25,r:.15}]},
    {base:.53,spacing:.0067,lines:12,rough:.0016,peaks:[{x:.11,a:.038,l:.09,r:.13},{x:.38,a:.112,l:.16,r:.10},{x:.80,a:.065,l:.12,r:.20}]},
    {base:.80,spacing:.0072,lines:14,rough:.0021,peaks:[{x:.08,a:.082,l:.07,r:.12},{x:.29,a:.050,l:.12,r:.08},{x:.55,a:.132,l:.17,r:.09},{x:.84,a:.090,l:.11,r:.07}]}
  ];
  function skewPeak(u,p){const s=u<p.x?p.l:p.r;return gaussian(u,p.x,s)*p.a;}
  function mountainProfile(g,u){
    const cfg=mountainLayers[g];let y=0;
    cfg.peaks.forEach((p,idx)=>y-=skewPeak(u,p)*(.94+rnd(720+g*30+idx)*.12));
    y+=Math.sin(u*(4.2+g*1.9)+g*.63)*cfg.rough;
    y+=Math.sin(u*(11.7+g*2.4)+g*1.37)*cfg.rough*.38;
    return y;
  }
  function buildMountainBase(w,h,c){
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;const ctx=cv.getContext('2d');
    for(let g=0;g<mountainLayers.length;g++){
      const cfg=mountainLayers[g];
      for(let j=0;j<cfg.lines;j++){
        const offset=(j-(cfg.lines-1)/2)*cfg.spacing;
        const contourScale=.82+Math.cos((j-(cfg.lines-1)/2)/cfg.lines*Math.PI)*.22;
        ctx.beginPath();
        for(let i=0;i<=360;i++){
          const u=i/360;
          const yn=cfg.base+offset+mountainProfile(g,u)*contourScale;
          const x=u*w,y=yn*h;
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }
        stroke(ctx,c,.18+rnd(310+g*20+j)*.10,.70+rnd(420+g*20+j)*.58);
      }
    }
    return cv;
  }
  function getMountainBase(w,h,c){
    const sig=`${w}x${h}:${sessionSeed}`;
    if(!mountainCache||mountainCache.sig!==sig) mountainCache={sig,canvas:buildMountainBase(w,h,c)};
    return mountainCache.canvas;
  }
  function fogBands(key,t){
    const strength=key==='stable'?.36:key==='drift'?.58:key==='dispersed'?.82:.50;
    const speed=key==='stable'?.003:key==='drift'?.006:key==='dispersed'?.010:.006;
    const bands=[
      {y:.22,w:.32,h:.055,p:.12},{y:.38,w:.42,h:.060,p:.49},{y:.57,w:.36,h:.070,p:.77},{y:.71,w:.31,h:.052,p:.93}
    ];
    return bands.map((b,k)=>({
      x:((b.p+t*speed*(1+k*.11))%1.48)-.24,
      y:b.y+(rnd(1600+k)-.5)*.035,
      w:b.w,h:b.h,gain:strength*(.82+rnd(1610+k)*.24),lobes:4+(k%3)
    }));
  }
  function eraseFog(ctx,w,h,key,t){
    const fog=fogBands(key,t);ctx.save();ctx.globalCompositeOperation='destination-out';
    fog.forEach((f,k)=>{
      for(let l=0;l<f.lobes;l++){
        const cx=(f.x+(l-(f.lobes-1)/2)*f.w*.20)*w;
        const cy=(f.y+Math.sin(l*1.4+k)*f.h*.18)*h;
        const rx=f.w*w*(.18+.025*(l%2));
        const ry=f.h*h*(.68+.08*(l%3));
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(rx,ry));
        g.addColorStop(0,`rgba(0,0,0,${f.gain})`);g.addColorStop(.58,`rgba(0,0,0,${f.gain*.58})`);g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g;ctx.save();ctx.translate(cx,cy);ctx.scale(rx,ry);ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.restore();ctx.fill();
      }
    });
    ctx.restore();
  }
  function drawMountain(ctx,w,h,c,st,t){
    const base=getMountainBase(w,h,c);
    const temp=document.createElement('canvas');temp.width=w;temp.height=h;const tx=temp.getContext('2d');
    tx.drawImage(base,0,0);eraseFog(tx,w,h,stateKey(st),t);ctx.drawImage(temp,0,0);
  }

  // ---------------------------------------------------------------------------
  // INCENSE — approved organic smoke grammar.
  // ---------------------------------------------------------------------------
  function drawIncense(ctx,w,h,c,st,t){
    const key=stateKey(st),s=stateScale(key),strands=7+Math.floor(rnd(50)*4),epoch=Math.floor(t/20);
    const eventA=Math.floor(eventRnd(epoch,1)*strands);
    const eventB=(eventA+2+Math.floor(eventRnd(epoch,2)*Math.max(2,strands-3)))%strands;
    const dirA=eventRnd(epoch,3)>.5?1:-1,dirB=-dirA;
    for(let j=0;j<strands;j++){
      const x0=w*(.17+j/(strands-1)*.66)+(rnd(60+j)-.5)*w*.038;
      const width=.62+rnd(100+j)*1.65,alpha=.16+rnd(90+j)*.19;
      ctx.beginPath();
      for(let i=0;i<=160;i++){
        const yn=i/160,y=h*(.90-yn*.79),upper=Math.pow(yn,1.58);
        const curl1=Math.sin(yn*(5.2+rnd(70+j)*4.2)+t*.083+j*.83)*w*.0145*upper*s;
        const curl2=Math.sin(yn*12.5+t*.145+j*.69)*w*.0085*upper*s;
        const drift=(rnd(80+j)-.5)*w*.052*yn;
        let fold=0;
        if(j===eventA) fold+=dirA*w*(key==='stable'?.012:key==='drift'?.035:key==='dispersed'?.052:.027)*Math.sin((yn-.38)*Math.PI*2.25+t*.055)*gaussian(yn,.69,.22);
        if((key==='dispersed'||key==='refocus')&&j===eventB) fold+=dirB*w*(key==='dispersed'?.045:.023)*Math.sin((yn-.34)*Math.PI*1.85-t*.047+1.1)*gaussian(yn,.66,.25);
        if(key==='drift') fold+=gaussian(yn,.76,.26)*dirA*w*.018*Math.sin(t*.035+j*.7);
        if(key==='refocus') fold+=(w*.50-(x0+drift))*smooth01(yn)*.12;
        const x=x0+curl1+curl2+drift+fold;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,alpha,width);
    }
  }

  // ---------------------------------------------------------------------------
  // DUSK — WATER ONLY. There is no sun/dome/horizon cue at all.
  // A calm horizontal water field carries a vertical path of brighter broken
  // reflections. The reflection is literally brighter fragments of those water rows.
  // ---------------------------------------------------------------------------
  function duskMode(key){
    if(key==='stable') return {spread:.060,fragment:.18,sway:.0015,shine:1.00};
    if(key==='drift') return {spread:.082,fragment:.34,sway:.0045,shine:.96};
    if(key==='dispersed') return {spread:.120,fragment:.56,sway:.0090,shine:.90};
    return {spread:.068,fragment:.24,sway:.0025,shine:1.02};
  }
  function drawDusk(ctx,w,h,c,st,t){
    const key=stateKey(st),m=duskMode(key),lines=56+Math.floor(rnd(2100)*7),cx=.58+rnd(2101)*.08;
    for(let j=0;j<lines;j++){
      const q=j/(lines-1),yn=.13+q*.76,y=yn*h;
      const staticWave=(Math.sin(j*.31+q*2.2)+Math.sin(j*.13+1.8)*.45)*h*.0016;
      const baseY=y+staticWave;
      const alpha=.10+rnd(2200+j)*.11;
      const width=.50+rnd(2300+j)*.76;
      ctx.beginPath();ctx.moveTo(0,baseY);ctx.lineTo(w,baseY);stroke(ctx,c,alpha,width);

      // Reflection exists on the water row itself. No geometric rise above the row.
      const verticalEnvelope=Math.sin(Math.PI*q)*(.72+.28*(1-q));
      const half=w*m.spread*verticalEnvelope*(.68+rnd(2400+j)*.64);
      if(half<2) continue;
      const sway=Math.sin(t*.11+j*.73)*w*m.sway*(.25+.75*q);
      const staticJitter=(rnd(2500+j)-.5)*w*.022*q;
      const center=cx*w+sway+staticJitter;
      const fragments=2+Math.floor(m.fragment*5)+(j%7===0?1:0);
      const block=half*2/fragments;
      for(let p=0;p<fragments;p++){
        if(rnd(2600+j*11+p)<m.fragment*(.18+.30*q)) continue;
        const left=center-half+p*block;
        const x1=left+block*(.08+.26*rnd(2700+j*13+p));
        const x2=left+block*(.90-.18*rnd(2800+j*13+p));
        if(x2<=x1) continue;
        const flicker=.84+.16*Math.sin(t*.18+j*.83+p*1.7);
        ctx.beginPath();ctx.moveTo(x1,baseY);ctx.lineTo(x2,baseY);
        stroke(ctx,c,(.19+.11*(1-q))*m.shine*flicker,.82+1.10*(1-q)+rnd(2900+j*7+p)*.44);
      }
    }
  }

  function drawFieldV10(canvas,opt={}){
    if(!canvas)return;
    const {w,h}=size(canvas),ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);
    const theme=opt.theme||(typeof activeTheme!=='undefined'?activeTheme:'ocean');
    const st=opt.state||(typeof states!=='undefined'?states[0]:{key:'stable'});
    const t=opt.t||0,c=palettes[theme]||palettes.ocean;
    if(theme==='ocean')drawRain(ctx,w,h,c,st,t);
    else if(theme==='mountain')drawMountain(ctx,w,h,c,st,t);
    else if(theme==='incense')drawIncense(ctx,w,h,c,st,t);
    else drawDusk(ctx,w,h,c,st,t);
  }

  function install(){
    window.drawField=drawFieldV10;
    document.querySelector('#beginLive')?.addEventListener('click',reseed,{capture:true});
    document.querySelector('#themeGroup')?.addEventListener('click',()=>requestAnimationFrame(()=>{if(typeof renderStatic==='function')renderStatic();}));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.FocusWaveVisualEngine={reseed,drawField:drawFieldV10,get seed(){return sessionSeed;}};
})();