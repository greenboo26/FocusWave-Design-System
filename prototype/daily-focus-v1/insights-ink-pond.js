/* FocusWave insight ink pond v1.
 * Replaces the karesansui insight garden with an interactive ink-wash pond.
 * Completed focus sessions map to draggable lotus blooms; local midnight clears the pond.
 * Fish swim continuously, food attracts them, and water clicks create ripples.
 * No MutationObserver and no polling.
 */
(() => {
  if (window.FocusWaveInkPond) return;

  const REWARD_KEY = 'focuswave.dailyRewardStones.v2';
  const LOTUS_KEY = 'focuswave.dailyLotusPositions.v1';
  const MOUNT_RETRIES = [0, 80, 220, 520, 980];
  const LOTUS_SLOTS = [
    [.23,.34],[.66,.63],[.48,.27],[.79,.38],[.34,.70],[.58,.52],
    [.17,.66],[.72,.76],[.40,.48],[.86,.61],[.55,.78],[.29,.53]
  ];

  let page = null;
  let shell = null;
  let canvas = null;
  let ctx = null;
  let background = null;
  let backgroundCtx = null;
  let raf = 0;
  let resizeObserver = null;
  let midnightTimer = 0;
  let lastTime = performance.now();
  let dpr = 1;
  let width = 0;
  let height = 0;
  let lotus = [];
  let fish = [];
  let food = [];
  let ripples = [];
  let draggingLotus = -1;
  let pointerId = null;
  let feedCooldown = false;

  function localDayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
  function rand(min,max){ return min + Math.random() * (max-min); }
  function lerp(a,b,t){ return a + (b-a)*t; }

  function rewardCount() {
    let state = null;
    try { state = JSON.parse(localStorage.getItem(REWARD_KEY) || 'null'); } catch (_) {}
    if (!state || state.date !== localDayKey() || !Array.isArray(state.stones)) return 0;
    return state.stones.length;
  }

  function defaultLotus(index) {
    const slot = LOTUS_SLOTS[index % LOTUS_SLOTS.length];
    const cycle = Math.floor(index / LOTUS_SLOTS.length);
    const jitter = cycle ? .035 : .018;
    return {
      id:`lotus-${Date.now()}-${index}-${Math.floor(Math.random()*10000)}`,
      x:clamp(slot[0] + rand(-jitter,jitter),.08,.92),
      y:clamp(slot[1] + rand(-jitter,jitter),.12,.86),
      scale:rand(.88,1.12),
      tone:index % 3
    };
  }

  function readLotusState() {
    let state = null;
    try { state = JSON.parse(localStorage.getItem(LOTUS_KEY) || 'null'); } catch (_) {}
    if (!state || state.date !== localDayKey() || !Array.isArray(state.lotus)) {
      state = {date:localDayKey(), lotus:[]};
    }
    return state;
  }

  function writeLotusState(items) {
    const state = {date:localDayKey(), lotus:items.map(item => ({
      id:item.id,x:item.x,y:item.y,scale:item.scale,tone:item.tone
    }))};
    localStorage.setItem(LOTUS_KEY,JSON.stringify(state));
  }

  function syncLotus() {
    const count = rewardCount();
    const state = readLotusState();
    lotus = state.lotus.slice(0,count).map((item,index) => ({
      ...defaultLotus(index), ...item,
      x:clamp(Number(item.x)||.5,.07,.93),
      y:clamp(Number(item.y)||.5,.10,.88),
      scale:clamp(Number(item.scale)||1,.72,1.28),
      tone:Number.isFinite(Number(item.tone)) ? Number(item.tone) : index%3
    }));
    while(lotus.length < count) lotus.push(defaultLotus(lotus.length));
    writeLotusState(lotus);
    const el = shell?.querySelector('#fwInkLotusCount');
    if (el) el.textContent = String(count);
  }

  function ensureStyles() {
    if (document.querySelector('style[data-focuswave-ink-pond]')) return;
    const style = document.createElement('style');
    style.dataset.focuswaveInkPond = 'true';
    style.textContent = `
      #page-insights{padding:0!important;background:#f5f3ed!important;color:#303632!important;min-height:100vh!important}
      #page-insights > :not(#fwInkPondShell){display:none!important}
      #fwInkPondShell{min-height:100vh;padding:38px 5.4vw 58px;box-sizing:border-box;background:
        radial-gradient(circle at 16% 12%,rgba(255,255,255,.72),transparent 30%),
        linear-gradient(180deg,#f8f6f0 0%,#f3f1ea 100%);}
      .fw-ink-head{display:flex;align-items:flex-end;justify-content:space-between;gap:36px;margin:0 0 24px}
      .fw-ink-title-row{display:flex;align-items:baseline;gap:14px}
      .fw-ink-title{margin:0;font-family:var(--human);font-size:40px;font-weight:400;letter-spacing:.06em;color:#303632}
      .fw-ink-title-en{font-family:Georgia,serif;font-size:17px;color:#858a84}
      .fw-ink-sub{margin-top:8px;font-family:var(--human);font-size:14px;color:#8a8e89;letter-spacing:.04em}
      .fw-ink-actions{display:flex;align-items:center;gap:14px;padding-bottom:2px}
      .fw-ink-count{display:flex;align-items:center;gap:8px;font-size:12px;color:#747a75;white-space:nowrap}
      .fw-ink-count i{width:15px;height:15px;border-radius:50% 50% 46% 54%;display:block;background:
        radial-gradient(circle at 34% 30%,rgba(255,236,239,.95),transparent 27%),
        radial-gradient(circle at 50% 55%,#dca9ad 0 26%,#c8858d 62%,#a96772 100%);box-shadow:0 2px 6px rgba(116,75,83,.13)}
      .fw-ink-count strong{font-size:17px;font-weight:450;color:#414943;font-variant-numeric:tabular-nums}
      .fw-feed-btn{height:40px;padding:0 17px;border:1px solid rgba(52,62,56,.12);border-radius:999px;background:rgba(255,255,255,.48);color:#55605a;font-family:var(--human);font-size:13px;letter-spacing:.03em;cursor:pointer;box-shadow:0 5px 16px rgba(65,71,65,.06);transition:.18s}
      .fw-feed-btn:hover{background:rgba(255,255,255,.82);transform:translateY(-1px)}
      .fw-feed-btn:active{transform:translateY(0)}
      .fw-feed-btn[disabled]{opacity:.55;cursor:default;transform:none}
      .fw-ink-frame{position:relative;height:min(58vw,640px);min-height:460px;border:1px solid rgba(54,65,59,.08);border-radius:24px;overflow:hidden;background:#f7f4eb;box-shadow:0 24px 52px rgba(49,55,50,.08),inset 0 1px rgba(255,255,255,.72)}
      #fwInkPondCanvas{display:block;width:100%;height:100%;touch-action:none;cursor:crosshair}
      .fw-ink-hint{position:absolute;left:24px;bottom:18px;padding:7px 11px;border-radius:999px;background:rgba(247,245,239,.70);backdrop-filter:blur(5px);font-size:11px;color:#7e8580;pointer-events:none;letter-spacing:.02em}
      .fw-ink-caption{margin-top:12px;text-align:center;font-family:var(--human);font-size:12px;color:#8a8f8a;letter-spacing:.04em}
      @media(max-width:900px){
        #fwInkPondShell{padding:28px 22px 46px}.fw-ink-head{align-items:flex-start;flex-direction:column;gap:16px}.fw-ink-actions{align-self:stretch;justify-content:space-between}.fw-ink-title{font-size:34px}.fw-ink-frame{height:68vh;min-height:420px}
      }
    `;
    document.head.appendChild(style);
  }

  function shellMarkup() {
    return `
      <div class="fw-ink-head">
        <div>
          <div class="fw-ink-title-row"><h1 class="fw-ink-title">洞察</h1><span class="fw-ink-title-en">/ Personal Baseline</span></div>
          <div class="fw-ink-sub">一池墨色，记录今日专注</div>
        </div>
        <div class="fw-ink-actions">
          <div class="fw-ink-count"><i aria-hidden="true"></i><span>今日莲花</span><strong id="fwInkLotusCount">0</strong></div>
          <button class="fw-feed-btn" id="fwFeedFish" type="button">撒一把鱼粮</button>
        </div>
      </div>
      <div class="fw-ink-frame">
        <canvas id="fwInkPondCanvas" aria-label="可交互的水墨池塘"></canvas>
        <div class="fw-ink-hint">拖动莲花调整位置 · 点击水面激起涟漪</div>
      </div>
      <div class="fw-ink-caption">每完成一次专注，今日水面会多一朵莲花；每日 24:00 重新归于空白。</div>
    `;
  }

  function ensureShell() {
    page = document.querySelector('#page-insights');
    if (!page) return false;
    ensureStyles();
    let existing = page.querySelector('#fwInkPondShell');
    if (!existing) {
      existing = document.createElement('section');
      existing.id = 'fwInkPondShell';
      existing.innerHTML = shellMarkup();
      page.appendChild(existing);
    }
    if (shell !== existing || canvas !== existing.querySelector('#fwInkPondCanvas')) {
      stopScene();
      shell = existing;
      canvas = shell.querySelector('#fwInkPondCanvas');
      ctx = canvas.getContext('2d');
      bindShell();
      initScene();
    }
    syncLotus();
    return true;
  }

  function makeBackground() {
    if (!width || !height) return;
    background = document.createElement('canvas');
    background.width = Math.max(1,Math.round(width*dpr));
    background.height = Math.max(1,Math.round(height*dpr));
    backgroundCtx = background.getContext('2d');
    const b = backgroundCtx;
    b.setTransform(dpr,0,0,dpr,0,0);

    b.fillStyle = '#f6f2e8';
    b.fillRect(0,0,width,height);

    const washes = [
      [.18,.23,.30,'rgba(104,132,123,.085)'],
      [.74,.30,.34,'rgba(116,142,132,.075)'],
      [.52,.76,.42,'rgba(101,128,122,.055)'],
      [.88,.72,.24,'rgba(80,111,104,.045)']
    ];
    washes.forEach(([nx,ny,r,color]) => {
      const g = b.createRadialGradient(nx*width,ny*height,0,nx*width,ny*height,r*Math.min(width,height)*1.9);
      g.addColorStop(0,color);g.addColorStop(.55,color.replace(/\.0(\d+)\)/,'.0$1)'));g.addColorStop(1,'rgba(255,255,255,0)');
      b.fillStyle=g;b.fillRect(0,0,width,height);
    });

    b.save();
    b.globalAlpha=.16;
    for(let i=0;i<1600;i++){
      const x=Math.random()*width,y=Math.random()*height;
      const a=Math.random()>.5 ? .032 : .018;
      b.fillStyle=`rgba(71,78,70,${a})`;
      b.fillRect(x,y,Math.random()*1.15+.2,Math.random()*.55+.15);
    }
    b.restore();

    b.save();
    b.globalAlpha=.12;
    b.strokeStyle='rgba(76,102,95,.16)';
    b.lineWidth=.55;
    for(let j=0;j<6;j++){
      b.beginPath();
      const y=height*(.14+j*.14);
      b.moveTo(-20,y);
      for(let x=0;x<=width+40;x+=40){
        b.quadraticCurveTo(x+20,y+Math.sin(x*.008+j)*5,x+40,y+Math.sin((x+40)*.008+j)*4);
      }
      b.stroke();
    }
    b.restore();
  }

  function resize() {
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1,2);
    width = Math.max(10,r.width);
    height = Math.max(10,r.height);
    const cw=Math.round(width*dpr),ch=Math.round(height*dpr);
    if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
    ctx.setTransform(dpr,0,0,dpr,0,0);
    makeBackground();
  }

  function initFish() {
    fish = [
      {x:.22,y:.28,vx:.027,vy:.011,size:17,phase:0,targetX:.68,targetY:.30,retarget:0,tone:0},
      {x:.67,y:.56,vx:-.021,vy:.015,size:20,phase:2.1,targetX:.30,targetY:.62,retarget:0,tone:1},
      {x:.47,y:.76,vx:.018,vy:-.019,size:15,phase:4.2,targetX:.80,targetY:.68,retarget:0,tone:2}
    ];
  }

  function initScene() {
    resize();
    initFish();
    food=[];ripples=[];draggingLotus=-1;pointerId=null;
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas);
    lastTime=performance.now();
    raf=requestAnimationFrame(frameLoop);
  }

  function stopScene() {
    cancelAnimationFrame(raf);raf=0;
    resizeObserver?.disconnect();resizeObserver=null;
  }

  function bindShell() {
    const feedButton = shell.querySelector('#fwFeedFish');
    feedButton?.addEventListener('click', () => feedFish());
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('pointerleave', e => { if (draggingLotus < 0) canvas.style.cursor='crosshair'; });
  }

  function canvasPoint(event) {
    const r=canvas.getBoundingClientRect();
    return {x:event.clientX-r.left,y:event.clientY-r.top};
  }

  function lotusRadius(item){ return 30 * item.scale; }

  function hitLotus(p) {
    for(let i=lotus.length-1;i>=0;i--){
      const item=lotus[i];
      const dx=p.x-item.x*width,dy=p.y-item.y*height;
      if(Math.hypot(dx,dy)<lotusRadius(item)*1.05) return i;
    }
    return -1;
  }

  function onPointerDown(event) {
    if(event.button!==0) return;
    const p=canvasPoint(event);
    const hit=hitLotus(p);
    if(hit>=0){
      draggingLotus=hit;pointerId=event.pointerId;
      canvas.setPointerCapture?.(event.pointerId);
      canvas.style.cursor='grabbing';
    } else {
      addRipple(p.x,p.y,1);
      canvas.style.cursor='crosshair';
    }
    event.preventDefault();
  }

  function onPointerMove(event) {
    const p=canvasPoint(event);
    if(draggingLotus>=0){
      const item=lotus[draggingLotus];
      item.x=clamp(p.x/width,.055,.945);
      item.y=clamp(p.y/height,.08,.92);
      canvas.style.cursor='grabbing';
      event.preventDefault();
      return;
    }
    canvas.style.cursor = hitLotus(p)>=0 ? 'grab' : 'crosshair';
  }

  function onPointerUp(event) {
    if(draggingLotus>=0){
      draggingLotus=-1;pointerId=null;writeLotusState(lotus);canvas.style.cursor='crosshair';
    }
    try{canvas.releasePointerCapture?.(event.pointerId);}catch(_){ }
  }

  function addRipple(x,y,strength=.8){
    ripples.push({x,y,age:0,duration:1.75,strength});
    if(ripples.length>18)ripples.shift();
  }

  function feedFish() {
    if(feedCooldown||!width||!height)return;
    feedCooldown=true;
    const button=shell.querySelector('#fwFeedFish');
    if(button)button.disabled=true;
    const originX=width*.86,originY=-8;
    for(let i=0;i<24;i++){
      const landX=width*rand(.58,.88),landY=height*rand(.20,.44);
      food.push({x:originX+rand(-14,14),y:originY-rand(0,40),vx:rand(-18,10),vy:rand(55,95),landX,landY,age:0,landed:false,eaten:false,r:rand(1.2,2.4)});
    }
    setTimeout(()=>{feedCooldown=false;if(button)button.disabled=false;},850);
  }

  function nearestFood(f) {
    let best=null,bestD=Infinity;
    for(const grain of food){
      if(grain.eaten||!grain.landed)continue;
      const dx=grain.x/width-f.x,dy=grain.y/height-f.y,d=dx*dx+dy*dy;
      if(d<bestD){bestD=d;best=grain;}
    }
    return best;
  }

  function updateFish(dt,now) {
    for(const f of fish){
      f.phase += dt*4.2;
      const grain=nearestFood(f);
      let tx,ty,speed;
      if(grain){tx=grain.x/width;ty=grain.y/height;speed=.16;}
      else{
        if(now>f.retarget||Math.hypot(f.targetX-f.x,f.targetY-f.y)<.08){
          f.targetX=rand(.12,.88);f.targetY=rand(.14,.84);f.retarget=now+rand(2800,6200);
        }
        tx=f.targetX;ty=f.targetY;speed=.055;
      }
      const dx=tx-f.x,dy=ty-f.y,len=Math.hypot(dx,dy)||1;
      const desiredX=dx/len*speed,desiredY=dy/len*speed;
      const steer=grain?2.8:1.25;
      f.vx=lerp(f.vx,desiredX,clamp(dt*steer,0,1));
      f.vy=lerp(f.vy,desiredY,clamp(dt*steer,0,1));
      f.x+=f.vx*dt;f.y+=f.vy*dt;
      if(f.x<.06||f.x>.94)f.vx*=-1;
      if(f.y<.08||f.y>.92)f.vy*=-1;
      f.x=clamp(f.x,.055,.945);f.y=clamp(f.y,.075,.925);

      if(grain){
        const px=f.x*width,py=f.y*height;
        if(Math.hypot(grain.x-px,grain.y-py)<f.size*1.15){
          grain.eaten=true;addRipple(grain.x,grain.y,.34);
        }
      }
    }
  }

  function updateFood(dt) {
    for(const grain of food){
      grain.age+=dt;
      if(grain.eaten)continue;
      if(!grain.landed){
        grain.vy+=85*dt;grain.x+=grain.vx*dt;grain.y+=grain.vy*dt;
        const dx=grain.landX-grain.x,dy=grain.landY-grain.y;
        grain.x+=dx*dt*1.2;
        if(grain.y>=grain.landY){grain.x=grain.landX;grain.y=grain.landY;grain.landed=true;grain.vx=0;grain.vy=0;addRipple(grain.x,grain.y,.25);}
      } else {
        grain.y += Math.sin(grain.age*2.6)*.025;
      }
    }
    food=food.filter(g=>!g.eaten&&g.age<13);
  }

  function updateRipples(dt){
    ripples.forEach(r=>r.age+=dt);ripples=ripples.filter(r=>r.age<r.duration);
  }

  function drawFish(f) {
    const x=f.x*width,y=f.y*height;
    const angle=Math.atan2(f.vy,f.vx);
    const s=f.size;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    ctx.shadowColor='rgba(45,60,55,.11)';ctx.shadowBlur=5;

    const wash=ctx.createRadialGradient(s*.20,-s*.16,0,0,0,s*1.55);
    wash.addColorStop(0,f.tone===1?'rgba(88,94,83,.80)':'rgba(52,61,57,.82)');
    wash.addColorStop(.68,f.tone===2?'rgba(73,83,77,.68)':'rgba(42,50,47,.68)');
    wash.addColorStop(1,'rgba(33,40,37,.22)');
    ctx.fillStyle=wash;
    ctx.beginPath();ctx.ellipse(0,0,s*1.18,s*.48,0,0,Math.PI*2);ctx.fill();

    const tailWave=Math.sin(f.phase)*s*.17;
    ctx.fillStyle='rgba(44,54,50,.52)';
    ctx.beginPath();ctx.moveTo(-s*.98,0);ctx.quadraticCurveTo(-s*1.52,-s*.62+tailWave,-s*1.82,-s*.52);ctx.quadraticCurveTo(-s*1.50,0,-s*1.82,s*.53);ctx.quadraticCurveTo(-s*1.48,s*.55+tailWave,-s*.98,0);ctx.fill();

    ctx.strokeStyle='rgba(32,42,38,.34)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(-s*.35,-s*.05);ctx.quadraticCurveTo(s*.20,-s*.14,s*.74,-s*.03);ctx.stroke();
    ctx.fillStyle='rgba(20,27,24,.72)';ctx.beginPath();ctx.arc(s*.64,-s*.09,1.2,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  function drawLotus(item,index) {
    const x=item.x*width,y=item.y*height,s=lotusRadius(item);
    ctx.save();ctx.translate(x,y);

    const leaf=ctx.createRadialGradient(-s*.18,-s*.22,1,0,0,s*1.10);
    leaf.addColorStop(0,'rgba(112,145,126,.34)');leaf.addColorStop(.64,'rgba(78,119,101,.28)');leaf.addColorStop(1,'rgba(61,98,82,.08)');
    ctx.fillStyle=leaf;ctx.beginPath();ctx.ellipse(s*.16,s*.16,s*.82,s*.52,-.18,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(62,100,84,.16)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(s*.12,s*.16);ctx.lineTo(s*.76,s*.08);ctx.stroke();

    const palette=[['#f1d5d5','#c98790'],['#f3dddd','#d5a2a6'],['#ead1d2','#b97882']][item.tone%3];
    for(let ring=0;ring<2;ring++){
      const petals=ring?8:6;
      for(let p=0;p<petals;p++){
        const a=(p/petals)*Math.PI*2+(ring?.22:0);
        ctx.save();ctx.rotate(a);ctx.translate(0,-s*(ring?.24:.12));
        const g=ctx.createLinearGradient(0,-s*.52,0,s*.14);g.addColorStop(0,'rgba(255,247,247,.88)');g.addColorStop(.48,palette[0]);g.addColorStop(1,palette[1]);
        ctx.fillStyle=g;ctx.globalAlpha=ring?.72:.86;
        ctx.beginPath();ctx.moveTo(0,s*.08);ctx.bezierCurveTo(-s*.20,-s*.03,-s*.18,-s*.42,0,-s*.55);ctx.bezierCurveTo(s*.18,-s*.42,s*.20,-s*.03,0,s*.08);ctx.fill();ctx.restore();
      }
    }
    ctx.globalAlpha=1;ctx.fillStyle='rgba(205,161,89,.70)';ctx.beginPath();ctx.arc(0,-s*.04,s*.09,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }

  function drawFood() {
    ctx.save();
    for(const g of food){
      ctx.fillStyle=g.landed?'rgba(126,91,54,.76)':'rgba(139,100,57,.69)';
      ctx.beginPath();ctx.arc(g.x,g.y,g.r,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  function drawRipples() {
    ctx.save();
    ripples.forEach(r=>{
      const t=r.age/r.duration;
      const ease=1-Math.pow(1-t,2);
      for(let i=0;i<3;i++){
        const radius=(12+i*11+ease*62)*r.strength;
        ctx.strokeStyle=`rgba(72,105,99,${(1-t)*(.22-i*.045)*r.strength})`;
        ctx.lineWidth=.8;
        ctx.beginPath();ctx.ellipse(r.x,r.y,radius,radius*.42,0,0,Math.PI*2);ctx.stroke();
      }
    });
    ctx.restore();
  }

  function draw(now) {
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,width,height);
    if(background)ctx.drawImage(background,0,0,width,height);

    drawRipples();
    lotus.forEach(drawLotus);
    fish.forEach(drawFish);
    drawFood();

    const haze=ctx.createLinearGradient(0,0,0,height);
    haze.addColorStop(0,'rgba(255,255,255,.05)');haze.addColorStop(1,'rgba(75,102,96,.025)');
    ctx.fillStyle=haze;ctx.fillRect(0,0,width,height);
  }

  function frameLoop(now) {
    if(!canvas||!canvas.isConnected)return;
    const dt=Math.min(.035,(now-lastTime)/1000||.016);lastTime=now;
    if(!document.hidden){updateFood(dt);updateFish(dt,now);updateRipples(dt);draw(now);}
    raf=requestAnimationFrame(frameLoop);
  }

  function scheduleMidnight() {
    clearTimeout(midnightTimer);
    const now=new Date();
    const next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,0,80);
    midnightTimer=setTimeout(()=>{
      localStorage.setItem(LOTUS_KEY,JSON.stringify({date:localDayKey(),lotus:[]}));
      lotus=[];syncLotus();ripples=[];food=[];scheduleMidnight();
    },Math.max(1000,next.getTime()-Date.now()));
  }

  function mountSoon() { MOUNT_RETRIES.forEach(delay=>setTimeout(()=>ensureShell(),delay)); }

  function bindGlobal() {
    ensureStyles();mountSoon();scheduleMidnight();
    document.addEventListener('click',event=>{
      const target=event.target?.closest?.('[data-nav="insights"],[data-go="insights"],#finishBtn');
      if(target)mountSoon();
    },{capture:true});
    window.addEventListener('pageshow',mountSoon,{once:true});
  }

  window.FocusWaveInkPond={mount:ensureShell,sync:syncLotus,feed:feedFish};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindGlobal,{once:true});
  else bindGlobal();
})();
