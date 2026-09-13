/* FocusWave lotus overlay — intentionally disabled.
 *
 * HISTORY / WHY THIS FILE IS NOW A NO-OP
 * --------------------------------------
 * The ink pond v3 runtime (insights-ink-pond-v3.js) already owns lotus
 * rendering: it draws each reward lotus onto #fwInkPondCanvas and handles
 * drag-to-reposition plus ripple-on-click.
 *
 * This overlay was added later as a separate DOM layer on top of that canvas.
 * Because it reused the SAME reward storage key, the SAME 12 position slots,
 * the SAME index-based slot assignment and the SAME three size tiers, it drew
 * a second, near-identical lotus on top of every canvas lotus. The result was
 * the reported symptom: the counter said N but the pond appeared to hold fewer
 * than N flowers, because overlapping duplicates read as a single bloom.
 *
 * The canvas already renders the flowers correctly at the right size, so the
 * fix is to stop double-rendering. Keep this file (rather than deleting the
 * script tag) so the boot chain stays intact, but make it inert.
 *
 * To re-enable a DOM overlay in future: give it its own storage key AND its own
 * slot table, and remove lotus drawing from the canvas so exactly one renderer
 * owns the flowers.
 */
(() => {
  if (window.FocusWaveLotusOverlayV4) return;
  window.FocusWaveLotusOverlayV4 = {
    disabled: true,
    sync() {},
    render() { return false; }
  };
})();
