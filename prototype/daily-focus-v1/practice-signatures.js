/* FocusWave practice signature visuals
 * Each practice owns one low-saturation palette and one motion grammar.
 * The list preview and the active practice reuse the same signature.
 */
(() => {
  const signatures = {
    arrival: {label:'到场', color:[124,145,151]},
    return: {label:'回到呼吸', color:[105,145,163]},
    breath: {label:'呼吸锚定', color:[116,145,124]},
    body: {label:'呼吸 + 身体', color:[171,135,100]},
    accept: {label:'接纳式回收', color:[143,129,154]},
    work: {label:'专注工作块', color:[96,122,111]}
  };

  let activePractice = 'breath';
  let overlayRAF = 0;
  const previewCanvases = new Map();

  function size(canvas){
    const d=Math.min(window.devicePixelRatio||1,2),r=canvas.getBoundingClientRect();
    const w=Math.max(10,Math.floor(r.width*d)),h=Math.max(10,Math.floor(r.height*d));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
    return {w,h,d};
  }

  function stroke(ctx,color,a,width=1){
    ctx.strokeStyle=`rgba(${color[0]},${color[1]},${color[2]},${a})`;
    ctx.lineWidth=width;
    ctx.stroke();
  }

  function drawArrival(ctx,w,h,c,t){
    for(let j=0;j<7;j++){
      const y=h*(.24+j*.085), phase=t*.12+j*.3;
      ctx.beginPath();
      for(let i=0;i<=90;i++){
        const x=i/90*w;
        const center=Math.exp(-Math.pow((x/w-.52)/.22,2));
        const py=y+Math.sin(x/w*4+phase)*h*.018*(1-center)+center*h*.012*Math.sin(phase*.7);
        i?ctx.lineTo(x,py):ctx.moveTo(x,py);
      }
      stroke(ctx,c,.24+j*.025,1.05);
    }
  }

  function drawReturn(ctx,w,h,c,t){
    for(let j=0;j<8;j++){
      const y=h*(.2+j*.078);
      ctx.beginPath();
      for(let i=0;i<=100;i++){
        const x=i/100*w, xn=x/w;
        const envelope=Math.exp(-Math.pow((xn-.5)/.3,2));
        const py=y+Math.sin(xn*Math.PI*2+t*.22+j*.15)*h*.022*envelope;
        i?ctx.lineTo(x,py):ctx.moveTo(x,py);
      }
      stroke(ctx,c,.22+j*.023,1.08);
    }
  }

  function drawBreath(ctx,w,h,c,t){
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
      stroke(ctx,c,.16+j*.027,1.02);
    }
  }

  function drawBody(ctx,w,h,c,t){
    for(let j=0;j<9;j++){
      const x=w*(.17+j*.083);
      ctx.beginPath();
      for(let i=0;i<=90;i++){
        const y=i/90*h;
        const yn=y/h;
        const grounding=Math.exp(-Math.pow((yn-.72)/.2,2));
        const px=x+Math.sin(yn*4+t*.13+j*.22)*w*.009+grounding*Math.sin(t*.16+j)*w*.008;
        i?ctx.lineTo(px,y):ctx.moveTo(px,y);
      }
      stroke(ctx,c,.18+j*.023,1.03);
    }
    ctx.beginPath();ctx.moveTo(w*.12,h*.78);ctx.quadraticCurveTo(w*.5,h*.84,w*.88,h*.78);stroke(ctx,c,.34,1.12);
  }

  function drawAccept(ctx,w,h,c,t){
    for(let j=0;j<8;j++){
      const y=h*(.2+j*.08);
      ctx.beginPath();
      for(let i=0;i<=100;i++){
        const x=i/100*w,xn=x/w;
        const split=Math.exp(-Math.pow((xn-.42)/.17,2))*Math.sin(j*.7+t*.18)*h*.026;
        const returnPull=Math.max(0,(xn-.58)/.42)*(h*.5-y)*.08;
        const py=y+split+returnPull;
        i?ctx.lineTo(x,py):ctx.moveTo(x,py);
      }
      stroke(ctx,c,.2+j*.024,1.04);
    }
  }

  function drawWork(ctx,w,h,c,t){
    for(let j=0;j<8;j++){
      const y=h*(.2+j*.08);
      ctx.beginPath();
      for(let i=0;i<=100;i++){
        const x=i/100*w,xn=x/w;
        const py=y+Math.sin(xn*3.6+t*.1+j*.11)*h*.008+Math.exp(-Math.pow((xn-.68)/.18,2))*h*.006*Math.sin(t*.15+j);
        i?ctx.lineTo(x,py):ctx.moveTo(x,py);
      }
      stroke(ctx,c,.22+j*.024,1.08);
    }
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
      button.addEventListener('click',()=>{activePractice=button.dataset.practice||'breath';},{capture:true});
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
    if(typeof window.animatePractice==='function'){
      window.animatePractice=animateOverlay;
    }
  }

  function init(){
    installListVisuals();
    bindPracticeSelection();
    replacePracticeAnimator();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
