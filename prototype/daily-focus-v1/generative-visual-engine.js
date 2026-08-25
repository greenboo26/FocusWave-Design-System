/* FocusWave generative visual engine v8
 * One continuous fine-line language; each natural image emerges from the same field.
 * - ocean: top-down circular ripple bands expand through the field; more lines become involved as radius grows.
 * - mountain: mountain geometry is completely fixed; only lateral fog masks erase / reveal line segments.
 * - incense: organic smoke strands keep their own folding grammar.
 * - dusk: dense horizon lines form a broad soft sunset bulge; moving lateral veils break it apart without hard bends.
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

  // ---------------------------------------------------------------------------
  // OCEAN — top-down ripples.
  // Radius controls WHICH lines are affected. Displacement stays restrained.
  // The circularity is computed in canvas pixels so the ripple does not become an "eye".
  // ---------------------------------------------------------------------------
  function buildOceanDrops(key,t,epoch,w,h){
    const count=key==='stable'?1:key==='drift'?2:key==='dispersed'?3:2;
    const cycle=key==='stable'?30:key==='drift'?24:key==='dispersed'?18:24;
    const minDim=Math.min(w,h);
    const drops=[];

    for(let k=0;k<count;k++){
      const seed=eventRnd(epoch,k*11+1);
      const phase=((t/cycle)*(1+k*.08)+seed)%1;
      const life=phase<.84 ? smooth01(phase/.84) : 1-smooth01((phase-.84)/.16);
      const radius=minDim*(.028 + phase*(.27+eventRnd(epoch,k*11+2)*.08));
      const ringGap=minDim*(.035+eventRnd(epoch,k*11+3)*.012);
      drops.push({
        x:w*(.16+eventRnd(epoch,k*11+4)*.68),
        y:h*(.20+eventRnd(epoch,k*11+5)*.60),
        radius,
        ringGap,
        band:minDim*(.010+eventRnd(epoch,k*11+6)*.006),
        life,
        rings:2+Math.floor(eventRnd(epoch,k*11+7)*3)
      });
    }
    return drops;
  }

  function oceanRippleOffset(x,y,drop){
    const dx=x-drop.x,dy=y-drop.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<1) return {dx:0,dy:0,weight:0};

    let total=0;
    for(let r=0;r<drop.rings;r++){
      const rr=drop.radius-r*drop.ringGap;
      if(rr<=drop.band*1.4) continue;
      const band=Math.exp(-Math.pow((dist-rr)/drop.band,2));
      total+=band*(1-r*.16);
    }
    total*=drop.life;
    if(total<.001) return {dx:0,dy:0,weight:0};

    // Small radial displacement in the picture plane. The visible expansion comes from
    // more line rows entering the annulus as radius grows, not from stronger bending.
    const nx=dx/dist,ny=dy/dist;
    const amount=Math.min(1.45,total)*3.6;
    return {dx:nx*amount,dy:ny*amount,weight:Math.min(1,total)};
  }

  function drawOcean(ctx,w,h,c,st,t){
    const key=stateKey(st),lines=48+Math.floor(rnd(2)*5),epoch=Math.floor(t/32);
    const drops=buildOceanDrops(key,t,epoch,w,h);

    for(let j=0;j<lines;j++){
      const y0=(j+.72)*h/(lines+1);
      const alpha=.125+rnd(200+j)*.135;
      const width=.56+rnd(100+j)*.92+(j%13===0?.18:0);
      ctx.beginPath();

      for(let i=0;i<=260;i++){
        const u=i/260;
        let x=u*w;
        let y=y0 + Math.sin(u*1.35+j*.021)*h*.0019 + Math.sin(u*.58+j*.012)*h*.0022;

        let ox=0,oy=0,weight=0;
        for(const drop of drops){
          const o=oceanRippleOffset(x,y,drop);
          ox+=o.dx; oy+=o.dy; weight=Math.max(weight,o.weight);
        }
        x+=ox; y+=oy;

        // State changes event density / overlap, not the force applied to one ring.
        if(key==='refocus'){
          const settle=smooth01(u);
          x-=ox*settle*.52;
          y-=oy*settle*.52;
        }
        if(key==='dispersed' && weight>.12){
          x+=Math.sin(j*.43+t*.033+u*5.2)*1.15*weight;
        }

        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,alpha,width);
    }
  }

  // ---------------------------------------------------------------------------
  // MOUNTAIN — the mountains never move.
  // Three depth layers have deliberately different silhouettes. Fog is a moving
  // spatial mask only: it travels left/right and erases / reveals fixed segments.
  // ---------------------------------------------------------------------------
  function mountainLayerConfig(g){
    if(g===0) return {
      base:.27, spacing:.0068, lines:11,
      peaks:[
        [.15,.030,.18], [.42,.020,.14], [.72,.035,.17], [.92,.018,.10]
      ],
      rough:.0020
    };
    if(g===1) return {
      base:.51, spacing:.0075, lines:12,
      peaks:[
        [.10,.050,.12], [.34,.072,.16], [.62,.030,.11], [.82,.058,.13]
      ],
      rough:.0028
    };
    return {
      base:.79, spacing:.0082, lines:13,
      peaks:[
        [.08,.083,.11], [.26,.042,.08], [.49,.092,.14], [.69,.055,.09], [.88,.078,.105]
      ],
      rough:.0038
    };
  }

  function mountainProfile(g,u){
    const cfg=mountainLayerConfig(g);
    let y=0;
    cfg.peaks.forEach((p,idx)=>{
      const [cx,amp,sigma]=p;
      y-=gaussian(u,cx,sigma)*amp*(.90+rnd(700+g*20+idx)*.20);
    });
    // Fixed micro-contour character. No t, no state.
    y+=Math.sin(u*(5.5+g*1.2)+g*.8)*cfg.rough;
    y+=Math.sin(u*(11.5+g*1.7)+1.7*g)*cfg.rough*.45;
    return y;
  }

  function buildMountainFog(key,t,epoch,h){
    const count=key==='stable'?1:key==='drift'?2:key==='dispersed'?3:2;
    const speed=key==='stable'?.0022:key==='drift'?.0058:key==='dispersed'?.009:.0062;
    const fog=[];
    for(let k=0;k<count;k++){
      const cx=((eventRnd(epoch,k*10)+t*speed*(1+k*.14))%1.38)-.19;
      const cy=.30+eventRnd(epoch,k*10+1)*.50;
      const baseW=.18+eventRnd(epoch,k*10+2)*.20;
      const baseH=.040+eventRnd(epoch,k*10+3)*.060;
      const lobes=3+Math.floor(eventRnd(epoch,k*10+4)*3);
      fog.push({cx,cy,baseW,baseH,lobes,gain:key==='stable'?.52:key==='drift'?.72:key==='dispersed'?.90:.68,seed:k});
    }
    return fog;
  }

  function mountainFogCover(xn,yn,fog,key,t){
    let cover=0;
    for(const f of fog){
      for(let l=0;l<f.lobes;l++){
        const lx=f.cx+(l-(f.lobes-1)/2)*f.baseW*.34;
        const ly=f.cy+Math.sin(l*1.7+f.seed)*f.baseH*.30;
        const sx=f.baseW*(.34+.10*((l+1)%2));
        const sy=f.baseH*(.72+.16*(l%3));
        const dx=(xn-lx)/sx,dy=(yn-ly)/sy;
        cover=Math.max(cover,Math.exp(-(dx*dx*1.45+dy*dy*1.75))*f.gain);
      }
    }
    if(key==='refocus') cover*=.30+.70*(1-smooth01((t%26)/26));
    return cover;
  }

  function drawMountain(ctx,w,h,c,st,t){
    const key=stateKey(st),fog=buildMountainFog(key,t,Math.floor(t/30),h);

    for(let g=0;g<3;g++){
      const cfg=mountainLayerConfig(g);
      for(let j=0;j<cfg.lines;j++){
        const offset=(j-(cfg.lines-1)/2)*cfg.spacing;
        const contourScale=.86+Math.cos((j-(cfg.lines-1)/2)/cfg.lines*Math.PI)*.17;
        ctx.beginPath();
        let drawing=false;

        for(let i=0;i<=280;i++){
          const u=i/280;
          const yn=cfg.base+offset+mountainProfile(g,u)*contourScale;
          const cover=mountainFogCover(u,yn,fog,key,t);
          const threshold=.44+(j%4)*.055;
          const hidden=cover>threshold;

          // x and y are the original fixed mountain coordinates. Fog never drags them.
          const x=u*w,y=yn*h;
          if(hidden){drawing=false;continue;}
          if(!drawing){ctx.moveTo(x,y);drawing=true}else ctx.lineTo(x,y);
        }
        stroke(ctx,c,.18+rnd(310+g*20+j)*.105,.70+rnd(420+g*20+j)*.64);
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
  // DUSK — return to the soft v2 logic: the same dense horizontal bands form a
  // broad smooth sun/reflection bulge. State motion comes from lateral erase veils.
  // ---------------------------------------------------------------------------
  function buildDuskVeils(key,t,epoch){
    const count=key==='stable'?1:key==='drift'?2:key==='dispersed'?3:2;
    const speed=key==='stable'?.0022:key==='drift'?.006:key==='dispersed'?.0095:.0062;
    const veils=[];
    for(let k=0;k<count;k++){
      veils.push({
        x:((eventRnd(epoch,k*9)+t*speed*(1+k*.16))%1.36)-.18,
        y:.43+eventRnd(epoch,k*9+1)*.28,
        w:.16+eventRnd(epoch,k*9+2)*.20,
        h:.036+eventRnd(epoch,k*9+3)*.060,
        lobes:2+Math.floor(eventRnd(epoch,k*9+4)*3),
        gain:key==='stable'?.46:key==='drift'?.66:key==='dispersed'?.88:.62,
        seed:k
      });
    }
    return veils;
  }

  function duskCover(xn,yn,veils,key,t){
    let cover=0;
    for(const v of veils){
      for(let l=0;l<v.lobes;l++){
        const lx=v.x+(l-(v.lobes-1)/2)*v.w*.38;
        const ly=v.y+Math.sin(l*1.45+v.seed)*v.h*.28;
        const sx=v.w*(.36+.08*(l%2));
        const sy=v.h*(.72+.15*((l+1)%3));
        const dx=(xn-lx)/sx,dy=(yn-ly)/sy;
        cover=Math.max(cover,Math.exp(-(dx*dx*1.55+dy*dy*1.70))*v.gain);
      }
    }
    if(key==='refocus') cover*=.28+.72*(1-smooth01((t%24)/24));
    return cover;
  }

  function drawDusk(ctx,w,h,c,st,t){
    const key=stateKey(st),bands=38+Math.floor(rnd(110)*7);
    const horizon=.59+(.5-rnd(111))*.035;
    const sunCx=.54+rnd(160)*.14;
    const sunSigma=.16+rnd(161)*.035;
    const veils=buildDuskVeils(key,t,Math.floor(t/28));

    for(let j=0;j<bands;j++){
      const base=.14+j/(bands-1)*.73;
      const near=Math.exp(-Math.pow((base-horizon)/.17,2));
      const alpha=.105+rnd(140+j)*.14+near*.055;
      const width=.46+rnd(120+j)*1.16+near*.66;
      ctx.beginPath();
      let drawing=false;

      for(let i=0;i<=260;i++){
        const u=i/260;
        const horizontal=gaussian(u,sunCx,sunSigma);
        const vertical=gaussian(base,horizon,.145);
        const side=base<horizon ? -1 : .52;

        // One soft field deformation; no rectangular cut-off, no sqrt edge, no hard corner.
        const lift=horizontal*vertical*(.050+.018*near)*side;
        const yn=base+lift+Math.sin(u*1.55+j*.019)*.0018;

        const cover=duskCover(u,yn,veils,key,t);
        // Reflection below the horizon is broken a little more readily by water/air veils.
        const threshold=(base<horizon?.50:.44)+(j%4)*.050;
        const hidden=cover>threshold;
        const x=u*w,y=yn*h;

        if(hidden){drawing=false;continue;}
        if(!drawing){ctx.moveTo(x,y);drawing=true}else ctx.lineTo(x,y);
      }
      stroke(ctx,c,alpha,width);
    }
  }

  function drawFieldV8(canvas,opt={}){
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
    window.drawField=drawFieldV8;
    document.querySelector('#beginLive')?.addEventListener('click',reseed,{capture:true});
    document.querySelector('#themeGroup')?.addEventListener('click',()=>requestAnimationFrame(()=>{
      if(typeof renderStatic==='function')renderStatic();
    }));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.FocusWaveVisualEngine={reseed,drawField:drawFieldV8,get seed(){return sessionSeed;}};
})();
