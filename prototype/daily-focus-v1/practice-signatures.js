/* FocusWave practice signature visuals v3
 * Uniform thin lines, restrained motion, distinct but related geometries.
 */
(() => {
  const signatures={
    arrival:{label:'到场',color:[120,140,148]},return:{label:'回到呼吸',color:[105,145,163]},
    breath:{label:'呼吸锚定',color:[116,145,124]},body:{label:'呼吸 + 身体',color:[171,135,100]},
    accept:{label:'接纳式回收',color:[143,129,154]},work:{label:'专注工作块',color:[96,122,111]}
  };
  let activePractice='breath',overlayRAF=0,sessionSeed=Math.floor(Math.random()*1e9);
  const previewCanvases=new Map();
  function size(canvas){const d=Math.min(devicePixelRatio||1,2),r=canvas.getBoundingClientRect(),w=Math.max(10,Math.floor(r.width*d)),h=Math.max(10,Math.floor(r.height*d));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}return{w,h}}
  function stroke(ctx,c,a=.23){ctx.strokeStyle=`rgba(${c[0]},${c[1]},${c[2]},${a})`;ctx.lineWidth=1;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke()}
  function reseed(){sessionSeed=Math.floor(Math.random()*0x7fffffff)}

  function drawArrival(ctx,w,h,c,t){
    for(let j=0;j<8;j++){
      const y0=h*(.18+j*.085);ctx.beginPath();
      for(let i=0;i<=120;i++){
        const u=i/120,x=u*w,settle=Math.pow(u,1.7);
        const y=y0+Math.sin(u*4+t*.08+j*.55)*h*.014*(1-settle)+((j-3.5)*h*.006)*settle;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,.21);
    }
  }
  function drawReturn(ctx,w,h,c,t){
    for(let j=0;j<8;j++){
      const y0=h*(.2+j*.078);ctx.beginPath();
      for(let i=0;i<=120;i++){
        const u=i/120,x=u*w,en=Math.exp(-Math.pow((u-.5)/.30,2));
        const y=y0+Math.sin(u*Math.PI*2+t*.18+j*.14)*h*.020*en;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,.23);
    }
  }
  function drawBreath(ctx,w,h,c,t){
    const cx=w*.5,cy=h*.5;
    for(let j=0;j<7;j++){
      const base=Math.min(w,h)*(.12+j*.055),breathe=1+Math.sin(t*.16+j*.16)*.03;ctx.beginPath();
      for(let i=0;i<=120;i++){
        const a=i/120*Math.PI*2,r=base*breathe*(1+Math.sin(a*3+t*.06)*.010);
        const x=cx+Math.cos(a)*r*1.45,y=cy+Math.sin(a)*r*.72;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,.21);
    }
  }
  function drawBody(ctx,w,h,c,t){
    // Abstract vertical body field: quiet upright strands, lightly grounded at the bottom.
    for(let j=0;j<9;j++){
      const x0=w*(.18+j/8*.64),phase=j*.62;ctx.beginPath();
      for(let i=0;i<=130;i++){
        const u=i/130,y=h*(.14+u*.70),ground=Math.pow(u,1.8);
        const x=x0+Math.sin(u*4.2+t*.09+phase)*w*.010*(1-ground*.45);
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,.22);
    }
  }
  function drawAccept(ctx,w,h,c,t){
    for(let j=0;j<8;j++){
      const y0=h*(.18+j*.085),sign=j%2?1:-1;ctx.beginPath();
      for(let i=0;i<=130;i++){
        const u=i/130,x=u*w;
        const open=Math.sin(Math.PI*Math.min(1,u/.62))*Math.max(0,1-(u-.48)*1.8);
        const returnEase=Math.max(0,(u-.55)/.45);
        const y=y0+sign*open*h*.018*(1-returnEase)+Math.sin(u*4+t*.10+j)*h*.004;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,.22);
    }
  }
  function drawWork(ctx,w,h,c,t){
    for(let j=0;j<7;j++){
      const y0=h*(.20+j*.095);ctx.beginPath();
      for(let i=0;i<=130;i++){
        const u=i/130,x=w*(.05+.90*u),y=y0+Math.sin(u*2.4+t*.055+j*.7)*h*.007;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      stroke(ctx,c,.22);
    }
  }

  function drawSignature(canvas,key,t=0){if(!canvas)return;const{w,h}=size(canvas),ctx=canvas.getContext('2d'),sig=signatures[key]||signatures.breath;ctx.clearRect(0,0,w,h);({arrival:drawArrival,return:drawReturn,breath:drawBreath,body:drawBody,accept:drawAccept,work:drawWork}[key]||drawBreath)(ctx,w,h,sig.color,t)}
  function installListVisuals(){
    document.querySelectorAll('.practice-card').forEach(card=>{
      const start=card.querySelector('.practice-start'),key=start?.dataset.practice||(card.querySelector('#practiceToSetup')?'work':null),slot=card.querySelector('.type');if(!key||!slot)return;
      slot.textContent='';const canvas=document.createElement('canvas');canvas.className='practice-signature';canvas.setAttribute('aria-label',`${signatures[key].label} 动态线条`);slot.appendChild(canvas);previewCanvases.set(canvas,key);card.dataset.practiceTone=key;
    });
    const start=performance.now();const loop=now=>{const t=(now-start)/1000;previewCanvases.forEach((key,canvas)=>drawSignature(canvas,key,t));requestAnimationFrame(loop)};requestAnimationFrame(loop);
  }
  function bindPracticeSelection(){document.querySelectorAll('.practice-start').forEach(button=>button.addEventListener('click',()=>{activePractice=button.dataset.practice||'breath';reseed()},{capture:true}))}
  function animateOverlay(){cancelAnimationFrame(overlayRAF);const canvas=document.querySelector('#practiceCanvas'),overlay=document.querySelector('#practiceOverlay'),eyebrow=document.querySelector('#practiceType');if(eyebrow){eyebrow.classList.add('practice-overlay-accent');eyebrow.dataset.practiceTone=activePractice}const start=performance.now();const loop=now=>{if(!overlay?.classList.contains('open'))return;drawSignature(canvas,activePractice,(now-start)/1000);overlayRAF=requestAnimationFrame(loop)};overlayRAF=requestAnimationFrame(loop)}
  function replacePracticeAnimator(){if(typeof window.animatePractice==='function')window.animatePractice=animateOverlay}
  function init(){installListVisuals();bindPracticeSelection();replacePracticeAnimator()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
