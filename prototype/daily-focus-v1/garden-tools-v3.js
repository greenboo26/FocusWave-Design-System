/* FocusWave long-term physical garden interaction v5
 * Keeps the rendered sand grain, stone mass, shadows and stone-generated rake
 * flow visible. User tools add physical-looking strokes above that persistent
 * scene: move, fine/medium/coarse rake, local flatten, undo and reset.
 */
(() => {
  let installed=false, canvas=null, frame=null, inner=null, toolbar=null;
  let mode='move', drawing=false, current=null, actions=[];
  const brushes={
    fine:{label:'细耙',teeth:7,gap:2.6,width:.72},
    medium:{label:'中耙',teeth:5,gap:4.4,width:.84},
    coarse:{label:'粗耙',teeth:3,gap:7.6,width:.98},
    smooth:{label:'抹平',radius:38}
  };

  function icon(type){
    if(type==='move')return '<svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/></svg>';
    if(type==='smooth')return '<svg viewBox="0 0 24 24"><path d="M4 15c4-3 12-3 16 0M5 18h14M7 12l4-7 6 3-3 6"/></svg>';
    if(type==='undo')return '<svg viewBox="0 0 24 24"><path d="M9 7H4V2M4 7c3-4 10-5 14-1 4 4 2 11-3 13-3 1-6 .5-8-1.5"/></svg>';
    if(type==='reset')return '<svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3M8 10v8M12 10v8M16 10v8M7 7l1 14h8l1-14"/></svg>';
    return '<svg viewBox="0 0 24 24"><path d="M4 7h12M6 4v6M9 4v6M12 4v6M15 4v6M13 9l7 11"/></svg>';
  }

  function setMode(next){
    mode=next;
    toolbar?.querySelectorAll('[data-garden-tool]').forEach(b=>b.classList.toggle('active',b.dataset.gardenTool===next));
    if(canvas)canvas.style.pointerEvents=(next==='move')?'none':'auto';
    if(inner)inner.style.cursor=next==='smooth'?'cell':(next==='move'?'default':'crosshair');
  }

  function canvasMetrics(){
    const d=Math.min(devicePixelRatio||1,2),r=canvas.getBoundingClientRect();
    const w=Math.max(10,Math.round(r.width*d)),h=Math.max(10,Math.round(r.height*d));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    return {d,r,w,h,sx:w/r.width,sy:h/r.height};
  }
  function redraw(){
    if(!canvas)return;
    const {d,w,h,sx,sy}=canvasMetrics(),ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);
    for(const a of actions){
      if(a.tool==='smooth'){
        ctx.save();ctx.globalCompositeOperation='destination-out';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=a.radius*2*sx;
        ctx.beginPath();a.points.forEach((p,i)=>i?ctx.lineTo(p.x*sx,p.y*sy):ctx.moveTo(p.x*sx,p.y*sy));ctx.stroke();ctx.restore();continue;
      }
      const b=brushes[a.tool];if(!b)continue;
      for(let tooth=0;tooth<b.teeth;tooth++){
        const offset=(tooth-(b.teeth-1)/2)*b.gap;ctx.beginPath();
        a.points.forEach((p,i,pts)=>{
          const prev=pts[Math.max(0,i-1)],next=pts[Math.min(pts.length-1,i+1)],dx=next.x-prev.x,dy=next.y-prev.y,len=Math.hypot(dx,dy)||1;
          const nx=-dy/len,ny=dx/len,x=(p.x+nx*offset)*sx,y=(p.y+ny*offset)*sy;i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        });
        ctx.strokeStyle=tooth===0?'rgba(255,255,255,.78)':'rgba(104,103,98,.24)';
        ctx.lineWidth=b.width*d;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
      }
    }
  }
  function point(ev){const r=canvas.getBoundingClientRect();return{x:ev.clientX-r.left,y:ev.clientY-r.top};}
  function start(ev){
    if(mode==='move')return;drawing=true;current={tool:mode,points:[point(ev)],radius:brushes.smooth.radius};actions.push(current);canvas.setPointerCapture?.(ev.pointerId);ev.preventDefault();redraw();
  }
  function move(ev){
    if(!drawing||!current)return;const p=point(ev),last=current.points[current.points.length-1];if(Math.hypot(p.x-last.x,p.y-last.y)>3){current.points.push(p);redraw();}
  }
  function end(){drawing=false;current=null;}

  function buildToolbar(){
    const old=document.querySelector('#fwEditTools');if(!old)return false;
    const fresh=document.createElement('div');fresh.id='fwEditTools';fresh.className='fw-edit-tools fw-edit-tools-v4';
    fresh.innerHTML=`
      <button class="fw-tool active" data-garden-tool="move">${icon('move')}<span>移动</span></button>
      <button class="fw-tool" data-garden-tool="fine">${icon('rake')}<span>细耙</span></button>
      <button class="fw-tool" data-garden-tool="medium">${icon('rake')}<span>中耙</span></button>
      <button class="fw-tool" data-garden-tool="coarse">${icon('rake')}<span>粗耙</span></button>
      <button class="fw-tool" data-garden-tool="smooth">${icon('smooth')}<span>抹平</span></button>
      <button class="fw-tool" data-action="undo">${icon('undo')}<span>撤销</span></button>
      <button class="fw-tool" data-action="reset">${icon('reset')}<span>重置</span></button>`;
    old.replaceWith(fresh);toolbar=fresh;
    toolbar.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.gardenTool){setMode(b.dataset.gardenTool);return;}
      if(b.dataset.action==='undo'){actions.pop();redraw();}
      if(b.dataset.action==='reset'){actions=[];redraw();}
    });
    return true;
  }
  function replaceUserCanvas(){
    const old=document.querySelector('#fwGardenUserCanvas');if(!old)return false;
    const fresh=document.createElement('canvas');fresh.id='fwGardenUserCanvas';fresh.className=old.className;old.replaceWith(fresh);canvas=fresh;
    canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointermove',move);
    window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);return true;
  }
  function restorePhysicalBase(){
    const base=document.querySelector('#fwGardenCanvas');if(base)base.style.setProperty('display','block','important');
    if(inner){
      inner.style.setProperty('background','linear-gradient(145deg,#f7f6f1,#ebe9e2)','important');
      inner.style.setProperty('box-shadow','inset 0 0 28px rgba(70,67,59,.11), inset 0 1px 0 rgba(255,255,255,.8)','important');
    }
  }
  function install(){
    if(installed)return true;
    frame=document.querySelector('#fwGardenFrame');inner=document.querySelector('#fwGardenInner');
    if(!frame||!inner||!document.querySelector('#fwGardenCanvas')||!document.querySelector('#fwGardenUserCanvas')||!document.querySelector('#fwEditTools'))return false;
    if(!buildToolbar()||!replaceUserCanvas())return false;
    installed=true;restorePhysicalBase();setMode('move');
    const help=document.querySelector('.fw-garden-help');if(help)help.textContent='实体沙纹会围绕石组自然转向。你也可以拖动石头，或用细耙、中耙、粗耙继续塑形；“抹平”只整理自己的局部纹路。';
    const style=document.createElement('style');style.dataset.gardenToolsV4='true';style.textContent=`
      #fwGardenInner{background:linear-gradient(145deg,#f7f6f1,#ebe9e2)!important;box-shadow:inset 0 0 28px rgba(70,67,59,.11),inset 0 1px 0 rgba(255,255,255,.8)!important}
      #fwGardenInner #fwGardenCanvas{display:block!important}
      #fwGardenUserCanvas{z-index:4!important;touch-action:none;background:transparent!important}
      .fw-edit-tools-v4{width:68px!important;right:-82px!important;padding:7px 5px!important;border-radius:18px!important}
      .fw-edit-tools-v4 .fw-tool{height:45px!important;font-size:10px!important;line-height:1.05!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important}
      .fw-edit-tools-v4 .fw-tool svg{width:15px!important;height:15px!important;margin:0!important}
      @media(max-width:1050px){.fw-edit-tools-v4{right:8px!important;top:8px!important;transform:none!important;width:190px!important;grid-template-columns:repeat(4,1fr)!important;gap:3px!important;background:rgba(250,249,246,.94)!important}.fw-editing .fw-edit-tools-v4{display:grid!important}.fw-edit-tools-v4 .fw-tool{height:40px!important}}
    `;document.head.appendChild(style);
    new MutationObserver(()=>{restorePhysicalBase();setMode(mode);}).observe(frame,{attributes:true,attributeFilter:['class']});
    window.addEventListener('resize',redraw);requestAnimationFrame(redraw);return true;
  }
  function boot(){
    if(install())return;
    const root=document.querySelector('#page-insights')||document.body;
    const mo=new MutationObserver(()=>{if(install())mo.disconnect();});mo.observe(root,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
