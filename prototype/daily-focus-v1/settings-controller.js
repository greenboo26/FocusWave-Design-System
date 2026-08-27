/* FocusWave preference + prototype review controller
 * One canonical defaultTextMode; Setup may override for one session.
 * Heavy page runtimes are loaded only when the corresponding flow is entered.
 */

const TEXT_MODES = [
  { value: 'minimal', label: '极简' },
  { value: 'original', label: '原创短句' },
  { value: 'global', label: '世界文学' },
  { value: 'classical', label: '中文古典' }
];

const STORAGE_KEY = 'focuswave.defaultTextMode';
const DEMO_STATE_INTERVAL_MS = 10000;
const TODAY_THEMES = ['ocean', 'mountain', 'incense', 'dusk'];
const TODAY_STATES = ['stable', 'drift', 'refocus'];
let todayVariant = null;
let liveReady = false;
let liveEnginePromise = null;
let prototypeStateBound = false;
const runtimePromises = new Map();

function ensureLayoutStyles() {
  if (!document.querySelector('link[data-focuswave-setup-balance]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './setup-balance.css';
    link.dataset.focuswaveSetupBalance = 'true';
    document.head.appendChild(link);
  }
  if (!document.querySelector('link[data-focuswave-practice-signatures]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './practice-signatures.css';
    link.dataset.focuswavePracticeSignatures = 'true';
    document.head.appendChild(link);
  }
  if (!document.querySelector('style[data-focuswave-settings-refinement]')) {
    const style = document.createElement('style');
    style.dataset.focuswaveSettingsRefinement = 'true';
    style.textContent = `
      #page-settings .settings-shell{grid-template-columns:190px minmax(0,1fr);gap:58px;max-width:1120px}
      #page-settings .settings-nav{padding-top:3px;gap:6px}
      #page-settings .settings-nav button{font-size:15px;font-weight:400;line-height:1.5;padding:10px 0;color:#858b87}
      #page-settings .settings-nav button.active{font-weight:450;color:var(--ink)}
      #page-settings .settings-panel{max-width:900px}
      #page-settings .settings-row{padding:24px 0;gap:44px;min-height:92px}
      #page-settings .settings-row b{font-family:var(--ui);font-size:15px;font-weight:450;letter-spacing:.01em;color:var(--ink)}
      #page-settings .settings-row p{font-size:12px;line-height:1.75;margin:7px 0 0;max-width:620px}
      #page-settings .pill{font-family:var(--ui);font-size:11px;font-weight:400}
      #page-settings .content-library-entry{background:transparent;cursor:pointer;color:var(--ink)}
      #page-settings .mini-choice{font-weight:400}

      #page-live .live-brand{font-family:var(--ui);font-size:17px;font-weight:450;letter-spacing:.01em;color:#39443f}
      #page-live .metric{color:#66706b;font-weight:400}
      #page-live .metric strong{font-family:var(--ui);font-size:23px;font-weight:400;letter-spacing:-.015em;color:#3e4944}
      #page-live .metric small{font-weight:400;color:#8a918d}
    `;
    document.head.appendChild(style);
  }
}

function appendRuntime(src, datasetKey) {
  if (runtimePromises.has(datasetKey)) return runtimePromises.get(datasetKey);
  const existing = document.querySelector(`script[data-focuswave-${datasetKey}]`);
  if (existing?.dataset.loaded === 'true') return Promise.resolve();

  const promise = new Promise(resolve => {
    const script = existing || document.createElement('script');
    if (!existing) {
      script.src = src;
      script.setAttribute(`data-focuswave-${datasetKey}`, 'true');
      document.body.appendChild(script);
    }
    const done = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    if (existing && existing.dataset.loaded !== 'true') {
      script.addEventListener('load', done, {once:true});
      script.addEventListener('error', done, {once:true});
    } else {
      script.onload = done;
      script.onerror = done;
    }
  });
  runtimePromises.set(datasetKey, promise);
  return promise;
}

function ensurePracticeSignatureRuntime() {
  return appendRuntime('./practice-signatures.js', 'practice-signatures');
}

function ensurePortraitDetailsRuntime() {
  return appendRuntime('./portrait-details.js', 'portrait-details');
}

async function ensureInsightsRuntime() {
  await appendRuntime('./insights-longterm.js', 'insights-longterm');
  await appendRuntime('./garden-tools-v3.js', 'garden-tools-v3');
}

function ensureLiveEngines() {
  if (liveEnginePromise) return liveEnginePromise;
  liveEnginePromise = Promise.all([
    appendRuntime('./generative-visual-engine.js', 'generative-visual-engine'),
    appendRuntime('./content-engine.js', 'content-engine')
  ]).then(() => {
    liveReady = true;
    window.FocusWaveContentEngine?.refresh?.();
    if (typeof renderStatic === 'function') requestAnimationFrame(renderStatic);
    bindPrototypeStateReview();
  });
  return liveEnginePromise;
}

function validMode(value) {
  return TEXT_MODES.some(mode => mode.value === value) ? value : 'original';
}
function getDefaultMode() { return validMode(localStorage.getItem(STORAGE_KEY) || 'original'); }
function setSelected(group, value) {
  if (!group) return;
  group.querySelectorAll('[data-value]').forEach(button => button.classList.toggle('selected', button.dataset.value === value));
}

function renderSettingsPanel() {
  const navButton = document.querySelector('[data-setting="ai"]');
  if (navButton) navButton.textContent = '文字';
  const panel = document.querySelector('#setting-ai');
  if (!panel) return;

  panel.innerHTML = `
    <div class="settings-row">
      <div>
        <b>默认文字模式</b>
        <p>新建专注时自动采用这个模式；每次 session 都可以在开始前单独调整。</p>
      </div>
      <div class="setting-choices" id="defaultTextSetting">
        ${TEXT_MODES.map(mode => `<button class="mini-choice" data-value="${mode.value}">${mode.label}</button>`).join('')}
      </div>
    </div>
    <div class="settings-row">
      <div>
        <b>内容来源</b>
        <p>原创短句、世界文学与中文古典分别使用对应内容库。内容库可查看当前条目、作者、作品与适用状态。</p>
      </div>
      <button class="pill content-library-entry" type="button">内容库</button>
    </div>`;

  const group = panel.querySelector('#defaultTextSetting');
  setSelected(group, getDefaultMode());
  group.querySelectorAll('[data-value]').forEach(button => {
    button.addEventListener('click', () => {
      const next = validMode(button.dataset.value);
      localStorage.setItem(STORAGE_KEY, next);
      setSelected(group, next);
    });
  });
}

function inheritDefaultForNewSession() { setSelected(document.querySelector('#textGroup'), getDefaultMode()); }
function bindSessionEntry() {
  [document.querySelector('#startFocus'), document.querySelector('#practiceToSetup')].filter(Boolean)
    .forEach(button => button.addEventListener('click', inheritDefaultForNewSession));
  inheritDefaultForNewSession();
}

function bindExport() {
  const button = document.querySelector('#exportSettings');
  if (!button) return;
  button.onclick = () => {
    const selected = id => document.querySelector(`#${id} .selected`)?.dataset.value || '';
    const data = { motion:selected('motionSetting'), feedback:selected('feedbackSetting'), defaultTextMode:getDefaultMode() };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = 'focuswave-settings.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 500);
  };
}

function shuffledStateBag(previous = -1) {
  const bag = Array.from({length:states.length}, (_,index)=>index);
  for (let i=bag.length-1;i>0;i-=1) {
    const j=Math.floor(Math.random()*(i+1));
    [bag[i],bag[j]]=[bag[j],bag[i]];
  }
  if (bag.length>1 && bag[0]===previous) [bag[0],bag[1]]=[bag[1],bag[0]];
  return bag;
}

function bindPrototypeStateReview() {
  if (prototypeStateBound || !liveReady) return;
  const begin=document.querySelector('#beginLive');
  if (!begin || typeof states==='undefined' || typeof showPage!=='function') return;
  begin.onclick = () => {
    window.FocusWaveVisualEngine?.reseed?.();
    showPage('live');
    liveStarted=Date.now();
    let bag=shuffledStateBag(-1);
    stateIndex=bag.shift();
    applyState();
    window.FocusWaveContentEngine?.refresh?.();
    clearInterval(timerId); timerId=setInterval(updateTimer,1000);
    clearInterval(stateTimer);
    stateTimer=setInterval(()=>{
      const previous=stateIndex;
      if(!bag.length) bag=shuffledStateBag(previous);
      stateIndex=bag.shift();
      applyState();
      window.FocusWaveContentEngine?.refresh?.();
    },DEMO_STATE_INTERVAL_MS);
    updateTimer();
    animateLive();
  };
  prototypeStateBound = true;
}

function chooseTodayVariant() {
  window.FocusWaveVisualEngine?.reseed?.();
  todayVariant = {
    theme: TODAY_THEMES[Math.floor(Math.random() * TODAY_THEMES.length)],
    stateKey: TODAY_STATES[Math.floor(Math.random() * TODAY_STATES.length)],
    t: 4 + Math.random() * 48
  };
  return todayVariant;
}

function renderTodayArtwork(forceNew = false) {
  const canvas = document.querySelector('#todayCanvas');
  const engine = window.FocusWaveVisualEngine;
  if (!canvas || !engine?.drawField || typeof states === 'undefined') return;
  const variant = (!todayVariant || forceNew) ? chooseTodayVariant() : todayVariant;
  const state = states.find(item => item.key === variant.stateKey) || states[0];
  engine.drawField(canvas, { theme: variant.theme, state, t: variant.t });
}

function bindTodayArtwork() {
  const entries = [
    ...document.querySelectorAll('[data-nav="today"]'),
    ...document.querySelectorAll('[data-go="today"]')
  ];
  entries.forEach(button => {
    button.addEventListener('click', () => {
      chooseTodayVariant();
      setTimeout(() => renderTodayArtwork(false), 0);
    });
  });
  window.addEventListener('resize', () => requestAnimationFrame(() => renderTodayArtwork(false)));
  chooseTodayVariant();
  requestAnimationFrame(() => renderTodayArtwork(false));
}

function pageTargetFromClick(target) {
  const route = target?.closest?.('[data-nav],[data-go]');
  if (route?.dataset.nav) return route.dataset.nav;
  if (route?.dataset.go) return route.dataset.go;
  if (target?.closest?.('#startFocus,#practiceToSetup')) return 'setup';
  if (target?.closest?.('#toDevice,#beginLive')) return 'device';
  return null;
}

function loadForPage(page) {
  if (page === 'setup' || page === 'device' || page === 'live' || page === 'summary') {
    return ensureLiveEngines();
  }
  if (page === 'portraits') {
    return Promise.all([ensureLiveEngines(), ensurePortraitDetailsRuntime()]);
  }
  if (page === 'insights') return ensureInsightsRuntime();
  if (page === 'practice') return ensurePracticeSignatureRuntime();
  return Promise.resolve();
}

function bindLazyRuntimeLoading() {
  document.addEventListener('click', event => {
    const page = pageTargetFromClick(event.target);
    if (page) loadForPage(page);
  }, {capture:true, passive:true});

  const begin = document.querySelector('#beginLive');
  if (begin) {
    begin.addEventListener('click', event => {
      if (liveReady) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const label = begin.textContent;
      begin.disabled = true;
      begin.textContent = '正在准备';
      ensureLiveEngines().then(() => {
        begin.disabled = false;
        begin.textContent = label;
        begin.click();
      });
    }, true);
  }
}

function init() {
  ensureLayoutStyles();
  renderSettingsPanel();
  bindSessionEntry();
  bindExport();
  bindLazyRuntimeLoading();
}

if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
