/* FocusWave long-term garden interaction v3
 * Default sand is clean and unraked. User marks are the only rake texture.
 * Tools: move stone, fine/medium/coarse rake, smooth local sand, undo, reset.
 */
(() => {
  let installed=false, canvas=null, ctx=null, frame=null, inner=null, toolbar=null;
  let mode='move', drawing=false, current=null, actions=[];
  const brushes={
    fine:{label:'细耙',teeth:7,gap:2.6,width:.72},
    medium:{label:'中耙',teeth:5,gap:4.2,width:.82},
    coarse:{label:'粗耙',teeth:3,gap:7.2,width:.94},
    smooth:{label:'抹平',radius:34}
  };

  function icon(type){
    if(type==='move')return '<svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/></svg>';
    if(type==='smooth')return '<svg viewBox="0 0 24 24"><path d="M4 15c4-3 12-3 16 0M5 18h14M7 12l4-7 6 3-3 6"/></svg>';
    if(type==='undo')return '<svg viewBox="0 0 24 24"><path d="M9 7H4v-5M4 7c3-4 10-5 14-1 4 4 2 11-3 13-3 1-6 .5-8-1.5"/></svg>';
    if(type==='reset')return '<svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3M8 10v8M12 10v8M16 10v8M7 7l1 14h8l1-14"/></svg>';
    return '<svg viewBox="0 0 24 24"><path d="M4 7h12M6 4v6M9 4v6M12 4v6M15 4v6M13 9l7 11"/></svg>';
  }

  function setMode(next){
    mode=next;
    toolbar?.querySelectorAll('[data-garden-tool]').forEach(b=>b.classList.toggle('active',b.dataset.gardenTool===next));
    if(canvas)canvas.style.pointerEvents=(next==='move')?'none':'auto';
    if(inner)inner.style.cursor=next==='smooth'?'cell':(next==='move'?'default':'crosshair');
  }

  function redraw(){
    if(!canvas)return;
    const d=Math.min(devicePixelRatio||1,2),r=canvas.getBoundingClientRect();
    const w=Math.max(10,Math.round(r.width*d)),h=Math.max(10,Math.round(r.height*d));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
    ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);
    const sx=w/r.width,sy=h/r.height;
    for(const a of actions){
      if(a.tool==='smooth'){
        ctx.save();ctx.globalCompositeOperation='destination-out';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=a.radius*2*sx;
        ctx.beginPath();a.points.forEach((p,i)=>i?ctx.lineTo(p.x*sx,p.y*sy):ctx.moveTo(p.x*sx,p.y*sy));ctx.stroke();ctx.restore();
        continue;
      }
      const b=brushes[a.tool];if(!b)continue;
      const pts=a.points;
      for(let tooth=0;tooth<b.teeth;tooth++){
        const offset=(tooth-(b.teeth-1)/2)*b.gap;
        ctx.beginPath();
        for(let i=0;i<pts.length;i++){
          const p=pts[i],prev=pts[Math.max(0,i-1)],next=pts[Math.min(pts.length-1,i+1)];
          const dx=next.x-prev.x,dy=next.y-prev.y,len=Math.hypot(dx,dy)||1;
          const nx=-dy/len,ny=dx/len;
          const x=(p.x+nx*offset)*sx,y=(p.y+ny*offset)*sy;
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }
        ctx.strokeStyle=tooth===0?'rgba(255,255,255,.74)':'rgba(105,104,99,.24)';
        ctx.lineWidth=b.width*d;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
      }
    }
  }

  function point(ev){const r=canvas.getBoundingClientRect();return{x:ev.clientX-r.left,y:ev.clientY-r.top};}
  function start(ev){
    if(mode==='move')return;
    drawing=true;current={tool:mode,points:[point(ev)],radius:brushes.smooth.radius};actions.push(current);
    canvas.setPointerCapture?.(ev.pointerId);ev.preventDefault();redraw();
  }
  function move(ev){
    if(!drawing||!current)return;const p=point(ev),last=current.points[current.points.length-1];
    if(Math.hypot(p.x-last.x,p.y-last.y)>3){current.points.push(p);redraw();}
  }
  function end(){drawing=false;current=null;}

  function buildToolbar(){
    const old=document.querySelector('#fwEditTools');if(!old)return;
    const fresh=old.cloneNode(false);fresh.id='fwEditTools';fresh.className='fw-edit-tools fw-edit-tools-v3';
    fresh.innerHTML=`
      <button class="fw-tool active" data-garden-tool="move">${icon('move')}移动</button>
      <button class="fw-tool" data-garden-tool="fine">${icon('rake')}细耙</button>
      <button class="fw-tool" data-garden-tool="medium">${icon('rake')}中耙</button>
      <button class="fw-tool" data-garden-tool="coarse">${icon('rake')}粗耙</button>
      <button class="fw-tool" data-garden-tool="smooth">${icon('smooth')}抹平</button>
      <button class="fw-tool" data-action="undo">${icon('undo')}撤销</button>
      <button class="fw-tool" data-action="reset">${icon('reset')}重置</button>`;
    old.replaceWith(fresh);toolbar=fresh;
    toolbar.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.gardenTool){setMode(b.dataset.gardenTool);return;}
      if(b.dataset.action==='undo'){actions.pop();redraw();}
      if(b.dataset.action==='reset'){actions=[];redraw();}
    });
  }

  function replaceCanvas(){
    const old=document.querySelector('#fwGardenUserCanvas');if(!old)return;
    const fresh=old.cloneNode(false);fresh.id='fwGardenUserCanvas';old.replaceWith(fresh);canvas=fresh;ctx=canvas.getContext('2d');
    canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointermove',move);
    window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);
  }

  function install(){
    if(installed)return true;
    frame=document.querySelector('#fwGardenFrame');inner=document.querySelector('#fwGardenInner');
    const base=document.querySelector('#fwGardenCanvas');
    if(!frame||!inner||!base||!document.querySelector('#fwGardenUserCanvas')||!document.querySelector('#fwEditTools'))return false;
    installed=true;
    base.style.display='none';
    inner.style.background='#f4f4f0';
    buildToolbar();replaceCanvas();setMode('move');
    const help=document.querySelector('.fw-garden-help');
    if(help)help.textContent='白沙默认保持平整。选择细耙、中耙或粗耙划纹；“抹平”可局部恢复干净沙面。';
    const style=document.createElement('style');style.textContent=`
      .fw-edit-tools-v3{width:64px;right:-78px;padding:7px 5px;border-radius:18px}
      .fw-edit-tools-v3 .fw-tool{height:43px;font-size:10px;line-height:1.1}
      .fw-edit-tools-v3 .fw-tool svg{width:15px;height:15px;margin-bottom:3px}
      #fwGardenUserCanvas{z-index:4;touch-action:none}
    `;document.head.appendChild(style);
    new MutationObserver(()=>setMode(mode)).observe(frame,{attributes:true,attributeFilter:['class']});
    window.addEventListener('resize',redraw);
    requestAnimationFrame(redraw);
    return true;
  }

  function boot(){
    if(install())return;
    const root=document.querySelector('#page-insights')||document.body;
    const mo=new MutationObserver(()=>{if(install())mo.disconnect()});mo.observe(root,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();