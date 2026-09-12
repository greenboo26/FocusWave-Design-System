/* FocusWave real photographic sand surface v1.
 * Uses a real CC0 seamless sand photograph as the visual base layer.
 * The surface starts flat and un-raked; interaction canvases remain above it.
 * Source: Wikimedia Commons, "Smooth clean beach shore sand seamless ground texture.jpg" (CC0).
 * No MutationObserver and no polling.
 */
(() => {
  if (window.FocusWaveRealSandPhoto) return;

  const SAND_URL = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Smooth_clean_beach_shore_sand_seamless_ground_texture.jpg?width=1600';

  function ensureStyles() {
    if (document.querySelector('style[data-focuswave-real-sand-photo]')) return;
    const style = document.createElement('style');
    style.dataset.focuswaveRealSandPhoto = 'true';
    style.textContent = `
      #page-insights #fwGardenInner{
        position:relative!important;
        isolation:isolate!important;
        background:#eee5d4!important;
        background-image:none!important;
        overflow:hidden!important;
      }

      #page-insights #fwGardenInner::before{
        content:'';
        position:absolute;
        inset:-2px;
        z-index:0;
        pointer-events:none;
        background-image:url('${SAND_URL}');
        background-repeat:repeat;
        background-size:520px 520px;
        background-position:center center;
        image-rendering:auto;
        filter:saturate(.72) brightness(1.12) contrast(.96);
        transform:translateZ(0);
      }

      /* Very light warm daylight wash only; the grain itself remains photographic. */
      #page-insights #fwGardenInner::after{
        content:'';
        position:absolute;
        inset:0;
        z-index:1;
        pointer-events:none;
        background:
          linear-gradient(135deg,rgba(255,255,255,.20),rgba(255,252,244,.045) 48%,rgba(117,90,55,.035)),
          radial-gradient(ellipse at 26% 18%,rgba(255,255,255,.12),transparent 58%);
        box-shadow:inset 0 10px 18px rgba(91,68,42,.055),inset 0 -4px 8px rgba(255,255,255,.24);
      }

      /* Disable every synthetic base texture so only the real sand photograph is visible. */
      #page-insights #fwInteractiveSandBase,
      #page-insights #fwDailyGardenCanvas,
      #page-insights #fwGardenCanvas{
        display:none!important;
        opacity:0!important;
      }

      #page-insights #fwStoneLayer{z-index:9!important}
      #page-insights #fwGardenUserCanvas{z-index:12!important}
      #page-insights .fw-real-cursor,
      #page-insights .fw-physical-cursor{z-index:30!important}
    `;
    document.head.appendChild(style);
  }

  ensureStyles();
  window.FocusWaveRealSandPhoto = {source:SAND_URL};
})();
