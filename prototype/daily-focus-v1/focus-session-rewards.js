/* FocusWave session reward controller v1.
 * One completed focus session earns exactly one daily reward entry.
 * The ink pond reads the same storage key and turns each entry into one lotus.
 * No MutationObserver and no polling.
 */
(() => {
  if (window.FocusWaveSessionRewards) return;

  const STORAGE_KEY = 'focuswave.dailyRewardStones.v2';
  let completionAwarded = false;

  function localDayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function readState() {
    const date = localDayKey();
    let state = null;
    try { state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) {}
    if (!state || state.date !== date || !Array.isArray(state.stones)) {
      state = {date, stones:[]};
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    return state;
  }

  function writeState(state) {
    const normalized = {
      date: localDayKey(),
      stones: Array.isArray(state?.stones) ? state.stones : []
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function syncInkPondSoon() {
    [0, 60, 220].forEach(delay => setTimeout(() => {
      try { window.FocusWaveInkPondV3?.sync?.(); } catch (_) {}
    }, delay));
  }

  function awardCompletion() {
    if (completionAwarded) return false;
    completionAwarded = true;

    const state = readState();
    state.stones.push({
      id: `focus-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      completedAt: Date.now()
    });
    const next = writeState(state);

    window.dispatchEvent(new CustomEvent('focuswave:daily-reward-updated', {
      detail: {count: next.stones.length, date: next.date}
    }));
    syncInkPondSoon();
    return true;
  }

  document.addEventListener('click', event => {
    const target = event.target?.closest?.('button,[data-nav],[data-go]');
    if (!target) return;

    if (target.matches('#beginLive')) {
      completionAwarded = false;
      return;
    }

    if (target.matches('#finishBtn')) {
      awardCompletion();
    }
  }, {capture:true});

  window.addEventListener('focuswave:daily-reward-updated', syncInkPondSoon);

  window.FocusWaveSessionRewards = {
    get count() { return readState().stones.length; },
    awardCompletion,
    resetToday() {
      completionAwarded = false;
      writeState({stones:[]});
      syncInkPondSoon();
    }
  };
})();
