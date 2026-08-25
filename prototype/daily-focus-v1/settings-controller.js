/* FocusWave preference + prototype review controller
 * Product preference: one canonical defaultTextMode.
 * Session Setup inherits the default, then may override it for the current session.
 * Prototype review: randomised, non-repeating AttentionState cycle so all visual states can be reviewed.
 * Production runtime replaces this demo driver with ModelBundle output.
 */

const TEXT_MODES = [
  { value: 'minimal', label: '极简' },
  { value: 'original', label: '原创短句' },
  { value: 'global', label: '世界文学' },
  { value: 'classical', label: '中文古典' }
];

const STORAGE_KEY = 'focuswave.defaultTextMode';
const DEMO_STATE_INTERVAL_MS = 10000;

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
}

function appendRuntime(src, datasetKey) {
  if (document.querySelector(`script[data-focuswave-${datasetKey}]`)) return Promise.resolve();
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = src;
    script.dataset[`focuswave${datasetKey.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}`] = 'true';
    script.setAttribute(`data-focuswave-${datasetKey}`, 'true');
    script.onload = resolve;
    script.onerror = resolve;
    document.body.appendChild(script);
  });
}

function ensurePracticeSignatureRuntime() {
  return appendRuntime('./practice-signatures.js', 'practice-signatures');
}

async function ensureLiveEngines() {
  await appendRuntime('./generative-visual-engine.js', 'generative-visual-engine');
  await appendRuntime('./content-engine.js', 'content-engine');
  if (window.FocusWaveContentEngine?.refresh) window.FocusWaveContentEngine.refresh();
  if (typeof renderStatic === 'function') requestAnimationFrame(renderStatic);
}

function validMode(value) {
  return TEXT_MODES.some(mode => mode.value === value) ? value : 'original';
}

function getDefaultMode() {
  return validMode(localStorage.getItem(STORAGE_KEY) || 'original');
}

function setSelected(group, value) {
  if (!group) return;
  group.querySelectorAll('[data-value]').forEach(button => {
    button.classList.toggle('selected', button.dataset.value === value);
  });
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
        <p>原创短句、世界文学与中文古典分别使用对应内容库；文字模式决定呈现内容，内容服务负责检索与生成。</p>
      </div>
      <span class="pill">内容库</span>
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

function inheritDefaultForNewSession() {
  const setupGroup = document.querySelector('#textGroup');
  setSelected(setupGroup, getDefaultMode());
}

function bindSessionEntry() {
  const entryButtons = [
    document.querySelector('#startFocus'),
    document.querySelector('#practiceToSetup')
  ].filter(Boolean);

  entryButtons.forEach(button => {
    button.addEventListener('click', inheritDefaultForNewSession);
  });

  inheritDefaultForNewSession();
}

function bindExport() {
  const button = document.querySelector('#exportSettings');
  if (!button) return;

  button.onclick = () => {
    const selected = id => document.querySelector(`#${id} .selected`)?.dataset.value || '';
    const data = {
      motion: selected('motionSetting'),
      feedback: selected('feedbackSetting'),
      defaultTextMode: getDefaultMode()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = 'focuswave-settings.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 500);
  };
}

function shuffledStateBag(previous = -1) {
  const bag = Array.from({ length: states.length }, (_, index) => index);
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  if (bag.length > 1 && bag[0] === previous) {
    [bag[0], bag[1]] = [bag[1], bag[0]];
  }
  return bag;
}

function bindPrototypeStateReview() {
  const begin = document.querySelector('#beginLive');
  if (!begin || typeof states === 'undefined' || typeof showPage !== 'function') return;

  begin.onclick = () => {
    window.FocusWaveVisualEngine?.reseed?.();
    showPage('live');
    liveStarted = Date.now();

    let bag = shuffledStateBag(-1);
    stateIndex = bag.shift();
    applyState();
    window.FocusWaveContentEngine?.refresh?.();

    clearInterval(timerId);
    timerId = setInterval(updateTimer, 1000);

    clearInterval(stateTimer);
    stateTimer = setInterval(() => {
      const previous = stateIndex;
      if (!bag.length) bag = shuffledStateBag(previous);
      stateIndex = bag.shift();
      applyState();
      window.FocusWaveContentEngine?.refresh?.();
    }, DEMO_STATE_INTERVAL_MS);

    updateTimer();
    animateLive();
  };
}

async function init() {
  ensureLayoutStyles();
  renderSettingsPanel();
  bindSessionEntry();
  bindExport();
  await ensureLiveEngines();
  bindPrototypeStateReview();
  await ensurePracticeSignatureRuntime();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
