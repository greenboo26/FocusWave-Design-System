/* FocusWave insight ink pond v2.
 * Overhead Chinese ink-wash pond inspired by the approved visual sample.
 * Three fish use clearly different sizes. Every completed focus session awards
 * one draggable lotus with a persistent random small/medium/large size.
 * Local midnight clears today's lotus arrangement. Feeding attracts fish and
 * clicking water creates top-down circular ripples.
 * No MutationObserver and no polling.
 */
(() => {
  if (window.FocusWaveInkPondV2) return;

  const REWARD_KEY = 'focuswave.dailyRewardStones.v2';
  const LOTUS_KEY = 'focuswave.dailyLotusPositions.v2';
  const OLD_LOTUS_KEY = 'focuswave.dailyLotusPositions.v1';
  const MOUNT_RETRIES = [0, 80, 220, 520, 980];
  const LOTUS_SLOTS = [
    [.24,.45],[.72,.64],[.48,.29],[.78,.38],[.34,.72],[.58,.52],
    [.18,.66],[.72,.76],[.40,.49],[.86,.61],[.55,.79],[.29,.55]
  ];
  const LOTUS_SIZES = {
    small:{key:'small',radius:24},
    medium:{key:'medium',radius:32},
    large:{key:'large',radius:42}
  };
  const LOTUS_SIZE_KEYS = Object.keys(LOTUS_SIZES);

  let page=null,shell=null,canvas=null,ctx=null,background=null;
  let raf=0,resizeObserver=null,midnightTimer=0,lastTime=performance.now();
  let dpr=1,width=0,height=0,lotus=[],fish=[],food=[],ripples=[];
  let draggingLotus=-1,feedCooldown=false;

  function localDayKey(date=new Date()){
    const y=date.getFullYear();
    const m=String(date.getMonth()+1).padStart(2,'0');
    const d=String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function rand(min,max){return min+Math.random()*(max-min);}
  function lerp(a,b,t){return a+(b-a)*t;}
  function pick(list){return list[Math.floor(Math.random()*list.length)];}

  function rewardCount(){
    let state=null;
    try{state=JSON.parse(localStorage.getItem(REWARD_KEY)||'null');}catch(_){ }
    if(!state||state.date!==localDayKey()||!Array.isArray(state.stones))return 0;
    return state.stones.length;
  }

  function randomLotusSize(){return pick(LOTUS_SIZE_KEYS);}

  function defaultLotus(index){
    const slot=LOTUS_SLOTS[index%LOTUS_SLOTS.length];
    const cycle=Math.floor(index/LOTUS_SLOTS.length);
    const jitter=cycle?.035:.018;
    return {
      id:`lotus-${Date.now()}-${index}-${Math.floor(Math.random()*10000)}`,
      x:clamp(slot[0]+rand(-jitter,jitter),.08,.92),
      y:clamp(slot[1]+rand(-jitter,jitter),.12,.86),
      sizeVariant:randomLotusSize(),
      tone:index%3,
      rotation:rand(-.18,.18)
    };
  }

  function readLotusState(){
    let state=null;
    try{state=JSON.parse(localStorage.getItem(LOTUS_KEY)||'null');}catch(_){ }
    if(!state||state.date!==localDayKey()||!Array.isArray(state.lotus)){
      let old=null;
      try{old=JSON.parse(localStorage.getItem(OLD_LOTUS_KEY)||'null');}catch(_){ }
      state={date:localDayKey(),lotus:old?.date===localDayKey()&&Array.isArray(old.lotus)?old.lotus:[]};
    }
    return state;
  }

  function normalizeLotus(item,index){
    const base=defaultLotus(index);
    const variant=LOTUS_SIZES[item?.sizeVariant]?item.sizeVariant:randomLotusSize();
    return {
      ...base,...item,
      x:clamp(Number(item?.x)||base.x,.065,.935),
      y:clamp(Number(item?.y)||base.y,.09,.91),
      sizeVariant:variant,
      tone:Number.isFinite(Number(item?.tone))?Number(item.tone):index%3,
      rotation:Number.isFinite(Number(item?.rotation))?Number(item.rotation):base.rotation
    };
  }

  function writeLotusState(items){
    localStorage.setItem(LOTUS_KEY,JSON.stringify({
      date:localDayKey(),
      lotus:items.map(item=>({
        id:item.id,x:item.x,y:item.y,sizeVariant:item.sizeVariant,
        tone:item.tone,rotation:item.rotation
      }))
    }));
  }

  function syncLotus(){
    const count=rewardCount();
    const state=readLotusState();
    lotus=state.lotus.slice(0,count).map(normalizeLotus);
    while(lotus.length<count)lotus.push(defaultLotus(lotus.length));
    writeLotusState(lotus);
    const el=shell?.querySelector('#fwInkLotusCount');
    if(el)el.textContent=String(count);
  }

  function ensureStyles(){
    if(document.querySelector('style[data-focuswave-ink-pond-v2]'))return;
    const style=document.createElement('style');
    style.dataset.focuswaveInkPondV2='true';
    style.textContent=`
      #page-insights{padding:0!important;background:#f5f3ed!important;color:#303632!important;min-height:100vh!important}
      #page-insights > :not(#fwInkPondShellV2){display:none!important}
      #fwInkPondShellV2{min-height:100vh;padding:38px 5.4vw 58px;box-sizing:border-box;background:radial-gradient(circle at 16% 12%,rgba(255,255,255,.74),transparent 30%),linear-gradient(180deg,#faf8f3 0%,#f4f1e9 100%)}
      .fw-ink2-head{display:flex;align-items:flex-end;justify-content:space-between;gap:36px;margin:0 0 24px}
      .fw-ink2-title-row{display:flex;align-items:baseline;gap:14px}
      .fw-ink2-title{margin:0;font-family:var(--human);font-size:40px;font-weight:400;letter-spacing:.06em;color:#303632}
      .fw-ink2-title-en{font-family:Georgia,serif;font-size:17px;color:#858a84}
      .fw-ink2-sub{margin-top:8px;font-family:var(--human);font-size:14px;color:#8a8e89;letter-spacing:.04em}
      .fw-ink2-actions{display:flex;align-items:center;gap:14px;padding-bottom:2px}
      .fw-ink2-count{display:flex;align-items:center;gap:8px;font-size:12px;color:#747a75;white-space:nowrap}
      .fw-ink2-count i{width:15px;height:15px;border-radius:50%;display:block;background:radial-gradient(circle at 34% 30%,rgba(255,244,245,.98),transparent 25%),radial-gradient(circle at 50% 55%,#ddaeb3 0 28%,#c98b93 65%,#a96873 100%);box-shadow:0 2px 6px rgba(116,75,83,.12)}
      .fw-ink2-count strong{font-size:17px;font-weight:450;color:#414943;font-variant-numeric:tabular-nums}
      .fw-ink2-feed{height:40px;padding:0 17px;border:1px solid rgba(52,62,56,.12);border-radius:999px;background:rgba(255,255,255,.60);color:#55605a;font-family:var(--human);font-size:13px;letter-spacing:.03em;cursor:pointer;box-shadow:0 5px 16px rgba(65,71,65,.06);transition:.18s}
      .fw-ink2-feed:hover{background:rgba(255,255,255,.90);transform:translateY(-1px)}
      .fw-ink2-feed:active{transform:translateY(0)}
      .fw-ink2-feed[disabled]{opacity:.55;cursor:default;transform:none}
      .fw-ink2-frame{position:relative;height:min(58vw,640px);min-height:460px;border:1px solid rgba(54,65,59,.07);border-radius:24px;overflow:hidden;background:#f8f4e9;box-shadow:0 24px 52px rgba(49,55,50,.07),inset 0 1px rgba(255,255,255,.78)}
      #fwInkPondCanvasV2{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair}
      .fw-ink2-hint{position:absolute;left:24px;bottom:18px;padding:7px 11px;border-radius:999px;background:rgba(249,247,241,.74);backdrop-filter:blur(5px);font-size:11px;color:#7e8580;pointer-events:none;letter-spacing:.02em}
      .fw-ink2-caption{margin-top:12px;text-align:center;font-family:var(--human);font-size:12px;color:#8a8f8a;letter-spacing:.04em}
      @media(max-width:900px){#fwInkPondShellV2{padding:28px 22px 46px}.fw-ink2-head{align-items:flex-start;flex-direction:column;gap:16px}.fw-ink2-actions{align-self:stretch;justify-content:space-between}.fw-ink2-title{font-size:34px}.fw-ink2-frame{height:68vh;min-height:420px}}
    `;
    document.head.appendChild(style);
  }

  function shellMarkup(){
    return `
      <div class="fw-ink2-head">
        <div>
          <div class="fw-ink2-title-row"><h1 class="fw-ink2-title">洞察</h1><span class="fw-ink2-title-en">/ Personal Baseline</span></div>
          <div class="fw-ink2-sub">一池墨色，记录今日专注</div>
        </div>
        <div class="fw-ink2-actions">
          <div class="fw-ink2-count"><i aria-hidden="true"></i><span>今日莲花</span><strong id="fwInkLotusCount">0</strong></div>
          <button class="fw-ink2-feed" id="fwFeedFishV2" type="button">撒一把鱼粮</button>
        </div>
      </div>
      <div class="fw-ink2-frame">
        <canvas id="fwInkPondCanvasV2" aria-label="可交互的俯视水墨莲池"></canvas>
        <div class="fw-ink2-hint">拖动莲花调整位置 · 点击水面激起涟漪</div>
      </div>
      <div class="fw-ink2-caption">每完成一次专注，今日水面会多一朵随机大小的莲花；每日 24:00 重新归于空白。</div>`;
  }

  function ensureShell(){
    page=document.querySelector('#page-insights');
    if(!page)return false;
    ensureStyles();
    const old=page.querySelector('#fwInkPondShell');
    if(old)old.remove();
    let existing=page.querySelector('#fwInkPondShellV2');
    if(!existing){
      existing=document.createElement('section');
      existing.id='fwInkPondShellV2';
      existing.innerHTML=shellMarkup();
      page.appendChild(existing);
    }
    if(shell!==existing||canvas!==existing.querySelector('#fwInkPondCanvasV2')){
      stopScene();
      shell=existing;
      canvas=shell.querySelector('#fwInkPondCanvasV2');
      ctx=canvas.getContext('2d');
      bindShell();
      initScene();
    }
    syncLotus();
    return true;
  }

  function inkLeaf(c,x,y,r,rotation=.0,alpha=.27){
    c.save();c.translate(x,y);c.rotate(rotation);
    for(let layer=0;layer<4;layer++){
      const dx=(layer-1.5)*r*.025,dy=(1.5-layer)*r*.018;
      c.fillStyle=`rgba(83,108,91,${alpha*(.46+layer*.12)})`;
      c.beginPath();
      c.moveTo(dx+r*.08,dy-r*.04);
      c.bezierCurveTo(dx+r*.58,dy-r*.48,dx+r*.90,dy-r*.15,dx+r*.78,dy+r*.27);
      c.bezierCurveTo(dx+r*.60,dy+r*.70,dx+r*.04,dy+r*.77,dx-r*.43,dy+r*.48);
      c.bezierCurveTo(dx-r*.86,dy+r*.21,dx-r*.78,dy-r*.30,dx-r*.28,dy-r*.66);
      c.bezierCurveTo(dx-r*.03,dy-r*.80,dx+r*.12,dy-r*.42,dx+r*.08,dy-r*.04);
      c.closePath();c.fill();
    }
    c.strokeStyle=`rgba(73,91,77,${alpha*.78})`;c.lineWidth=.55;
    for(let i=0;i<10;i++){
      const a=-Math.PI*.82+i*(Math.PI*1.64/9);
      c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*r*.72,Math.sin(a)*r*.62);c.stroke();
    }
    c.restore();
  }

  function makeBackground(){
    if(!width||!height)return;
    background=document.createElement('canvas');
    background.width=Math.max(1,Math.round(width*dpr));
    background.height=Math.max(1,Math.round(height*dpr));
    const b=background.getContext('2d');
    b.setTransform(dpr,0,0,dpr,0,0);
    b.fillStyle='#f6f1e5';b.fillRect(0,0,width,height);

    const washSpots=[[.18,.20,.27,.065],[.82,.22,.24,.052],[.17,.77,.30,.060],[.83,.75,.30,.056],[.52,.48,.42,.022]];
    washSpots.forEach(([nx,ny,r,a])=>{
      const g=b.createRadialGradient(nx*width,ny*height,0,nx*width,ny*height,r*Math.min(width,height)*1.8);
      g.addColorStop(0,`rgba(91,112,98,${a})`);g.addColorStop(.55,`rgba(110,126,112,${a*.40})`);g.addColorStop(1,'rgba(255,255,255,0)');
      b.fillStyle=g;b.fillRect(0,0,width,height);
    });

    b.save();b.globalAlpha=.18;
    for(let i=0;i<1500;i++){
      const x=Math.random()*width,y=Math.random()*height;
      b.fillStyle=Math.random()>.5?'rgba(72,76,69,.025)':'rgba(255,255,255,.085)';
      b.fillRect(x,y,Math.random()*.9+.2,Math.random()*.5+.15);
    }
    b.restore();

    const s=Math.min(width,height);
    const leaves=[
      [.07,.12,.095,-.3,.34],[.15,.19,.052,.12,.26],[.06,.74,.11,.18,.34],[.17,.83,.065,-.12,.27],
      [.92,.13,.10,.22,.33],[.84,.20,.052,-.15,.25],[.93,.73,.11,-.20,.35],[.82,.84,.067,.14,.27],
      [.02,.38,.045,.15,.20],[.97,.42,.052,-.06,.22]
    ];
    leaves.forEach(([nx,ny,rr,rot,a])=>inkLeaf(b,nx*width,ny*height,rr*s,rot,a));
  }

  function resize(){
    if(!canvas)return;
    const r=canvas.getBoundingClientRect();
    dpr=Math.min(window.devicePixelRatio||1,2);
    width=Math.max(10,r.width);height=Math.max(10,r.height);
    const cw=Math.round(width*dpr),ch=Math.round(height*dpr);
    if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
    ctx.setTransform(dpr,0,0,dpr,0,0);makeBackground();
  }

  function initFish(){
    fish=[
      {x:.30,y:.31,vx:.026,vy:.010,size:13,phase:0,targetX:.65,targetY:.28,retarget:0,tone:0},
      {x:.62,y:.54,vx:-.021,vy:.015,size:19,phase:2.1,targetX:.28,targetY:.61,retarget:0,tone:1},
      {x:.50,y:.73,vx:.017,vy:-.018,size:25,phase:4.2,targetX:.79,targetY:.67,retarget:0,tone:2}
    ];
  }

  function initScene(){
    resize();initFish();food=[];ripples=[];draggingLotus=-1;
    resizeObserver?.disconnect();resizeObserver=new ResizeObserver(()=>resize());resizeObserver.observe(canvas);
    lastTime=performance.now();raf=requestAnimationFrame(frameLoop);
  }
  function stopScene(){cancelAnimationFrame(raf);raf=0;resizeObserver?.disconnect();resizeObserver=null;}

  function bindShell(){
    shell.querySelector('#fwFeedFishV2')?.addEventListener('click',feedFish);
    canvas.addEventListener('pointerdown',onPointerDown);
    canvas.addEventListener('pointermove',onPointerMove);
    canvas.addEventListener('pointerup',onPointerUp);
    canvas.addEventListener('pointercancel',onPointerUp);
  }
  function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  function lotusRadius(item){return LOTUS_SIZES[item.sizeVariant]?.radius||LOTUS_SIZES.medium.radius;}
  function hitLotus(p){
    for(let i=lotus.length-1;i>=0;i--){const item=lotus[i],dx=p.x-item.x*width,dy=p.y-item.y*height;if(Math.hypot(dx,dy)<lotusRadius(item)*1.05)return i;}
    return -1;
  }
  function onPointerDown(e){
    if(e.button!==0)return;const p=canvasPoint(e),hit=hitLotus(p);
    if(hit>=0){draggingLotus=hit;canvas.setPointerCapture?.(e.pointerId);canvas.style.cursor='grabbing';}
    else{addRipple(p.x,p.y,1);canvas.style.cursor='crosshair';}
    e.preventDefault();
  }
  function onPointerMove(e){
    const p=canvasPoint(e);
    if(draggingLotus>=0){const item=lotus[draggingLotus];item.x=clamp(p.x/width,.055,.945);item.y=clamp(p.y/height,.08,.92);canvas.style.cursor='grabbing';e.preventDefault();return;}
    canvas.style.cursor=hitLotus(p)>=0?'grab':'crosshair';
  }
  function onPointerUp(e){
    if(draggingLotus>=0){draggingLotus=-1;writeLotusState(lotus);canvas.style.cursor='crosshair';}
    try{canvas.releasePointerCapture?.(e.pointerId);}catch(_){ }
  }

  function addRipple(x,y,strength=.8){ripples.push({x,y,age:0,duration:1.9,strength});if(ripples.length>18)ripples.shift();}

  function feedFish(){
    if(feedCooldown||!width||!height)return;
    feedCooldown=true;const button=shell.querySelector('#fwFeedFishV2');if(button)button.disabled=true;
    const originX=width*.86,originY=-8;
    for(let i=0;i<26;i++){
      const landX=width*rand(.58,.88),landY=height*rand(.20,.44);
      food.push({x:originX+rand(-14,14),y:originY-rand(0,40),vx:rand(-18,10),vy:rand(55,95),landX,landY,age:0,landed:false,eaten:false,r:rand(1.1,2.2)});
    }
    setTimeout(()=>{feedCooldown=false;if(button)button.disabled=false;},850);
  }

  function nearestFood(f){let best=null,bestD=Infinity;for(const g of food){if(g.eaten||!g.landed)continue;const dx=g.x/width-f.x,dy=g.y/height-f.y,d=dx*dx+dy*dy;if(d<bestD){bestD=d;best=g;}}return best;}

  function updateFish(dt,now){
    for(const f of fish){
      f.phase+=dt*4.1;const grain=nearestFood(f);let tx,ty,speed;
      if(grain){tx=grain.x/width;ty=grain.y/height;speed=.15;}
      else{
        if(now>f.retarget||Math.hypot(f.targetX-f.x,f.targetY-f.y)<.08){f.targetX=rand(.14,.86);f.targetY=rand(.15,.85);f.retarget=now+rand(3000,6500);}
        tx=f.targetX;ty=f.targetY;speed=.052;
      }
      const dx=tx-f.x,dy=ty-f.y,len=Math.hypot(dx,dy)||1;const desiredX=dx/len*speed,desiredY=dy/len*speed;const steer=grain?2.7:1.18;
      f.vx=lerp(f.vx,desiredX,clamp(dt*steer,0,1));f.vy=lerp(f.vy,desiredY,clamp(dt*steer,0,1));f.x+=f.vx*dt;f.y+=f.vy*dt;
      if(f.x<.07||f.x>.93)f.vx*=-1;if(f.y<.09||f.y>.91)f.vy*=-1;f.x=clamp(f.x,.065,.935);f.y=clamp(f.y,.085,.915);
      if(grain&&Math.hypot(grain.x-f.x*width,grain.y-f.y*height)<f.size*1.2){grain.eaten=true;addRipple(grain.x,grain.y,.35);}
    }
  }

  function updateFood(dt){
    for(const g of food){g.age+=dt;if(g.eaten)continue;if(!g.landed){g.vy+=85*dt;g.x+=g.vx*dt;g.y+=g.vy*dt;g.x+=(g.landX-g.x)*dt*1.2;if(g.y>=g.landY){g.x=g.landX;g.y=g.landY;g.landed=true;g.vx=0;g.vy=0;addRipple(g.x,g.y,.25);}}}
    food=food.filter(g=>!g.eaten&&g.age<13);
  }
  function updateRipples(dt){ripples.forEach(r=>r.age+=dt);ripples=ripples.filter(r=>r.age<r.duration);}

  function drawBrushEllipse(x,y,rx,ry,rot,color,layers=3){
    for(let i=0;i<layers;i++){
      ctx.save();ctx.translate(x+(i-layers/2)*.6,y+(layers/2-i)*.35);ctx.rotate(rot+(i-1)*.012);ctx.fillStyle=color(i);ctx.beginPath();ctx.ellipse(0,0,rx*(1+i*.035),ry*(1-i*.02),0,0,Math.PI*2);ctx.fill();ctx.restore();
    }
  }

  function drawFish(f){
    const x=f.x*width,y=f.y*height,angle=Math.atan2(f.vy,f.vx),s=f.size;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    const tone=f.tone===0?[48,54,50]:f.tone===1?[58,62,55]:[38,45,41];

    drawBrushEllipse(0,0,s*1.12,s*.40,0,i=>`rgba(${tone[0]},${tone[1]},${tone[2]},${.22+i*.14})`,3);
    ctx.fillStyle='rgba(29,36,33,.32)';ctx.beginPath();ctx.ellipse(s*.40,-s*.02,s*.50,s*.23,0,0,Math.PI*2);ctx.fill();

    const tail=Math.sin(f.phase)*s*.17;
    for(let k=0;k<3;k++){
      ctx.globalAlpha=.28-k*.055;ctx.fillStyle='rgba(40,49,45,.75)';ctx.beginPath();ctx.moveTo(-s*.82,0);
      ctx.quadraticCurveTo(-s*1.34,-s*(.55+k*.08)+tail,-s*(1.72+k*.10),-s*(.42+k*.03));
      ctx.quadraticCurveTo(-s*1.38,-s*.02,-s*(1.72+k*.10),s*(.44+k*.03));
      ctx.quadraticCurveTo(-s*1.32,s*(.53+k*.07)+tail,-s*.82,0);ctx.fill();
    }
    ctx.globalAlpha=1;

    ctx.strokeStyle='rgba(36,44,40,.22)';ctx.lineWidth=Math.max(.7,s*.055);ctx.beginPath();ctx.moveTo(-s*.15,-s*.05);ctx.quadraticCurveTo(s*.30,-s*.16,s*.72,-s*.03);ctx.stroke();
    ctx.fillStyle='rgba(18,24,21,.70)';ctx.beginPath();ctx.arc(s*.65,-s*.08,Math.max(1,s*.055),0,Math.PI*2);ctx.fill();

    ctx.globalAlpha=.28;ctx.fillStyle='rgba(47,59,54,.65)';ctx.beginPath();ctx.moveTo(-s*.02,-s*.16);ctx.quadraticCurveTo(s*.22,-s*.62,s*.44,-s*.35);ctx.quadraticCurveTo(s*.26,-s*.15,-s*.02,-s*.16);ctx.fill();
    ctx.globalAlpha=1;ctx.restore();
  }

  function drawLotus(item){
    const x=item.x*width,y=item.y*height,s=lotusRadius(item);
    ctx.save();ctx.translate(x,y);ctx.rotate(item.rotation||0);

    const wash=ctx.createRadialGradient(0,0,s*.10,0,0,s*1.15);wash.addColorStop(0,'rgba(190,130,139,.08)');wash.addColorStop(.62,'rgba(179,121,130,.025)');wash.addColorStop(1,'rgba(179,121,130,0)');ctx.fillStyle=wash;ctx.beginPath();ctx.arc(0,0,s*1.18,0,Math.PI*2);ctx.fill();

    const palettes=[['#f5e4e4','#d69aa3','#b96f7e'],['#f7e9e7','#dda8ad','#c47f88'],['#f0d9db','#cf8d98','#aa6674']];
    const p=palettes[item.tone%3];
    const rings=[{count:12,r:.34,len:.70,w:.18,a:.48},{count:9,r:.20,len:.60,w:.20,a:.68},{count:6,r:.08,len:.49,w:.22,a:.84}];
    rings.forEach((ring,ri)=>{
      for(let i=0;i<ring.count;i++){
        const a=i/ring.count*Math.PI*2+(ri*.19);
        ctx.save();ctx.rotate(a);ctx.translate(0,-s*ring.r);
        const g=ctx.createLinearGradient(0,-s*ring.len,0,s*.08);g.addColorStop(0,'rgba(255,250,248,.92)');g.addColorStop(.52,p[0]);g.addColorStop(.82,p[1]);g.addColorStop(1,p[2]);
        ctx.fillStyle=g;ctx.globalAlpha=ring.a;ctx.beginPath();ctx.moveTo(0,s*.06);ctx.bezierCurveTo(-s*ring.w,-s*.04,-s*ring.w*.85,-s*ring.len*.78,0,-s*ring.len);ctx.bezierCurveTo(s*ring.w*.85,-s*ring.len*.78,s*ring.w,-s*.04,0,s*.06);ctx.fill();ctx.restore();
      }
    });
    ctx.globalAlpha=1;
    ctx.fillStyle='rgba(206,165,91,.72)';ctx.beginPath();ctx.arc(0,0,s*.105,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(151,116,64,.42)';ctx.lineWidth=.7;for(let i=0;i<14;i++){const a=i/14*Math.PI*2;ctx.beginPath();ctx.moveTo(Math.cos(a)*s*.06,Math.sin(a)*s*.06);ctx.lineTo(Math.cos(a)*s*.15,Math.sin(a)*s*.15);ctx.stroke();}
    ctx.restore();
  }

  function drawFood(){ctx.save();for(const g of food){ctx.fillStyle=g.landed?'rgba(126,91,54,.72)':'rgba(139,100,57,.65)';ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();}ctx.restore();}

  function drawRipples(){
    ctx.save();ripples.forEach(r=>{const t=r.age/r.duration,ease=1-Math.pow(1-t,2);for(let i=0;i<4;i++){const radius=(10+i*10+ease*64)*r.strength;ctx.strokeStyle=`rgba(79,103,94,${Math.max(0,(1-t)*(.19-i*.032)*r.strength)})`;ctx.lineWidth=.85;ctx.beginPath();ctx.arc(r.x,r.y,radius,0,Math.PI*2);ctx.stroke();}});ctx.restore();
  }

  function draw(){
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);if(background)ctx.drawImage(background,0,0,width,height);
    drawRipples();lotus.forEach(drawLotus);fish.forEach(drawFish);drawFood();
    const haze=ctx.createLinearGradient(0,0,0,height);haze.addColorStop(0,'rgba(255,255,255,.035)');haze.addColorStop(1,'rgba(74,98,88,.018)');ctx.fillStyle=haze;ctx.fillRect(0,0,width,height);
  }

  function frameLoop(now){
    if(!canvas||!canvas.isConnected)return;
    const dt=Math.min(.035,(now-lastTime)/1000||.016);lastTime=now;
    if(!document.hidden){updateFood(dt);updateFish(dt,now);updateRipples(dt);draw();}
    raf=requestAnimationFrame(frameLoop);
  }

  function scheduleMidnight(){
    clearTimeout(midnightTimer);const now=new Date();const next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,0,80);
    midnightTimer=setTimeout(()=>{localStorage.setItem(LOTUS_KEY,JSON.stringify({date:localDayKey(),lotus:[]}));lotus=[];syncLotus();ripples=[];food=[];scheduleMidnight();},Math.max(1000,next.getTime()-Date.now()));
  }

  function mountSoon(){MOUNT_RETRIES.forEach(delay=>setTimeout(ensureShell,delay));}
  function bindGlobal(){
    ensureStyles();mountSoon();scheduleMidnight();
    document.addEventListener('click',e=>{const t=e.target?.closest?.('[data-nav="insights"],[data-go="insights"],#finishBtn');if(t)mountSoon();},{capture:true});
    window.addEventListener('pageshow',mountSoon,{once:true});
  }

  window.FocusWaveInkPondV2={mount:ensureShell,sync:syncLotus,feed:feedFish};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindGlobal,{once:true});else bindGlobal();
})();
