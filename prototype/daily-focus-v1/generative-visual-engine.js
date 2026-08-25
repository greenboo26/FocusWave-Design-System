/* FocusWave generative visual engine v5
 * Shared visual language: low-saturation, fine-line fields with distinct natural grammars.
 * Ocean integrates ripples into the field; mountain keeps denser contour ridges;
 * incense returns to organic smoke strands; dusk returns to dense horizon bands with moving cloud veils.
 * Attention states alter each theme through its own motion grammar rather than one shared distortion trick.
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

  // ---- Ocean: ripples are deformations of the same continuous water lines ----
  function oceanRipple(x,y,w,h,ripple,t,strength){
    const dx=(x-ripple.x)/w;
    const dy=(y-ripple.y)/h;
    const r=Math.sqrt(dx*dx + dy*dy*1.55);
    const envelope=Math.exp(-Math.pow(r/(ripple.radius||.22),2));
    const phase=r*46 - t*(.62+ripple.speed) + ripple.phase;
    const wave=Math.sin(phase)*envelope*strength;
    return {
      dx: Math.cos(phase*.56)*envelope*w*.0045*strength*Math.sign(dx||1),
      dy: wave*h*.021
    };
  }

  function drawOcean(ctx,w,h,c,st,t){
    const key=stateKey(st),s=stateScale(key),lines=40+Math.floor(rnd(2)*7),epoch=Math.floor(t/20);
    const count=key==='stable'?1:key==='drift'?2:key==='dispersed'?3:2;
    const ripples=[];
    for(let k=0;k<count;k++){
      ripples.push({
        x:w*(.18+eventRnd(epoch,k*7)*.66),
        y:h*(.22+eventRnd(epoch,k*7+1)*.56),
        radius:.17+eventRnd(epoch,k*7+2)*.08,
        phase:eventRnd(epoch,k*7+3)*Math.PI*2,
        speed:.10+eventRnd(epoch,k*7+4)*.18,
        gain:.52+eventRnd(epoch,k*7+5)*.48
      });
    }

    for(let j=0;j<lines;j++){
      const y0=(j+.7)*h/(lines+1);
      const width=.58+rnd(100+j)*1.15+(j%11===0?.35:0);
      const alpha=.13+rnd(200+j)*.15;
      ctx.beginPath();
      for(let i=0;i<=180;i++){
        const u=i/180;
        let x=u*w;
        let y=y0
          +Math.sin(u*(4.25+rnd(4)*1.6)+t*.042+j*.071)*h*.0082*s
          +Math.sin(u*1.45+t*.020+j*.019)*h*.0155*s;

        const recovery = key==='refocus' ? (1-.76*smooth01(u)) : 1;
        const stableGain = key==='stable' ? .55 : 1;
        for(const ripple of ripples){
          const o=oceanRipple(x,y,w,h,ripple,t,ripple.gain*stableGain*recovery*s);
          x+=o.dx; y+=o.dy;
        }

        if(key==='dispersed'){
          const interference=gaussian(u,.56,.27)*Math.sin(u*18+j*.27+t*.12)*h*.0038;
          y+=interference;
        }
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,alpha,width);
    }
  }

  // ---- Mountain: preserve v4 grouped contours, but denser and with larger ridge curvature ----
  function drawMountain(ctx,w,h,c,st,t){
    const key=stateKey(st),s=stateScale(key),epoch=Math.floor(t/26);
    const groups=3,linesPerGroup=12;
    const centers=[.22,.50,.78];

    for(let g=0;g<groups;g++){
      const baseY=h*(centers[g] + (eventRnd(epoch,20+g)-.5)*.018);
      const p1=.20+eventRnd(epoch,40+g*5)*.18;
      const p2=.55+eventRnd(epoch,41+g*5)*.23;
      const p3=.80+eventRnd(epoch,42+g*5)*.10;
      const driftShift=(key==='drift'||key==='dispersed')?Math.sin(t*.035+g*1.4)*(.018+.018*s):0;

      for(let j=0;j<linesPerGroup;j++){
        const offset=(j-(linesPerGroup-1)/2)*h*.0088;
        const contourPhase=(j-(linesPerGroup-1)/2)/linesPerGroup;
        ctx.beginPath();
        for(let i=0;i<=190;i++){
          const u=i/190,x=u*w;
          const ridge1=gaussian(u,p1+driftShift,.115+g*.010)*h*(.047+.011*g);
          const ridge2=gaussian(u,p2-driftShift*.55,.155)*h*(.062-.006*g);
          const ridge3=gaussian(u,p3,.090)*h*.026;
          const contourScale=.88+Math.cos(contourPhase*Math.PI)*.16;
          let profile=(-ridge1-ridge2*.86+ridge3*.32*(g===1?-1:1))*contourScale;

          const lowDrift=Math.sin(u*6.4+t*.015+j*.12+g)*h*.0024;
          let stateWarp=0;
          if(key==='drift'){
            stateWarp=gaussian(u,.50+.08*Math.sin(t*.025+g),.24)*Math.sin(u*8+j*.21+t*.055)*h*.0054;
          } else if(key==='dispersed'){
            const fork=gaussian(u,.42,.20)*Math.sin(u*14.5+j*.44+t*.095)*h*.0084;
            const second=gaussian(u,.73,.17)*Math.sin(u*11.5-j*.29-t*.072)*h*.0063;
            stateWarp=fork+second;
          } else if(key==='refocus'){
            stateWarp=gaussian(u,.36,.28)*Math.sin(u*10+j*.33+t*.045)*h*.0052*(1-smooth01(u));
          }

          const y=baseY+offset+profile*s+lowDrift+stateWarp;
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }
        stroke(ctx,c,.20+rnd(310+g*20+j)*.11,.78+rnd(420+g*20+j)*.72);
      }
    }
  }

  // ---- Incense: return to v2 organic smoke strands; state changes happen inside the smoke itself ----
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

        // The old detached smoke circle is replaced by an open fold in one or two actual smoke strands.
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

  // ---- Dusk: return to v2 dense bands; larger shallow sun arc, cloud ribbons cross in front ----
  function buildDuskClouds(w,h,key,t,epoch,horizon){
    const count=key==='stable'?1:key==='drift'?2:key==='dispersed'?3:2;
    const speed=key==='stable'?.0045:key==='drift'?.009:key==='dispersed'?.014:.008;
    const clouds=[];
    for(let k=0;k<count;k++){
      const seedX=eventRnd(epoch,k*6);
      const cycle=((seedX+t*speed*(.75+k*.18))%1.24)-.12;
      const refocusShift=key==='refocus'?(.10*smooth01((t%24)/24)):0;
      clouds.push({
        x:w*(cycle+refocusShift),
        y:h*(horizon-.075+k*.045+(eventRnd(epoch,k*6+1)-.5)*.025),
        width:w*(.14+eventRnd(epoch,k*6+2)*.16),
        height:h*(.018+eventRnd(epoch,k*6+3)*.018),
        phase:eventRnd(epoch,k*6+4)*Math.PI*2,
        lines:2+Math.floor(eventRnd(epoch,k*6+5)*3)
      });
    }
    return clouds;
  }

  function cloudCoversPoint(x,y,cloud){
    const nx=(x-cloud.x)/(cloud.width*.55);
    const ny=(y-cloud.y)/(cloud.height*1.15);
    return nx*nx+ny*ny<1;
  }

  function drawDusk(ctx,w,h,c,st,t){
    const key=stateKey(st),s=stateScale(key),bands=22+Math.floor(rnd(110)*9);
    const horizon=.60+(.5-rnd(111))*.055;
    const epoch=Math.floor(t/24);
    const clouds=buildDuskClouds(w,h,key,t,epoch,horizon);

    // Dense v2-style sunset field.
    for(let j=0;j<bands;j++){
      const y0=h*(.16+j/(bands-1)*.70);
      const near=Math.exp(-Math.pow((y0/h-horizon)/.15,2));
      const width=.48+rnd(120+j)*1.35+near*.78;
      const alpha=.11+rnd(140+j)*.15+near*.075;
      ctx.beginPath();
      for(let i=0;i<=170;i++){
        const u=i/170,x=u*w;
        const center=.56+rnd(130)*.14;
        const arc=gaussian(u,center,.24+rnd(131)*.09)*h*.026*(y0/h<horizon?-1:1);
        let y=y0+arc*s+Math.sin(u*3.0+t*.022+j*.033)*h*.0045*s;
        if(key==='drift') y+=gaussian(u,.58,.28)*Math.sin(u*8+t*.065+j*.13)*h*.0038;
        if(key==='dispersed') y+=Math.sin(u*12.5+j*.41+t*.095)*h*.0056*gaussian(u,.55,.40);
        if(key==='refocus') y+=Math.sin(u*8+j*.23+t*.052)*h*.0042*(1-smooth01(u));
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,alpha,width);
    }

    // A broader, shallow sun arc; deliberately not a round half-circle.
    const sunCx=w*(.54+rnd(160)*.14);
    const sunCy=h*horizon;
    const sunRx=w*(.19+rnd(161)*.055);
    const sunRy=h*(.058+rnd(162)*.025);
    ctx.beginPath();
    let drawing=false;
    for(let i=0;i<=150;i++){
      const q=i/150;
      const a=Math.PI*1.04+q*Math.PI*.92;
      const wobble=1+.018*Math.sin(q*Math.PI*3+rnd(164)*4);
      const x=sunCx+Math.cos(a)*sunRx*wobble;
      const y=sunCy+Math.sin(a)*sunRy*(1+.05*Math.sin(q*Math.PI*2));
      const covered=clouds.some(cloud=>cloudCoversPoint(x,y,cloud));
      if(covered){ drawing=false; continue; }
      if(!drawing){ctx.moveTo(x,y);drawing=true}else ctx.lineTo(x,y);
    }
    stroke(ctx,c,.22,1.15+rnd(163)*.65);

    // Abstract cloud veils move in front of the sun.
    clouds.forEach((cloud,k)=>{
      for(let j=0;j<cloud.lines;j++){
        const y0=cloud.y+(j-(cloud.lines-1)/2)*cloud.height*.54;
        ctx.beginPath();
        for(let i=0;i<=100;i++){
          const q=i/100;
          const x=cloud.x-cloud.width*.52+q*cloud.width*1.04;
          const taper=Math.sin(Math.PI*q);
          const y=y0
            +Math.sin(q*Math.PI*2.2+t*.035+cloud.phase+j*.7)*cloud.height*.22*taper
            +Math.sin(q*Math.PI*5+j)*cloud.height*.08*taper;
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }
        stroke(ctx,c,.15+.035*k,.75+rnd(500+k*7+j)*.8);
      }
    });

    // "Floating gold" as restrained, broken reflected lines under the sun.
    const shimmerCount=key==='dispersed'?10:key==='drift'?8:6;
    for(let j=0;j<shimmerCount;j++){
      const yy=sunCy+h*(.045+j*.025);
      const spread=w*(.055+j*.007)*(key==='dispersed'?1.25:1);
      const offset=Math.sin(t*.09+j*1.7)*w*.010;
      const seg=spread*(.50+rnd(620+j)*.55);
      ctx.beginPath();
      ctx.moveTo(sunCx-seg+offset,yy);
      ctx.bezierCurveTo(sunCx-seg*.35,yy+h*.0025,sunCx+seg*.35,yy-h*.0025,sunCx+seg+offset,yy);
      stroke(ctx,c,.11+rnd(650+j)*.09,.65+rnd(680+j)*.75);
    }
  }

  function drawFieldV5(canvas,opt={}){
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
    window.drawField=drawFieldV5;
    document.querySelector('#beginLive')?.addEventListener('click',reseed,{capture:true});
    document.querySelector('#themeGroup')?.addEventListener('click',()=>requestAnimationFrame(()=>{
      if(typeof renderStatic==='function')renderStatic();
    }));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.FocusWaveVisualEngine={reseed,drawField:drawFieldV5,get seed(){return sessionSeed;}};
})();
