/* FocusWave weekly garden rewards.
 * One completed focus task earns one stone. The accumulated reward stones reset
 * once per week at Sunday 24:00 / Monday 00:00 local time. The insight garden
 * renders exactly the same number of stones as the visible reward counter.
 * No MutationObserver and no global polling.
 */
(() => {
  if (window.FocusWaveDailyGardenRewards) return;

  const STORAGE_KEY = 'focuswave.weeklyRewardStones.v1';
  let sessionActive = false;
  let weeklyResetTimer = 0;
  let resizeRaf = 0;

  const STONE_SHAPES = [
    'polygon(17% 25%,34% 7%,67% 12%,88% 37%,81% 75%,56% 94%,20% 85%,5% 55%)',
    'polygon(22% 15%,57% 3%,87% 31%,93% 64%,69% 92%,31% 96%,7% 69%,5% 38%)',
    'polygon(30% 5%,68% 12%,91% 45%,78% 83%,45% 96%,12% 78%,4% 38%)',
    'polygon(24% 11%,59% 4%,88% 30%,94% 63%,71% 92%,33% 95%,7% 69%,3% 39%)'
  ];

  const STONE_LAYOUT = [
    [.17,.22,66,0,-5], [.13,.58,34,2,4], [.53,.74,58,1,-3], [.86,.60,54,3,7],
    [.78,.27,32,2,-8], [.37,.43,46,1,5], [.64,.19,38,3,-4], [.29,.76,42,0,7],
    [.69,.57,34,2,-5], [.48,.25,50,1,3], [.90,.34,30,0,8], [.08,.36,36,3,-6]
  ];

  function localDayKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function localWeekKey(date = new Date()) {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
    return localDayKey(start);
  }

  function readState() {
    const week = localWeekKey();
    let state = null;
    try { state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) {}
    if (!state || state.week !== week || !Number.isFinite(Number(state.count))) {
      state = {week, count: 0};
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    state.count = Math.max(0, Math.floor(Number(state.count) || 0));
    return state;
  }

  function writeCount(count) {
    const state = {week: localWeekKey(), count: Math.max(0, Math.floor(Number(count) || 0))};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }

  function incrementReward() {
    const state = readState();
    writeCount(state.count + 1);
    syncInsightsSoon();
  }

  function nextMondayMidnight(now = new Date()) {
    const day = now.getDay();
    const daysUntilMonday = ((8 - day) % 7) || 7;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday, 0, 0, 0, 40);
  }

  function scheduleWeeklyReset() {
    clearTimeout(weeklyResetTimer);
    const next = nextMondayMidnight();
    weeklyResetTimer = setTimeout(() => {
      writeCount(0);
      patchInsights();
      scheduleWeeklyReset();
    }, Math.max(1000, next.getTime() - Date.now()));
  }

  function ensureStyles() {
    if (document.querySelector('style[data-focuswave-daily-garden-rewards]')) return;
    const style = document.createElement('style');
    style.dataset.focuswaveDailyGardenRewards = 'true';
    style.textContent = `
      #page-insights .fw-i-actions{display:none!important}
      #page-insights .fw-reward-block{display:flex!important;flex-direction:column;align-items:flex-end;gap:8px!important}
      #page-insights .fw-reward-label{display:none!important}
      #page-insights .fw-reward-tray{height:38px!important;display:flex!important;align-items:center!important;gap:11px!important}
      #page-insights .fw-reward-tray .fw-mini-stone{flex:0 0 auto;margin:0!important}
      #page-insights .fw-daily-reward-text{font-size:12px;color:#737a75;white-space:nowrap;letter-spacing:.02em}
      #page-insights .fw-daily-reward-text strong{font-size:16px;font-weight:450;color:#3f4843;margin-left:5px;font-variant-numeric:tabular-nums}
      #page-insights #fwDailyGardenCanvas{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:3;pointer-events:none}
      #page-insights #fwStoneLayer{z-index:5}
      #page-insights #fwStoneLayer .fw-stone{pointer-events:none!important}
    `;
    document.head.appendChild(style);
  }

  function positionFor(index) {
    if (index < STONE_LAYOUT.length) {
      const [x,y,size,shape,rotation] = STONE_LAYOUT[index];
      return {x,y,size,shape,rotation};
    }
    const n = index - STONE_LAYOUT.length;
    const x = .08 + ((n * .381966 + .19) % 1) * .84;
    const y = .14 + ((n * .618034 + .31) % 1) * .72;
    const size = 28 + (n % 5) * 6;
    return {x,y,size,shape:index % STONE_SHAPES.length,rotation:(index * 7) % 19 - 9};
  }

  function rewardStones(count) {
    return Array.from({length: count}, (_, index) => ({id:`reward-${index + 1}`,...positionFor(index)}));
  }

  function renderRewardHeader(count) {
    const shell = document.querySelector('#page-insights .fw-i-shell');
    if (!shell) return;
    shell.querySelector('.fw-i-actions')?.remove();

    const tray = shell.querySelector('.fw-reward-tray');
    if (tray) {
      tray.innerHTML = `<i class="fw-mini-stone" aria-hidden="true"></i><span class="fw-daily-reward-text">今日所获石头数 <strong id="fwRewardCount">${count}</strong></span>`;
    }
  }

  function renderStoneLayer(stones) {
    const layer = document.querySelector('#fwStoneLayer');
    if (!layer) return;
    layer.innerHTML = '';
    stones.forEach((stone) => {
      const el = document.createElement('div');
      el.className = 'fw-stone';
      el.dataset.stoneId = stone.id;
      el.dataset.dailyRewardStone = 'true';
      el.style.left = `${stone.x * 100}%`;
      el.style.top = `${stone.y * 100}%`;
      el.style.width = `${stone.size}px`;
      el.style.height = `${Math.round(stone.size * .72)}px`;
      el.style.transform = `translate(-50%,-50%) rotate(${stone.rotation}deg)`;
      el.style.setProperty('--stone-shape', STONE_SHAPES[stone.shape % STONE_SHAPES.length]);
      const body = document.createElement('div');
      body.className = 'body';
      el.appendChild(body);
      layer.appendChild(el);
    });
  }

  function ensureDailyCanvas() {
    const inner = document.querySelector('#fwGardenInner');
    if (!inner) return null;
    let canvas = inner.querySelector('#fwDailyGardenCanvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'fwDailyGardenCanvas';
      inner.insertBefore(canvas, inner.querySelector('#fwGardenUserCanvas'));
    }
    return canvas;
  }

  function drawGardenForRewards(stones) {
    const canvas = ensureDailyCanvas();
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const d = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(10, Math.floor(rect.width));
    const h = Math.max(10, Math.floor(rect.height));
    const pw = Math.floor(w * d), ph = Math.floor(h * d);
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(d,0,0,d,0,0);
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = '#f4f4f0';
    ctx.fillRect(0,0,w,h);

    const lineGap = 9;
    for (let y0 = 5, line = 0; y0 < h; y0 += lineGap, line += 1) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        let y = y0 + Math.sin(x * .012 + line * .17) * 1.2 + Math.sin(x * .026 - line * .09) * .45;
        for (const stone of stones) {
          const sx = stone.x * w, sy = stone.y * h;
          const dx = x - sx, dy = y0 - sy;
          const r = stone.size * 1.18;
          const dist2 = dx*dx + dy*dy;
          if (dist2 < r*r*3.2) {
            const influence = Math.exp(-dist2 / (r*r*1.55));
            y += (dy >= 0 ? 1 : -1) * influence * Math.min(12, stone.size * .17);
          }
        }
        if (x === 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.strokeStyle = 'rgba(117,115,109,.18)';
      ctx.lineWidth = .82;
      ctx.stroke();
      ctx.save();
      ctx.translate(0,-.65);
      ctx.strokeStyle = 'rgba(255,255,255,.78)';
      ctx.lineWidth = .65;
      ctx.stroke();
      ctx.restore();
    }

    stones.forEach(stone => {
      const sx = stone.x * w, sy = stone.y * h;
      const rings = stone.size > 45 ? 6 : 4;
      for (let k = 1; k <= rings; k += 1) {
        const rx = stone.size * .56 + k * 10;
        const ry = rx * .62;
        ctx.beginPath();
        ctx.ellipse(sx, sy + 2, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(118,116,109,${Math.max(.07,.17-k*.016)})`;
        ctx.lineWidth = .8;
        ctx.stroke();
      }
    });
  }

  function patchInsights() {
    ensureStyles();
    const shell = document.querySelector('#page-insights .fw-i-shell');
    if (!shell) return false;
    const count = readState().count;
    const stones = rewardStones(count);
    renderRewardHeader(count);
    renderStoneLayer(stones);
    drawGardenForRewards(stones);
    return true;
  }

  function syncInsightsSoon() {
    // Bounded, event-triggered retries only: the insights runtime is lazy-loaded.
    [0, 120, 420].forEach(delay => setTimeout(patchInsights, delay));
  }

  function bind() {
    ensureStyles();
    scheduleWeeklyReset();
    syncInsightsSoon();

    document.addEventListener('click', event => {
      const target = event.target.closest('button,[data-nav],[data-go]');
      if (!target) return;

      if (target.matches('#beginLive')) {
        sessionActive = true;
        return;
      }

      if (target.matches('#finishBtn')) {
        if (sessionActive) {
          sessionActive = false;
          incrementReward();
        }
        return;
      }

      if (target.matches('[data-nav="insights"],[data-go="insights"],#fwEditGarden')) {
        syncInsightsSoon();
      }
    });

    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(patchInsights);
    });

    window.addEventListener('storage', event => {
      if (event.key === STORAGE_KEY) patchInsights();
    });
  }

  window.FocusWaveDailyGardenRewards = {
    get count(){ return readState().count; },
    get week(){ return readState().week; },
    patchInsights,
    resetWeek(){ writeCount(0); patchInsights(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, {once:true});
  else bind();
})();
