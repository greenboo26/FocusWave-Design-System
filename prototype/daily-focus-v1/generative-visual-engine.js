/* FocusWave generative visual engine v7
 * One continuous fine-line language; each natural image emerges by transforming that same field.
 * - ocean: top-down water lines locally become connected concentric ripple arcs;
 * - mountain: fixed contour mountains are horizontally occluded / tugged by drifting fog;
 * - incense: organic smoke strands keep their own folding grammar;
 * - dusk: dense horizon lines themselves bulge into the sunset and are broken by lateral veils.
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
    ctx.strokeStyle=rgba(c,a);ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
  }
  function stateKey(st){ return st?.key || 'stable'; }
  function stateScale(key){ return key==='stable'?.50:key==='drift'?.78:key==='dispersed'?1.12:.68; }
  function smooth01(x){ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); }
  function gaussian(x,m,s){ return Math.exp(-Math.pow((x-m)/s,2)); }
  function clamp01(x){ return Math.max(0,Math.min(1,x)); }

  function buildOceanDrops(key,t,epoch){
    const count=key==='stable'?1:key==='drift'?2:key==='dispersed'?3:2;
    const speed=key==='stable'?.004:key==='drift'?.007:key==='dispersed'?.010:.006;
    const drops=[];
    for(let k=0;k<count;k++){
      const phase=(eventRnd(epoch,k*8+4)+t*speed*(1+k*.17))%1;
      drops.push({
        x:.18+eventRnd(epoch,k*8)*.66,
        y:.22+eventRnd(epoch,k*8+1)*.56,
        rx:.12+eventRnd(epoch,k*8+2)*.075,
        ry:.075+eventRnd(epoch,k*8+3)*.045,
        phase,
        gain:.72+eventRnd(epoch,k*8+5)*.34
      });
    }
    return drops;
  }

  function oceanArcForLine(u,yNorm,drop,key){
    const dy=yNorm-drop.y;
    const absDy=Math.abs(dy);
    const influenceY=drop.ry*1.25;
    if(absDy>influenceY) return null;
    const ringBand=.24+.68*drop.phase;
    const local=clamp01(absDy/influenceY);
    const ringScale=.44+.56*Math.max(local,ringBand*.55);
    const rx=drop.rx*ringScale;
    const ry=drop.ry*ringScale;
    if(ry<=absDy+.002) return null;
    const halfX=rx*Math.sqrt(Math.max(0,1-(absDy*absDy)/(ry*ry)));
    const dx=u-drop.x;
    if(Math.abs(dx)>halfX) return null;
    const z=dx/rx;
    const circleY=drop.y + Math.sign(dy||1)*ry*Math.sqrt(Math.max(0,1-z*z));
    const edge=1-clamp01(Math.abs(dx)/Math.max(.0001,halfX));
    const blend=smooth01(edge);
    const stateGain=key==='stable'?.58:key==='drift'?.82:key==='dispersed'?1:.76;
    return {y:yNorm+(circleY-yNorm)*blend*drop.gain*stateGain,pull:blend*drop.gain*stateGain};
  }

  function drawOcean(ctx,w,h,c,st,t){
    const key=stateKey(st),lines=44+Math.floor(rnd(2)*5),epoch=Math.floor(t/22),drops=buildOceanDrops(key,t,epoch);
    for(let j=0;j<lines;j++){
      const yNorm=(j+.7)/(lines+1);
      const alpha=.13+rnd(200+j)*.145;
      const width=.58+rnd(100+j)*1.02+(j%12===0?.22:0);
      ctx.beginPath();
      for(let i=0;i<=220;i++){
        const u=i/220;
        let x=u*w;
        let yn=yNorm + Math.sin(u*1.45+j*.025)*.0028 + Math.sin(u*.62+j*.013)*.0032;
        let strongest=0;
        for(const drop of drops){
          const arc=oceanArcForLine(u,yn,drop,key);
          if(arc && arc.pull>strongest){yn=arc.y;strongest=arc.pull;}
        }
        if(key==='dispersed') x+=Math.sin(u*8+j*.31+t*.035)*w*.0028*strongest;
        if(key==='refocus') x+=Math.sin(u*4+j*.11)*w*.0015*(1-smooth01(u));
        const y=yn*h;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,alpha,width);
    }
  }

  function buildMountainFog(key,t,epoch){
    const count=key==='stable'?1:key==='drift'?2:key==='dispersed'?3:2;
    const speed=key==='stable'?.0026:key==='drift'?.006:key==='dispersed'?.0095:.0065;
    const fog=[];
    for(let k=0;k<count;k++){
      fog.push({
        x:((eventRnd(epoch,k*9)+t*speed*(1+k*.13))%1.34)-.17,
        y:.27+eventRnd(epoch,k*9+1)*.48,
        w:.20+eventRnd(epoch,k*9+2)*.20,
        h:.055+eventRnd(epoch,k*9+3)*.075,
        dir:eventRnd(epoch,k*9+4)>.5?1:-1,
        gain:(key==='stable'?.30:key==='drift'?.58:key==='dispersed'?.86:.50),
        phase:eventRnd(epoch,k*9+5)*Math.PI*2
      });
    }
    return fog;
  }

  function fogAt(xn,yn,fog,key,t){
    let shift=0,cover=0;
    for(const f of fog){
      const dx=(xn-f.x)/(f.w*.55),dy=(yn-f.y)/(f.h*1.15);
      const env=Math.exp(-(dx*dx*1.7+dy*dy*1.45))*f.gain;
      shift+=f.dir*Math.sin(dx*Math.PI+f.phase)*env*.020;
      cover=Math.max(cover,env);
    }
    if(key==='refocus'){
      const fade=.26+.74*(1-smooth01((t%26)/26));shift*=fade;cover*=fade;
    }
    return {shift,cover};
  }

  function drawMountain(ctx,w,h,c,st,t){
    const key=stateKey(st),fog=buildMountainFog(key,t,Math.floor(t/28));
    const groups=3,linesPerGroup=13,centers=[.22,.50,.78];
    for(let g=0;g<groups;g++){
      const baseY=centers[g]+(rnd(20+g)-.5)*.014;
      const p1=.18+rnd(40+g*5)*.20,p2=.52+rnd(41+g*5)*.25,p3=.80+rnd(42+g*5)*.10;
      for(let j=0;j<linesPerGroup;j++){
        const offset=(j-(linesPerGroup-1)/2)*.0077;
        const contourPhase=(j-(linesPerGroup-1)/2)/linesPerGroup;
        const contourScale=.88+Math.cos(contourPhase*Math.PI)*.17;
        ctx.beginPath();let drawing=false;
        for(let i=0;i<=220;i++){
          const u=i/220;
          const ridge1=gaussian(u,p1,.108+g*.010)*(.064+.013*g);
          const ridge2=gaussian(u,p2,.150)*(.082-.006*g);
          const ridge3=gaussian(u,p3,.086)*.035;
          const yn=baseY+offset+(-ridge1-ridge2*.86+ridge3*.30*(g===1?-1:1))*contourScale;
          const f=fogAt(u,yn,fog,key,t);
          const x=(u+f.shift)*w,y=yn*h;
          const hidden=f.cover>(.48+(j%4)*.055);
          if(hidden){drawing=false;continue;}
          if(!drawing){ctx.moveTo(x,y);drawing=true}else ctx.lineTo(x,y);
        }
        stroke(ctx,c,.19+rnd(310+g*20+j)*.11,.72+rnd(420+g*20+j)*.68);
      }
    }
  }

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

  function buildDuskVeils(key,t,epoch){
    const count=key==='stable'?1:key==='drift'?2:key==='dispersed'?3:2;
    const speed=key==='stable'?.0025:key==='drift'?.0065:key==='dispersed'?.010:.0065;
    const veils=[];
    for(let k=0;k<count;k++){
      veils.push({
        x:((eventRnd(epoch,k*8)+t*speed*(1+k*.15))%1.34)-.17,
        y:.48+eventRnd(epoch,k*8+1)*.20,
        w:.16+eventRnd(epoch,k*8+2)*.20,
        h:.045+eventRnd(epoch,k*8+3)*.050,
        gain:(key==='stable'?.28:key==='drift'?.55:key==='dispersed'?.84:.48),
        dir:eventRnd(epoch,k*8+4)>.5?1:-1,
        phase:eventRnd(epoch,k*8+5)*Math.PI*2
      });
    }
    return veils;
  }

  function duskVeilAt(xn,yn,veils,key,t){
    let shift=0,cover=0;
    for(const v of veils){
      const dx=(xn-v.x)/(v.w*.55),dy=(yn-v.y)/(v.h*1.15);
      const env=Math.exp(-(dx*dx*1.8+dy*dy*1.45))*v.gain;
      shift+=v.dir*Math.sin(dx*Math.PI+v.phase)*env*.014;
      cover=Math.max(cover,env);
    }
    if(key==='refocus'){
      const fade=.24+.76*(1-smooth01((t%24)/24));shift*=fade;cover*=fade;
    }
    return {shift,cover};
  }

  function drawDusk(ctx,w,h,c,st,t){
    const key=stateKey(st),bands=34+Math.floor(rnd(110)*6),horizon=.60+(.5-rnd(111))*.040;
    const sunCx=.55+rnd(160)*.13,sunW=.20+rnd(161)*.045,sunH=.115+rnd(162)*.025;
    const veils=buildDuskVeils(key,t,Math.floor(t/26));
    for(let j=0;j<bands;j++){
      const base=.15+j/(bands-1)*.72;
      const near=Math.exp(-Math.pow((base-horizon)/.18,2));
      const alpha=.11+rnd(140+j)*.145+near*.060;
      const width=.48+rnd(120+j)*1.22+near*.70;
      ctx.beginPath();let drawing=false;
      for(let i=0;i<=220;i++){
        const u=i/220;
        const dx=(u-sunCx)/sunW;
        const row=(base-horizon)/sunH;
        const inside=Math.abs(dx)<1.08 && Math.abs(row)<1.12;
        let yn=base + Math.sin(u*1.7+j*.021)*.0025;
        if(inside){
          const dome=Math.sqrt(Math.max(0,1-dx*dx));
          const rowWeight=Math.exp(-row*row*1.55);
          const upper=row<.18 ? 1 : .48;
          yn-=dome*sunH*.78*rowWeight*upper;
          if(row>.08) yn+=dome*sunH*.26*rowWeight;
        }
        const veil=duskVeilAt(u,yn,veils,key,t);
        let x=(u+veil.shift)*w;
        if(base>horizon-.01){
          const water=gaussian(u,sunCx,sunW*.80)*Math.sin(j*.78+t*.055)*(.0035+(base-horizon)*.014);
          x+=water*w*(key==='stable'?.55:key==='drift'?.85:key==='dispersed'?1.25:.75);
        }
        const y=yn*h;
        const hidden=veil.cover>(.54+(j%4)*.045);
        if(hidden){drawing=false;continue;}
        if(!drawing){ctx.moveTo(x,y);drawing=true}else ctx.lineTo(x,y);
      }
      stroke(ctx,c,alpha,width);
    }
  }

  function drawFieldV7(canvas,opt={}){
    if(!canvas)return;
    const {w,h}=size(canvas),ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);
    const theme=opt.theme||(typeof activeTheme!=='undefined'?activeTheme:'ocean');
    const st=opt.state||(typeof states!=='undefined'?states[0]:{key:'stable'});
    const t=opt.t||0,c=palettes[theme]||palettes.ocean;
    if(theme==='ocean')drawOcean(ctx,w,h,c,st,t);
    else if(theme==='mountain')drawMountain(ctx,w,h,c,st,t);
    else if(theme==='incense')drawIncense(ctx,w,h,c,st,t);
    else drawDusk(ctx,w,h,c,st,t);
  }

  function install(){
    window.drawField=drawFieldV7;
    document.querySelector('#beginLive')?.addEventListener('click',reseed,{capture:true});
    document.querySelector('#themeGroup')?.addEventListener('click',()=>requestAnimationFrame(()=>{
      if(typeof renderStatic==='function')renderStatic();
    }));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.FocusWaveVisualEngine={reseed,drawField:drawFieldV7,get seed(){return sessionSeed;}};
})();