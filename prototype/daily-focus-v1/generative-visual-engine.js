/* FocusWave generative visual engine v6
 * Shared visual language: low-saturation, fine-line fields with distinct natural grammars.
 * Motion is expressed as 2D line-field change, not faux 3D wobble:
 * - ocean: continuous water lines bend around expanding ripple contours;
 * - mountain: the mountain profile stays fixed while fog moves laterally through the contours;
 * - incense: organic smoke strands keep their own folding grammar;
 * - dusk: the sun is sliced and scattered by horizontal water motion rather than drawn as a floating arc.
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
  function stateScale(key){ return key==='stable'?.48:key==='drift'?.76:key==='dispersed'?1.14:.66; }
  function smooth01(x){ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); }
  function gaussian(x,m,s){ return Math.exp(-Math.pow((x-m)/s,2)); }

  // ---- Ocean: the ripple is a 2D warp of the same continuous lines ----
  // No detached circles and no height-wave illusion. Each expanding elliptical ring
  // gently pushes the existing line field outward in the picture plane.
  function oceanRippleWarp(x,y,w,h,ripple,t,strength){
    const rx=w*ripple.aspectX;
    const ry=h*ripple.aspectY;
    const nx=(x-ripple.x)/rx;
    const ny=(y-ripple.y)/ry;
    const r=Math.sqrt(nx*nx+ny*ny);
    if(r>1.35) return {dx:0,dy:0};

    const progress=(t*ripple.speed+ripple.phase)%1;
    const ring1=.22+progress*.72;
    const ring2=Math.max(.10,ring1-.22);
    const band1=gaussian(r,ring1,.075);
    const band2=gaussian(r,ring2,.065)*.55;
    const envelope=Math.max(0,1-r/1.35);
    const push=(band1-band2)*envelope*strength;
    const inv=1/Math.max(.18,r);

    return {
      dx:nx*inv*w*.0105*push,
      dy:ny*inv*h*.0190*push
    };
  }

  function drawOcean(ctx,w,h,c,st,t){
    const key=stateKey(st),s=stateScale(key),lines=42+Math.floor(rnd(2)*5),epoch=Math.floor(t/18);
    const count=key==='stable'?1:key==='drift'?2:key==='dispersed'?3:2;
    const ripples=[];
    for(let k=0;k<count;k++){
      ripples.push({
        x:w*(.18+eventRnd(epoch,k*8)*.66),
        y:h*(.22+eventRnd(epoch,k*8+1)*.56),
        aspectX:.18+eventRnd(epoch,k*8+2)*.08,
        aspectY:.105+eventRnd(epoch,k*8+3)*.055,
        phase:eventRnd(epoch,k*8+4),
        speed:.018+eventRnd(epoch,k*8+5)*.012,
        gain:.68+eventRnd(epoch,k*8+6)*.42
      });
    }

    for(let j=0;j<lines;j++){
      const y0=(j+.7)*h/(lines+1);
      const width=.58+rnd(100+j)*1.10+(j%11===0?.28:0);
      const alpha=.13+rnd(200+j)*.145;
      ctx.beginPath();
      for(let i=0;i<=190;i++){
        const u=i/190;
        let x=u*w;
        // A quiet 2D base field: long, nearly-flat lines with only slight contour drift.
        let y=y0
          +Math.sin(u*2.25+j*.035+t*.010)*h*.0035
          +Math.sin(u*.86+j*.017)*h*.0048;

        const recovery=key==='refocus'?(1-.80*smooth01(u)):1;
        const stableGain=key==='stable'?.56:1;
        for(const ripple of ripples){
          const o=oceanRippleWarp(x,y,w,h,ripple,t,ripple.gain*stableGain*recovery*s);
          x+=o.dx; y+=o.dy;
        }

        // Dispersed water gets overlapping 2D distortions, not extra vertical vibration.
        if(key==='dispersed'){
          const side=gaussian(u,.54,.30)*Math.sin(u*7+j*.31+t*.026);
          x+=side*w*.0045;
        }
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,alpha,width);
    }
  }

  // ---- Mountain: mountain is fixed; fog is the moving state layer ----
  // The y-profile never animates. Attention state is shown by horizontal fog bands
  // that laterally tug, soften and temporarily hide contour segments.
  function buildMountainFog(key,t,epoch,g){
    const count=key==='stable'?1:key==='drift'?2:key==='dispersed'?3:2;
    const speed=key==='stable'?.0025:key==='drift'?.0065:key==='dispersed'?.010:.007;
    const fog=[];
    for(let k=0;k<count;k++){
      const seed=eventRnd(epoch,200+g*30+k*7);
      const x=((seed+t*speed*(1+k*.17))%1.28)-.14;
      fog.push({
        x,
        width:.15+eventRnd(epoch,201+g*30+k*7)*.18,
        strength:(key==='stable'?.28:key==='drift'?.56:key==='dispersed'?.82:.48)*( .78+eventRnd(epoch,202+g*30+k*7)*.34 ),
        phase:eventRnd(epoch,203+g*30+k*7)*Math.PI*2,
        cut:eventRnd(epoch,204+g*30+k*7)>.42
      });
    }
    return fog;
  }

  function mountainFogEffect(u,j,fog,key,t){
    let dx=0,cover=0;
    for(const f of fog){
      const d=(u-f.x)/(f.width*.55);
      const env=Math.exp(-d*d*2.25)*f.strength;
      // The fog moves sideways through the mountain. It only changes x / visibility.
      dx+=Math.sin((u-f.x)*Math.PI*2.2/f.width+f.phase+j*.08)*env*.020;
      cover=Math.max(cover,env*(f.cut?.92:.64));
    }
    if(key==='refocus'){
      const fade=.25+.75*(1-smooth01((t%24)/24));
      dx*=fade;cover*=fade;
    }
    return {dx,cover};
  }

  function drawMountain(ctx,w,h,c,st,t){
    const key=stateKey(st),epoch=Math.floor(t/26);
    const groups=3,linesPerGroup=13;
    const centers=[.22,.50,.78];

    for(let g=0;g<groups;g++){
      // Fixed mountain geometry: no t and no state in these ridge parameters.
      const baseY=h*(centers[g]+(rnd(20+g)-.5)*.014);
      const p1=.18+rnd(40+g*5)*.20;
      const p2=.52+rnd(41+g*5)*.25;
      const p3=.80+rnd(42+g*5)*.10;
      const fog=buildMountainFog(key,t,epoch,g);

      for(let j=0;j<linesPerGroup;j++){
        const offset=(j-(linesPerGroup-1)/2)*h*.0078;
        const contourPhase=(j-(linesPerGroup-1)/2)/linesPerGroup;
        const contourScale=.88+Math.cos(contourPhase*Math.PI)*.17;
        ctx.beginPath();
        let drawing=false;

        for(let i=0;i<=200;i++){
          const u=i/200;
          const ridge1=gaussian(u,p1,.108+g*.010)*h*(.061+.013*g);
          const ridge2=gaussian(u,p2,.150)*h*(.078-.006*g);
          const ridge3=gaussian(u,p3,.086)*h*.033;
          const profile=(-ridge1-ridge2*.86+ridge3*.30*(g===1?-1:1))*contourScale;
          const y=baseY+offset+profile;

          const f=mountainFogEffect(u,j,fog,key,t);
          const x=u*w+f.dx*w;
          // Fog is represented by the contour itself disappearing / thinning in moving horizontal windows.
          const threshold=.54+(j%3)*.06;
          const hidden=f.cover>threshold && Math.sin(u*19+j*.73+f.cover*4)>-.12;
          if(hidden){drawing=false;continue;}

          if(!drawing){ctx.moveTo(x,y);drawing=true}else ctx.lineTo(x,y);
        }
        stroke(ctx,c,.19+rnd(310+g*20+j)*.11,.72+rnd(420+g*20+j)*.68);
      }
    }
  }

  // ---- Incense: organic smoke strands; state changes happen inside the smoke itself ----
  function drawIncense(ctx,w,h,c,st,t){
    const key=stateKey(st),s=stateScale(key),strands=7+Math.floor(rnd(50)*4),epoch=Math.floor(t/20);
    const eventA=Math.floor(eventRnd(epoch,1)*strands);
    const eventB=(eventA+2+Math.floor(eventRnd(epoch,2)*Math.max(2,strands-3)))%strands;
    const dirA=eventRnd(epoch,3)>.5?1:-1;
    const dirB=-dirA;

    for(let j=0;j<strands;j++){
      const x0=w*(.17+j/(strands-1)*.66)+(rnd(60+j)-.5)*w*.038;
      const width=.62+rnd(100+j)*1.65;
      const alpha=.16+rnd(90+j)*.19;
      ctx.beginPath();
      for(let i=0;i<=160;i++){
        const yn=i/160;
        const y=h*(.90-yn*.79);
        const upper=Math.pow(yn,1.58);
        const curl1=Math.sin(yn*(5.2+rnd(70+j)*4.2)+t*.083+j*.83)*w*.0145*upper*s;
        const curl2=Math.sin(yn*12.5+t*.145+j*.69)*w*.0085*upper*s;
        const drift=(rnd(80+j)-.5)*w*.052*yn;
        let eventFold=0;

        const foldBand=gaussian(yn,.69,.22);
        if(j===eventA){
          const openCurl=Math.sin((yn-.38)*Math.PI*2.25+t*.055)*foldBand;
          eventFold+=dirA*w*(key==='stable'?.012:key==='drift'?.035:key==='dispersed'?.052:.027)*openCurl;
        }
        if((key==='dispersed'||key==='refocus')&&j===eventB){
          const openCurl=Math.sin((yn-.34)*Math.PI*1.85-t*.047+1.1)*gaussian(yn,.66,.25);
          eventFold+=dirB*w*(key==='dispersed'?.045:.023)*openCurl;
        }
        if(key==='drift'){
          eventFold+=gaussian(yn,.76,.26)*dirA*w*.018*Math.sin(t*.035+j*.7);
        }
        if(key==='refocus'){
          const target=w*.50;
          eventFold+=(target-(x0+drift))*smooth01(yn)*.12;
        }

        const x=x0+curl1+curl2+drift+eventFold;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,alpha,width);
    }
  }

  // ---- Dusk: a sunset on water, not a separate arc laid over stripes ----
  function buildDuskVeils(key,t,epoch){
    const count=key==='stable'?1:key==='drift'?2:key==='dispersed'?3:2;
    const speed=key==='stable'?.003:key==='drift'?.0075:key==='dispersed'?.011:.007;
    const veils=[];
    for(let k=0;k<count;k++){
      const x=((eventRnd(epoch,k*7)+t*speed*(1+k*.16))%1.30)-.15;
      veils.push({
        x,
        width:.14+eventRnd(epoch,k*7+1)*.18,
        gain:(key==='stable'?.30:key==='drift'?.55:key==='dispersed'?.82:.50),
        phase:eventRnd(epoch,k*7+2)*Math.PI*2
      });
    }
    return veils;
  }

  function duskVeilAt(u,veils,key,t){
    let shift=0,cover=0;
    for(const v of veils){
      const d=(u-v.x)/(v.width*.55);
      const env=Math.exp(-d*d*2.1)*v.gain;
      shift+=Math.sin((u-v.x)*Math.PI*2/v.width+v.phase)*env*.012;
      cover=Math.max(cover,env);
    }
    if(key==='refocus'){
      const fade=.25+.75*(1-smooth01((t%24)/24));
      shift*=fade;cover*=fade;
    }
    return {shift,cover};
  }

  function drawDusk(ctx,w,h,c,st,t){
    const key=stateKey(st),bands=30+Math.floor(rnd(110)*7);
    const horizon=.60+(.5-rnd(111))*.045;
    const epoch=Math.floor(t/24);
    const veils=buildDuskVeils(key,t,epoch);
    const sunCx=.56+rnd(160)*.12;
    const sunTop=h*(horizon-.105);
    const sunBottom=h*(horizon+.070);
    const sunRx=.155+rnd(161)*.038;

    // Dense water field. The water itself moves mainly sideways; vertical structure stays restrained.
    for(let j=0;j<bands;j++){
      const y0=h*(.16+j/(bands-1)*.70);
      const near=Math.exp(-Math.pow((y0/h-horizon)/.16,2));
      const width=.48+rnd(120+j)*1.30+near*.72;
      const alpha=.11+rnd(140+j)*.145+near*.060;
      ctx.beginPath();
      for(let i=0;i<=190;i++){
        const u=i/190;
        const veil=duskVeilAt(u,veils,key,t);
        const localFlow=Math.sin(u*6.5+j*.19+t*.028)*.0025*(.45+near);
        const dispersed=key==='dispersed'?Math.sin(u*12+j*.37+t*.045)*.0032*near:0;
        const x=(u+veil.shift+localFlow+dispersed)*w;
        const y=y0+Math.sin(u*1.8+j*.023)*h*.0028;
        const hidden=veil.cover>(.66+(j%4)*.045) && near>.18 && Math.sin(u*17+j*.61)>-.2;
        if(hidden){
          // Split the existing water line: the missing fragment reads as cloud/atmospheric veil.
          ctx.moveTo(x,y);
        } else {
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }
      }
      stroke(ctx,c,alpha,width);
    }

    // The sun is not drawn as one arc. Horizontal water slices reconstruct and scatter it.
    const sliceCount=15;
    for(let k=0;k<sliceCount;k++){
      const q=k/(sliceCount-1);
      const y=sunTop+(sunBottom-sunTop)*q;
      const yn=(y-(sunTop+sunBottom)/2)/((sunBottom-sunTop)/2);
      const half=sunRx*Math.sqrt(Math.max(0,1-yn*yn));
      const waterShift=Math.sin(k*.92+t*.050)*(.010+q*.006)
        +(key==='drift'?Math.sin(k*1.7+t*.080)*.006:0)
        +(key==='dispersed'?Math.sin(k*2.3-t*.11)*.011:0);
      const center=sunCx+waterShift;
      const veil=duskVeilAt(center,veils,key,t);
      const pieces=key==='stable'?2:key==='drift'?3:key==='dispersed'?4:3;

      for(let p=0;p<pieces;p++){
        const span=half*2/pieces;
        const left=center-half+p*span;
        const trim=span*(.12+rnd(700+k*9+p)*.18);
        const jitter=(rnd(760+k*9+p)-.5)*.010;
        const x1=(left+trim+jitter+veil.shift)*w;
        const x2=(left+span-trim+jitter+veil.shift)*w;
        if(x2<=x1)continue;
        const gap=veil.cover>.68 && ((p+k)%2===0);
        if(gap)continue;
        ctx.beginPath();
        ctx.moveTo(x1,y);
        ctx.bezierCurveTo(
          x1+(x2-x1)*.35,y+h*.0016*Math.sin(k+p),
          x1+(x2-x1)*.68,y-h*.0016*Math.sin(k+p),
          x2,y
        );
        stroke(ctx,c,.14+rnd(820+k*5+p)*.11,.72+rnd(850+k*5+p)*.72);
      }
    }

    // Restrained "floating gold": short water fragments under the sun, never a separate decorative symbol.
    const shimmerCount=key==='dispersed'?11:key==='drift'?9:7;
    for(let j=0;j<shimmerCount;j++){
      const yy=h*(horizon+.085+j*.022);
      const spread=.032+j*.0065;
      const shift=Math.sin(t*.052+j*1.35)*.012;
      const center=sunCx+shift;
      const seg=spread*(.55+rnd(900+j)*.60);
      const breaks=2+(j%3);
      for(let p=0;p<breaks;p++){
        const block=seg*2/breaks;
        const x1=(center-seg+p*block+block*.10)*w;
        const x2=(center-seg+(p+1)*block-block*.18)*w;
        if(x2<=x1)continue;
        ctx.beginPath();ctx.moveTo(x1,yy);ctx.lineTo(x2,yy);
        stroke(ctx,c,.09+rnd(930+j*5+p)*.08,.58+rnd(950+j*5+p)*.55);
      }
    }
  }

  function drawFieldV6(canvas,opt={}){
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
    window.drawField=drawFieldV6;
    document.querySelector('#beginLive')?.addEventListener('click',reseed,{capture:true});
    document.querySelector('#themeGroup')?.addEventListener('click',()=>requestAnimationFrame(()=>{
      if(typeof renderStatic==='function')renderStatic();
    }));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.FocusWaveVisualEngine={reseed,drawField:drawFieldV6,get seed(){return sessionSeed;}};
})();