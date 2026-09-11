/* FocusWave session summary refinements.
 * Keeps summary copy concise and reports the actual number of 60s focus practices
 * started during the current focus session. No MutationObserver or polling.
 */
(() => {
  if (window.FocusWaveSummaryRefinements) return;

  let practiceBaseline = 0;

  function practiceStartCount(){
    const events = window.FocusWaveContentEngine?.regulationEvents;
    if (!Array.isArray(events)) return 0;
    return events.filter((event) => event?.action === 'practice-started').length;
  }

  function patchSummaryStatic(){
    const summary = document.querySelector('#page-summary .summary-copy');
    if (!summary) return;

    const title = summary.querySelector('h1');
    if (title) title.textContent = '任务完成';

    summary.querySelector(':scope > .lead')?.remove();

    const stats = [...summary.querySelectorAll('.summary-stats .stat')];

    const effectiveFocusStat = stats.find((stat) => {
      const label = stat.querySelector('span')?.textContent?.trim();
      return label === '稳定片段' || label === '有效专注比例';
    });
    if (effectiveFocusStat) {
      const label = effectiveFocusStat.querySelector('span');
      if (label) label.textContent = '有效专注比例';
    }

    const practiceStat = stats.find((stat) => stat.querySelector('span')?.textContent?.trim() === '恢复次数')
      || stats.find((stat) => stat.querySelector('span')?.textContent?.trim() === '练习次数');
    if (practiceStat) {
      const label = practiceStat.querySelector('span');
      const value = practiceStat.querySelector('b');
      if (label) label.textContent = '练习次数';
      if (value) {
        value.id = 'summaryPracticeCount';
        value.textContent = '0';
      }
    }

    const decisionTitle = summary.querySelector('#portraitDecision > b');
    if (decisionTitle) decisionTitle.textContent = '是否保留本次专注记录';

    // The optional AI reflection block is intentionally removed from Session Summary.
    summary.querySelector('.ai-reflection-card')?.remove();
  }

  function updatePracticeCount(){
    patchSummaryStatic();
    const value = document.querySelector('#summaryPracticeCount');
    if (!value) return;
    value.textContent = String(Math.max(0, practiceStartCount() - practiceBaseline));
  }

  function markSessionStart(){
    practiceBaseline = practiceStartCount();
    const value = document.querySelector('#summaryPracticeCount');
    if (value) value.textContent = '0';
  }

  function bind(){
    patchSummaryStatic();
    practiceBaseline = practiceStartCount();

    document.querySelector('#beginLive')?.addEventListener('click', markSessionStart);
    document.querySelector('#finishBtn')?.addEventListener('click', updatePracticeCount);

    // ai-assistant-controller may have just inserted the optional card before this
    // module runs; remove it once more after the current task without observing DOM.
    queueMicrotask(patchSummaryStatic);
  }

  window.FocusWaveSummaryRefinements = {
    patchSummaryStatic,
    updatePracticeCount,
    markSessionStart
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
