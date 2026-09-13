/* FocusWave visible lotus overlay v4.
 * Uses a verified transparent lotus PNG written directly to this repo.
 * No MutationObserver and no polling.
 */
(() => {
  if (window.FocusWaveLotusOverlayV4) return;

  const REWARD_KEY='focuswave.dailyRewardStones.v2';
  const LOTUS_KEY='focuswave.dailyLotusPositions.v3';
  const LOTUS_URL=new URL('./assets/inkpond/ink-lotus-approved-visible-92.png',import.meta.url).href;
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
  const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const randomSize=()=>LOTUS_KEYS[Math.floor(Math.random()*LOTUS_KEYS.length)];

  function rewardCount(){
    let s=null;
    try{s=JSON.parse(localStorage.getItem(REWARD_KEY)||'null')}catch(_){ }
    return s&&s.date===dayKey()&&Array.isArray(s.stones)?s.stones.length:0;
  }

  function readState(){
    let s=null;
    try{s=JSON.parse(localStorage.getItem(LOTUS_KEY)||'null')}catch(_){ }
    return s&&s.date===dayKey()&&Array.isArray(s.lotus)?s:{date:dayKey(),lotus:[]};
  }

  function save(){
    localStorage.setItem(LOTUS_KEY,JSON.stringify({date:dayKey(),lotus:items.map(x=>({id:x.id,x:x.x,y:x.y,size:x.size}))}));
  }

  function defaultItem(i){
    const p=LOTUS_SLOTS[i%LOTUS_SLOTS.length];
    return {id:`lotus-${Date.now()}-${i}-${Math.floor(Math.random()*100000)}`,x:clamp(p[0]+rand(-.018,.018),.07,.93),y:clamp(p[1]+rand(-.018,.018),.10,.90),size:randomSize()};
  }

  function normalize(){
    const count=rewardCount();
    const state=readState();
    items=state.lotus.slice(0,count).map((x,i)=>({id:x.id||`lotus-${i}`,x:clamp(Number(x.x)||.5,.07,.93),y:clamp(Number(x.y)||.5,.10,.90),size:LOTUS_SIZES[x.size]?x.size:randomSize()}));
    while(items.length<count)items.push(defaultItem(items.length));
    save();
    return count;
  }

  function ensureStyle(){
    let style=document.querySelector('style[data-focuswave-lotus-overlay-v4]');
    if(style)return;
    style=document.createElement('style');
    style.dataset.focuswaveLotusOverlayV4='true';
    style.textContent=`
      #page-insights .fw-ink-frame{position:relative!important}
      #fwLotusOverlayV4{position:absolute!important;inset:0!important;z-index:999!important;pointer-events:none!important;overflow:hidden!important;border-radius:inherit!important}
      #fwLotusOverlayV4 .fw-visible-lotus-v4{position:absolute!important;display:block!important;max-width:none!important;transform:translate(-50%,-50%)!important;pointer-events:auto!important;cursor:grab!important;user-select:none!important;-webkit-user-drag:none!important;touch-action:none!important;opacity:1!important;visibility:visible!important;filter:drop-shadow(0 4px 7px rgba(78,70,61,.10))!important}
      #fwLotusOverlayV4 .fw-visible-lotus-v4:active{cursor:grabbing!important}
    `;
    document.head.appendChild(style);
  }

  function frame(){return document.querySelector('#page-insights .fw-ink-frame')}

  function ensureLayer(){
    const host=frame();
    if(!host)return null;
    let layer=host.querySelector('#fwLotusOverlayV4');
    if(!layer){layer=document.createElement('div');layer.id='fwLotusOverlayV4';host.appendChild(layer)}
    return layer;
  }

  function render(){
    ensureStyle();
    normalize();
    const layer=ensureLayer();
    if(!layer)return false;
    layer.replaceChildren();
    items.forEach((item,index)=>{
      const img=new Image();
      img.className='fw-visible-lotus-v4';
      img.alt='';
      img.draggable=false;
      img.src=LOTUS_URL;
      img.dataset.index=String(index);
      const size=LOTUS_SIZES[item.size];
      Object.assign(img.style,{left:`${item.x*100}%`,top:`${item.y*100}%`,width:`${size}px`,height:`${size}px`});
      img.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging={index,pointerId:e.pointerId};img.setPointerCapture?.(e.pointerId);e.preventDefault();e.stopPropagation()});
      img.addEventListener('pointermove',e=>{if(!dragging||dragging.index!==index)return;const r=layer.getBoundingClientRect();item.x=clamp((e.clientX-r.left)/r.width,.055,.945);item.y=clamp((e.clientY-r.top)/r.height,.08,.92);img.style.left=`${item.x*100}%`;img.style.top=`${item.y*100}%`;e.preventDefault()});
      const end=e=>{if(!dragging||dragging.index!==index)return;dragging=null;try{img.releasePointerCapture?.(e.pointerId)}catch(_){ }save();e.stopPropagation()};
      img.addEventListener('pointerup',end);img.addEventListener('pointercancel',end);
      layer.appendChild(img);
    });
    return true;
  }

  function sync(){[0,80,220,500,1000,1600].forEach(ms=>setTimeout(render,ms))}
  document.addEventListener('click',e=>{const t=e.target?.closest?.('button,[data-nav],[data-go]');if(t?.matches?.('[data-nav="insights"],[data-go="insights"],#finishBtn'))sync()},{capture:true});
  window.addEventListener('focuswave:daily-reward-updated',sync);
  window.addEventListener('resize',()=>requestAnimationFrame(render));
  window.FocusWaveLotusOverlayV4={sync,render};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
})();
