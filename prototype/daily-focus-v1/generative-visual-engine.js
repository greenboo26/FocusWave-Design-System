/* FocusWave generative visual engine v3
 * One visual language: quiet, uniform fine lines.
 * Theme changes geometry. Attention state changes entropy, speed and coherence.
 * Refocus never changes axis; it reduces disorder inside the same field.
 */
(() => {
  let sessionSeed = Math.floor(Math.random() * 0x7fffffff);
  const palettes = {
    ocean:[103,145,163],
    mountain:[105,139,112],
    incense:[170,125,82],
    dusk:[190,132,108]
  };

  function reseed(){
    if (window.crypto?.getRandomValues) {
      const a=new Uint32Array(1); crypto.getRandomValues(a); sessionSeed=a[0];
    } else sessionSeed=Math.floor(Math.random()*0xffffffff);
  }
  function hash(n){n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/4294967295}
  function rnd(k){return hash((sessionSeed+Math.imul(k+1,2654435761))|0)}
  function eventRnd(epoch,k){return hash((sessionSeed^Math.imul(epoch+11,1597334677)^Math.imul(k+17,3812015801))|0)}
  function size(c){
    const d=Math.min(devicePixelRatio||1,2),r=c.getBoundingClientRect();
    const w=Math.max(10,Math.floor(r.width*d)),h=Math.max(10,Math.floor(r.height*d));
    if(c.width!==w||c.height!==h){c.width=w;c.height=h} return {w,h};
  }
  function stroke(ctx,c,a=.24){
    ctx.strokeStyle=`rgba(${c[0]},${c[1]},${c[2]},${a})`;
    ctx.lineWidth=1;
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.stroke();
  }
  function entropy(key){return key==='stable'?.16:key==='drift'?.42:key==='dispersed'?.82:.30}
  function smooth01(x){return x*x*(3-2*x)}

  function vortexOffset(x,y,cx,cy,strength,radius,sign=1){
    const dx=x-cx,dy=y-cy,d2=dx*dx+dy*dy,fall=Math.exp(-d2/(radius*radius));
    const inv=1/Math.max(12,Math.sqrt(d2));
    return {dx:-dy*inv*strength*fall*sign,dy:dx*inv*strength*fall*sign};
  }

  function drawOcean(ctx,w,h,c,st,t){
    const key=st?.key||'stable',e=entropy(key),lines=38;
    const epoch=Math.floor(t/20),centers=[];
    const count=key==='stable'?1:key==='drift'?2:key==='dispersed'?4:2;
    for(let k=0;k<count;k++) centers.push({
      x:w*(.18+eventRnd(epoch,k*5)*.68),
      y:h*(.20+eventRnd(epoch,k*5+1)*.60),
      r:Math.min(w,h)*(.08+eventRnd(epoch,k*5+2)*.08),
      s:(eventRnd(epoch,k*5+3)>.5?1:-1)*(6+eventRnd(epoch,k*5+4)*9)
    });
    for(let j=0;j<lines;j++){
      const y0=(j+.8)*h/(lines+1);ctx.beginPath();
      for(let i=0;i<=180;i++){
        const u=i/180,x=u*w;
        let y=y0+Math.sin(u*5.2+t*.035+j*.10)*h*.006+Math.sin(u*1.7+t*.018+j*.025)*h*.010;
        let xx=x;
        const refocusFade=key==='refocus'?(1-smooth01(u)) : 1;
        centers.forEach((v,k)=>{
          const o=vortexOffset(xx,y,v.x,v.y,v.s*e*refocusFade,v.r,k%2?1:-1);
          xx+=o.dx; y+=o.dy;
        });
        i?ctx.lineTo(xx,y):ctx.moveTo(xx,y);
      }
      stroke(ctx,c,.22);
    }
  }

  function drawMountain(ctx,w,h,c,st,t){
    const key=st?.key||'stable',e=entropy(key),lines=30;
    const epoch=Math.floor(t/24);
    const peaks=[
      {x:.28+eventRnd(epoch,1)*.12,a:.045+eventRnd(epoch,2)*.035,s:.11},
      {x:.62+eventRnd(epoch,3)*.12,a:.035+eventRnd(epoch,4)*.035,s:.15}
    ];
    if(key==='dispersed') peaks.push({x:.46+eventRnd(epoch,5)*.18,a:.05,s:.10});
    for(let j=0;j<lines;j++){
      const base=h*(.15+j/(lines-1)*.70),band=Math.sin(j/(lines-1)*Math.PI);ctx.beginPath();
      for(let i=0;i<=180;i++){
        const u=i/180,x=u*w;let lift=0;
        peaks.forEach((p,k)=>{lift-=Math.exp(-Math.pow((u-p.x)/p.s,2))*h*p.a*band*(.65+e*.55)*(k%2?.8:1)});
        const local=Math.sin(u*7+j*.22+t*.022)*h*.003*(.5+e);
        const fade=key==='refocus'?(1-.72*smooth01(u)):1;
        const y=base+(lift+local)*fade;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,.22);
    }
  }

  function drawIncense(ctx,w,h,c,st,t){
    const key=st?.key||'stable',e=entropy(key),lines=10;
    for(let j=0;j<lines;j++){
      const x0=w*(.20+j/(lines-1)*.62),phase=j*.74+rnd(j)*2;ctx.beginPath();
      for(let i=0;i<=170;i++){
        const u=i/170,y=h*(.88-u*.72);
        const heightFactor=Math.pow(u,1.35);
        const refocusFade=key==='refocus'?(1-.76*smooth01(j/(lines-1))):1;
        const sway=Math.sin(u*(4.5+j*.07)+t*.07+phase)*w*.010*e*heightFactor*refocusFade;
        const fine=Math.sin(u*10.5+t*.11+j)*w*.0035*e*heightFactor*refocusFade;
        const x=x0+sway+fine;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,.23);
    }
  }

  function drawDusk(ctx,w,h,c,st,t){
    const key=st?.key||'stable',e=entropy(key),lines=28;
    const horizon=.60;
    for(let j=0;j<lines;j++){
      const base=h*(.16+j/(lines-1)*.68),near=Math.exp(-Math.pow((base/h-horizon)/.20,2));ctx.beginPath();
      for(let i=0;i<=180;i++){
        const u=i/180,x=u*w;
        const broad=Math.sin(u*2.6+t*.018+j*.025)*h*.006;
        const sink=Math.exp(-Math.pow((u-.62)/.24,2))*h*.014*(base/h<horizon?-1:1)*(.4+e*.5);
        const fade=key==='refocus'?(1-.62*smooth01(u)):1;
        const y=base+(broad+sink)*fade;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,.20+near*.02);
    }
  }

  function drawFieldV3(canvas,opt={}){
    if(!canvas)return;
    const {w,h}=size(canvas),ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);
    const theme=opt.theme||(typeof activeTheme!=='undefined'?activeTheme:'ocean');
    const st=opt.state||(typeof states!=='undefined'?states[0]:{key:'stable'}),t=opt.t||0,c=palettes[theme]||palettes.ocean;
    if(theme==='ocean')drawOcean(ctx,w,h,c,st,t);
    else if(theme==='mountain')drawMountain(ctx,w,h,c,st,t);
    else if(theme==='incense')drawIncense(ctx,w,h,c,st,t);
    else drawDusk(ctx,w,h,c,st,t);
  }

  function install(){
    window.drawField=drawFieldV3;
    document.querySelector('#beginLive')?.addEventListener('click',reseed,{capture:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.FocusWaveVisualEngine={reseed,drawField:drawFieldV3,get seed(){return sessionSeed;}};
})();
