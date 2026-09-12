/* FocusWave photographic karesansui garden v2.
 * Fixed-view physical presentation assembled from the supplied reference image.
 * Reward stones remain dynamic, but there is no WebGL model, orbit, zoom or fake 3D geometry.
 * The existing daily reward store remains the single source of truth.
 * No MutationObserver and no global polling.
 */
(() => {
  if (window.FocusWavePhotoGarden) return;

  const BASE_PHOTO = 'data:image/webp;base64,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';
  const STONE_PHOTO = 'data:image/webp;base64,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';

  const SIZE_WIDTH = {small:5.3, medium:7.1, large:9.0};
  let mounted = false;
  let resetTimer = 0;

  function rewardStones(){
    return window.FocusWaveDailyGardenRewards?.stones || [];
  }

  function ensureStyles(){
    if(document.querySelector('style[data-focuswave-photo-garden]')) return;
    const style=document.createElement('style');
    style.dataset.focuswavePhotoGarden='true';
    style.textContent=`
      #page-insights .fw-garden-frame.fw-photo-active{padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;border-radius:22px!important;overflow:visible!important;aspect-ratio:768/345!important;min-height:0!important}
      #page-insights .fw-garden-frame.fw-photo-active:before{display:none!important}
      #page-insights .fw-garden-frame.fw-photo-active #fwGardenInner{position:relative!important;width:100%!important;height:100%!important;min-height:0!important;border:0!important;border-radius:22px!important;background:transparent!important;box-shadow:none!important;overflow:hidden!important}
      #page-insights .fw-garden-frame.fw-photo-active #fwGardenCanvas,
      #page-insights .fw-garden-frame.fw-photo-active #fwGardenUserCanvas,
      #page-insights .fw-garden-frame.fw-photo-active #fwDailyGardenCanvas,
      #page-insights .fw-garden-frame.fw-photo-active #fwStoneLayer,
      #page-insights .fw-garden-frame.fw-photo-active .fw-physical-bay,
      #page-insights .fw-garden-frame.fw-photo-active .fw-physical-cursor,
      #page-insights .fw-garden-frame.fw-photo-active #fwThreeGardenMount{display:none!important}
      #fwPhotoGardenMount{position:absolute;inset:0;z-index:40;border-radius:22px;overflow:hidden;background:#f3efe7;box-shadow:0 26px 46px rgba(74,55,35,.18);pointer-events:none;isolation:isolate}
      #fwPhotoGardenMount .fw-photo-base{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;display:block;user-select:none;-webkit-user-drag:none}
      #fwPhotoGardenMount .fw-photo-rings,#fwPhotoGardenMount .fw-photo-stones{position:absolute;inset:0;pointer-events:none}
      #fwPhotoGardenMount .fw-photo-ring{position:absolute;transform:translate(-50%,-50%) scaleY(.58);border-radius:50%;background:repeating-radial-gradient(ellipse at center,transparent 0 7px,rgba(122,111,92,.20) 8px 9px,rgba(255,255,255,.52) 9.7px 10.6px,transparent 11.5px 17px);mix-blend-mode:multiply;opacity:.68;filter:blur(.12px)}
      #fwPhotoGardenMount .fw-photo-stone{position:absolute;transform:translate(-50%,-50%);height:auto;object-fit:contain;filter:drop-shadow(0 12px 10px rgba(47,40,31,.25));user-select:none;-webkit-user-drag:none}
      #page-insights .fw-garden-frame.fw-photo-active + .fw-garden-help{height:34px!important;opacity:1!important;color:#8a8276!important}
      @media(max-width:700px){#page-insights .fw-garden-frame.fw-photo-active{aspect-ratio:1.65/1!important}#fwPhotoGardenMount .fw-photo-base{object-fit:cover;object-position:39% center}}
    `;
    document.head.appendChild(style);
  }

  function photoPoint(stone){
    const x=Math.max(0,Math.min(1,Number(stone?.x)||.5));
    const y=Math.max(0,Math.min(1,Number(stone?.y)||.5));
    return {left:5.2+x*67.0, top:7.5+y*83.0};
  }

  function mount(){
    ensureStyles();
    const frame=document.querySelector('#fwGardenFrame');
    const inner=document.querySelector('#fwGardenInner');
    if(!frame||!inner) return false;
    frame.classList.remove('fw-three-active');
    frame.classList.add('fw-photo-active');
    inner.querySelector('#fwThreeGardenMount')?.remove();

    let mountEl=inner.querySelector('#fwPhotoGardenMount');
    if(!mountEl){
      mountEl=document.createElement('div');
      mountEl.id='fwPhotoGardenMount';
      mountEl.innerHTML=`<img class="fw-photo-base" alt="实物枯山水沙盘"><div class="fw-photo-rings"></div><div class="fw-photo-stones"></div>`;
      mountEl.querySelector('.fw-photo-base').src=BASE_PHOTO;
      inner.appendChild(mountEl);
    }
    const help=document.querySelector('.fw-garden-help');
    if(help) help.textContent='今日完成的每段专注会化作一块石头，次日 00:00 沙盘重新归零。';
    mounted=true;
    render();
    return true;
  }

  function render(){
    const mountEl=document.querySelector('#fwPhotoGardenMount');
    if(!mountEl){if(!mount()) return;}
    const rings=document.querySelector('#fwPhotoGardenMount .fw-photo-rings');
    const stonesLayer=document.querySelector('#fwPhotoGardenMount .fw-photo-stones');
    if(!rings||!stonesLayer) return;
    rings.innerHTML='';
    stonesLayer.innerHTML='';

    rewardStones().forEach((stone,index)=>{
      const point=photoPoint(stone);
      const width=SIZE_WIDTH[stone.variant]||SIZE_WIDTH.medium;
      const ring=document.createElement('div');
      ring.className='fw-photo-ring';
      ring.style.left=`${point.left}%`;
      ring.style.top=`${point.top+1.1}%`;
      ring.style.width=`${width*2.65}%`;
      ring.style.height=`${width*2.1}%`;
      ring.style.transform=`translate(-50%,-50%) scaleY(.58) rotate(${(Number(stone.rotation)||0)*.2}deg)`;
      rings.appendChild(ring);

      const image=document.createElement('img');
      image.className='fw-photo-stone';
      image.alt='';
      image.src=STONE_PHOTO;
      image.style.left=`${point.left}%`;
      image.style.top=`${point.top}%`;
      image.style.width=`${width}%`;
      image.style.transform=`translate(-50%,-50%) rotate(${Number(stone.rotation)||0}deg) scale(${Number(stone.scale)||1})`;
      image.style.filter=`brightness(${.93+(Number(stone.tone)||.5)*.12}) drop-shadow(0 ${7+index%3}px ${7+index%4}px rgba(47,40,31,.25))`;
      stonesLayer.appendChild(image);
    });
  }

  function queueRender(){
    [0,120,420].forEach(delay=>setTimeout(()=>{if(mounted)render();else mount();},delay));
  }

  function scheduleMidnight(){
    clearTimeout(resetTimer);
    const now=new Date();
    const next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,1);
    resetTimer=setTimeout(()=>{queueRender();scheduleMidnight();},Math.max(1000,next.getTime()-Date.now()));
  }

  document.addEventListener('click',event=>{
    const target=event.target?.closest?.('[data-nav],[data-go],#finishBtn');
    if(!target) return;
    if(target.matches('[data-nav="insights"],[data-go="insights"]')) setTimeout(()=>{mount();queueRender();},80);
    if(target.matches('#finishBtn')) setTimeout(queueRender,160);
  },{capture:true});
  window.addEventListener('storage',queueRender);
  window.addEventListener('resize',()=>{if(mounted)requestAnimationFrame(render)});

  function boot(){
    scheduleMidnight();
    if(!mount()) requestAnimationFrame(()=>mount());
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

  window.FocusWavePhotoGarden={mount,render,refresh:queueRender};
})();
