/* FocusWave practice signature visuals v2
 * Return-to-breath and breath-anchor remain the reference language.
 * Other practices use distinct, low-saturation generative signatures.
 */
(() => {
  const signatures = {
    arrival: {label:'到场', color:[120,140,148]},
    return: {label:'回到呼吸', color:[105,145,163]},
    breath: {label:'呼吸锚定', color:[116,145,124]},
    body: {label:'呼吸 + 身体', color:[171,135,100]},
    accept: {label:'接纳式回收', color:[143,129,154]},
    work: {label:'专注工作块', color:[96,122,111]}
  };

  let activePractice = 'breath';
  let overlayRAF = 0;
  const previewCanvases = new Map();
  let sessionSeed = Math.floor(Math.random()*1e9);

  function hash(n){n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/4294967295}
  function rnd(k){return hash((sessionSeed+Math.imul(k+1,2654435761))|0)}
  function reseed(){sessionSeed=Math.floor(Math.random()*0x7fffffff)}
  function size(canvas){
    const d=Math.min(window.devicePixelRatio||1,2),r=canvas.getBoundingClientRect();
    const w=Math.max(10,Math.floor(r.width*d)),h=Math.max(10,Math.floor(r.height*d));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
    return {w,h,d};
  }
  function stroke(ctx,color,a,width=1){ctx.strokeStyle=`rgba(${color[0]},${color[1]},${color[2]},${a})`;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke()}

  function drawArrival(ctx,w,h,c,t){
    // Loose peripheral strands settle toward a quiet center.
    const cx=w*.53,cy=h*.5;
    for(let j=0;j<9;j++){
      const fromLeft=j%2===0, y0=h*(.14+j*.09), spread=(j-4)*h*.018;
      ctx.beginPath();
      for(let i=0;i<=90;i++){
        const u=i/90, ease=1-Math.pow(1-u,2.4);
        const x=fromLeft?u*w:(1-u)*w;
        const targetY=cy+spread*.35;
        const y=y0*(1-ease)+targetY*ease+Math.sin(u*5+t*.12+j)*h*.012*(1-ease);
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,.12+j*.018,.65+(j%4===0?.8:0)+rnd(j)*.5);
    }
    for(let r=0;r<3;r++){
      ctx.beginPath();
      const rr=(18+r*16)*(1+.03*Math.sin(t*.15+r));
      for(let i=0;i<=80;i++){
        const a=i/80*Math.PI*2,x=cx+Math.cos(a)*rr*1.45,y=cy+Math.sin(a)*rr*.55;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,.10+r*.035,.7+r*.25);
    }
  }

  function drawReturn(ctx,w,h,c,t){
    // Reference design: quiet horizontal breathing field.
    for(let j=0;j<8;j++){
      const y=h*(.2+j*.078);
      ctx.beginPath();
      for(let i=0;i<=100;i++){
        const x=i/100*w, xn=x/w;
        const envelope=Math.exp(-Math.pow((xn-.5)/.3,2));
        const py=y+Math.sin(xn*Math.PI*2+t*.22+j*.15)*h*.022*envelope;
        i?ctx.lineTo(x,py):ctx.moveTo(x,py);
      }
      stroke(ctx,c,.22+j*.023,.8+(j%3===0?.45:0));
    }
  }

  function drawBreath(ctx,w,h,c,t){
    // Reference design: breathing nested ellipses.
    const cx=w*.5,cy=h*.5;
    for(let j=0;j<7;j++){
      const base=Math.min(w,h)*(.12+j*.055);
      const breathe=1+Math.sin(t*.18+j*.18)*.035;
      ctx.beginPath();
      for(let i=0;i<=120;i++){
        const a=i/120*Math.PI*2;
        const r=base*breathe*(1+Math.sin(a*3+t*.08)*.012);
        const x=cx+Math.cos(a)*r*1.45,y=cy+Math.sin(a)*r*.72;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,.16+j*.027,.72+(j%2===0?.48:0));
    }
  }

  function drawBody(ctx,w,h,c,t){
    // Body-awareness: several soft contact basins, linked by grounded curves.
    const points=[
      [w*.28,h*.32],[w*.55,h*.43],[w*.72,h*.66]
    ];
    points.forEach((p,k)=>{
      for(let r=0;r<3;r++){
        ctx.beginPath();
        const rx=(22+r*15)*(1+.025*Math.sin(t*.11+k)),ry=rx*.42;
        for(let i=0;i<=90;i++){
          const a=i/90*Math.PI*2;
          const x=p[0]+Math.cos(a)*rx*(1+.04*Math.sin(a*3+k));
          const y=p[1]+Math.sin(a)*ry;
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }
        stroke(ctx,c,.10+r*.045,.7+r*.28);
      }
    });
    for(let j=0;j<5;j++){
      ctx.beginPath();
      for(let i=0;i<=100;i++){
        const u=i/100,x=w*(.14+.72*u);
        const y=h*(.78-j*.055)+Math.sin(u*3.4+t*.08+j)*h*.009;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,.15+j*.025,.75+(j===2?.8:0));
    }
  }

  function drawAccept(ctx,w,h,c,t){
    // Acceptance: lines are allowed to open, then gently rejoin without snapping shut.
    for(let j=0;j<8;j++){
      const y0=h*(.17+j*.09), splitSign=j%2?1:-1;
      ctx.beginPath();
      for(let i=0;i<=120;i++){
        const u=i/120,x=u*w;
        const open=Math.sin(Math.PI*Math.min(1,u/.58))*Math.max(0,1-(u-.48)*1.9);
        const returnEase=Math.max(0,(u-.55)/.45);
        const y=y0+splitSign*open*h*(.018+.006*j)*(1-returnEase)+Math.sin(u*4+t*.12+j)*h*.005;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,.16+j*.022,.7+rnd(30+j)*1.25);
    }
    // A single slow returning arc appears in changing phase.
    const phase=(Math.sin(t*.09)+1)/2;
    ctx.beginPath();
    for(let i=0;i<=90;i++){
      const a=Math.PI*.15+i/90*Math.PI*.7;
      const x=w*(.63+Math.cos(a)*(.16+.05*phase)),y=h*(.52+Math.sin(a)*(.18-.04*phase));
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    stroke(ctx,c,.20,.95);
  }

  function drawWork(ctx,w,h,c,t){
    // Deep work: a small number of directional streams with varied weight.
    for(let j=0;j<6;j++){
      const y0=h*(.22+j*.105);
      ctx.beginPath();
      for(let i=0;i<=120;i++){
        const u=i/120,x=w*(.06+.88*u);
        const drift=Math.sin(u*(2.2+j*.12)+t*.07+j)*h*.008;
        const lane=Math.exp(-Math.pow((u-(.52+rnd(j)*.16))/(.18+rnd(10+j)*.06),2))*h*.008*(j%2?1:-1);
        const y=y0+drift+lane;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,.16+j*.03,.75+(j===2||j===3?1.35:0));
    }
    // One faint forward arc gives a sense of sustained direction.
    ctx.beginPath();
    ctx.moveTo(w*.18,h*.78);
    ctx.bezierCurveTo(w*.38,h*.72,w*.63,h*.76,w*.86,h*.68);
    stroke(ctx,c,.18,1.25);
  }

  function drawSignature(canvas,key,t=0){
    if(!canvas)return;
    const {w,h}=size(canvas),ctx=canvas.getContext('2d'),sig=signatures[key]||signatures.breath;
    ctx.clearRect(0,0,w,h);
    if(key==='arrival')drawArrival(ctx,w,h,sig.color,t);
    else if(key==='return')drawReturn(ctx,w,h,sig.color,t);
    else if(key==='breath')drawBreath(ctx,w,h,sig.color,t);
    else if(key==='body')drawBody(ctx,w,h,sig.color,t);
    else if(key==='accept')drawAccept(ctx,w,h,sig.color,t);
    else drawWork(ctx,w,h,sig.color,t);
  }

  function installListVisuals(){
    document.querySelectorAll('.practice-card').forEach(card=>{
      const start=card.querySelector('.practice-start');
      const key=start?.dataset.practice || (card.querySelector('#practiceToSetup')?'work':null);
      if(!key)return;
      const slot=card.querySelector('.type');
      if(!slot)return;
      slot.textContent='';
      const canvas=document.createElement('canvas');
      canvas.className='practice-signature';
      canvas.setAttribute('aria-label',`${signatures[key].label} 动态线条`);
      slot.appendChild(canvas);
      previewCanvases.set(canvas,key);
      card.dataset.practiceTone=key;
    });

    const start=performance.now();
    const loop=now=>{
      const t=(now-start)/1000;
      previewCanvases.forEach((key,canvas)=>drawSignature(canvas,key,t));
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function bindPracticeSelection(){
    document.querySelectorAll('.practice-start').forEach(button=>{
      button.addEventListener('click',()=>{activePractice=button.dataset.practice||'breath';reseed();},{capture:true});
    });
  }

  function animateOverlay(){
    cancelAnimationFrame(overlayRAF);
    const canvas=document.querySelector('#practiceCanvas');
    const overlay=document.querySelector('#practiceOverlay');
    const eyebrow=document.querySelector('#practiceType');
    if(eyebrow){eyebrow.classList.add('practice-overlay-accent');eyebrow.dataset.practiceTone=activePractice;}
    const start=performance.now();
    const loop=now=>{
      if(!overlay?.classList.contains('open'))return;
      drawSignature(canvas,activePractice,(now-start)/1000);
      overlayRAF=requestAnimationFrame(loop);
    };
    overlayRAF=requestAnimationFrame(loop);
  }

  function replacePracticeAnimator(){
    if(typeof window.animatePractice==='function')window.animatePractice=animateOverlay;
  }

  function init(){installListVisuals();bindPracticeSelection();replacePracticeAnimator();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
