/* FocusWave text preference controller
 * One canonical preference: defaultTextMode.
 * Session Setup inherits the default, then may override it for the current session.
 */

const TEXT_MODES = [
  { value: 'minimal', label: '极简' },
  { value: 'original', label: '原创短句' },
  { value: 'global', label: '世界文学' },
  { value: 'classical', label: '中文古典' }
];

const STORAGE_KEY = 'focuswave.defaultTextMode';

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

  // Initial prototype state also reflects the stored default.
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

function init() {
  renderSettingsPanel();
  bindSessionEntry();
  bindExport();
}

document.addEventListener('DOMContentLoaded', init);
