/* FocusWave realistic karesansui renderer v2.
 * Fixed-view interactive sand tray with photo-like sand/stone materials.
 * Initial sand is flat; grooves are drawn only by the selected physical rake.
 * No MutationObserver and no polling.
 */
(() => {
  if (window.FocusWaveGardenRealismV2) return;

  const ASSET_ROOT = './lab/assets/karesansui/';
  const TOOL_ASSETS = {
    fine: 'fine.webp',
    medium: 'medium.webp',
    coarse: 'coarse.webp',
    flatten: 'flatten.webp'
  };
  const LABELS = {
    fine: '细耙 7齿',
    medium: '中耙 5齿',
    coarse: '粗耙 3齿',
    flatten: '平整棒'
  };
  const SPECS = {
    fine: {teeth: 7, spacing: 9.2},
    medium: {teeth: 5, spacing: 13.6},
    coarse: {teeth: 3, spacing: 20.5},
    flatten: {eraseWidth: 104}
  };

  let frame = null;
  let inner = null;
  let canvas = null;
  let dock = null;
  let cursor = null;
  let cursorImg = null;
  let status = null;
  let tool = null;
  let drawing = false;
  let current = null;
  let actions = [];
  let lastPointer = null;
  let angle = -42;
  let resizeObserver = null;
  let installed = false;

  function ensureStyles() {
    if (document.querySelector('style[data-focuswave-realistic-garden-v2]')) return;
    const style = document.createElement('style');
    style.dataset.focuswaveRealisticGardenV2 = 'true';
    style.textContent = `
      #page-insights #fwGardenFrame{
        padding:13px!important;border:0!important;border-radius:24px!important;overflow:hidden!important;
        background:
          repeating-linear-gradient(2deg,rgba(94,54,25,.045) 0 1px,transparent 1px 9px),
          linear-gradient(100deg,#d8ad74 0%,#bd824c 18%,#d1a06a 43%,#a0673c 74%,#c38b53 100%)!important;
        box-shadow:0 25px 44px rgba(68,47,28,.16),0 7px 17px rgba(68,47,28,.12),inset 0 2px 1px rgba(255,255,255,.55),inset 0 -4px 8px rgba(81,46,22,.20)!important;
      }
      #page-insights #fwGardenFrame:before{content:'';position:absolute;inset:7px;border-radius:18px;pointer-events:none;z-index:40;border:1px solid rgba(255,238,205,.28);box-shadow:inset 0 0 0 1px rgba(83,47,23,.15)}
      #page-insights #fwGardenInner{
        position:relative!important;width:100%!important;height:100%!important;min-width:0!important;overflow:hidden!important;
        border-radius:13px!important;border:1px solid rgba(104,87,65,.22)!important;
        background-color:#f3ede3!important;
        background-image:url('./assets/garden/sand-fine.svg')!important;
        background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;
        box-shadow:inset 0 10px 18px rgba(106,84,58,.08),inset 0 -4px 8px rgba(255,255,255,.62),0 1px 0 rgba(255,255,255,.46)!important;
      }
      #page-insights #fwInteractiveSandBase,
      #page-insights #fwDailyGardenCanvas,
      #page-insights #fwGardenCanvas{display:none!important;opacity:0!important}
      #page-insights #fwGardenUserCanvas{
        position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:12!important;
        background:transparent!important;touch-action:none!important;pointer-events:auto!important;
      }
      #page-insights #fwStoneLayer{z-index:9!important;pointer-events:none!important}
      #page-insights #fwStoneLayer .fw-stone{pointer-events:none!important;overflow:visible!important;filter:drop-shadow(0 12px 7px rgba(55,45,33,.27))!important}
      #page-insights #fwStoneLayer .fw-stone:after{display:none!important}
      #page-insights #fwStoneLayer .fw-stone .body{width:100%!important;height:100%!important;border-radius:0!important;clip-path:none!important;box-shadow:none!important;background-color:transparent!important;background-repeat:no-repeat!important;background-position:center!important;background-size:100% 100%!important;overflow:visible!important}
      #page-insights #fwStoneLayer .fw-stone .body:before,#page-insights #fwStoneLayer .fw-stone .body:after{display:none!important}
      #page-insights #fwStoneLayer .fw-stone[data-size="small"] .body{background-image:url('./assets/garden/stone-grey-a.svg')!important}
      #page-insights #fwStoneLayer .fw-stone[data-size="medium"] .body{background-image:url('./assets/garden/stone-grey-b.svg')!important}
      #page-insights #fwStoneLayer .fw-stone[data-size="large"] .body{background-image:url('./assets/garden/stone-grey-c.svg')!important}
      #page-insights #fwStoneLayer .fw-stone:not([data-size]) .body{background-image:url('./assets/garden/stone-grey-b.svg')!important}
      #page-insights .fw-reward-tray .fw-mini-stone{width:36px!important;height:27px!important;border-radius:0!important;clip-path:none!important;background:transparent url('./assets/garden/stone-grey-b.svg') center/100% 100% no-repeat!important;box-shadow:none!important;filter:drop-shadow(0 6px 4px rgba(55,45,33,.22))!important;transform:none!important}

      #page-insights .fw-garden-help{height:32px!important;opacity:1!important;color:#898176!important;font-size:11px!important}
      #page-insights .fw-real-dock{min-height:88px;margin:10px 0 0;padding:8px 14px 8px 18px;display:grid;grid-template-columns:minmax(170px,1fr) auto minmax(470px,1.55fr) auto minmax(200px,1fr);align-items:center;gap:15px;border:1px solid rgba(72,67,58,.10);border-radius:20px;background:rgba(249,247,241,.96);box-shadow:0 12px 30px rgba(56,49,38,.08),inset 0 1px rgba(255,255,255,.78)}
      #page-insights .fw-real-status{display:flex;align-items:center;gap:8px;color:#7c7d77;font-size:11px;white-space:nowrap}
      #page-insights .fw-real-dot{width:7px;height:7px;border-radius:50%;background:#626660;opacity:.8}
      #page-insights .fw-real-divider{width:1px;height:40px;background:rgba(67,64,57,.11)}
      #page-insights .fw-real-tools{display:flex;align-items:center;justify-content:center;gap:12px}
      #page-insights .fw-real-tool{width:94px;height:72px;padding:5px 6px 4px;border:1px solid transparent;border-radius:13px;background:transparent;display:grid;grid-template-rows:45px auto;place-items:center;gap:2px;cursor:pointer;color:#696a64;font-size:10px;transition:.16s}
      #page-insights .fw-real-tool:hover{background:rgba(225,216,201,.28);transform:translateY(-1px)}
      #page-insights .fw-real-tool.active{border-color:#947154;background:rgba(201,169,131,.11);box-shadow:inset 0 0 0 1px rgba(148,113,84,.08)}
      #page-insights .fw-real-thumb{width:72px;height:43px;display:grid;place-items:center;overflow:hidden}
      #page-insights .fw-real-thumb img{width:58px;height:58px;object-fit:contain;filter:drop-shadow(0 4px 3px rgba(70,46,27,.16));pointer-events:none;user-select:none}
      #page-insights .fw-real-tool[data-rake-tool="flatten"] .fw-real-thumb img{width:64px;height:64px}
      #page-insights .fw-real-actions{display:flex;justify-content:flex-end;gap:8px;white-space:nowrap}
      #page-insights .fw-real-actions button{height:36px;padding:0 12px;border:1px solid rgba(80,70,58,.12);border-radius:999px;background:rgba(255,255,255,.32);color:#72726c;font-size:11px;cursor:pointer}
      #page-insights .fw-real-actions button:hover{background:rgba(224,214,198,.22)}
      #page-insights .fw-real-cursor{--tool-angle:-42deg;position:absolute;left:0;top:0;z-index:30;pointer-events:none;opacity:0;transform:translate3d(0,0,0)}
      #page-insights .fw-real-cursor.visible{opacity:.98}
      #page-insights .fw-real-cursor img{display:block;filter:drop-shadow(0 8px 5px rgba(57,38,23,.25));transform-origin:27% 76%;user-select:none}
      #page-insights .fw-real-cursor.fine img{width:150px;transform:translate(-35px,-116px) rotate(calc(var(--tool-angle) - 44deg))}
      #page-insights .fw-real-cursor.medium img{width:145px;transform:translate(-34px,-112px) rotate(calc(var(--tool-angle) - 44deg))}
      #page-insights .fw-real-cursor.coarse img{width:136px;transform:translate(-32px,-106px) rotate(calc(var(--tool-angle) - 44deg))}
      #page-insights .fw-real-cursor.flatten img{width:150px;transform:translate(-38px,-112px) rotate(calc(var(--tool-angle) - 44deg))}
      @media(max-width:1000px){#page-insights .fw-real-dock{grid-template-columns:1fr;gap:7px;padding:10px}#page-insights .fw-real-divider{display:none}#page-insights .fw-real-status,#page-insights .fw-real-actions{justify-content:center}#page-insights .fw-real-tools{flex-wrap:wrap}}
    `;
    document.head.appendChild(style);
  }

  function metrics() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    const w = Math.max(10, Math.round(r.width * d));
    const h = Math.max(10, Math.round(r.height * d));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return {d, r, w, h, sx: w / Math.max(1, r.width), sy: h / Math.max(1, r.height)};
  }

  function point(event) {
    const r = canvas.getBoundingClientRect();
    return {x:event.clientX-r.left,y:event.clientY-r.top};
  }

  function shifted(points, offset) {
    return points.map((p,i,all) => {
      const a = all[Math.max(0,i-1)], b = all[Math.min(all.length-1,i+1)];
      const dx=b.x-a.x, dy=b.y-a.y, len=Math.hypot(dx,dy)||1;
      return {x:p.x-dy/len*offset,y:p.y+dx/len*offset};
    });
  }

  function path(ctx, points, m, offset=0) {
    if (points.length < 2) return false;
    const pts = shifted(points, offset);
    ctx.beginPath();
    ctx.moveTo(pts[0].x*m.sx,pts[0].y*m.sy);
    for(let i=1;i<pts.length-1;i++){
      const mx=(pts[i].x+pts[i+1].x)/2, my=(pts[i].y+pts[i+1].y)/2;
      ctx.quadraticCurveTo(pts[i].x*m.sx,pts[i].y*m.sy,mx*m.sx,my*m.sy);
    }
    const last=pts[pts.length-1];ctx.lineTo(last.x*m.sx,last.y*m.sy);
    return true;
  }

  function drawFurrow(ctx, action, m, offset) {
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    path(ctx,action.points,m,offset);
    ctx.strokeStyle='rgba(112,92,66,.095)';ctx.lineWidth=5.6*m.d;ctx.shadowColor='rgba(112,92,66,.09)';ctx.shadowBlur=1.3*m.d;ctx.stroke();
    ctx.shadowBlur=0;
    path(ctx,action.points,m,offset+.7);
    ctx.strokeStyle='rgba(122,103,78,.19)';ctx.lineWidth=2.55*m.d;ctx.stroke();
    path(ctx,action.points,m,offset+1.45);
    ctx.strokeStyle='rgba(104,87,65,.15)';ctx.lineWidth=.85*m.d;ctx.stroke();
    path(ctx,action.points,m,offset-1.45);
    ctx.strokeStyle='rgba(255,254,249,.72)';ctx.lineWidth=1.05*m.d;ctx.stroke();
    ctx.restore();
  }

  function renderAction(ctx, action, m) {
    if (action.tool === 'flatten') {
      ctx.save();ctx.globalCompositeOperation='destination-out';ctx.lineCap='round';ctx.lineJoin='round';
      path(ctx,action.points,m,0);ctx.lineWidth=SPECS.flatten.eraseWidth*m.d;ctx.strokeStyle='#000';ctx.stroke();ctx.restore();return;
    }
    const spec=SPECS[action.tool];if(!spec)return;
    const center=(spec.teeth-1)/2;
    for(let i=0;i<spec.teeth;i++) drawFurrow(ctx,action,m,(i-center)*spec.spacing);
  }

  function redraw() {
    if (!canvas) return;
    const m=metrics(),ctx=canvas.getContext('2d');ctx.clearRect(0,0,m.w,m.h);
    actions.forEach(a=>renderAction(ctx,a,m));if(current)renderAction(ctx,current,m);updateStatus();
  }

  function updateStatus(){if(status)status.innerHTML=`<span class="fw-real-dot"></span><span>${actions.length} 次塑形 · ${tool?`已选择 ${LABELS[tool]}`:'尚未选择庭具'}</span>`;}
  function showCursor(v){cursor?.classList.toggle('visible',Boolean(v&&tool));}

  function moveCursor(event){
    if(!tool||!cursor)return;
    const r=inner.getBoundingClientRect();cursor.style.left=`${event.clientX-r.left}px`;cursor.style.top=`${event.clientY-r.top}px`;
    if(lastPointer){const dx=event.clientX-lastPointer[0],dy=event.clientY-lastPointer[1];if(Math.hypot(dx,dy)>2){const raw=Math.atan2(dy,dx)*180/Math.PI;angle=angle*.68+raw*.32;}}
    cursor.style.setProperty('--tool-angle',`${angle}deg`);lastPointer=[event.clientX,event.clientY];showCursor(true);
  }

  function setTool(next){
    tool=next&&SPECS[next]?next:null;
    dock?.querySelectorAll('[data-rake-tool]').forEach(b=>{const on=b.dataset.rakeTool===tool;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false');});
    if(tool){cursor.className=`fw-real-cursor ${tool}`;cursorImg.src=ASSET_ROOT+TOOL_ASSETS[tool];cursorImg.alt=LABELS[tool];inner.style.cursor='none';}
    else{cursor.className='fw-real-cursor';cursorImg.removeAttribute('src');cursorImg.alt='';inner.style.cursor='';showCursor(false);}updateStatus();
  }

  function start(e){if(!tool||e.button!==0)return;drawing=true;current={tool,points:[point(e)]};canvas.setPointerCapture?.(e.pointerId);moveCursor(e);e.preventDefault();redraw();}
  function move(e){if(tool)moveCursor(e);if(!drawing||!current)return;const p=point(e),last=current.points[current.points.length-1];if(Math.hypot(p.x-last.x,p.y-last.y)>1.6){current.points.push(p);redraw();}}
  function end(e){if(!drawing)return;if(current?.points.length>1)actions.push(current);drawing=false;current=null;try{canvas.releasePointerCapture(e.pointerId)}catch(_){}redraw();}

  function buildDock(){
    document.querySelector('#page-insights #fwEditTools')?.remove();
    document.querySelector('#page-insights .fw-tool-dock')?.remove();
    document.querySelector('#page-insights .fw-real-dock')?.remove();
    const help=document.querySelector('#page-insights .fw-garden-help');
    const el=document.createElement('div');el.className='fw-real-dock';el.innerHTML=`
      <div class="fw-real-status"></div><div class="fw-real-divider"></div>
      <div class="fw-real-tools">${['fine','medium','coarse','flatten'].map(k=>`<button class="fw-real-tool" type="button" data-rake-tool="${k}" aria-pressed="false"><span class="fw-real-thumb"><img src="${ASSET_ROOT+TOOL_ASSETS[k]}" alt=""></span><span>${LABELS[k]}</span></button>`).join('')}</div>
      <div class="fw-real-divider"></div><div class="fw-real-actions"><button type="button" data-action="undo">↶ 撤销</button><button type="button" data-action="reset">↻ 重置白砂</button></div>`;
    (help||frame).insertAdjacentElement('afterend',el);dock=el;status=el.querySelector('.fw-real-status');
    el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.rakeTool)setTool(tool===b.dataset.rakeTool?null:b.dataset.rakeTool);if(b.dataset.action==='undo'){actions.pop();redraw();}if(b.dataset.action==='reset'){actions=[];current=null;redraw();}});
  }

  function replaceCanvas(){
    document.querySelector('#page-insights .fw-real-cursor')?.remove();
    const old=document.querySelector('#page-insights #fwGardenUserCanvas');if(old)old.remove();
    canvas=document.createElement('canvas');canvas.id='fwGardenUserCanvas';inner.appendChild(canvas);
    cursor=document.createElement('div');cursor.className='fw-real-cursor';cursor.innerHTML='<img alt="">';cursorImg=cursor.querySelector('img');inner.appendChild(cursor);
    canvas.addEventListener('pointerenter',e=>{lastPointer=null;if(tool)moveCursor(e)});canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerleave',()=>{if(!drawing){lastPointer=null;showCursor(false)}});window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);
  }

  function install(){
    ensureStyles();frame=document.querySelector('#page-insights #fwGardenFrame');inner=document.querySelector('#page-insights #fwGardenInner');if(!frame||!inner)return false;
    if(installed&&document.body.contains(canvas)&&document.body.contains(dock)){redraw();return true;}
    replaceCanvas();buildDock();installed=true;const edit=document.querySelector('#fwEditGarden');if(edit)edit.style.display='none';const help=document.querySelector('#page-insights .fw-garden-help');if(help)help.textContent='选择下方庭具后，鼠标进入沙盘会拿起庭具；按住左键拖动才会留下真实的砂槽。再次点击同一庭具即可放下。';
    if(resizeObserver)resizeObserver.disconnect();resizeObserver=new ResizeObserver(()=>requestAnimationFrame(redraw));resizeObserver.observe(canvas);redraw();return true;
  }

  function installSoon(){[0,120,320,650,1100,1800].forEach(ms=>setTimeout(install,ms));}
  function bind(){ensureStyles();installSoon();document.addEventListener('click',e=>{if(e.target?.closest?.('[data-nav="insights"],[data-go="insights"]'))installSoon();},{capture:true});window.addEventListener('pageshow',installSoon,{once:true});}

  window.FocusWaveGardenRealismV2={install,installSoon,get actions(){return actions.slice();}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
