/* FocusWave daily garden rewards v3.
 * One completed focus task earns one persistent stone for the current local day.
 * Stones reset once per day at local midnight. Each earned stone randomly receives
 * one of three size classes and keeps that size for the rest of the day.
 * The insight garden and visible reward count share the same source of truth.
 * No MutationObserver and no global polling.
 */
(() => {
  if (window.FocusWaveDailyGardenRewards) return;

  const STORAGE_KEY = 'focuswave.dailyRewardStones.v2';
  let sessionActive = false;
  let midnightTimer = 0;
  let resizeRaf = 0;

  const SIZE_VARIANTS = [
    {key:'small', size:34, depth:9},
    {key:'medium', size:50, depth:13},
    {key:'large', size:68, depth:18}
  ];

  const STONE_SLOTS = [
    [.17,.23], [.52,.70], [.83,.58], [.30,.60], [.74,.25], [.48,.34],
    [.12,.72], [.88,.32], [.64,.78], [.35,.20], [.58,.55], [.22,.42],
    [.79,.74], [.43,.82], [.68,.42], [.10,.34], [.91,.70], [.56,.18]
  ];

  function localDayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function randomBetween(min,max){ return min + Math.random() * (max-min); }

  function normalizeStone(stone,index){
    const variant = SIZE_VARIANTS.find(item => item.key === stone?.variant) || SIZE_VARIANTS[index % SIZE_VARIANTS.length];
    const slot = STONE_SLOTS[index % STONE_SLOTS.length];
    return {
      id: stone?.id || `stone-${index + 1}`,
      variant: variant.key,
      x: Number.isFinite(Number(stone?.x)) ? Number(stone.x) : slot[0],
      y: Number.isFinite(Number(stone?.y)) ? Number(stone.y) : slot[1],
      rotation: Number.isFinite(Number(stone?.rotation)) ? Number(stone.rotation) : 0,
      tone: Number.isFinite(Number(stone?.tone)) ? Number(stone.tone) : .5,
      scale: Number.isFinite(Number(stone?.scale)) ? Number(stone.scale) : 1
    };
  }

  function readState(){
    const date = localDayKey();
    let state = null;
    try { state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) {}
    if (!state || state.date !== date || !Array.isArray(state.stones)) {
      state = {date, stones:[]};
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    state.stones = state.stones.map(normalizeStone);
    return state;
  }

  function writeState(state){
    const normalized = {
      date: localDayKey(),
      stones: Array.isArray(state?.stones) ? state.stones.map(normalizeStone) : []
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function createRewardStone(index){
    const slot = STONE_SLOTS[index % STONE_SLOTS.length];
    const variant = SIZE_VARIANTS[Math.floor(Math.random() * SIZE_VARIANTS.length)];
    const cycle = Math.floor(index / STONE_SLOTS.length);
    const jitter = cycle ? .035 : .018;
    return {
      id: `reward-${Date.now()}-${Math.floor(Math.random()*100000)}`,
      variant: variant.key,
      x: Math.max(.07,Math.min(.93,slot[0] + randomBetween(-jitter,jitter))),
      y: Math.max(.12,Math.min(.86,slot[1] + randomBetween(-jitter,jitter))),
      rotation: randomBetween(-12,12),
      tone: Math.random(),
      scale: randomBetween(.94,1.06)
    };
  }

  function incrementReward(){
    const state = readState();
    state.stones.push(createRewardStone(state.stones.length));
    writeState(state);
    syncInsightsSoon();
  }

  function scheduleMidnightReset(){
    clearTimeout(midnightTimer);
    const now = new Date();
    const next = new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,0,40);
    midnightTimer = setTimeout(() => {
      writeState({stones:[]});
      patchInsights();
      scheduleMidnightReset();
    },Math.max(1000,next.getTime()-Date.now()));
  }

  function ensureStyles(){
    if (document.querySelector('style[data-focuswave-daily-garden-rewards]')) return;
    const style = document.createElement('style');
    style.dataset.focuswaveDailyGardenRewards = 'true';
    style.textContent = `
      #page-insights .fw-i-actions{display:none!important}
      #page-insights .fw-reward-block{display:flex!important;flex-direction:column;align-items:flex-end;gap:8px!important}
      #page-insights .fw-reward-label{display:none!important}
      #page-insights .fw-reward-tray{height:42px!important;display:flex!important;align-items:center!important;gap:12px!important}
      #page-insights .fw-reward-tray .fw-mini-stone{width:29px!important;height:23px!important;margin:0!important;flex:0 0 auto;background:radial-gradient(circle at 31% 21%,rgba(255,255,255,.38),transparent 20%),radial-gradient(circle at 64% 72%,rgba(11,15,13,.32),transparent 56%),linear-gradient(145deg,#a6aaa4 0%,#747a74 38%,#414742 76%,#777d77 100%)!important;border-radius:48% 52% 44% 56%/42% 45% 55% 58%!important;clip-path:none!important;box-shadow:inset 4px 3px 7px rgba(255,255,255,.18),inset -6px -6px 9px rgba(20,25,22,.27),0 7px 8px rgba(30,32,29,.22)!important;transform:rotate(-5deg)!important}
      #page-insights .fw-daily-reward-text{font-size:12px;color:#737a75;white-space:nowrap;letter-spacing:.02em}
      #page-insights .fw-daily-reward-text strong{font-size:16px;font-weight:450;color:#3f4843;margin-left:5px;font-variant-numeric:tabular-nums}

      #page-insights .fw-garden-frame{padding:16px!important;border-radius:24px!important;background:linear-gradient(135deg,#deb77b 0%,#bc8751 18%,#d3a466 42%,#9c6739 72%,#c89354 100%)!important;box-shadow:0 28px 45px rgba(70,49,29,.17),0 8px 16px rgba(70,49,29,.15),inset 0 2px 1px rgba(255,255,255,.46),inset 0 -4px 8px rgba(82,48,22,.22)!important}
      #page-insights .fw-garden-frame:before{content:'';position:absolute;inset:8px;border-radius:18px;pointer-events:none;border:1px solid rgba(255,244,218,.34);box-shadow:inset 0 0 0 1px rgba(93,55,26,.16)}
      #page-insights .fw-garden-inner{border-radius:13px!important;border:1px solid rgba(104,91,71,.25)!important;background:#eeeae1!important;box-shadow:inset 0 13px 20px rgba(112,93,66,.13),inset 0 -5px 9px rgba(255,255,255,.72),0 1px 0 rgba(255,255,255,.42)!important}
      #page-insights #fwGardenCanvas{opacity:0!important}
      #page-insights #fwDailyGardenCanvas{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:3;pointer-events:none;border-radius:inherit}
      #page-insights #fwGardenUserCanvas{z-index:4}
      #page-insights #fwStoneLayer{z-index:7}
      #page-insights #fwStoneLayer .fw-stone{pointer-events:none!important;will-change:transform;filter:none!important;overflow:visible!important}
      #page-insights #fwStoneLayer .fw-stone:after{content:'';position:absolute;left:9%;right:5%;bottom:-13%;height:32%;border-radius:50%;background:radial-gradient(ellipse,rgba(47,43,36,.30) 0%,rgba(47,43,36,.15) 38%,transparent 72%);filter:blur(4px);transform:skewX(-8deg);z-index:-1}
      #page-insights #fwStoneLayer .fw-stone .body{width:100%;height:100%;clip-path:none!important;border-radius:48% 52% 47% 53%/40% 43% 57% 60%!important;position:relative;overflow:hidden;background:radial-gradient(circle at 28% 18%,rgba(255,255,255,.42) 0%,rgba(255,255,255,.09) 20%,transparent 34%),radial-gradient(circle at 73% 73%,rgba(15,19,16,.42),transparent 56%),conic-gradient(from 218deg at 48% 47%,#555c57 0deg,#858b84 58deg,#444b46 122deg,#777d77 184deg,#363c38 248deg,#6b716b 314deg,#515752 360deg)!important;box-shadow:inset 7px 5px 12px rgba(255,255,255,.16),inset -11px -12px 16px rgba(15,19,17,.30),inset 1px -2px 3px rgba(0,0,0,.22),0 2px 1px rgba(255,255,255,.14)}
      #page-insights #fwStoneLayer .fw-stone .body:before{content:'';position:absolute;inset:7% 11% 48% 13%;border-radius:50%;background:linear-gradient(160deg,rgba(255,255,255,.30),rgba(255,255,255,.03) 65%,transparent);filter:blur(.4px);transform:rotate(-8deg)}
      #page-insights #fwStoneLayer .fw-stone .body:after{content:'';position:absolute;inset:0;border-radius:inherit;background:radial-gradient(circle at 18% 66%,rgba(255,255,255,.06) 0 1px,transparent 2px),radial-gradient(circle at 62% 31%,rgba(0,0,0,.13) 0 1px,transparent 2px),radial-gradient(circle at 75% 57%,rgba(255,255,255,.05) 0 1px,transparent 2px);background-size:13px 11px,17px 15px,19px 17px;opacity:.55}
      #page-insights #fwStoneLayer .fw-stone[data-size="small"] .body{border-radius:50% 46% 52% 45%/45% 50% 50% 55%!important}
      #page-insights #fwStoneLayer .fw-stone[data-size="large"] .body{border-radius:46% 54% 50% 50%/38% 43% 57% 62%!important}
    `;
    document.head.appendChild(style);
  }

  function renderRewardHeader(count){
    const shell = document.querySelector('#page-insights .fw-i-shell');
    if (!shell) return;
    shell.querySelector('.fw-i-actions')?.remove();
    const tray = shell.querySelector('.fw-reward-tray');
    if (tray) tray.innerHTML = `<i class="fw-mini-stone" aria-hidden="true"></i><span class="fw-daily-reward-text">今日所获石头数 <strong id="fwRewardCount">${count}</strong></span>`;
  }

  function variantFor(stone){
    return SIZE_VARIANTS.find(item => item.key === stone.variant) || SIZE_VARIANTS[1];
  }

  function renderStoneLayer(stones){
    const layer = document.querySelector('#fwStoneLayer');
    if (!layer) return;
    layer.innerHTML = '';
    stones.forEach(stone => {
      const variant = variantFor(stone);
      const width = variant.size * stone.scale;
      const height = width * (.72 + variant.depth/220);
      const el = document.createElement('div');
      el.className = 'fw-stone';
      el.dataset.stoneId = stone.id;
      el.dataset.dailyRewardStone = 'true';
      el.dataset.size = variant.key;
      el.style.left = `${stone.x*100}%`;
      el.style.top = `${stone.y*100}%`;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      el.style.transform = `translate(-50%,-50%) rotate(${stone.rotation}deg)`;
      el.style.filter = `brightness(${.91 + stone.tone*.12})`;
      const body = document.createElement('div');
      body.className = 'body';
      el.appendChild(body);
      layer.appendChild(el);
    });
  }

  function ensureDailyCanvas(){
    const inner = document.querySelector('#fwGardenInner');
    if (!inner) return null;
    let canvas = inner.querySelector('#fwDailyGardenCanvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'fwDailyGardenCanvas';
      inner.insertBefore(canvas,inner.querySelector('#fwGardenUserCanvas'));
    }
    return canvas;
  }

  function seeded(seed){
    let x = seed >>> 0;
    return () => ((x = (Math.imul(x,1664525) + 1013904223) >>> 0) / 4294967296);
  }

  function drawSandTexture(ctx,w,h){
    const gradient = ctx.createLinearGradient(0,0,0,h);
    gradient.addColorStop(0,'#f1eee7');
    gradient.addColorStop(.52,'#ebe7de');
    gradient.addColorStop(1,'#e5dfd4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,w,h);

    const rnd = seeded(824731);
    const grainCount = Math.min(2200,Math.floor(w*h/340));
    for(let i=0;i<grainCount;i+=1){
      const x=rnd()*w,y=rnd()*h,r=.35+rnd()*.8;
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fillStyle = rnd()>.52 ? `rgba(126,111,88,${.025+rnd()*.035})` : `rgba(255,255,255,${.07+rnd()*.08})`;
      ctx.fill();
    }
  }

  function drawGroove(ctx,points,shadowAlpha=.18){
    ctx.beginPath();
    points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
    ctx.strokeStyle=`rgba(115,103,84,${shadowAlpha})`;
    ctx.lineWidth=1.45;
    ctx.stroke();
    ctx.save();
    ctx.translate(0,-1.05);
    ctx.strokeStyle='rgba(255,255,255,.70)';
    ctx.lineWidth=.9;
    ctx.stroke();
    ctx.restore();
  }

  function drawSandRakes(ctx,w,h,stones){
    const gap=13;
    for(let base=10,line=0;base<h;base+=gap,line+=1){
      const points=[];
      for(let x=0;x<=w;x+=5){
        let y=base + Math.sin(x*.009 + line*.18)*1.0;
        for(const stone of stones){
          const variant=variantFor(stone);
          const sx=stone.x*w,sy=stone.y*h;
          const rx=variant.size*1.7, ry=variant.size*1.15;
          const nx=(x-sx)/rx, ny=(base-sy)/ry;
          const dist=nx*nx+ny*ny;
          if(dist<2.7){
            const influence=Math.exp(-dist*1.18);
            y += (base>=sy?1:-1) * influence * Math.min(18,variant.size*.24);
          }
        }
        points.push([x,y]);
      }
      drawGroove(ctx,points,.12);
    }
  }

  function drawStoneRings(ctx,w,h,stones){
    stones.forEach(stone=>{
      const variant=variantFor(stone);
      const sx=stone.x*w,sy=stone.y*h;
      const rings=variant.key==='large'?7:variant.key==='medium'?6:5;
      for(let k=1;k<=rings;k+=1){
        const rx=variant.size*.60+k*10.5;
        const ry=rx*.58;
        ctx.beginPath();
        ctx.ellipse(sx,sy+variant.size*.05,rx,ry,stone.rotation*Math.PI/180*.12,0,Math.PI*2);
        ctx.strokeStyle=`rgba(112,100,82,${Math.max(.055,.19-k*.019)})`;
        ctx.lineWidth=1.35;
        ctx.stroke();
        ctx.save();ctx.translate(0,-1);
        ctx.strokeStyle=`rgba(255,255,255,${Math.max(.16,.48-k*.045)})`;
        ctx.lineWidth=.8;ctx.stroke();ctx.restore();
      }
    });
  }

  function drawDailyGarden(stones){
    const canvas=ensureDailyCanvas();
    if(!canvas)return;
    const rect=canvas.getBoundingClientRect();
    if(rect.width<10||rect.height<10)return;
    const d=Math.min(window.devicePixelRatio||1,2);
    const w=Math.max(10,Math.floor(rect.width)),h=Math.max(10,Math.floor(rect.height));
    const pw=Math.floor(w*d),ph=Math.floor(h*d);
    if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
    const ctx=canvas.getContext('2d');
    ctx.setTransform(d,0,0,d,0,0);
    ctx.clearRect(0,0,w,h);
    drawSandTexture(ctx,w,h);
    drawSandRakes(ctx,w,h,stones);
    drawStoneRings(ctx,w,h,stones);

    const vignette=ctx.createRadialGradient(w*.5,h*.46,Math.min(w,h)*.25,w*.5,h*.5,Math.max(w,h)*.72);
    vignette.addColorStop(0,'rgba(255,255,255,0)');
    vignette.addColorStop(1,'rgba(102,83,57,.055)');
    ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
  }

  function patchInsights(){
    ensureStyles();
    const shell=document.querySelector('#page-insights .fw-i-shell');
    if(!shell)return false;
    const state=readState();
    renderRewardHeader(state.stones.length);
    renderStoneLayer(state.stones);
    drawDailyGarden(state.stones);
    return true;
  }

  function syncInsightsSoon(){
    [0,120,420].forEach(delay=>setTimeout(patchInsights,delay));
  }

  function bind(){
    ensureStyles();
    scheduleMidnightReset();
    syncInsightsSoon();

    document.addEventListener('click',event=>{
      const target=event.target.closest('button,[data-nav],[data-go]');
      if(!target)return;
      if(target.matches('#beginLive')){sessionActive=true;return;}
      if(target.matches('#finishBtn')){
        if(sessionActive){sessionActive=false;incrementReward();}
        return;
      }
      if(target.matches('[data-nav="insights"],[data-go="insights"],#fwEditGarden'))syncInsightsSoon();
    });

    window.addEventListener('resize',()=>{
      cancelAnimationFrame(resizeRaf);
      resizeRaf=requestAnimationFrame(patchInsights);
    });
    window.addEventListener('storage',event=>{
      if(event.key===STORAGE_KEY)patchInsights();
    });
  }

  window.FocusWaveDailyGardenRewards={
    get count(){return readState().stones.length;},
    get stones(){return readState().stones.map(stone=>({...stone}));},
    patchInsights,
    resetToday(){writeState({stones:[]});patchInsights();}
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();
