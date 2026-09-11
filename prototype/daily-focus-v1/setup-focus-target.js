/* FocusWave per-session effective-focus target.
 * Adds one optional numeric target to Session Setup and keeps it scoped to the
 * current session. No MutationObserver and no polling.
 */
(() => {
  if (window.FocusWaveSessionGoal) return;

  let targetEffectiveFocusPercent = null;

  function ensureStyles(){
    if (document.querySelector('style[data-focuswave-session-goal]')) return;
    const style = document.createElement('style');
    style.dataset.focuswaveSessionGoal = 'true';
    style.textContent = `
      #page-setup .effective-focus-target{margin-top:24px}
      #page-setup .effective-focus-target .choice-label{margin-bottom:10px}
      #page-setup .effective-focus-target-row{display:flex;align-items:center;gap:9px;width:max-content;max-width:100%}
      #page-setup .effective-focus-target input{width:112px;height:40px;border:1px solid var(--hair);border-radius:999px;background:rgba(255,255,255,.12);outline:0;padding:0 15px;font-family:var(--ui);font-size:13px;color:var(--ink);font-variant-numeric:tabular-nums}
      #page-setup .effective-focus-target input:focus{border-color:#7f958a;box-shadow:0 0 0 2px rgba(127,149,138,.08)}
      #page-setup .effective-focus-target .percent-sign{font-size:13px;color:var(--muted)}
      #page-setup .effective-focus-target-error{min-height:16px;margin-top:7px;font-size:11px;color:#9b705f}
    `;
    document.head.appendChild(style);
  }

  function ensureField(){
    const durationGroup = document.querySelector('#durationGroup');
    if (!durationGroup || document.querySelector('#effectiveFocusTarget')) return;

    const field = document.createElement('div');
    field.className = 'effective-focus-target';
    field.innerHTML = `
      <span class="choice-label">目标有效专注比例</span>
      <div class="effective-focus-target-row">
        <input id="effectiveFocusTarget" type="number" min="1" max="100" step="1" inputmode="numeric" placeholder="例如 75" aria-label="目标有效专注比例" />
        <span class="percent-sign">%</span>
      </div>
      <div class="effective-focus-target-error" id="effectiveFocusTargetError" aria-live="polite"></div>`;
    durationGroup.insertAdjacentElement('afterend', field);

    const input = field.querySelector('#effectiveFocusTarget');
    input.addEventListener('input', () => {
      const error = field.querySelector('#effectiveFocusTargetError');
      if (error) error.textContent = '';
      const value = Number(input.value);
      targetEffectiveFocusPercent = input.value === '' || !Number.isFinite(value) ? null : value;
    });
  }

  function resetForNewSession(){
    targetEffectiveFocusPercent = null;
    const input = document.querySelector('#effectiveFocusTarget');
    const error = document.querySelector('#effectiveFocusTargetError');
    if (input) input.value = '';
    if (error) error.textContent = '';
  }

  function validateAndStore(){
    const input = document.querySelector('#effectiveFocusTarget');
    const error = document.querySelector('#effectiveFocusTargetError');
    if (!input) return true;
    if (input.value.trim() === '') {
      targetEffectiveFocusPercent = null;
      if (error) error.textContent = '';
      return true;
    }
    const value = Number(input.value);
    if (!Number.isFinite(value) || value < 1 || value > 100) {
      if (error) error.textContent = '请输入 1–100 之间的比例。';
      input.focus();
      return false;
    }
    targetEffectiveFocusPercent = Math.round(value);
    input.value = String(targetEffectiveFocusPercent);
    if (error) error.textContent = '';
    return true;
  }

  function bind(){
    ensureStyles();
    ensureField();

    document.addEventListener('click', event => {
      const target = event.target.closest('button,[data-go]');
      if (!target) return;

      if (target.matches('#startFocus,#practiceToSetup')) {
        resetForNewSession();
        requestAnimationFrame(ensureField);
        return;
      }

      if (target.matches('#toDevice') && !validateAndStore()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }

  window.FocusWaveSessionGoal = {
    get targetEffectiveFocusPercent(){ return targetEffectiveFocusPercent; },
    validateAndStore,
    resetForNewSession
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, {once:true});
  else bind();
})();
