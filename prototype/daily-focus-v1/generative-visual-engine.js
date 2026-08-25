/* FocusWave generative visual engine v11
 * Four distinct natural grammars in one restrained fine-line language.
 * - rain (internal key: ocean): concentric rain ripples only; no horizontal background field.
 * - mountain: immutable mountain geometry; only visible fog moves laterally across it.
 * - incense: organic smoke strands.
 * - dusk: water surface only; sunset is a broad trapezoidal reflection made from water-line fragments.
 */
(() => {
  let sessionSeed = Math.floor(Math.random() * 0x7fffffff);
  let mountainCache = null;

  const palettes = {
    ocean:    [91, 137, 156],
    mountain: [91, 124, 98],
    incense:  [164, 116, 75],
    dusk:     [181, 119, 102]
  };

  function reseed(){
    if (window.crypto?.getRandomValues) {
      const a = new Uint32Array(1); window.crypto.getRandomValues(a); sessionSeed = a[0];
    } else sessionSeed = Math.floor(Math.random()*0xffffffff);
  }
  function hash(n){
    n=Math.imul(n^(n>>>16),0x45d9f3b); n=Math.imul(n^(n>>>16),0x45d9f3b);
    return ((n^(n>>>16))>>>0)/4294967295;
  }
  function rnd(k){ return hash((sessionSeed + Math.imul(k+1,2654435761))|0); }
  function size(c){
    const d=Math.min(devicePixelRatio||1,2),r=c.getBoundingClientRect();
    const w=Math.max(10,Math.floor(r.width*d)),h=Math.max(10,Math.floor(r.height*d));
    if(c.width!==w||c.height!==h){ c.width=w; c.height=h; }
    return {w,h,d};
  }
  function rgba(c,a){ return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
  function stroke(ctx,c,a=.24,width=1){
    ctx.strokeStyle=rgba(c,a); ctx.lineWidth=width; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke();
  }
  function stateKey(st){ return st?.key || 'stable'; }
  function smooth01(x){ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); }
  function gaussian(x,m,s){ return Math.exp(-Math.pow((x-m)/s,2)); }
  function lerp(a,b,t){ return a+(b-a)*t; }

  // ---------------------------------------------------------------------------
  // RAIN — only top-down concentric ripples. No horizontal water field.
  // ---------------------------------------------------------------------------
  function rainMode(key){
    if(key==='stable')    return {sources:15,min:.026,max:.070,rings:[3,5],speed:.026,alpha:.34,varn:.10};
    if(key==='drift')     return {sources:13,min:.022,max:.115,rings:[2,5],speed:.043,alpha:.36,varn:.40};
    if(key==='dispersed') return {sources:18,min:.014,max:.175,rings:[1,5],speed:.068,alpha:.40,varn:.88};
    return {sources:14,min:.024,max:.085,rings:[3,5],speed:.032,alpha:.37,varn:.20};
  }
  function drawRain(ctx,w,h,c,st,t){
    const key=stateKey(st),m=rainMode(key),minDim=Math.min(w,h);
    for(let s=0;s<m.sources;s++){
      const sx=w*(.07+rnd(100+s*17)*.86);
      const sy=h*(.08+rnd(101+s*17)*.84);
      const localSpeed=m.speed*(.82+rnd(102+s*17)*.40);
      const phase=(t*localSpeed+rnd(103+s*17))%1;
      const sizeBias=key==='dispersed' ? Math.pow(rnd(104+s*17),.56) : Math.pow(rnd(104+s*17),1.12);
      const maxR=minDim*lerp(m.min,m.max,sizeBias);
      const radius=minDim*.010+maxR*smooth01(phase);
      const fade=Math.pow(Math.sin(Math.PI*phase),.72);
      const ringCount=m.rings[0]+Math.floor(rnd(105+s*17)*(m.rings[1]-m.rings[0]+1));
      const gap=minDim*(.014+rnd(106+s*17)*(.011+.010*m.varn));
      for(let r=0;r<ringCount;r++){
        const rr=radius-r*gap; if(rr<minDim*.007) continue;
        const irregular=(.0025+.007*m.varn)*(1+rnd(107+s*19+r));
        ctx.beginPath();
        for(let i=0;i<=120;i++){
          const a=i/120*Math.PI*2;
          const wobble=1+Math.sin(a*(3+(r%3))+s*.71)*irregular+Math.sin(a*7+s*.43)*irregular*.32;
          const x=sx+Math.cos(a)*rr*wobble;
          const y=sy+Math.sin(a)*rr*wobble;
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }
        stroke(ctx,c,m.alpha*fade*(1-r*.09),.82+rnd(1200+s*23+r)*.72);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // MOUNTAIN — the mountain itself is a completely static cached image.
  // No ridge coordinate ever depends on t/state/session. Only fog masks move.
  // ---------------------------------------------------------------------------
  const mountainLayers=[
    {base:.34,spacing:.0070,lines:9,  peaks:[{x:.18,a:.095,l:.12,r:.19},{x:.72,a:.070,l:.22,r:.14}]},
    {base:.57,spacing:.0072,lines:11, peaks:[{x:.10,a:.055,l:.08,r:.13},{x:.39,a:.150,l:.16,r:.10},{x:.80,a:.090,l:.12,r:.20}]},
    {base:.82,spacing:.0076,lines:13, peaks:[{x:.07,a:.105,l:.07,r:.12},{x:.29,a:.065,l:.11,r:.08},{x:.56,a:.175,l:.16,r:.09},{x:.84,a:.115,l:.10,r:.07}]}
  ];
  function skewPeak(u,p){ return gaussian(u,p.x,u<p.x?p.l:p.r)*p.a; }
  function fixedMountainProfile(g,u){
    const cfg=mountainLayers[g]; let y=0;
    cfg.peaks.forEach(p=>{ y-=skewPeak(u,p); });
    y += Math.sin(u*(5.1+g*1.3)+g*.8)*(.0014+g*.00045);
    y += Math.sin(u*(12.0+g*1.8)+g*1.2)*(.00055+g*.00018);
    return y;
  }
  function buildMountainBase(w,h,c){
    const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
    const ctx=cv.getContext('2d');
    for(let g=0;g<mountainLayers.length;g++){
      const cfg=mountainLayers[g];
      for(let j=0;j<cfg.lines;j++){
        const offset=(j-(cfg.lines-1)/2)*cfg.spacing;
        const scale=.84+Math.cos((j-(cfg.lines-1)/2)/cfg.lines*Math.PI)*.18;
        ctx.beginPath();
        for(let i=0;i<=360;i++){
          const u=i/360,yn=cfg.base+offset+fixedMountainProfile(g,u)*scale;
          const x=u*w,y=yn*h; i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }
        stroke(ctx,c,.19+g*.015+(j%4)*.008,.78+(j%3)*.12);
      }
    }
    return cv;
  }
  function getMountainBase(w,h,c){
    const sig=`${w}x${h}`;
    if(!mountainCache||mountainCache.sig!==sig) mountainCache={sig,canvas:buildMountainBase(w,h,c)};
    return mountainCache.canvas;
  }
  function fogMode(key){
    if(key==='stable') return {count:2,speed:.0012,erase:.48,visible:.17};
    if(key==='drift') return {count:3,speed:.0028,erase:.63,visible:.20};
    if(key==='dispersed') return {count:4,speed:.0046,erase:.78,visible:.23};
    return {count:3,speed:.0022,erase:.57,visible:.19};
  }
  const fogTemplates=[
    {y:.29,w:.34,h:.055,p:.04},{y:.43,w:.42,h:.070,p:.37},{y:.61,w:.38,h:.078,p:.69},{y:.75,w:.33,h:.060,p:.88}
  ];
  function fogInstances(key,t){
    const m=fogMode(key); return fogTemplates.slice(0,m.count).map((b,k)=>({
      x:((b.p+t*m.speed*(1+k*.12))%1.46)-.23,
      y:b.y,w:b.w,h:b.h,erase:m.erase*(.92+k*.025),visible:m.visible,seed:k
    }));
  }
  function fogLobes(f){
    const lobes=[]; const n=5+f.seed%2;
    for(let l=0;l<n;l++) lobes.push({
      x:f.x+(l-(n-1)/2)*f.w*.18,
      y:f.y+Math.sin(l*1.45+f.seed)*f.h*.18,
      rx:f.w*(.18+.018*(l%2)),
      ry:f.h*(.62+.08*(l%3))
    });
    return lobes;
  }
  function eraseFog(ctx,w,h,fogs){
    ctx.save(); ctx.globalCompositeOperation='destination-out';
    fogs.forEach(f=>fogLobes(f).forEach(l=>{
      const cx=l.x*w,cy=l.y*h,rx=l.rx*w,ry=l.ry*h;
      const g=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(rx,ry));
      g.addColorStop(0,`rgba(0,0,0,${f.erase})`);
      g.addColorStop(.62,`rgba(0,0,0,${f.erase*.52})`);
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); ctx.fill();
    }));
    ctx.restore();
  }
  function drawVisibleFog(ctx,w,h,fogs){
    fogs.forEach(f=>{
      const lobes=fogLobes(f);
      ctx.save();
      lobes.forEach(l=>{
        const cx=l.x*w,cy=l.y*h,rx=l.rx*w,ry=l.ry*h;
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(rx,ry));
        g.addColorStop(0,`rgba(247,244,237,${f.visible})`);
        g.addColorStop(.68,`rgba(247,244,237,${f.visible*.55})`);
        g.addColorStop(1,'rgba(247,244,237,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill();
      });
      ctx.restore();
    });
  }
  function drawMountain(ctx,w,h,c,st,t){
    const base=getMountainBase(w,h,c),fogs=fogInstances(stateKey(st),t);
    const temp=document.createElement('canvas'); temp.width=w; temp.height=h;
    const tx=temp.getContext('2d'); tx.drawImage(base,0,0); eraseFog(tx,w,h,fogs);
    ctx.drawImage(temp,0,0); drawVisibleFog(ctx,w,h,fogs);
  }

  // ---------------------------------------------------------------------------
  // INCENSE — organic smoke strands.
  // ---------------------------------------------------------------------------
  function incenseScale(key){ return key==='stable'?.55:key==='drift'?.82:key==='dispersed'?1.16:.70; }
  function drawIncense(ctx,w,h,c,st,t){
    const key=stateKey(st),s=incenseScale(key),strands=8;
    for(let j=0;j<strands;j++){
      const x0=w*(.18+j/(strands-1)*.64)+(rnd(60+j)-.5)*w*.032;
      ctx.beginPath();
      for(let i=0;i<=170;i++){
        const yn=i/170,y=h*(.90-yn*.79),upper=Math.pow(yn,1.58);
        const curl1=Math.sin(yn*(5.4+rnd(70+j)*3.8)+t*.075+j*.83)*w*.014*upper*s;
        const curl2=Math.sin(yn*12.2+t*.13+j*.69)*w*.008*upper*s;
        const drift=(rnd(80+j)-.5)*w*.044*yn;
        let fold=0;
        if(j===3) fold+=w*(key==='stable'?.010:key==='drift'?.032:key==='dispersed'?.050:.024)*Math.sin((yn-.38)*Math.PI*2.2+t*.05)*gaussian(yn,.69,.22);
        if(key==='dispersed'&&j===5) fold-=w*.040*Math.sin((yn-.34)*Math.PI*1.9-t*.045+1.1)*gaussian(yn,.66,.25);
        if(key==='refocus') fold+=(w*.50-(x0+drift))*smooth01(yn)*.10;
        const x=x0+curl1+curl2+drift+fold; i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,.18+rnd(90+j)*.17,.72+rnd(100+j)*1.20);
    }
  }

  // ---------------------------------------------------------------------------
  // DUSK — WATER ONLY. No sun, no dome, no raised contour.
  // Reflection is a broad-topped trapezoid made from brighter fragments of the
  // same horizontal water rows. The far/top end never narrows to a point.
  // ---------------------------------------------------------------------------
  function duskMode(key){
    if(key==='stable') return {top:.125,bottom:.055,fragment:.15,sway:.0012,shine:1.04};
    if(key==='drift') return {top:.140,bottom:.060,fragment:.28,sway:.0036,shine:1.00};
    if(key==='dispersed') return {top:.165,bottom:.070,fragment:.46,sway:.0075,shine:.95};
    return {top:.128,bottom:.055,fragment:.20,sway:.0020,shine:1.06};
  }
  function drawDusk(ctx,w,h,c,st,t){
    const key=stateKey(st),m=duskMode(key),cx=.61,lines=66;
    const topY=.18,bottomY=.88;
    for(let j=0;j<lines;j++){
      const q=j/(lines-1),yn=.12+q*.78,y=yn*h;
      const waterWave=(Math.sin(q*10.5+j*.17)+Math.sin(j*.33)*.34)*h*.0012;
      const baseY=y+waterWave;
      ctx.beginPath();ctx.moveTo(0,baseY);ctx.lineTo(w,baseY);stroke(ctx,c,.105+(j%9===0?.025:0),.62+(j%4)*.07);

      if(yn<topY||yn>bottomY) continue;
      const rq=(yn-topY)/(bottomY-topY);
      const taper=rq<.12 ? 0 : smooth01((rq-.12)/.88);
      const half=w*lerp(m.top,m.bottom,taper)*(1+(rnd(2200+j)-.5)*.18);
      const center=cx*w + (rnd(2300+j)-.5)*w*.012 + Math.sin(t*.10+j*.61)*w*m.sway*(.25+.75*rq);
      const pieces=2+Math.floor(m.fragment*5)+(j%8===0?1:0);
      const block=half*2/pieces;
      for(let p=0;p<pieces;p++){
        const chance=rnd(2400+j*11+p);
        if(chance<m.fragment*.18*(.45+.55*rq)) continue;
        const left=center-half+p*block;
        const trimL=block*(.05+.20*rnd(2500+j*13+p));
        const trimR=block*(.06+.22*rnd(2600+j*13+p));
        const x1=left+trimL,x2=left+block-trimR; if(x2<=x1) continue;
        const flicker=.88+.12*Math.sin(t*.16+j*.83+p*1.6);
        const alpha=(.24+.10*(1-rq))*(.88+.18*rnd(2700+j*7+p))*m.shine*flicker;
        const width=.88+1.00*(1-rq)+rnd(2800+j*7+p)*.40;
        const mid=(x1+x2)/2;
        ctx.beginPath();ctx.moveTo(x1,baseY);ctx.quadraticCurveTo(mid,baseY+h*(rnd(2900+j*7+p)-.5)*.0010,x2,baseY);stroke(ctx,c,alpha,width);
      }
    }
  }

  function drawFieldV11(canvas,opt={}){
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
    window.drawField=drawFieldV11;
    document.querySelector('#beginLive')?.addEventListener('click',reseed,{capture:true});
    document.querySelector('#themeGroup')?.addEventListener('click',()=>requestAnimationFrame(()=>{
      if(typeof renderStatic==='function')renderStatic();
    }));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.FocusWaveVisualEngine={reseed,drawField:drawFieldV11,get seed(){return sessionSeed;},version:'v11'};
})();