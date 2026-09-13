/* FocusWave visible lotus overlay v2.
 * Keeps earned lotuses visible and draggable independently from the pond canvas.
 * Uses the same reward and position storage as insights-ink-pond-v3.
 * No MutationObserver and no polling.
 */
(() => {
  if (window.FocusWaveLotusOverlay) return;

  const REWARD_KEY='focuswave.dailyRewardStones.v2';
  const LOTUS_KEY='focuswave.dailyLotusPositions.v3';
  const LOTUS_URL=new URL('./assets/inkpond/ink-lotus-visible.svg',import.meta.url).href;
  const LOTUS_SIZES={small:46,medium:68,large:92};
  const LOTUS_KEYS=['small','medium','large'];
  const LOTUS_SLOTS=[
    [.28,.48],[.69,.65],[.47,.31],[.79,.38],[.36,.72],[.58,.52],
    [.18,.65],[.72,.77],[.40,.54],[.84,.60],[.55,.79],[.30,.30]
  ];

  let items=[];
  let dragging=null;

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rand=(a,b)=>a+Math.random()*(b-a);
  const localDayKey=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const randomSize=()=>LOTUS_KEYS[Math.floor(Math.random()*LOTUS_KEYS.length)];

  function rewardCount(){
    let state=null;
    try{state=JSON.parse(localStorage.getItem(REWARD_KEY)||'null')}catch(_){ }
    return state&&state.date===localDayKey()&&Array.isArray(state.stones)?state.stones.length:0;
  }

  function readState(){
    let state=null;
    try{state=JSON.parse(localStorage.getItem(LOTUS_KEY)||'null')}catch(_){ }
    if(!state||state.date!==localDayKey()||!Array.isArray(state.lotus)) return {date:localDayKey(),lotus:[]};
    return state;
  }

  function writeState(){
    localStorage.setItem(LOTUS_KEY,JSON.stringify({
      date:localDayKey(),
      lotus:items.map(item=>({id:item.id,x:item.x,y:item.y,size:item.size}))
    }));
  }

  function defaultItem(index){
    const slot=LOTUS_SLOTS[index%LOTUS_SLOTS.length];
    return {
      id:`lotus-${Date.now()}-${index}-${Math.floor(Math.random()*100000)}`,
      x:clamp(slot[0]+rand(-.018,.018),.07,.93),
      y:clamp(slot[1]+rand(-.018,.018),.10,.90),
      size:randomSize()
    };
  }

  function normalize(){
    const count=rewardCount();
    const state=readState();
    items=state.lotus.slice(0,count).map((item,index)=>({
      id:item.id||`lotus-${index}`,
      x:clamp(Number(item.x)||.5,.07,.93),
      y:clamp(Number(item.y)||.5,.10,.90),
      size:LOTUS_SIZES[item.size]?item.size:randomSize()
    }));
    while(items.length<count)items.push(defaultItem(items.length));
    writeState();
    return count;
  }

  function ensureStyles(){
    if(document.querySelector('style[data-focuswave-lotus-overlay]'))return;
    const style=document.createElement('style');
    style.dataset.focuswaveLotusOverlay='true';
    style.textContent=`
      #fwInkPondFrame,#page-insights .fw-ink-frame{position:relative}
      #fwLotusOverlay{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:hidden;border-radius:inherit}
      #fwLotusOverlay .fw-visible-lotus{position:absolute;display:block;transform:translate(-50%,-50%);pointer-events:auto;cursor:grab;user-select:none;-webkit-user-drag:none;touch-action:none;filter:drop-shadow(0 4px 7px rgba(78,70,61,.08));}
      #fwLotusOverlay .fw-visible-lotus:active{cursor:grabbing}
    `;
    document.head.appendChild(style);
  }

  function ensureLayer(){
    const frame=document.querySelector('#page-insights .fw-ink-frame');
    if(!frame)return null;
    let layer=frame.querySelector('#fwLotusOverlay');
    if(!layer){
      layer=document.createElement('div');
      layer.id='fwLotusOverlay';
      layer.setAttribute('aria-label','今日获得的莲花');
      frame.appendChild(layer);
    }
    return layer;
  }

  function render(){
    ensureStyles();
    normalize();
    const layer=ensureLayer();
    if(!layer)return false;
    layer.replaceChildren();
    items.forEach((item,index)=>{
      const img=document.createElement('img');
      img.className='fw-visible-lotus';
      img.src=LOTUS_URL;
      img.alt='';
      img.draggable=false;
      img.dataset.index=String(index);
      img.style.left=`${item.x*100}%`;
      img.style.top=`${item.y*100}%`;
      const size=LOTUS_SIZES[item.size];
      img.style.width=`${size}px`;
      img.style.height=`${size}px`;
      img.addEventListener('pointerdown',event=>{
        if(event.button!==0)return;
        dragging={index,pointerId:event.pointerId};
        img.setPointerCapture?.(event.pointerId);
        event.preventDefault();
        event.stopPropagation();
      });
      img.addEventListener('pointermove',event=>{
        if(!dragging||dragging.index!==index)return;
        const rect=layer.getBoundingClientRect();
        item.x=clamp((event.clientX-rect.left)/rect.width,.055,.945);
        item.y=clamp((event.clientY-rect.top)/rect.height,.08,.92);
        img.style.left=`${item.x*100}%`;
        img.style.top=`${item.y*100}%`;
        event.preventDefault();
      });
      const endDrag=event=>{
        if(!dragging||dragging.index!==index)return;
        dragging=null;
        try{img.releasePointerCapture?.(event.pointerId)}catch(_){ }
        writeState();
        try{window.FocusWaveInkPondV3?.sync?.()}catch(_){ }
        event.stopPropagation();
      };
      img.addEventListener('pointerup',endDrag);
      img.addEventListener('pointercancel',endDrag);
      layer.appendChild(img);
    });
    return true;
  }

  function syncSoon(){[0,70,180,420,900,1400].forEach(delay=>setTimeout(render,delay));}

  document.addEventListener('click',event=>{
    const target=event.target?.closest?.('button,[data-nav],[data-go]');
    if(!target)return;
    if(target.matches('[data-nav="insights"],[data-go="insights"],#finishBtn'))syncSoon();
  },{capture:true});

  window.addEventListener('focuswave:daily-reward-updated',syncSoon);
  window.addEventListener('pageshow',syncSoon,{once:true});
  window.addEventListener('resize',()=>requestAnimationFrame(render));

  window.FocusWaveLotusOverlay={sync:syncSoon,render};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncSoon,{once:true});else syncSoon();
})();
