/* FocusWave garden materials v1.
 * High-resolution procedural material assets for the insight garden.
 * Sand is a generated texture with no pre-raked grooves; reward stones use generated
 * rock assets rather than gradients or crops from the visual reference.
 * No MutationObserver and no global polling.
 */
(() => {
  if (window.FocusWaveGardenMaterials) return;

  const STYLE_KEY = 'focuswaveGardenMaterials';
  const RETRIES = [0, 120, 360, 760, 1400, 2400];

  function ensureStyles() {
    let style = document.querySelector(`style[data-${STYLE_KEY}]`);
    if (!style) {
      style = document.createElement('style');
      style.setAttribute(`data-${STYLE_KEY}`, 'true');
      style.textContent = `
        #page-insights #fwGardenInner{
          background-color:#eee6d8!important;
          background-image:url('./assets/garden/sand-fine.svg')!important;
          background-size:cover!important;
          background-position:center!important;
          background-repeat:no-repeat!important;
          box-shadow:inset 0 18px 26px rgba(105,86,61,.11),inset 0 -8px 16px rgba(255,255,255,.58),0 1px 0 rgba(255,255,255,.35)!important;
        }
        #page-insights #fwInteractiveSandBase{display:none!important}
        #page-insights #fwGardenCanvas,
        #page-insights #fwDailyGardenCanvas{display:none!important;opacity:0!important}

        #page-insights #fwStoneLayer .fw-stone{
          overflow:visible!important;
          filter:drop-shadow(0 13px 7px rgba(45,39,31,.28)) drop-shadow(0 2px 1px rgba(255,255,255,.10))!important;
        }
        #page-insights #fwStoneLayer .fw-stone:after{display:none!important}
        #page-insights #fwStoneLayer .fw-stone .body{
          width:100%!important;height:100%!important;
          clip-path:none!important;border-radius:0!important;box-shadow:none!important;
          background-color:transparent!important;
          background-image:url('./assets/garden/stone-grey-b.svg')!important;
          background-position:center!important;background-repeat:no-repeat!important;background-size:136% 136%!important;
          overflow:visible!important;
        }
        #page-insights #fwStoneLayer .fw-stone .body:before,
        #page-insights #fwStoneLayer .fw-stone .body:after{display:none!important}
        #page-insights #fwStoneLayer .fw-stone:nth-child(3n+1) .body{background-image:url('./assets/garden/stone-grey-a.svg')!important}
        #page-insights #fwStoneLayer .fw-stone:nth-child(3n+2) .body{background-image:url('./assets/garden/stone-grey-b.svg')!important}
        #page-insights #fwStoneLayer .fw-stone:nth-child(3n) .body{background-image:url('./assets/garden/stone-grey-c.svg')!important}
        #page-insights #fwStoneLayer .fw-stone[data-size="small"] .body{background-image:url('./assets/garden/stone-grey-a.svg')!important;background-size:140% 140%!important}
        #page-insights #fwStoneLayer .fw-stone[data-size="medium"] .body{background-image:url('./assets/garden/stone-grey-b.svg')!important;background-size:136% 136%!important}
        #page-insights #fwStoneLayer .fw-stone[data-size="large"] .body{background-image:url('./assets/garden/stone-grey-c.svg')!important;background-size:132% 132%!important}

        #page-insights .fw-reward-tray .fw-mini-stone{
          width:36px!important;height:28px!important;border-radius:0!important;clip-path:none!important;
          background-color:transparent!important;
          background-image:url('./assets/garden/stone-grey-b.svg')!important;
          background-size:150% 150%!important;background-position:center!important;background-repeat:no-repeat!important;
          box-shadow:none!important;filter:drop-shadow(0 6px 4px rgba(45,39,31,.24))!important;
        }
      `;
    }
    document.head.appendChild(style);
  }

  function patch() {
    window.FocusWaveDailyGardenRewards?.patchInsights?.();
    window.FocusWaveInteractiveSand?.patchSurface?.();
    ensureStyles();
  }

  function patchSoon() {
    RETRIES.forEach(delay => setTimeout(patch, delay));
  }

  function bind() {
    ensureStyles();
    patchSoon();
    document.addEventListener('click', event => {
      const target = event.target?.closest?.('[data-nav="insights"],[data-go="insights"],#fwEditGarden,[data-rake-tool]');
      if (target) patchSoon();
    }, {capture:true});
    window.addEventListener('pageshow', patchSoon, {once:true});
  }

  window.FocusWaveGardenMaterials = {patch, patchSoon};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, {once:true});
  else bind();
})();
