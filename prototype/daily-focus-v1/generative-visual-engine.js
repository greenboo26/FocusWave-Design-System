/* FocusWave generative visual engine v2
 * Theme = composition grammar.
 * Attention state = motion/order intensity.
 * Session seed + slow event epochs = non-repeating local variation.
 */
(() => {
  let sessionSeed = Math.floor(Math.random() * 0x7fffffff);
  let lastPage = '';

  const palettes = {
    ocean:[93,139,160], mountain:[98,132,104], incense:[164,116,75], dusk:[181,119,102]
  };

  function reseed(){
    if (crypto?.getRandomValues) {
      const a = new Uint32Array(1); crypto.getRandomValues(a); sessionSeed = a[0];
    } else sessionSeed = Math.floor(Math.random()*0xffffffff);
  }

  function hash(n){
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }
  function rnd(k){ return hash((sessionSeed + Math.imul(k+1, 2654435761))|0); }
  function eventRnd(epoch,k){ return hash((sessionSeed ^ Math.imul(epoch+11,1597334677) ^ Math.imul(k+17,3812015801))|0); }
  function size(c){
    const d=Math.min(devicePixelRatio||1,2), r=c.getBoundingClientRect();
    const w=Math.max(10,Math.floor(r.width*d)), h=Math.max(10,Math.floor(r.height*d));
    if(c.width!==w||c.height!==h){c.width=w;c.height=h} return {w,h};
  }
  function rgba(c,a){ return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
  function stateScale(st){
    const key=st?.key||'stable';
    return key==='stable'?.45:key==='drift'?.72:key==='dispersed'?1.12:.62;
  }
  function grammar(st,x,y,w,h,t,j,seed){
    return window.FocusWaveIdiomGrammar?.offset(st?.key||'stable',x,y,w,h,t,j,seed)||{dx:0,dy:0};
  }
  function strokePath(ctx,c,a,width){ctx.strokeStyle=rgba(c,a);ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}

  function drawOcean(ctx,w,h,c,st,t){
    const s=stateScale(st), lines=34 + Math.floor(rnd(2)*15), epoch=Math.floor(t/18), phase=(t%18)/18;
    const eFade=Math.sin(Math.PI*phase);
    for(let j=0;j<lines;j++){
      const y0=(j+.7)*h/(lines+1);
      const width=.55+rnd(100+j)*1.45 + (j%9===0?.8:0);
      const alpha=.12+rnd(200+j)*.18;
      ctx.beginPath();
      for(let i=0;i<=150;i++){
        const x=i/150*w, xn=x/w;
        const swell=Math.sin(xn*(4.2+rnd(4)*2)+t*.055+j*.075)*h*.010*s;
        const long=Math.sin(xn*1.5+t*.025+j*.021)*h*.020*s;
        let y=y0+swell+long;
        const g=grammar(st,x,y,w,h,t,j,4); y+=g.dy*.65;
        i?ctx.lineTo(x+g.dx*.5,y):ctx.moveTo(x+g.dx*.5,y);
      }
      strokePath(ctx,c,alpha,width);
    }
    // slow local water events: irregular rings + eddy arcs
    const n=st?.key==='dispersed'?4:st?.key==='drift'?3:2;
    for(let k=0;k<n;k++){
      const cx=w*(.18+eventRnd(epoch,k*7)*.68), cy=h*(.18+eventRnd(epoch,k*7+1)*.64);
      const r=Math.min(w,h)*(.035+eventRnd(epoch,k*7+2)*.08)*eFade;
      ctx.beginPath();
      for(let i=0;i<=80;i++){
        const a=i/80*Math.PI*2, wob=1+Math.sin(a*3+eventRnd(epoch,k)*5)*.08;
        const x=cx+Math.cos(a)*r*wob*1.6, y=cy+Math.sin(a)*r*wob*.72;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      strokePath(ctx,c,.12+.16*eFade,.7+eventRnd(epoch,k+40)*1.2);
    }
  }

  function drawMountain(ctx,w,h,c,st,t){
    const s=stateScale(st), bands=15+Math.floor(rnd(12)*10), epoch=Math.floor(t/22), eFade=Math.sin(Math.PI*((t%22)/22));
    for(let j=0;j<bands;j++){
      const y0=h*(.18+j/(bands-1)*.66), offset=j/(bands-1);
      const p1=.24+rnd(20)*.18, p2=.62+rnd(21)*.18;
      const a1=.075+rnd(30)*.07, a2=.045+rnd(31)*.06;
      ctx.beginPath(); let drawing=false;
      for(let i=0;i<=170;i++){
        const x=i/170*w,xn=x/w;
        const ridge=-(Math.exp(-Math.pow((xn-p1)/(.10+rnd(32)*.06),2))*a1 + Math.exp(-Math.pow((xn-p2)/(.13+rnd(33)*.08),2))*a2)*h*(.55+.45*Math.sin(offset*Math.PI));
        let y=y0+ridge*s+Math.sin(xn*8+j*.32+t*.035)*h*.003*s;
        const g=grammar(st,x,y,w,h,t,j,8); y+=g.dy*.45;
        // contour gaps are part of the mountain language
        const gap=(Math.sin(xn*21+j*1.7+eventRnd(epoch,j)*5)>.91 && j%3!==0);
        if(gap){drawing=false;continue}
        if(!drawing){ctx.moveTo(x+g.dx*.35,y);drawing=true}else ctx.lineTo(x+g.dx*.35,y);
      }
      strokePath(ctx,c,.16+rnd(300+j)*.18,.65+rnd(350+j)*1.9+(j%6===0?.65:0));
    }
    // sparse nested contour islands
    if(eFade>.08){
      const cx=w*(.3+eventRnd(epoch,2)*.42),cy=h*(.36+eventRnd(epoch,3)*.28);
      for(let r=0;r<3;r++){
        ctx.beginPath();
        for(let i=0;i<=80;i++){
          const a=i/80*Math.PI*2, rr=(22+r*16)*eFade*(.8+eventRnd(epoch,r+9)*.5);
          const x=cx+Math.cos(a)*rr*1.55, y=cy+Math.sin(a)*rr*.55*(1+.12*Math.sin(a*4));
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }
        strokePath(ctx,c,.08+.09*eFade,.7+r*.35);
      }
    }
  }

  function drawIncense(ctx,w,h,c,st,t){
    const s=stateScale(st), strands=6+Math.floor(rnd(50)*5), epoch=Math.floor(t/20), eFade=Math.sin(Math.PI*((t%20)/20));
    for(let j=0;j<strands;j++){
      const x0=w*(.18+j/(strands-1)*.64)+(rnd(60+j)-.5)*w*.035;
      ctx.beginPath();
      for(let i=0;i<=140;i++){
        const yn=i/140, y=h*(.9-yn*.78), upper=Math.pow(yn,1.6);
        const curl1=Math.sin(yn*(5.5+rnd(70+j)*4)+t*.09+j)*w*.014*upper*s;
        const curl2=Math.sin(yn*13+t*.16+j*.7)*w*.009*upper*s;
        const drift=(rnd(80+j)-.5)*w*.055*yn;
        let x=x0+curl1+curl2+drift;
        const g=grammar(st,x,y,w,h,t,j,12); x+=g.dx*.45;
        i?ctx.lineTo(x,y+g.dy*.25):ctx.moveTo(x,y+g.dy*.25);
      }
      strokePath(ctx,c,.17+rnd(90+j)*.2,.65+rnd(100+j)*2.25);
    }
    // ephemeral smoke loop, never fixed in place
    const cx=w*(.3+eventRnd(epoch,1)*.4),cy=h*(.22+eventRnd(epoch,2)*.3),rr=Math.min(w,h)*(.04+.05*eventRnd(epoch,3))*eFade;
    ctx.beginPath();
    for(let i=0;i<=70;i++){
      const a=i/70*Math.PI*1.75, x=cx+Math.cos(a)*rr*(1.1+.25*Math.sin(a*2)), y=cy+Math.sin(a)*rr*.8-a*rr*.10;
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    strokePath(ctx,c,.18*eFade,.8+eventRnd(epoch,4)*1.4);
  }

  function drawDusk(ctx,w,h,c,st,t){
    const s=stateScale(st), bands=20+Math.floor(rnd(110)*10), horizon=.60+(.5-rnd(111))*.08;
    for(let j=0;j<bands;j++){
      const y0=h*(.17+j/(bands-1)*.68), near=Math.exp(-Math.pow((y0/h-horizon)/.15,2));
      const width=.45+rnd(120+j)*1.7+near*1.25;
      ctx.beginPath();
      for(let i=0;i<=150;i++){
        const x=i/150*w,xn=x/w;
        const arc=Math.exp(-Math.pow((xn-(.58+rnd(130)*.15))/(.22+rnd(131)*.12),2))*h*.024*(y0/h<horizon?-1:1);
        let y=y0+arc*s+Math.sin(xn*3.1+t*.025+j*.035)*h*.004*s;
        const g=grammar(st,x,y,w,h,t,j,16); y+=g.dy*.38;
        i?ctx.lineTo(x+g.dx*.28,y):ctx.moveTo(x+g.dx*.28,y);
      }
      strokePath(ctx,c,.10+rnd(140+j)*.18+near*.10,width);
    }
    // one soft horizon arc; position varies per session
    const cx=w*(.45+rnd(160)*.22),cy=h*horizon,rx=w*(.12+rnd(161)*.08),ry=h*(.045+rnd(162)*.035);
    ctx.beginPath();
    for(let i=0;i<=80;i++){
      const a=Math.PI+i/80*Math.PI, x=cx+Math.cos(a)*rx,y=cy+Math.sin(a)*ry;
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    strokePath(ctx,c,.16,.8+rnd(163)*1.2);
  }

  function drawFieldV2(canvas,opt={}){
    if(!canvas)return;
    const {w,h}=size(canvas),ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);
    const theme=opt.theme || (typeof activeTheme!=='undefined'?activeTheme:'ocean');
    const st=opt.state || (typeof states!=='undefined'?states[0]:{key:'stable'}), t=opt.t||0, c=palettes[theme]||palettes.ocean;
    if(theme==='ocean')drawOcean(ctx,w,h,c,st,t);
    else if(theme==='mountain')drawMountain(ctx,w,h,c,st,t);
    else if(theme==='incense')drawIncense(ctx,w,h,c,st,t);
    else drawDusk(ctx,w,h,c,st,t);
  }

  function install(){
    // Replace the original global renderer used by live/static/practice callers.
    window.drawField = drawFieldV2;
    const begin=document.querySelector('#beginLive');
    begin?.addEventListener('click',()=>reseed(),{capture:true});
    document.querySelector('#themeGroup')?.addEventListener('click',()=>{ if(typeof renderStatic==='function') requestAnimationFrame(renderStatic); });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.FocusWaveVisualEngine={reseed,drawField:drawFieldV2,get seed(){return sessionSeed;}};
})();
