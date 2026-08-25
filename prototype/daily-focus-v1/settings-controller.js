/* FocusWave preference + prototype review controller
 * One canonical defaultTextMode; Setup may override for one session.
 * Demo state driver exists only for prototype review.
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
  if (document.querySelector(`script[data-focuswave-${datasetKey}]`)) return Promise.resolve();
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = src;
    script.setAttribute(`data-focuswave-${datasetKey}`, 'true');
    script.onload = resolve;
    script.onerror = resolve;
    document.body.appendChild(script);
  });
}

function ensurePracticeSignatureRuntime() {
  return appendRuntime('./practice-signatures.js', 'practice-signatures');
}

function ensurePortraitDetailsRuntime() {
  return appendRuntime('./portrait-details.js', 'portrait-details');
}

function ensureInsightsRuntime() {
  return appendRuntime('./insights-longterm.js', 'insights-longterm');
}

async function ensureLiveEngines() {
  await appendRuntime('./generative-visual-engine.js', 'generative-visual-engine');
  await appendRuntime('./content-engine.js', 'content-engine');
  window.FocusWaveContentEngine?.refresh?.();
  if (typeof renderStatic === 'function') requestAnimationFrame(renderStatic);
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

async function init() {
  ensureLayoutStyles();
  renderSettingsPanel();
  bindSessionEntry();
  bindExport();
  await ensureLiveEngines();
  bindPrototypeStateReview();
  bindTodayArtwork();
  await ensurePortraitDetailsRuntime();
  await ensureInsightsRuntime();
  await ensurePracticeSignatureRuntime();
}

if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
