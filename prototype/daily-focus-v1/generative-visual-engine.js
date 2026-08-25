/* FocusWave generative visual engine v9
 * One continuous fine-line language; each image is carried by the line field itself.
 * - ocean: top-down water lines locally resolve into expanding concentric ripple arcs;
 * - mountain: mountain geometry is immutable; only horizontal fog masks move and erase/reveal it;
 * - incense: organic smoke strands keep the approved v2-like folding grammar;
 * - dusk: the lines describe water; a vertical sunset reflection is built from the same horizontal water lines.
 */
(() => {
  let sessionSeed = Math.floor(Math.random() * 0x7fffffff);

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
    ctx.strokeStyle=rgba(c,a);
    ctx.lineWidth=width;
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.stroke();
  }
  function stateKey(st){ return st?.key || 'stable'; }
  function stateScale(key){ return key==='stable'?.50:key==='drift'?.78:key==='dispersed'?1.12:.68; }
  function smooth01(x){ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); }
  function gaussian(x,m,s){ return Math.exp(-Math.pow((x-m)/s,2)); }
  function clamp01(x){ return Math.max(0,Math.min(1,x)); }
  function lerp(a,b,t){ return a+(b-a)*t; }

  // ---------------------------------------------------------------------------
  // OCEAN — a top-down surface. A drop does not "push" a fixed set of lines.
  // As its radius expands, more horizontal rows intersect the annulus and those
  // local row segments become circular arcs. The field itself therefore becomes
  // the ripple instead of carrying a separate ring on top.
  // ---------------------------------------------------------------------------
  function buildOceanDrops(key,t,epoch,w,h){
    const count=key==='stable'?1:key==='drift'?2:key==='dispersed'?3:2;
    const cycle=key==='stable'?34:key==='drift'?28:key==='dispersed'?22:28;
    const minDim=Math.min(w,h);
    const drops=[];

    for(let k=0;k<count;k++){
      const phase=((t/cycle)*(1+k*.10)+eventRnd(epoch,k*13+1))%1;
      const grow=smooth01(Math.min(1,phase/.78));
      const fade=phase<.76?1:1-smooth01((phase-.76)/.24);
      const maxR=minDim*(.18+eventRnd(epoch,k*13+2)*.14);
      drops.push({
        x:w*(.16+eventRnd(epoch,k*13+3)*.68),
        y:h*(.18+eventRnd(epoch,k*13+4)*.64),
        radius:minDim*.020+maxR*grow,
        ringGap:minDim*(.032+eventRnd(epoch,k*13+5)*.014),
        band:minDim*(.014+eventRnd(epoch,k*13+6)*.006),
        rings:2+Math.floor(eventRnd(epoch,k*13+7)*3),
        fade
      });
    }
    return drops;
  }

  function oceanArcTarget(x,y0,drop){
    let best=null;
    for(let r=0;r<drop.rings;r++){
      const rr=drop.radius-r*drop.ringGap;
      if(rr<drop.band*2.2) continue;
      const dx=x-drop.x;
      if(Math.abs(dx)>=rr) continue;
      const root=Math.sqrt(Math.max(0,rr*rr-dx*dx));
      const upper=drop.y-root;
      const lower=drop.y+root;
      const target=Math.abs(y0-upper)<Math.abs(y0-lower)?upper:lower;
      const delta=Math.abs(y0-target);
      if(delta>drop.band*2.4) continue;

      const proximity=Math.exp(-Math.pow(delta/(drop.band*1.15),2));
      const sideSoft=Math.pow(Math.max(0,1-Math.abs(dx)/rr),.32);
      const innerFade=1-r*.13;
      const weight=proximity*sideSoft*innerFade*drop.fade;
      if(!best || weight>best.weight) best={target,weight};
    }
    return best;
  }

  function drawOcean(ctx,w,h,c,st,t){
    const key=stateKey(st),lines=50+Math.floor(rnd(2)*5),epoch=Math.floor(t/36);
    const drops=buildOceanDrops(key,t,epoch,w,h);

    for(let j=0;j<lines;j++){
      const y0=(j+.72)*h/(lines+1);
      const staticDrift=Math.sin(j*.41+rnd(300+j)*2.2)*h*.0014;
      const alpha=.13+rnd(200+j)*.13;
      const width=.58+rnd(100+j)*.84+(j%13===0?.16:0);
      ctx.beginPath();

      for(let i=0;i<=320;i++){
        const x=i/320*w;
        let y=y0+staticDrift+Math.sin(x/w*1.45+j*.017)*h*.0016;
        let strongest=0,target=y;

        for(const drop of drops){
          const arc=oceanArcTarget(x,y,drop);
          if(arc && arc.weight>strongest){
            strongest=arc.weight;
            target=arc.target;
          }
        }

        if(strongest>0){
          // Preserve continuity: only the local row segment migrates toward the
          // circular contour; neighboring samples smoothly return to the base row.
          y=lerp(y,target,smooth01(clamp01(strongest))*0.92);
        }

        // Refocus dissolves active rings spatially from left to right; dispersed
        // changes event overlap, not the bending force of a single row.
        if(key==='refocus') y=lerp(y,y0+staticDrift,smooth01(x/w)*.42);
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,alpha,width);
    }
  }

  // ---------------------------------------------------------------------------
  // MOUNTAIN — immutable geometry. The mountain coordinates never read t/state.
  // Different depth layers have deliberately different peak counts, heights and
  // widths. Only fog masks move laterally and erase/reveal the fixed contours.
  // ---------------------------------------------------------------------------
  const mountainLayers = [
    {
      base:.28, spacing:.0065, lines:10, rough:.0014,
      peaks:[
        {x:.18,a:.050,l:.19,r:.12},
        {x:.67,a:.034,l:.23,r:.17}
      ]
    },
    {
      base:.53, spacing:.0071, lines:12, rough:.0020,
      peaks:[
        {x:.12,a:.038,l:.10,r:.16},
        {x:.39,a:.094,l:.17,r:.11},
        {x:.79,a:.058,l:.14,r:.20}
      ]
    },
    {
      base:.80, spacing:.0078, lines:13, rough:.0027,
      peaks:[
        {x:.09,a:.074,l:.08,r:.12},
        {x:.31,a:.045,l:.13,r:.09},
        {x:.55,a:.112,l:.16,r:.10},
        {x:.84,a:.078,l:.12,r:.08}
      ]
    }
  ];

  function skewPeak(u,p){
    const s=u<p.x?p.l:p.r;
    return gaussian(u,p.x,s)*p.a;
  }
  function mountainProfile(g,u){
    const cfg=mountainLayers[g];
    let y=0;
    cfg.peaks.forEach((p,idx)=>{
      y-=skewPeak(u,p)*(.94+rnd(720+g*30+idx)*.12);
    });
    y+=Math.sin(u*(4.8+g*1.6)+g*.74)*cfg.rough;
    y+=Math.sin(u*(10.8+g*2.1)+g*1.25)*cfg.rough*.42;
    return y;
  }

  function buildMountainFog(key,t,epoch){
    const strength=key==='stable'?.42:key==='drift'?.66:key==='dispersed'?.88:.58;
    const speed=key==='stable'?.0018:key==='drift'?.0048:key==='dispersed'?.0074:.0046;
    const fixedBands=[
      {y:.24,w:.32,h:.040,phase:.13},
      {y:.46,w:.38,h:.052,phase:.57},
      {y:.66,w:.34,h:.046,phase:.91}
    ];
    return fixedBands.map((b,k)=>({
      cx:((eventRnd(epoch,500+k*7)+t*speed*(1+k*.18)+b.phase)%1.52)-.26,
      cy:b.y+(eventRnd(epoch,501+k*7)-.5)*.045,
      w:b.w*(.88+eventRnd(epoch,502+k*7)*.28),
      h:b.h*(.82+eventRnd(epoch,503+k*7)*.34),
      lobes:4+Math.floor(eventRnd(epoch,504+k*7)*3),
      gain:strength*(.84+eventRnd(epoch,505+k*7)*.22),
      seed:k
    }));
  }

  function mountainFogCover(xn,yn,fog,key,t){
    let cover=0;
    for(const f of fog){
      for(let l=0;l<f.lobes;l++){
        const lx=f.cx+(l-(f.lobes-1)/2)*f.w*.23;
        const ly=f.cy+Math.sin(l*1.37+f.seed*.8)*f.h*.26;
        const sx=f.w*(.25+.035*(l%3));
        const sy=f.h*(.82+.10*((l+1)%3));
        const dx=(xn-lx)/sx,dy=(yn-ly)/sy;
        cover=Math.max(cover,Math.exp(-(dx*dx*1.18+dy*dy*1.85))*f.gain);
      }
    }
    if(key==='refocus') cover*=.34+.66*(1-smooth01((t%28)/28));
    return cover;
  }

  function drawMountain(ctx,w,h,c,st,t){
    const key=stateKey(st);
    const fog=buildMountainFog(key,t,Math.floor(t/34));

    for(let g=0;g<mountainLayers.length;g++){
      const cfg=mountainLayers[g];
      for(let j=0;j<cfg.lines;j++){
        const offset=(j-(cfg.lines-1)/2)*cfg.spacing;
        const contourScale=.84+Math.cos((j-(cfg.lines-1)/2)/cfg.lines*Math.PI)*.20;
        ctx.beginPath();
        let drawing=false;

        for(let i=0;i<=320;i++){
          const u=i/320;
          // IMMUTABLE GEOMETRY: these are the only coordinates of the mountain.
          // No t, no state, no grammar offset, no animated displacement.
          const yn=cfg.base+offset+mountainProfile(g,u)*contourScale;
          const x=u*w,y=yn*h;
          const cover=mountainFogCover(u,yn,fog,key,t);
          const threshold=.40+(j%4)*.06;
          const hidden=cover>threshold;

          if(hidden){drawing=false;continue;}
          if(!drawing){ctx.moveTo(x,y);drawing=true}else ctx.lineTo(x,y);
        }
        stroke(ctx,c,.18+rnd(310+g*20+j)*.10,.72+rnd(420+g*20+j)*.60);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // INCENSE — keep the approved organic v2-like smoke grammar.
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
        if(j===eventA){
          fold+=dirA*w*(key==='stable'?.012:key==='drift'?.035:key==='dispersed'?.052:.027)
            *Math.sin((yn-.38)*Math.PI*2.25+t*.055)*gaussian(yn,.69,.22);
        }
        if((key==='dispersed'||key==='refocus')&&j===eventB){
          fold+=dirB*w*(key==='dispersed'?.045:.023)
            *Math.sin((yn-.34)*Math.PI*1.85-t*.047+1.1)*gaussian(yn,.66,.25);
        }
        if(key==='drift') fold+=gaussian(yn,.76,.26)*dirA*w*.018*Math.sin(t*.035+j*.7);
        if(key==='refocus') fold+=(w*.50-(x0+drift))*smooth01(yn)*.12;
        const x=x0+curl1+curl2+drift+fold;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,alpha,width);
    }
  }

  // ---------------------------------------------------------------------------
  // DUSK — WATER, WATER, WATER.
  // The base field is a calm horizontal water surface. The sunset is read mainly
  // from a vertical reflection path made of brighter fragments of those same rows.
  // The sun itself is only a restrained horizon cue; no dome, arch or sky-ring.
  // ---------------------------------------------------------------------------
  function duskState(key){
    if(key==='stable') return {spread:.055,fragment:.22,sway:.002,shine:.92};
    if(key==='drift') return {spread:.075,fragment:.34,sway:.006,shine:.90};
    if(key==='dispersed') return {spread:.105,fragment:.52,sway:.011,shine:.86};
    return {spread:.062,fragment:.28,sway:.004,shine:.94};
  }

  function drawDusk(ctx,w,h,c,st,t){
    const key=stateKey(st),mode=duskState(key);
    const horizon=.31+(.5-rnd(110))*.025;
    const sunCx=.54+rnd(111)*.12;
    const lines=46+Math.floor(rnd(112)*7);
    const waterTop=horizon+.025;
    const waterBottom=.90;

    // 1) Calm water field. Geometry is largely static; the theme is water, not sky.
    for(let j=0;j<lines;j++){
      const q=j/(lines-1);
      const yn=lerp(waterTop,waterBottom,q);
      const y=yn*h;
      const alpha=.105+rnd(500+j)*.125;
      const width=.54+rnd(600+j)*.84;
      ctx.beginPath();
      for(let i=0;i<=300;i++){
        const u=i/300;
        const staticRipple=(Math.sin(u*(3.0+q*2.4)+j*.17)+Math.sin(u*7.2+j*.11)*.42)*h*(.0007+.0018*q);
        const yy=y+staticRipple;
        i?ctx.lineTo(u*w,yy):ctx.moveTo(u*w,yy);
      }
      stroke(ctx,c,alpha,width);
    }

    // 2) Restrained horizon/sun cue: a few short, calm horizontal chords directly
    // at the horizon. It never becomes a large arch or a separate graphic symbol.
    const cueRows=5;
    for(let k=0;k<cueRows;k++){
      const q=k/(cueRows-1);
      const yy=h*(horizon-.015+q*.030);
      const half=w*(.026+Math.sqrt(Math.max(0,1-Math.pow((q-.5)/.58,2)))*.026);
      ctx.beginPath();
      ctx.moveTo(sunCx*w-half,yy);
      ctx.lineTo(sunCx*w+half,yy);
      stroke(ctx,c,.13+q*.025,.70);
    }

    // 3) Water reflection: a vertically coherent path built from fragments of the
    // SAME horizontal water rows. Lower rows become more fragmented and irregular.
    const reflectionRows=30;
    for(let k=0;k<reflectionRows;k++){
      const q=k/(reflectionRows-1);
      const yn=lerp(horizon+.045,.88,q);
      const y=yn*h;
      const taper=1-q*.58;
      const baseHalf=w*(mode.spread*taper*(.78+rnd(800+k)*.52));
      const stateSway=Math.sin(t*.12+k*.67)*w*mode.sway*(.25+.75*q);
      const staticOffset=(rnd(900+k)-.5)*w*.018*q;
      const center=sunCx*w+stateSway+staticOffset;
      const fragmentRate=mode.fragment*(.48+.72*q);
      const pieces=2+Math.floor(fragmentRate*4)+((k%5===0)?1:0);
      const totalWidth=baseHalf*2;
      const block=totalWidth/pieces;

      for(let p=0;p<pieces;p++){
        const noise=rnd(1000+k*11+p);
        if(noise<fragmentRate*.26) continue;
        const left=center-baseHalf+p*block;
        const trimL=block*(.08+.22*rnd(1100+k*13+p));
        const trimR=block*(.10+.26*rnd(1200+k*13+p));
        const x1=left+trimL;
        const x2=left+block-trimR;
        if(x2<=x1) continue;

        const flicker=.82+.18*Math.sin(t*.18+k*.91+p*1.7);
        const alpha=(.16+.12*(1-q))*(.80+.20*rnd(1300+k*7+p))*mode.shine*flicker;
        const width=.72+1.05*(1-q)+rnd(1400+k*7+p)*.46;
        ctx.beginPath();
        ctx.moveTo(x1,y);
        // Tiny horizontal water irregularity only; never a vertical bulge.
        const mid=(x1+x2)/2;
        ctx.quadraticCurveTo(mid,y+h*(rnd(1500+k*7+p)-.5)*.0014,x2,y);
        stroke(ctx,c,alpha,width);
      }
    }
  }

  function drawFieldV9(canvas,opt={}){
    if(!canvas)return;
    const {w,h}=size(canvas),ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,w,h);
    const theme=opt.theme||(typeof activeTheme!=='undefined'?activeTheme:'ocean');
    const st=opt.state||(typeof states!=='undefined'?states[0]:{key:'stable'});
    const t=opt.t||0,c=palettes[theme]||palettes.ocean;
    if(theme==='ocean')drawOcean(ctx,w,h,c,st,t);
    else if(theme==='mountain')drawMountain(ctx,w,h,c,st,t);
    else if(theme==='incense')drawIncense(ctx,w,h,c,st,t);
    else drawDusk(ctx,w,h,c,st,t);
  }

  function install(){
    window.drawField=drawFieldV9;
    document.querySelector('#beginLive')?.addEventListener('click',reseed,{capture:true});
    document.querySelector('#themeGroup')?.addEventListener('click',()=>requestAnimationFrame(()=>{
      if(typeof renderStatic==='function')renderStatic();
    }));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.FocusWaveVisualEngine={reseed,drawField:drawFieldV9,get seed(){return sessionSeed;}};
})();