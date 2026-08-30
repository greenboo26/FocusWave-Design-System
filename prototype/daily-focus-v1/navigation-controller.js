/* FocusWave navigation controller v1
 * Keeps top-level navigation, focus subflow state and transient UI in sync.
 */
(() => {
  const NAV_PARENT = {
    today:'today',
    setup:'today',
    device:'today',
    live:'today',
    summary:'today',
    insights:'insights',
    portraits:'portraits',
    practice:'practice',
    settings:'settings'
  };

  let installed = false;

  function closeTransientUI(from, to) {
    document.querySelector('#detailDrawer')?.classList.remove('open');
    document.querySelector('#regOverlay')?.classList.remove('open');

    const practiceOverlay = document.querySelector('#practiceOverlay');
    if (practiceOverlay?.classList.contains('open')) {
      if (typeof window.closePractice === 'function') window.closePractice(false);
      else practiceOverlay.classList.remove('open');
    }

    document.querySelector('.fw-detail.open')?.classList.remove('open');

    if (from === 'insights' && to !== 'insights') {
      const editingFrame = document.querySelector('#fwGardenFrame.fw-editing');
      if (editingFrame) document.querySelector('#fwEditGarden')?.click();
    }

    if (to !== 'portraits') {
      const portraitDetail = document.querySelector('#portraitDetailPage.open');
      if (portraitDetail) {
        portraitDetail.classList.remove('open');
        document.body.style.overflow = '';
        if (/^#portrait-\d+$/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
      }
    }
  }

  function stopPreviousRuntime(from, to) {
    if (from === 'live' && to !== 'live') {
      try { clearInterval(timerId); } catch (_) {}
      try { clearInterval(stateTimer); } catch (_) {}
      try { cancelAnimationFrame(raf); } catch (_) {}
    }
    if (from === 'device' && to !== 'device') {
      try { cancelAnimationFrame(sensorRaf); } catch (_) {}
    }
  }

  function syncPrimaryNav(pageName) {
    const parent = NAV_PARENT[pageName] || pageName;
    document.querySelectorAll('[data-nav]').forEach(button => {
      const active = button.dataset.nav === parent;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }

  function syncShellState(pageName) {
    document.body.dataset.page = pageName;
    const rail = document.querySelector('#rail');
    if (rail) rail.setAttribute('aria-hidden', String(pageName === 'live'));
  }

  function resetViewport() {
    requestAnimationFrame(() => window.scrollTo({top:0,left:0,behavior:'auto'}));
  }

  function install() {
    if (installed || typeof window.showPage !== 'function') return;
    const baseShowPage = window.showPage;

    window.showPage = function focusWaveShowPage(name) {
      const from = typeof currentPage !== 'undefined' ? currentPage : null;
      if (!name) return;

      if (from !== name) {
        closeTransientUI(from, name);
        stopPreviousRuntime(from, name);
      }

      baseShowPage(name);
      syncPrimaryNav(name);
      syncShellState(name);
      resetViewport();
    };

    syncPrimaryNav(typeof currentPage !== 'undefined' ? currentPage : 'today');
    syncShellState(typeof currentPage !== 'undefined' ? currentPage : 'today');
    document.querySelectorAll('button').forEach(button => {
      if (!button.hasAttribute('type')) button.type = 'button';
    });
    installed = true;
  }

  function init() {
    install();
    if (!installed) setTimeout(install, 0);
    if (!installed) setTimeout(install, 80);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    document.querySelector('#detailDrawer')?.classList.remove('open');
    document.querySelector('#regOverlay')?.classList.remove('open');
    document.querySelector('#practiceOverlay')?.classList.remove('open');
    document.querySelector('#contentLibraryOverlay')?.classList.remove('open');
    document.querySelector('.fw-detail.open')?.classList.remove('open');
  });
})();
