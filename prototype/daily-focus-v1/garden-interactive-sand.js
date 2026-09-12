/* FocusWave interactive physical sand v1.
 * Replaces the photographic/3D presentation with a fixed-view interactive sand surface.
 * The sand starts flat. Existing physical rake tools draw the only grooves that appear.
 * Reward stones continue to come from FocusWaveDailyGardenRewards.
 * No MutationObserver and no global polling.
 */
(() => {
  if (window.FocusWaveInteractiveSand) return;

  let resizeRaf = 0;

  function ensureStyles(){
    if (document.querySelector('style[data-focuswave-interactive-sand]')) return;
    const style=document.createElement('style');
    style.dataset.focuswaveInteractiveSand='true';
    style.textContent=`
      #page-insights #fwGardenFrame{
        display:block!important;
        position:relative!important;
        padding:13px!important;
        border:0!important;
        border-radius:24px!important;
        overflow:hidden!important;
        background:
          repeating-linear-gradient(4deg,rgba(84,47,23,.055) 0 1px,transparent 1px 8px),
          repeating-linear-gradient(176deg,rgba(255,240,210,.08) 0 1px,transparent 1px 13px),
          linear-gradient(102deg,#dcb078 0%,#bd824c 19%,#d6a36a 42%,#9b6238 72%,#c89255 100%)!important;
        box-shadow:0 28px 48px rgba(72,48,27,.18),0 8px 18px rgba(64,43,25,.12),inset 0 2px 1px rgba(255,255,255,.52),inset 0 -5px 10px rgba(79,43,19,.22)!important;
      }
      #page-insights #fwGardenFrame:before{
        content:'';position:absolute;inset:7px;border-radius:18px;pointer-events:none;z-index:30;
        border:1px solid rgba(255,238,204,.34);
        box-shadow:inset 0 0 0 1px rgba(86,48,24,.17),inset 0 7px 12px rgba(255,242,213,.08);
      }
      #page-insights #fwGardenInner{
        position:relative!important;
        width:100%!important;height:100%!important;min-width:0!important;
        border-radius:13px!important;overflow:hidden!important;
        border:1px solid rgba(101,80,57,.28)!important;
        background:#ece6da!important;
        box-shadow:inset 0 15px 24px rgba(96,77,55,.15),inset 0 -7px 12px rgba(255,255,255,.72),0 1px 0 rgba(255,255,255,.40)!important;
      }
      #page-insights #fwPhotoGardenMount,
      #page-insights #fwThreeGardenMount{display:none!important}
      #page-insights #fwGardenFrame.fw-photo-active #fwGardenUserCanvas,
      #page-insights #fwGardenFrame.fw-photo-active #fwStoneLayer,
      #page-insights #fwGardenFrame.fw-photo-active .fw-physical-bay,
      #page-insights #fwGardenFrame.fw-three-active #fwGardenUserCanvas,
      #page-insights #fwGardenFrame.fw-three-active #fwStoneLayer,
      #page-insights #fwGardenFrame.fw-three-active .fw-physical-bay{display:block!important}
      #page-insights #fwGardenCanvas,
      #page-insights #fwDailyGardenCanvas{display:none!important;opacity:0!important}
      #page-insights #fwInteractiveSandBase{
        position:absolute;inset:0;width:100%;height:100%;display:block;z-index:2;pointer-events:none;
      }
      #page-insights #fwGardenUserCanvas{
        position:absolute!important;inset:0!important;width:100%!important;height:100%!important;
        z-index:6!important;background:transparent!important;touch-action:none!important;
      }
      #page-insights #fwStoneLayer{z-index:8!important}
      #page-insights .fw-physical-bay{z-index:20!important}
      #page-insights .fw-physical-cursor{z-index:24!important}
      #page-insights .fw-garden-help{opacity:1!important;height:38px!important;color:#8b8378!important}
      @media(max-width:700px){#page-insights #fwGardenFrame{padding:8px!important;border-radius:18px!important}}
    `;
    document.head.appendChild(style);
  }

  function seeded(seed){
    let x=seed>>>0;
    return()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);
  }

  function ensureCanvas(){
    const inner=document.querySelector('#fwGardenInner');
    if(!inner) return null;
    let canvas=inner.querySelector('#fwInteractiveSandBase');
    if(!canvas){
      canvas=document.createElement('canvas');
      canvas.id='fwInteractiveSandBase';
      const anchor=inner.querySelector('#fwGardenUserCanvas');
      if(anchor) inner.insertBefore(canvas,anchor);
      else inner.prepend(canvas);
    }
    return canvas;
  }

  function drawFlatSand(){
    const canvas=ensureCanvas();
    if(!canvas) return false;
    const rect=canvas.getBoundingClientRect();
    if(rect.width<10||rect.height<10) return false;
    const d=Math.min(window.devicePixelRatio||1,2);
    const w=Math.max(10,Math.round(rect.width));
    const h=Math.max(10,Math.round(rect.height));
    const pw=Math.round(w*d),ph=Math.round(h*d);
    if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
    const ctx=canvas.getContext('2d');
    ctx.setTransform(d,0,0,d,0,0);
    ctx.clearRect(0,0,w,h);

    const base=ctx.createLinearGradient(0,0,w,h);
    base.addColorStop(0,'#f6f2e9');
    base.addColorStop(.38,'#eee8dd');
    base.addColorStop(.72,'#e9e1d4');
    base.addColorStop(1,'#f1ebe0');
    ctx.fillStyle=base;ctx.fillRect(0,0,w,h);

    const light=ctx.createRadialGradient(w*.24,h*.18,0,w*.24,h*.18,Math.max(w,h)*.95);
    light.addColorStop(0,'rgba(255,255,255,.34)');
    light.addColorStop(.45,'rgba(255,255,255,.08)');
    light.addColorStop(1,'rgba(104,84,60,.055)');
    ctx.fillStyle=light;ctx.fillRect(0,0,w,h);

    const rnd=seeded(604219);
    const grains=Math.min(7200,Math.floor(w*h/110));
    for(let i=0;i<grains;i+=1){
      const x=rnd()*w,y=rnd()*h;
      const r=.22+rnd()*.72;
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
      const dark=rnd()>.58;
      ctx.fillStyle=dark
        ?`rgba(116,99,76,${.017+rnd()*.028})`
        :`rgba(255,255,255,${.045+rnd()*.075})`;
      ctx.fill();
    }

    const edge=ctx.createLinearGradient(0,0,0,h);
    edge.addColorStop(0,'rgba(91,69,46,.055)');
    edge.addColorStop(.09,'rgba(91,69,46,0)');
    edge.addColorStop(.88,'rgba(255,255,255,0)');
    edge.addColorStop(1,'rgba(255,255,255,.12)');
    ctx.fillStyle=edge;ctx.fillRect(0,0,w,h);
    return true;
  }

  function patchSurface(){
    ensureStyles();
    const frame=document.querySelector('#fwGardenFrame');
    const inner=document.querySelector('#fwGardenInner');
    if(!frame||!inner) return false;

    frame.classList.remove('fw-photo-active','fw-three-active');
    inner.querySelector('#fwPhotoGardenMount')?.remove();
    inner.querySelector('#fwThreeGardenMount')?.remove();
    drawFlatSand();

    const help=document.querySelector('.fw-garden-help');
    if(help) help.textContent='沙面初始保持平整。向左拉开庭具盘，选择细耙、中耙或粗耙后按住沙面拖动；齿数会决定留下的平行砂纹。平整棒可抹去局部痕迹。';
    return true;
  }

  function refreshSoon(){
    [0,120,360,700].forEach(delay=>setTimeout(patchSurface,delay));
  }

  function bind(){
    ensureStyles();
    refreshSoon();
    document.addEventListener('click',event=>{
      const target=event.target.closest('[data-nav="insights"],[data-go="insights"],#fwEditGarden,[data-physical-tool],.fw-drawer-toggle');
      if(target) refreshSoon();
    },{capture:true});
    window.addEventListener('resize',()=>{
      cancelAnimationFrame(resizeRaf);
      resizeRaf=requestAnimationFrame(drawFlatSand);
    });
  }

  window.FocusWaveInteractiveSand={patchSurface,drawFlatSand};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();
