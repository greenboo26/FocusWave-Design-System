/* FocusWave generative visual engine v4
 * Shared visual language: calm, uniform fine lines.
 * Theme changes distribution + motion grammar, not line weight.
 * Attention state changes entropy/speed/coherence inside the chosen theme.
 */
(() => {
  let sessionSeed = Math.floor(Math.random() * 0x7fffffff);

  const palettes = {
    ocean:    [92, 136, 158],
    mountain: [93, 127, 101],
    incense:  [164, 112, 69],
    dusk:     [186, 121, 96]
  };
  const alphaByTheme = { ocean:.31, mountain:.30, incense:.33, dusk:.29 };

  function reseed(){
    if (window.crypto?.getRandomValues) {
      const a = new Uint32Array(1); crypto.getRandomValues(a); sessionSeed = a[0];
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
  function stroke(ctx,c,a){
    ctx.strokeStyle=`rgba(${c[0]},${c[1]},${c[2]},${a})`;
    ctx.lineWidth=1.35;
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.stroke();
  }
  function stateKey(st){ return st?.key || 'stable'; }
  function entropy(key){ return key==='stable'?.10:key==='drift'?.34:key==='dispersed'?.72:.20; }
  function amplitude(key){ return key==='stable'?.68:key==='drift'?.88:key==='dispersed'?1.12:.76; }
  function smooth01(x){ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); }
  function gaussian(x,m,s){ return Math.exp(-Math.pow((x-m)/s,2)); }

  function advectEddy(x,y,cx,cy,radius,strength,sign){
    const dx=x-cx,dy=y-cy,d2=dx*dx+dy*dy,rr=Math.max(16,Math.sqrt(d2));
    const fall=Math.exp(-d2/(radius*radius));
    const turn=strength*fall/rr;
    return {dx:-dy*turn*sign,dy:dx*turn*sign};
  }

  function drawOcean(ctx,w,h,c,st,t){
    const key=stateKey(st),e=entropy(key),amp=amplitude(key),lines=42;
    const epoch=Math.floor(t/18);
    const eddyCount=key==='stable'?1:key==='drift'?2:key==='dispersed'?3:2;
    const eddies=[];
    for(let k=0;k<eddyCount;k++){
      eddies.push({
        x:w*(.20+eventRnd(epoch,k*7)*.62),
        y:h*(.20+eventRnd(epoch,k*7+1)*.60),
        r:Math.min(w,h)*(.10+eventRnd(epoch,k*7+2)*.075),
        s:(8+eventRnd(epoch,k*7+3)*14)*(key==='stable'?.25:key==='refocus'?.48:1),
        sign:eventRnd(epoch,k*7+4)>.5?1:-1
      });
    }
    for(let j=0;j<lines;j++){
      const y0=(j+.7)*h/(lines+1);
      ctx.beginPath();
      for(let i=0;i<=190;i++){
        const u=i/190,x0=u*w;
        let x=x0;
        let y=y0
          + Math.sin(u*4.6+t*.030+j*.072)*h*.0065*amp
          + Math.sin(u*1.55+t*.016+j*.018)*h*.012*amp;
        const recovery = key==='refocus' ? (.35 + .65*(1-smooth01(u))) : 1;
        for(let k=0;k<eddies.length;k++){
          const ed=eddies[k];
          const o=advectEddy(x,y,ed.x,ed.y,ed.r,ed.s*e*recovery,ed.sign);
          x+=o.dx; y+=o.dy;
        }
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,alphaByTheme.ocean);
    }
  }

  function drawMountain(ctx,w,h,c,st,t){
    const key=stateKey(st),e=entropy(key),amp=amplitude(key),epoch=Math.floor(t/26);
    const groups=3,linesPerGroup=9;
    const centers=[.25,.50,.74];
    for(let g=0;g<groups;g++){
      const baseY=h*(centers[g] + (eventRnd(epoch,20+g)-.5)*.025);
      const p1=.22+eventRnd(epoch,40+g*4)*.18;
      const p2=.58+eventRnd(epoch,41+g*4)*.22;
      const p3=.82+eventRnd(epoch,42+g*4)*.08;
      const signed=g===1?-1:1;
      for(let j=0;j<linesPerGroup;j++){
        const offset=(j-(linesPerGroup-1)/2)*h*.0125;
        ctx.beginPath();
        for(let i=0;i<=180;i++){
          const u=i/180,x=u*w;
          const ridge1=gaussian(u,p1,.11+g*.012)*h*(.030+.010*g);
          const ridge2=gaussian(u,p2,.15)*h*(.045-.006*g);
          const ridge3=gaussian(u,p3,.085)*h*.018;
          let profile=(-ridge1-ridge2*.82+ridge3*.42*signed)*amp;
          const contourScale=1-(Math.abs(j-(linesPerGroup-1)/2)/(linesPerGroup))*0.22;
          profile*=contourScale;
          const drift=Math.sin(u*6.2+t*.012+j*.13+g)*h*.0022;
          const split=(key==='dispersed'?Math.sin(u*15.5+j*.52+t*.08)*h*.0048*e:Math.sin(u*10+j*.37)*h*.0016*e);
          const recover=key==='refocus' ? (.45+.55*smooth01(u)) : 1;
          const y=baseY+offset+(profile+drift+split)*recover;
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }
        stroke(ctx,c,alphaByTheme.mountain);
      }
    }
  }

  function drawIncense(ctx,w,h,c,st,t){
    const key=stateKey(st),e=entropy(key),amp=amplitude(key),lines=12;
    const epoch=Math.floor(t/24);
    for(let j=0;j<lines;j++){
      const x0=w*(.18+j/(lines-1)*.66)+(eventRnd(epoch,90+j)-.5)*w*.018;
      const phase=j*.71+rnd(140+j)*2.4;
      ctx.beginPath();
      for(let i=0;i<=175;i++){
        const u=i/175,y=h*(.88-u*.74),upper=Math.pow(u,1.55);
        const recovery=key==='refocus' ? (.28+.72*(1-smooth01(u))) : 1;
        const sway=Math.sin(u*(4.1+rnd(j)*1.2)+t*.065+phase)*w*.011*upper*e*amp*recovery;
        const curl=Math.sin(u*10.2+t*.10+j*.86)*w*.0042*upper*e*recovery;
        const x=x0+sway+curl;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,alphaByTheme.incense);
    }
  }

  function drawDusk(ctx,w,h,c,st,t){
    const key=stateKey(st),e=entropy(key),amp=amplitude(key),epoch=Math.floor(t/28);
    const bands=[
      {cy:.26,count:6,span:[.10,.94],curve:-1},
      {cy:.49,count:7,span:[.05,.88],curve:1},
      {cy:.70,count:6,span:[.16,.98],curve:-1}
    ];
    bands.forEach((band,b)=>{
      const center=.46+(eventRnd(epoch,70+b)-.5)*.18;
      for(let j=0;j<band.count;j++){
        const y0=h*(band.cy+(j-(band.count-1)/2)*.017);
        const start=band.span[0]+(j%2)*.012,end=band.span[1]-(j%3)*.010;
        ctx.beginPath();
        for(let i=0;i<=150;i++){
          const q=i/150,u=start+(end-start)*q,x=u*w;
          const arc=gaussian(u,center,.23)*h*.020*band.curve*amp;
          const settle=Math.sin((u-start)/(end-start)*Math.PI*1.4+t*.012+j*.09+b)*h*.0035;
          const drift=Math.sin(u*8.5+j*.55+t*.045)*h*.0038*e;
          const recover=key==='refocus' ? (.40+.60*smooth01(q)) : 1;
          const y=y0+(arc+settle+drift)*recover;
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }
        stroke(ctx,c,alphaByTheme.dusk);
      }
    });
  }

  function drawFieldV4(canvas,opt={}){
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
    window.drawField=drawFieldV4;
    document.querySelector('#beginLive')?.addEventListener('click',reseed,{capture:true});
    document.querySelector('#themeGroup')?.addEventListener('click',()=>requestAnimationFrame(()=>{
      if(typeof renderStatic==='function')renderStatic();
    }));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.FocusWaveVisualEngine={reseed,drawField:drawFieldV4,get seed(){return sessionSeed;}};
})();
