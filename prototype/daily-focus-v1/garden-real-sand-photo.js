/* FocusWave real photographic sand surface v2.
 * Uses a real CC0 seamless sand photograph only as fine-grain microdetail.
 * The visible surface is tuned toward pale, warm karesansui sand: bright, fine and low-contrast.
 * The surface starts flat and un-raked; interaction canvases remain above it.
 * Source: Wikimedia Commons, "Smooth clean beach shore sand seamless ground texture.jpg" (CC0).
 * No MutationObserver and no polling.
 */
(() => {
  if (window.FocusWaveRealSandPhotoV2) return;

  const SAND_URL = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Smooth_clean_beach_shore_sand_seamless_ground_texture.jpg?width=1600';

  function ensureStyles() {
    document.querySelector('style[data-focuswave-real-sand-photo]')?.remove();
    if (document.querySelector('style[data-focuswave-real-sand-photo-v2]')) return;

    const style = document.createElement('style');
    style.dataset.focuswaveRealSandPhotoV2 = 'true';
    style.textContent = `
      #page-insights #fwGardenInner{
        position:relative!important;
        isolation:isolate!important;
        background:#f2ece2!important;
        background-image:none!important;
        overflow:hidden!important;
        box-shadow:
          inset 0 8px 15px rgba(111,92,67,.045),
          inset 0 -4px 8px rgba(255,255,255,.46),
          0 1px 0 rgba(255,255,255,.50)!important;
      }

      /*
       * Real sand photograph used only as micro-grain detail.
       * Smaller tile = visually finer grains; low contrast + warm-white base removes
       * the beach-like dark pits and coarse gravel appearance of the previous pass.
       */
      #page-insights #fwGardenInner::before{
        content:'';
        position:absolute;
        inset:-3px;
        z-index:0;
        pointer-events:none;
        background-image:url('${SAND_URL}');
        background-repeat:repeat;
        background-size:285px 285px;
        background-position:center center;
        image-rendering:auto;
        filter:
          grayscale(.18)
          sepia(.08)
          saturate(.42)
          brightness(1.42)
          contrast(.58);
        opacity:.42;
        transform:translateZ(0);
      }

      /* Pale warm daylight veil, matching fine indoor zen-garden sand rather than beach sand. */
      #page-insights #fwGardenInner::after{
        content:'';
        position:absolute;
        inset:0;
        z-index:1;
        pointer-events:none;
        background:
          linear-gradient(135deg,rgba(255,253,248,.40),rgba(255,250,242,.24) 47%,rgba(231,218,198,.055)),
          radial-gradient(ellipse at 24% 15%,rgba(255,255,255,.24),transparent 62%);
        box-shadow:
          inset 0 7px 13px rgba(91,72,49,.026),
          inset 0 -3px 7px rgba(255,255,255,.34);
      }

      /* Disable every synthetic base texture so the pale photographic micro-grain is the only base surface. */
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
  window.FocusWaveRealSandPhotoV2 = {source:SAND_URL};
})();
