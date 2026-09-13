/* FocusWave insight ink pond v3.
 * Static ink-wash lotus-leaf background + reusable fish/lotus art assets.
 * Reward lotuses use three persisted random sizes; fish share one asset with three sizes.
 * No MutationObserver and no polling.
 */
(() => {
  if (window.FocusWaveInkPondV3) return;

  const REWARD_KEY='focuswave.dailyRewardStones.v2';
  const LOTUS_KEY='focuswave.dailyLotusPositions.v3';
  const BG_URL=new URL('./assets/inkpond/pond-background.svg',import.meta.url).href;
  const FISH_URL=new URL('./assets/inkpond/ink-fish.svg',import.meta.url).href;
  const LOTUS_URL=new URL('./assets/inkpond/ink-lotus-approved.png',import.meta.url).href;
  const LOTUS_SIZES={small:46,medium:68,large:92};
  const LOTUS_KEYS=['small','medium','large'];
  const LOTUS_SLOTS=[
    [.28,.48],[.69,.65],[.47,.31],[.79,.38],[.36,.72],[.58,.52],
    [.18,.65],[.72,.77],[.40,.54],[.84,.60],[.55,.79],[.30,.30]
  ];

  let page=null,shell=null,canvas=null,ctx=null;
  let width=0,height=0,dpr=1,raf=0,lastTime=performance.now();
  let resizeObserver=null,midnightTimer=0,feedCooldown=false;
  let bgImage=null,fishImage=null,lotusImage=null,assetsReady=false;
  let lotus=[],fish=[],food=[],ripples=[],dragging=-1;

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rand=(a,b)=>a+Math.random()*(b-a);
  const localDayKey=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

  function rewardCount(){
    let state=null;
    try{state=JSON.parse(localStorage.getItem(REWARD_KEY)||'null')}catch(_){ }
    return state&&state.date===localDayKey()&&Array.isArray(state.stones)?state.stones.length:0;
  }

  function randomLotusSize(){return LOTUS_KEYS[Math.floor(Math.random()*LOTUS_KEYS.length)]}

  function defaultLotus(index){
    const slot=LOTUS_SLOTS[index%LOTUS_SLOTS.length];
    return {
      id:`lotus-${Date.now()}-${index}-${Math.floor(Math.random()*100000)}`,
      x:clamp(slot[0]+rand(-.018,.018),.07,.93),
      y:clamp(slot[1]+rand(-.018,.018),.10,.90),
      size:randomLotusSize()
    };
  }

  function readLotusState(){
    let state=null;
    try{state=JSON.parse(localStorage.getItem(LOTUS_KEY)||'null')}catch(_){ }
    if(!state||state.date!==localDayKey()||!Array.isArray(state.lotus)) return {date:localDayKey(),lotus:[]};
    return state;
  }

  function writeLotusState(){
    localStorage.setItem(LOTUS_KEY,JSON.stringify({
      date:localDayKey(),
      lotus:lotus.map(item=>({id:item.id,x:item.x,y:item.y,size:item.size}))
    }));
  }

  function syncLotus(){
    const count=rewardCount();
    const state=readLotusState();
    lotus=state.lotus.slice(0,count).map((item,index)=>({
      id:item.id||`lotus-${index}`,
      x:clamp(Number(item.x)||.5,.07,.93),
      y:clamp(Number(item.y)||.5,.10,.90),
      size:LOTUS_SIZES[item.size]?item.size:randomLotusSize()
    }));
    while(lotus.length<count) lotus.push(defaultLotus(lotus.length));
    writeLotusState();
    const n=shell?.querySelector('#fwInkLotusCount');
    if(n)n.textContent=String(count);
  }

  function loadImage(src){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=reject;
      img.src=src;
    });
  }

  async function prepareAssets(){
    try{
      [bgImage,fishImage,lotusImage]=await Promise.all([loadImage(BG_URL),loadImage(FISH_URL),loadImage(LOTUS_URL)]);
      assetsReady=true;
    }catch(err){
      console.error('FocusWave ink pond assets failed',err);
      assetsReady=false;
    }
  }

  function ensureStyles(){
    if(document.querySelector('style[data-focuswave-ink-v3]'))return;
    const style=document.createElement('style');
    style.dataset.focuswaveInkV3='true';
    style.textContent=`
      #page-insights{padding:0!important;background:#f6f3ec!important;color:#303632!important;min-height:100vh!important}
      #page-insights>:not(#fwInkPondShell){display:none!important}
      #fwInkPondShell{min-height:100vh;padding:38px 5.4vw 58px;box-sizing:border-box;background:linear-gradient(180deg,#faf8f3,#f5f1e9)}
      .fw-ink-head{display:flex;align-items:flex-end;justify-content:space-between;gap:34px;margin-bottom:24px}
      .fw-ink-title-row{display:flex;align-items:baseline;gap:14px}.fw-ink-title{margin:0;font-family:var(--human);font-size:40px;font-weight:400;letter-spacing:.06em;color:#303632}.fw-ink-title-en{font-family:Georgia,serif;font-size:17px;color:#858a84}
      .fw-ink-sub{margin-top:8px;font-family:var(--human);font-size:14px;color:#8a8e89;letter-spacing:.04em}
      .fw-ink-actions{display:flex;align-items:center;gap:14px;padding-bottom:2px}.fw-ink-count{display:flex;align-items:center;gap:8px;font-size:12px;color:#747a75;white-space:nowrap}.fw-ink-count i{width:15px;height:15px;border-radius:50%;display:block;background:radial-gradient(circle at 34% 30%,#f5dddd 0 28%,#c77d88 74%,#a86170 100%);box-shadow:0 2px 6px rgba(116,75,83,.14)}.fw-ink-count strong{font-size:17px;font-weight:450;color:#414943;font-variant-numeric:tabular-nums}
      .fw-feed-btn{height:40px;padding:0 17px;border:1px solid rgba(52,62,56,.12);border-radius:999px;background:rgba(255,255,255,.60);color:#55605a;font-family:var(--human);font-size:13px;cursor:pointer;box-shadow:0 5px 16px rgba(65,71,65,.06);transition:.18s}.fw-feed-btn:hover{background:#fff;transform:translateY(-1px)}.fw-feed-btn:active{transform:none}.fw-feed-btn[disabled]{opacity:.55;cursor:default;transform:none}
      .fw-ink-frame{position:relative;height:min(53vw,640px);min-height:460px;border:1px solid rgba(54,65,59,.07);border-radius:24px;overflow:hidden;background:#f6f1e7;box-shadow:0 24px 52px rgba(49,55,50,.07)}
      #fwInkPondCanvas{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair}.fw-ink-hint{position:absolute;left:24px;bottom:18px;padding:7px 11px;border-radius:999px;background:rgba(251,249,243,.78);backdrop-filter:blur(5px);font-size:11px;color:#7e8580;pointer-events:none}.fw-ink-caption{margin-top:12px;text-align:center;font-family:var(--human);font-size:12px;color:#8a8f8a;letter-spacing:.04em}
      @media(max-width:900px){#fwInkPondShell{padding:28px 22px 46px}.fw-ink-head{align-items:flex-start;flex-direction:column;gap:16px}.fw-ink-actions{width:100%;justify-content:space-between}.fw-ink-title{font-size:34px}.fw-ink-frame{height:68vh;min-height:420px}}
    `;
    document.head.appendChild(style);
  }

  function shellMarkup(){
    return `<div class="fw-ink-head"><div><div class="fw-ink-title-row"><h1 class="fw-ink-title">洞察</h1><span class="fw-ink-title-en">/ Personal Baseline</span></div><div class="fw-ink-sub">一池墨色，记录今日专注</div></div><div class="fw-ink-actions"><div class="fw-ink-count"><i aria-hidden="true"></i><span>今日莲花</span><strong id="fwInkLotusCount">0</strong></div><button class="fw-feed-btn" id="fwFeedFish" type="button">撒一把鱼粮</button></div></div><div class="fw-ink-frame"><canvas id="fwInkPondCanvas" aria-label="可交互的水墨莲池"></canvas><div class="fw-ink-hint">拖动莲花调整位置 · 点击水面激起涟漪</div></div><div class="fw-ink-caption">每完成一次专注，今日水面会多一朵随机大小的莲花；每日 24:00 重新归于空白。</div>`;
  }

  function resize(){
    if(!canvas)return;
    const r=canvas.getBoundingClientRect();
    width=Math.max(10,r.width);height=Math.max(10,r.height);dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  }

  function initFish(){
    fish=[
      {x:.29,y:.33,size:58,vx:.027,vy:.012,targetX:.64,targetY:.31,retarget:0},
      {x:.62,y:.55,size:82,vx:-.022,vy:.014,targetX:.34,targetY:.61,retarget:0},
      {x:.49,y:.74,size:108,vx:.018,vy:-.017,targetX:.79,targetY:.67,retarget:0}
    ];
  }

  function mount(){
    page=document.querySelector('#page-insights');
    if(!page)return false;
    ensureStyles();
    let node=page.querySelector('#fwInkPondShell');
    if(!node||node.dataset.version!=='3'){
      node?.remove();node=document.createElement('section');node.id='fwInkPondShell';node.dataset.version='3';node.innerHTML=shellMarkup();page.appendChild(node);
    }
    if(shell!==node){
      stopScene();shell=node;canvas=shell.querySelector('#fwInkPondCanvas');ctx=canvas.getContext('2d');
      bindShell();resize();initFish();syncLotus();lastTime=performance.now();
      resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);raf=requestAnimationFrame(frameLoop);
    }else syncLotus();
    return true;
  }

  function bindShell(){
    shell.querySelector('#fwFeedFish')?.addEventListener('click',feedFish);
    canvas.addEventListener('pointerdown',onPointerDown);canvas.addEventListener('pointermove',onPointerMove);canvas.addEventListener('pointerup',onPointerUp);canvas.addEventListener('pointercancel',onPointerUp);
  }

  function canvasPoint(event){const r=canvas.getBoundingClientRect();return{x:event.clientX-r.left,y:event.clientY-r.top}}
  function lotusRadius(item){return LOTUS_SIZES[item.size]/2}
  function hitLotus(p){for(let i=lotus.length-1;i>=0;i--){const l=lotus[i],dx=p.x-l.x*width,dy=p.y-l.y*height;if(Math.hypot(dx,dy)<lotusRadius(l)*1.08)return i}return-1}
  function onPointerDown(event){if(event.button!==0)return;const p=canvasPoint(event),hit=hitLotus(p);if(hit>=0){dragging=hit;canvas.setPointerCapture?.(event.pointerId);canvas.style.cursor='grabbing'}else addRipple(p.x,p.y,1);event.preventDefault()}
  function onPointerMove(event){const p=canvasPoint(event);if(dragging>=0){const l=lotus[dragging];l.x=clamp(p.x/width,.055,.945);l.y=clamp(p.y/height,.08,.92);event.preventDefault()}canvas.style.cursor=dragging>=0?'grabbing':(hitLotus(p)>=0?'grab':'crosshair')}
  function onPointerUp(event){if(dragging>=0){dragging=-1;writeLotusState()}try{canvas.releasePointerCapture?.(event.pointerId)}catch(_){ }canvas.style.cursor='crosshair'}

  function addRipple(x,y,strength=.8){ripples.push({x,y,age:0,duration:1.8,strength});if(ripples.length>18)ripples.shift()}

  function feedFish(){
    if(feedCooldown)return;feedCooldown=true;const button=shell.querySelector('#fwFeedFish');if(button)button.disabled=true;
    for(let i=0;i<24;i++)food.push({x:width*.86+rand(-10,10),y:-rand(6,38),vx:rand(-18,7),vy:rand(55,92),landX:width*rand(.58,.87),landY:height*rand(.20,.43),landed:false,eaten:false,age:0,r:rand(1.1,2.2)});
    setTimeout(()=>{feedCooldown=false;if(button)button.disabled=false},850);
  }

  function nearestFood(f){let best=null,bestD=Infinity;for(const grain of food){if(!grain.landed||grain.eaten)continue;const dx=grain.x/width-f.x,dy=grain.y/height-f.y,d=dx*dx+dy*dy;if(d<bestD){bestD=d;best=grain}}return best}

  function update(dt,now){
    for(const grain of food){grain.age+=dt;if(grain.eaten)continue;if(!grain.landed){grain.vy+=85*dt;grain.x+=grain.vx*dt;grain.y+=grain.vy*dt;grain.x+=(grain.landX-grain.x)*dt*1.2;if(grain.y>=grain.landY){grain.x=grain.landX;grain.y=grain.landY;grain.landed=true;addRipple(grain.x,grain.y,.24)}}}
    food=food.filter(g=>!g.eaten&&g.age<13);
    for(const f of fish){
      const grain=nearestFood(f);
      if(!grain&&(now>f.retarget||Math.hypot(f.targetX-f.x,f.targetY-f.y)<.07)){f.targetX=rand(.14,.86);f.targetY=rand(.15,.85);f.retarget=now+rand(2800,6100)}
      const tx=grain?grain.x/width:f.targetX,ty=grain?grain.y/height:f.targetY,speed=grain?.15:.05;const dx=tx-f.x,dy=ty-f.y,len=Math.hypot(dx,dy)||1,steer=grain?2.7:1.15;
      f.vx+=(dx/len*speed-f.vx)*clamp(dt*steer,0,1);f.vy+=(dy/len*speed-f.vy)*clamp(dt*steer,0,1);f.x=clamp(f.x+f.vx*dt,.06,.94);f.y=clamp(f.y+f.vy*dt,.08,.92);
      if(grain&&Math.hypot(grain.x-f.x*width,grain.y-f.y*height)<f.size*.30){grain.eaten=true;addRipple(grain.x,grain.y,.30)}
    }
    ripples.forEach(r=>r.age+=dt);ripples=ripples.filter(r=>r.age<r.duration);
  }

  function drawCover(img){
    const ir=img.width/img.height,cr=width/height;let sx=0,sy=0,sw=img.width,sh=img.height;
    if(ir>cr){sw=img.height*cr;sx=(img.width-sw)/2}else{sh=img.width/cr;sy=(img.height-sh)/2}
    ctx.drawImage(img,sx,sy,sw,sh,0,0,width,height);
  }

  function drawBackground(){ctx.fillStyle='#f6f1e7';ctx.fillRect(0,0,width,height);if(assetsReady)drawCover(bgImage)}
  function drawLotus(item){if(!assetsReady)return;const size=LOTUS_SIZES[item.size];ctx.save();ctx.translate(item.x*width,item.y*height);ctx.globalAlpha=.98;ctx.drawImage(lotusImage,-size/2,-size/2,size,size);ctx.restore()}
  function drawFish(f){if(!assetsReady)return;const angle=Math.atan2(f.vy,f.vx)-Math.PI/2;const h=f.size,w=h*(fishImage.width/fishImage.height);ctx.save();ctx.translate(f.x*width,f.y*height);ctx.rotate(angle);ctx.globalAlpha=.91;ctx.drawImage(fishImage,-w/2,-h/2,w,h);ctx.restore()}
  function drawRipples(){ctx.save();for(const r of ripples){const t=r.age/r.duration,ease=1-Math.pow(1-t,2);for(let i=0;i<4;i++){const radius=(12+i*12+ease*58)*r.strength;ctx.strokeStyle=`rgba(67,79,72,${Math.max(0,(1-t)*(.15-i*.027)*r.strength)})`;ctx.lineWidth=.85;ctx.beginPath();ctx.arc(r.x,r.y,radius,0,Math.PI*2);ctx.stroke()}}ctx.restore()}
  function drawFood(){for(const g of food){ctx.fillStyle=g.landed?'rgba(117,86,53,.72)':'rgba(132,94,55,.62)';ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill()}}
  function draw(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);drawBackground();drawRipples();lotus.forEach(drawLotus);fish.forEach(drawFish);drawFood()}

  function frameLoop(now){if(!canvas?.isConnected)return;const dt=Math.min(.035,(now-lastTime)/1000||.016);lastTime=now;if(!document.hidden){update(dt,now);draw()}raf=requestAnimationFrame(frameLoop)}
  function stopScene(){cancelAnimationFrame(raf);raf=0;resizeObserver?.disconnect();resizeObserver=null}

  function scheduleMidnight(){clearTimeout(midnightTimer);const now=new Date(),next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,0,80);midnightTimer=setTimeout(()=>{localStorage.setItem(LOTUS_KEY,JSON.stringify({date:localDayKey(),lotus:[]}));lotus=[];syncLotus();food=[];ripples=[];scheduleMidnight()},Math.max(1000,next.getTime()-Date.now()))}
  function mountSoon(){[0,80,220,520,980].forEach(delay=>setTimeout(mount,delay))}
  function boot(){prepareAssets().finally(mountSoon);scheduleMidnight();document.addEventListener('click',event=>{if(event.target?.closest?.('[data-nav="insights"],[data-go="insights"],#finishBtn'))mountSoon()},{capture:true});window.addEventListener('pageshow',mountSoon,{once:true})}

  window.FocusWaveInkPondV3={mount,sync:syncLotus,feed:feedFish};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();