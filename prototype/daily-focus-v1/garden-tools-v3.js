/* FocusWave karesansui bottom tool dock v8.
 * Click a physical rake in the bottom dock to equip it; click the same tool again to unequip.
 * While equipped, the physical tool follows the pointer over the sand and left-dragging leaves
 * tooth-count-accurate grooves. The sand surface itself starts flat and is rendered separately.
 * No MutationObserver and no global polling.
 */
(() => {
  if (window.FocusWaveGardenToolsV8) return;

  const ASSET_ROOT = './lab/assets/karesansui/';
  const ASSETS = {
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
    fine: {teeth: 7, spacing: 8.5, dark: 1.45, light: .72},
    medium: {teeth: 5, spacing: 12.5, dark: 1.55, light: .76},
    coarse: {teeth: 3, spacing: 19, dark: 1.7, light: .82},
    flatten: {eraseWidth: 96}
  };

  let installed = false;
  let frame = null;
  let inner = null;
  let canvas = null;
  let dock = null;
  let status = null;
  let cursor = null;
  let cursorImg = null;
  let tool = null;
  let drawing = false;
  let current = null;
  let actions = [];
  let lastScreen = null;
  let lastAngle = -45;
  let resizeObserver = null;

  function metrics() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    const w = Math.max(10, Math.round(r.width * d));
    const h = Math.max(10, Math.round(r.height * d));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    return {d, r, w, h, sx: w / r.width, sy: h / r.height};
  }

  function point(event) {
    const {r} = metrics();
    return {x: event.clientX - r.left, y: event.clientY - r.top};
  }

  function shiftedPath(points, offset) {
    return points.map((p, i, all) => {
      const a = all[Math.max(0, i - 1)];
      const b = all[Math.min(all.length - 1, i + 1)];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      return {x: p.x - dy / len * offset, y: p.y + dx / len * offset};
    });
  }

  function tracePath(ctx, points, sx, sy, offset = 0) {
    if (points.length < 2) return;
    const path = shiftedPath(points, offset);
    ctx.moveTo(path[0].x * sx, path[0].y * sy);
    for (let i = 1; i < path.length - 1; i += 1) {
      const mx = (path[i].x + path[i + 1].x) / 2;
      const my = (path[i].y + path[i + 1].y) / 2;
      ctx.quadraticCurveTo(path[i].x * sx, path[i].y * sy, mx * sx, my * sy);
    }
    const last = path[path.length - 1];
    ctx.lineTo(last.x * sx, last.y * sy);
  }

  function strokeGroove(ctx, action, m, offset, spec) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    tracePath(ctx, action.points, m.sx, m.sy, offset);
    ctx.strokeStyle = 'rgba(105, 91, 70, .34)';
    ctx.lineWidth = spec.dark * m.d;
    ctx.stroke();

    ctx.translate(0, -1.05 * m.d);
    ctx.beginPath();
    tracePath(ctx, action.points, m.sx, m.sy, offset);
    ctx.strokeStyle = 'rgba(255, 255, 255, .70)';
    ctx.lineWidth = spec.light * m.d;
    ctx.stroke();
    ctx.restore();
  }

  function renderAction(ctx, action, m) {
    if (action.tool === 'flatten') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = SPECS.flatten.eraseWidth * m.d;
      ctx.beginPath();
      tracePath(ctx, action.points, m.sx, m.sy, 0);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const spec = SPECS[action.tool];
    if (!spec) return;
    const center = (spec.teeth - 1) / 2;
    for (let tooth = 0; tooth < spec.teeth; tooth += 1) {
      strokeGroove(ctx, action, m, (tooth - center) * spec.spacing, spec);
    }
  }

  function updateStatus() {
    if (!status) return;
    status.innerHTML = `<span class="fw-dock-dot"></span><span>${actions.length} 次塑形</span><span class="fw-dock-sep">·</span><span>${tool ? `已选择 ${LABELS[tool]}` : '尚未选择庭具'}</span>`;
  }

  function redraw() {
    if (!canvas) return;
    const m = metrics();
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, m.w, m.h);
    actions.forEach(action => renderAction(ctx, action, m));
    if (current) renderAction(ctx, current, m);
    updateStatus();
  }

  function showCursor(visible) {
    if (!cursor) return;
    cursor.classList.toggle('visible', Boolean(visible && tool));
  }

  function moveCursor(event) {
    if (!tool || !cursor) return;
    const r = inner.getBoundingClientRect();
    cursor.style.left = `${event.clientX - r.left}px`;
    cursor.style.top = `${event.clientY - r.top}px`;
    showCursor(true);

    if (lastScreen) {
      const dx = event.clientX - lastScreen[0];
      const dy = event.clientY - lastScreen[1];
      if (Math.hypot(dx, dy) > 2) {
        const raw = Math.atan2(dy, dx) * 180 / Math.PI;
        lastAngle = lastAngle * .68 + raw * .32;
      }
    }
    cursor.style.setProperty('--tool-angle', `${lastAngle}deg`);
    lastScreen = [event.clientX, event.clientY];
  }

  function setTool(next) {
    tool = next && SPECS[next] ? next : null;
    dock?.querySelectorAll('[data-rake-tool]').forEach(button => {
      const active = button.dataset.rakeTool === tool;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    if (tool) {
      cursor.className = `fw-physical-cursor ${tool}`;
      cursorImg.src = ASSET_ROOT + ASSETS[tool];
      cursorImg.alt = LABELS[tool];
      inner.style.cursor = 'none';
    } else {
      cursor.className = 'fw-physical-cursor';
      cursorImg.removeAttribute('src');
      cursorImg.alt = '';
      inner.style.cursor = '';
      showCursor(false);
    }
    updateStatus();
  }

  function toggleTool(next) {
    setTool(tool === next ? null : next);
  }

  function start(event) {
    if (!tool || event.button !== 0) return;
    drawing = true;
    current = {tool, points: [point(event)]};
    canvas.setPointerCapture?.(event.pointerId);
    moveCursor(event);
    cursor.classList.add('using');
    event.preventDefault();
    redraw();
  }

  function move(event) {
    if (tool) moveCursor(event);
    if (!drawing || !current) return;
    const p = point(event);
    const last = current.points[current.points.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) > 1.8) {
      current.points.push(p);
      redraw();
    }
  }

  function end(event) {
    if (!drawing) return;
    if (current?.points.length > 1) actions.push(current);
    drawing = false;
    current = null;
    cursor.classList.remove('using');
    try { canvas.releasePointerCapture(event.pointerId); } catch (_) {}
    redraw();
  }

  function buildDock(oldTools) {
    const nextDock = document.createElement('div');
    nextDock.id = 'fwEditTools';
    nextDock.className = 'fw-tool-dock';
    nextDock.setAttribute('aria-label', '枯山水庭具工具栏');
    nextDock.innerHTML = `
      <div class="fw-dock-status" id="fwPhysicalStatus"></div>
      <div class="fw-dock-divider" aria-hidden="true"></div>
      <div class="fw-dock-tools" role="group" aria-label="选择庭具">
        ${['fine','medium','coarse','flatten'].map(key => `
          <button class="fw-dock-tool" type="button" data-rake-tool="${key}" aria-pressed="false" title="${LABELS[key]}">
            <span class="fw-dock-thumb"><img src="${ASSET_ROOT + ASSETS[key]}" alt=""></span>
            <span>${LABELS[key]}</span>
          </button>`).join('')}
      </div>
      <div class="fw-dock-divider" aria-hidden="true"></div>
      <div class="fw-dock-actions">
        <button type="button" data-action="undo" title="撤销上一次塑形">↶ <span>撤销</span></button>
        <button type="button" data-action="reset" title="清空全部砂纹">↻ <span>重置白砂</span></button>
      </div>`;

    oldTools.remove();
    const help = document.querySelector('#page-insights .fw-garden-help');
    if (help) help.insertAdjacentElement('afterend', nextDock);
    else frame.insertAdjacentElement('afterend', nextDock);

    dock = nextDock;
    status = nextDock.querySelector('#fwPhysicalStatus');
    nextDock.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      const nextTool = button.dataset.rakeTool;
      if (nextTool) toggleTool(nextTool);
      if (button.dataset.action === 'undo') {
        actions.pop();
        redraw();
      }
      if (button.dataset.action === 'reset') {
        actions = [];
        current = null;
        redraw();
      }
    });
  }

  function replaceCanvas(oldCanvas) {
    const nextCanvas = document.createElement('canvas');
    nextCanvas.id = 'fwGardenUserCanvas';
    oldCanvas.replaceWith(nextCanvas);
    canvas = nextCanvas;

    cursor = document.createElement('div');
    cursor.className = 'fw-physical-cursor';
    cursor.innerHTML = '<img alt="">';
    cursorImg = cursor.querySelector('img');
    inner.appendChild(cursor);

    canvas.addEventListener('pointerenter', event => {
      lastScreen = null;
      if (tool) moveCursor(event);
    });
    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', () => {
      if (!drawing) {
        lastScreen = null;
        showCursor(false);
      }
    });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  function ensureStyles() {
    if (document.querySelector('style[data-focuswave-bottom-garden-tools]')) return;
    const style = document.createElement('style');
    style.dataset.focuswaveBottomGardenTools = 'true';
    style.textContent = `
      #page-insights #fwEditGarden{display:none!important}
      #page-insights #fwGardenFrame{overflow:hidden!important}
      #page-insights #fwGardenInner{cursor:default}
      #page-insights #fwGardenUserCanvas{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:10!important;background:transparent!important;touch-action:none!important;pointer-events:auto!important}
      #page-insights #fwStoneLayer,#page-insights #fwStoneLayer .fw-stone{pointer-events:none!important}
      #page-insights .fw-garden-help{height:34px!important;opacity:1!important;color:#8a847a!important;font-size:11px!important}

      #page-insights .fw-tool-dock{
        min-height:88px;margin:10px 0 0;padding:8px 14px 8px 18px;
        display:grid;grid-template-columns:minmax(190px,1fr) auto minmax(470px,1.55fr) auto minmax(220px,1fr);
        align-items:center;gap:16px;border:1px solid rgba(72,67,58,.10);border-radius:20px;
        background:rgba(249,247,241,.94);box-shadow:0 12px 30px rgba(56,49,38,.08),inset 0 1px rgba(255,255,255,.75);
        backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)
      }
      #page-insights .fw-dock-status{display:flex;align-items:center;gap:8px;color:#7c7d77;font-size:11px;white-space:nowrap}
      #page-insights .fw-dock-dot{width:7px;height:7px;border-radius:50%;background:#5e635f;opacity:.82}
      #page-insights .fw-dock-sep{color:#bbb6ac}
      #page-insights .fw-dock-divider{width:1px;height:40px;background:rgba(67,64,57,.11)}
      #page-insights .fw-dock-tools{display:flex;align-items:center;justify-content:center;gap:12px}
      #page-insights .fw-dock-tool{width:94px;height:72px;padding:5px 6px 4px;border:1px solid transparent;border-radius:13px;background:transparent;display:grid;grid-template-rows:45px auto;place-items:center;gap:2px;cursor:pointer;color:#696a64;font-size:10px;transition:background .16s,border-color .16s,transform .16s,box-shadow .16s}
      #page-insights .fw-dock-tool:hover{background:rgba(225,216,201,.28);transform:translateY(-1px)}
      #page-insights .fw-dock-tool.active{border-color:#947154;background:rgba(201,169,131,.11);box-shadow:inset 0 0 0 1px rgba(148,113,84,.08)}
      #page-insights .fw-dock-thumb{width:72px;height:43px;display:grid;place-items:center;overflow:hidden}
      #page-insights .fw-dock-thumb img{width:58px;height:58px;object-fit:contain;filter:drop-shadow(0 4px 3px rgba(70,46,27,.16));pointer-events:none;user-select:none}
      #page-insights .fw-dock-tool[data-rake-tool="flatten"] .fw-dock-thumb img{width:64px;height:64px}
      #page-insights .fw-dock-actions{display:flex;justify-content:flex-end;gap:8px;white-space:nowrap}
      #page-insights .fw-dock-actions button{height:36px;padding:0 12px;border:1px solid rgba(74,70,62,.10);border-radius:999px;background:rgba(255,255,255,.33);color:#797970;font-size:11px;cursor:pointer;transition:background .16s,color .16s}
      #page-insights .fw-dock-actions button:hover{background:rgba(255,255,255,.72);color:#4f544f}

      #page-insights .fw-physical-cursor{--tool-angle:-45deg;position:absolute;left:0;top:0;z-index:24;pointer-events:none;opacity:0;transform:translateZ(0);transition:opacity .08s}
      #page-insights .fw-physical-cursor.visible{opacity:.96}
      #page-insights .fw-physical-cursor.using{opacity:1}
      #page-insights .fw-physical-cursor img{display:block;width:145px;height:145px;object-fit:contain;user-select:none;filter:drop-shadow(0 8px 7px rgba(61,42,26,.24));transform-origin:38% 72%;transform:translate(-38%,-72%) rotate(calc(var(--tool-angle) - 45deg))}
      #page-insights .fw-physical-cursor.medium img{width:140px;height:140px}
      #page-insights .fw-physical-cursor.coarse img{width:134px;height:134px}
      #page-insights .fw-physical-cursor.flatten img{width:142px;height:142px;transform-origin:42% 64%;transform:translate(-42%,-64%) rotate(calc(var(--tool-angle) - 45deg))}

      @media(max-width:1100px){
        #page-insights .fw-tool-dock{grid-template-columns:1fr auto minmax(390px,1.7fr) auto auto;gap:10px;padding-left:12px}
        #page-insights .fw-dock-tool{width:82px}.fw-dock-status .fw-dock-sep{display:none}
      }
      @media(max-width:780px){
        #page-insights .fw-tool-dock{grid-template-columns:1fr;gap:8px;padding:10px;overflow-x:auto}
        #page-insights .fw-dock-status,#page-insights .fw-dock-actions{justify-content:center}
        #page-insights .fw-dock-divider{display:none}
        #page-insights .fw-dock-tools{justify-content:flex-start;min-width:max-content}
      }
    `;
    document.head.appendChild(style);
  }

  function install() {
    if (installed) return true;
    frame = document.querySelector('#fwGardenFrame');
    inner = document.querySelector('#fwGardenInner');
    const oldTools = document.querySelector('#fwEditTools');
    const oldCanvas = document.querySelector('#fwGardenUserCanvas');
    if (!frame || !inner || !oldTools || !oldCanvas) return false;

    installed = true;
    frame.classList.remove('fw-photo-active', 'fw-three-active');
    ensureStyles();
    buildDock(oldTools);
    replaceCanvas(oldCanvas);

    const editButton = document.querySelector('#fwEditGarden');
    if (editButton) editButton.hidden = true;
    const help = document.querySelector('#page-insights .fw-garden-help');
    if (help) help.textContent = '点击下方庭具即可拿起；鼠标进入沙盘后庭具会跟随光标。按住左键拖动留下对应齿数的砂纹；再次点击当前庭具即可放下。';

    setTool(null);
    resizeObserver = new ResizeObserver(() => requestAnimationFrame(redraw));
    resizeObserver.observe(canvas);
    requestAnimationFrame(redraw);
    return true;
  }

  function boot() {
    if (install()) return;
    requestAnimationFrame(install);
  }

  window.FocusWaveGardenToolsV8 = {
    install,
    selectTool: setTool,
    get activeTool() { return tool; },
    reset() { actions = []; current = null; redraw(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
