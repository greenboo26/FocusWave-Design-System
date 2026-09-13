/* FocusWave focus archive styles v1
 * ---------------------------------------------------------------
 * Ink-wash language extended downward. The archive sits BELOW the lotus pond
 * and must not read as a SaaS dashboard: no card shadows stacked in a grid, no
 * saturated accent colours, no KPI tiles with sparkline chips. Everything is
 * built from hairlines, paper tones and generous vertical rhythm — the same
 * vocabulary the pond uses, just organised for reading numbers.
 *
 * Colour tokens mirror index.html's :root so the archive inherits the product
 * palette instead of inventing a second one.
 * ---------------------------------------------------------------
 */
(() => {
  if (document.querySelector('style[data-focuswave-archive]')) return;
  const style = document.createElement('style');
  style.dataset.focuswaveArchive = 'true';
  style.textContent = `
  /* ===== shell ===================================================== */
  /* This is a standalone page now, not a section continuing the pond, so there
   * is no top hairline bridging the two. The archive owns the page's padding. */
  #page-archive{padding:0!important;background:#f7f4ed!important}
  #page-archive>.topbar{padding:34px 5.4vw 0;box-sizing:border-box}
  .fw-arch{position:relative;background:#f7f4ed;padding:0 5.4vw 92px;box-sizing:border-box;min-height:calc(100vh - 1px)}
  .fw-arch *{box-sizing:border-box}
  .fw-arch-inner{max-width:1220px;margin:0 auto}

  /* ===== section header with day/week/month switch ================== */
  .fw-arch-head{display:flex;align-items:flex-end;justify-content:space-between;gap:38px;margin:34px 0 44px}
  .fw-arch-title-row{display:flex;align-items:baseline;gap:13px}
  .fw-arch-title{font-family:var(--human);font-size:37px;font-weight:400;letter-spacing:.07em;margin:0;color:#2f3531}
  .fw-arch-title-en{font-family:Georgia,serif;font-size:15px;color:#8b908b;letter-spacing:.02em}
  .fw-arch-sub{font-family:var(--human);font-size:14.5px;color:#888d88;letter-spacing:.035em;margin-top:9px}
  .fw-arch-switch{display:flex;align-items:center;gap:3px;padding:3px;border:1px solid rgba(52,62,56,.10);border-radius:999px;background:rgba(255,255,255,.42);flex-shrink:0}
  .fw-arch-switch button{min-width:52px;height:31px;padding:0 15px;border:0;border-radius:999px;background:transparent;color:#7c827d;font-family:var(--human);font-size:13.5px;letter-spacing:.06em;cursor:pointer;transition:background .18s,color .18s}
  .fw-arch-switch button:hover{color:#49524c}
  .fw-arch-switch button[aria-selected="true"]{background:#e6e9e3;color:#3a453e;box-shadow:inset 0 0 0 1px rgba(52,62,56,.06)}

  .fw-arch-view{display:none;animation:fwArchIn .42s cubic-bezier(.22,.61,.36,1) both}
  .fw-arch-view.fw-active{display:block}
  @keyframes fwArchIn{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}

  /* ===== shared block heading ======================================= */
  .fw-blk{margin-top:62px}
  .fw-blk:first-child{margin-top:0}
  .fw-blk-head{display:flex;align-items:baseline;justify-content:space-between;gap:26px;padding-bottom:13px;border-bottom:1px solid rgba(52,62,56,.10);margin-bottom:26px}
  .fw-blk-title{font-family:var(--human);font-size:21px;font-weight:400;letter-spacing:.06em;margin:0;color:#333b36}
  .fw-blk-note{font-size:11.5px;color:#8d918c;letter-spacing:.03em}
  .fw-eyebrow{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#8d918c}

  /* ===== layer 1 — today's overview cards =========================== */
  .fw-cards{display:grid;grid-template-columns:repeat(5,1fr);gap:0;border:1px solid rgba(52,62,56,.085);border-radius:3px;background:rgba(255,255,255,.30);overflow:hidden}
  .fw-card{padding:24px 24px 22px;border-right:1px solid rgba(52,62,56,.075);position:relative}
  .fw-card:last-child{border-right:0}
  .fw-card-label{font-size:11.5px;color:#7f847f;letter-spacing:.045em;margin-bottom:13px}
  .fw-card-value{font-family:var(--ui);font-size:31px;line-height:1;font-weight:430;letter-spacing:-.03em;color:#2f3a34;font-variant-numeric:tabular-nums}
  .fw-card-value small{font-size:12px;font-weight:400;letter-spacing:.02em;color:#767d77;margin-left:4px}
  .fw-card-foot{font-size:11px;color:#8b908b;margin-top:11px;letter-spacing:.02em;display:flex;align-items:center;gap:6px}
  .fw-card-bar{height:3px;border-radius:2px;background:rgba(52,62,56,.09);margin-top:12px;overflow:hidden;position:relative}
  .fw-card-bar i{position:absolute;inset:0 auto 0 0;border-radius:2px;background:linear-gradient(90deg,#6d8578,#93a89b)}
  .fw-goal-mark{position:absolute;top:-5px;width:1px;height:13px;background:#a89880;opacity:.85}

  /* ===== layer 2 — state timeline =================================== */
  .fw-tl-wrap{border:1px solid rgba(52,62,56,.085);border-radius:3px;background:rgba(255,255,255,.34);padding:26px 26px 18px}
  .fw-tl-holder{position:relative}
  .fw-tl-svg{display:block;width:100%;height:158px}
  .fw-tl-legend{display:flex;flex-wrap:wrap;gap:19px;margin-top:13px;padding-top:13px;border-top:1px solid rgba(52,62,56,.07);font-size:11px;color:#7f847f;letter-spacing:.03em}
  .fw-tl-legend span{display:inline-flex;align-items:center;gap:7px}
  .fw-tl-legend i{width:17px;height:8px;border-radius:1.5px;display:block;flex-shrink:0}
  .fw-tl-tick{font:9.5px var(--ui);fill:#8f948e;letter-spacing:.02em}
  .fw-tl-marker-text{font:9.5px var(--human);fill:#9c7f5c;letter-spacing:.03em}
  .fw-tl-empty{padding:34px 0;text-align:center;font-family:var(--human);font-size:14px;color:#969b95}
  .fw-tl-practice-dot{cursor:pointer;transition:r .16s,fill .16s}
  .fw-tl-practice-dot:hover{r:6;fill:#eef2ee}
  .fw-tl-hot{outline:1.6px solid #8d6f4e;outline-offset:1px}
  .fw-tl-mini-svg{display:block;width:100%;height:16px;border-radius:2px;overflow:hidden}
  .fw-tl-hint{margin-top:11px;font-size:11px;color:#909590;letter-spacing:.03em}

  /* practice popover */
  .fw-practice-pop{position:absolute;z-index:12;transform:translate(-50%,-100%);pointer-events:none;opacity:0;transition:opacity .16s}
  .fw-practice-pop.fw-on{opacity:1}
  .fw-practice-pop-inner{white-space:nowrap;padding:9px 13px;border:1px solid rgba(52,62,56,.12);border-radius:9px;background:rgba(252,250,245,.97);box-shadow:0 10px 24px rgba(48,48,44,.11);font-size:11.5px;color:#5f6a63;letter-spacing:.02em;backdrop-filter:blur(6px)}

  /* ===== layer 3 — session records ================================== */
  .fw-sessions{border-top:1px solid rgba(52,62,56,.10)}
  .fw-session{display:grid;grid-template-columns:188px minmax(0,1fr) 190px 118px;gap:34px;align-items:center;padding:25px 14px 25px 22px;border-bottom:1px solid rgba(52,62,56,.085);position:relative;cursor:pointer;transition:background .2s,padding .2s}
  .fw-session:hover{background:rgba(255,255,255,.42)}
  .fw-session.fw-hot{background:rgba(197,168,132,.10);box-shadow:inset 3px 0 0 #b39264}
  .fw-session-idx{position:absolute;left:2px;top:50%;transform:translateY(-50%);font-size:10px;color:#c0c3bd;font-variant-numeric:tabular-nums;letter-spacing:.04em}
  .fw-session-task{font-family:var(--human);font-size:19px;color:#333b36;letter-spacing:.05em;margin-bottom:7px}
  .fw-session-time{font-size:11.5px;color:#868b86;letter-spacing:.03em;font-variant-numeric:tabular-nums}
  .fw-session-stats{font-size:11.5px;color:#7f847f;line-height:1.85;letter-spacing:.02em}
  .fw-session-stats b{font-family:var(--ui);font-variant-numeric:tabular-nums;font-weight:450;font-size:13.5px;color:#3d4842;letter-spacing:-.015em}
  .fw-session-stats .fw-sep{color:#c3c6c0;margin:0 7px}
  .fw-session-ratio{display:flex;align-items:baseline;gap:8px;margin-bottom:6px}
  .fw-session-ratio b{font-family:var(--ui);font-size:22px;font-weight:430;letter-spacing:-.025em;color:#33413a;font-variant-numeric:tabular-nums}
  .fw-session-ratio span{font-size:10.5px;color:#8b908b}
  .fw-session-mini{width:100%;height:16px;border-radius:2px;overflow:hidden;opacity:.9}
  .fw-session-go{font-size:11.5px;color:#707a73;letter-spacing:.05em;white-space:nowrap;border:0;background:transparent;border-bottom:1px solid rgba(52,62,56,.22);padding:4px 0;cursor:pointer;transition:color .18s,border-color .18s}
  .fw-session-go:hover{color:#3a453e;border-color:rgba(52,62,56,.45)}
  /* The pond is a separate page now, so the reverse link is a labelled action
   * rather than a hover. Kept visually quieter than 查看详情. */
  .fw-session-actions{justify-self:end;display:flex;flex-direction:column;align-items:flex-end;gap:9px}
  .fw-session-pond{font-size:11px;color:#8f948e;letter-spacing:.04em;white-space:nowrap;border:0;background:transparent;padding:2px 0;cursor:pointer;transition:color .18s}
  .fw-session-pond:hover{color:#5d6b63}

  /* ===== week view ================================================== */
  .fw-week-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid rgba(52,62,56,.085);border-radius:3px;background:rgba(255,255,255,.30);overflow:hidden;margin-bottom:52px}
  .fw-charts{display:flex;flex-direction:column;gap:0;border:1px solid rgba(52,62,56,.085);border-radius:3px;background:rgba(255,255,255,.32);padding:28px 28px 22px}
  .fw-chart-block{position:relative}
  .fw-chart-block + .fw-chart-block{border-top:1px solid rgba(52,62,56,.075);padding-top:22px;margin-top:22px}
  .fw-chart-cap{display:flex;align-items:baseline;justify-content:space-between;gap:20px;margin-bottom:13px}
  .fw-chart-name{font-size:11.5px;color:#7f847f;letter-spacing:.05em}
  .fw-chart-name b{font-family:var(--ui);font-size:17px;font-weight:430;color:#35413a;letter-spacing:-.02em;margin-left:7px;font-variant-numeric:tabular-nums}
  .fw-chart-axis{display:grid;grid-template-columns:repeat(7,1fr);gap:0;margin-top:7px}
  .fw-chart-axis span{text-align:center;font-size:10.5px;color:#8f948e;letter-spacing:.03em}
  .fw-bar-svg,.fw-line-svg{display:block;width:100%;height:134px;overflow:visible}
  .fw-bar-hit{cursor:pointer}
  .fw-insight-list{border-top:1px solid rgba(52,62,56,.10);margin-top:52px}
  .fw-insight{display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,340px);gap:34px;align-items:baseline;padding:23px 0;border-bottom:1px solid rgba(52,62,56,.08)}
  .fw-insight-text{font-family:var(--human);font-size:17.5px;line-height:1.75;color:#39433d;letter-spacing:.035em}
  .fw-insight-note{font-size:11px;line-height:1.8;color:#8d918c;letter-spacing:.02em}

  /* ===== month view ================================================= */
  .fw-cal{border:1px solid rgba(52,62,56,.085);border-radius:3px;background:rgba(255,255,255,.30);padding:26px 28px 22px}
  /* The calendar is a contribution-style grid: small fixed-ish squares, not
   * stretched tiles. Capping the cell size and the grid width keeps it reading
   * as a month overview rather than as seven giant swatches. */
  .fw-cal-scroll{overflow-x:auto}
  .fw-cal-grid{display:grid;grid-template-columns:28px repeat(7,minmax(0,1fr));gap:5px;align-items:center;max-width:560px;margin:0 auto}
  .fw-cal-wd{font-size:10px;color:#8f948e;text-align:center;letter-spacing:.06em;padding-bottom:3px}
  .fw-cal-wk{font-size:9.5px;color:#b0b4ae;padding-right:5px;text-align:right;font-variant-numeric:tabular-nums}
  .fw-cal-cell{aspect-ratio:1;max-width:62px;width:100%;justify-self:center;border-radius:4px;border:1px solid rgba(52,62,56,.055);background:rgba(52,62,56,.028);cursor:pointer;transition:transform .16s,box-shadow .16s;position:relative}
  .fw-cal-cell:hover{transform:scale(1.12);box-shadow:0 3px 10px rgba(48,48,44,.14);z-index:2}
  .fw-cal-cell.fw-empty{background:transparent;border-color:transparent;cursor:default}
  .fw-cal-cell.fw-empty:hover{transform:none;box-shadow:none}
  .fw-cal-legend{display:flex;align-items:center;gap:8px;justify-content:center;margin-top:17px;font-size:10.5px;color:#8f948e}
  .fw-cal-legend i{width:12px;height:12px;border-radius:3px;display:block;border:1px solid rgba(52,62,56,.055)}
  .fw-cal-note{margin-top:13px;font-size:11px;color:#909590;letter-spacing:.02em;text-align:center}

  .fw-rhythm-svg{display:block;width:100%;height:152px;overflow:visible}
  .fw-rhythm-axis{display:flex;justify-content:space-between;font-size:10.5px;color:#8f948e;margin-top:6px;letter-spacing:.03em}

  /* trend (monthly weekly-aggregated line) */
  .fw-trend-svg{display:block;width:100%;height:158px;overflow:visible}
  .fw-trend-axis{display:grid;grid-template-columns:repeat(4,1fr);margin-top:7px}
  .fw-trend-axis span{text-align:center;font-size:10.5px;color:#8f948e;letter-spacing:.03em;line-height:1.6}
  .fw-trend-axis span em{display:block;font-style:normal;font-size:9.5px;color:#b0b4ae}

  /* ===== advanced modules =========================================== */
  .fw-adv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid rgba(52,62,56,.085);border-radius:3px;background:rgba(255,255,255,.26);overflow:hidden}
  .fw-adv{padding:26px 26px 24px;border-right:1px solid rgba(52,62,56,.075)}
  .fw-adv:last-child{border-right:0}
  .fw-adv-name{font-family:var(--human);font-size:16px;color:#39433d;letter-spacing:.05em;margin-bottom:5px}
  .fw-adv-hint{font-size:10.5px;color:#8d918c;line-height:1.7;margin-bottom:19px;letter-spacing:.02em}
  .fw-adv-row{display:flex;align-items:baseline;justify-content:space-between;gap:14px;padding:9px 0;border-bottom:1px solid rgba(52,62,56,.06);font-size:11.5px;color:#7f847f}
  .fw-adv-row:last-child{border-bottom:0}
  .fw-adv-row b{font-family:var(--ui);font-variant-numeric:tabular-nums;font-size:14px;font-weight:430;color:#39433d;letter-spacing:-.015em}
  .fw-adv-big{font-family:var(--ui);font-size:29px;font-weight:430;letter-spacing:-.03em;color:#313d36;font-variant-numeric:tabular-nums;margin-bottom:3px}
  .fw-adv-big span{font-size:11px;font-weight:400;color:#8b908b;margin-left:5px;letter-spacing:.02em}
  .fw-adv-flow{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px}
  .fw-adv-flow span{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border:1px solid rgba(52,62,56,.09);border-radius:999px;font-size:10.5px;color:#6e7873;letter-spacing:.02em;background:rgba(255,255,255,.4)}
  .fw-adv-flow span b{font-family:var(--ui);font-weight:450;color:#3d4842;font-variant-numeric:tabular-nums}
  .fw-privacy{margin-top:16px;padding-top:15px;border-top:1px solid rgba(52,62,56,.07);font-size:10.5px;color:#9a9e99;line-height:1.75;letter-spacing:.02em}

  /* ===== session detail overlay ===================================== */
  .fw-sd{position:fixed;inset:0;z-index:88;background:rgba(247,244,237,.985);display:none;overflow-y:auto;overscroll-behavior:contain}
  .fw-sd.fw-open{display:block}
  .fw-sd-shell{max-width:1080px;margin:0 auto;padding:40px 54px 110px}
  .fw-sd-top{display:flex;align-items:center;justify-content:space-between;gap:24px}
  .fw-sd-back{border:0;background:transparent;padding:8px 0;border-bottom:1px solid rgba(52,62,56,.18);cursor:pointer;color:#626b65;font-size:12.5px;letter-spacing:.04em}
  .fw-sd-back:hover{border-color:rgba(52,62,56,.42);color:#39433d}
  .fw-sd-eyebrow{font-size:10px;letter-spacing:.14em;color:#8d918c;text-transform:uppercase}
  .fw-sd-hero{margin-top:62px;display:grid;grid-template-columns:minmax(0,1fr) 342px;gap:74px;align-items:start}
  .fw-sd-task{font-family:var(--human);font-size:41px;font-weight:400;letter-spacing:.06em;margin:14px 0 15px;color:#2f3531}
  .fw-sd-meta{font-size:12.5px;color:#7f847f;letter-spacing:.035em;line-height:1.9;font-variant-numeric:tabular-nums}
  .fw-sd-target{border-top:1px solid rgba(52,62,56,.10);padding-top:20px}
  .fw-sd-target-row{display:flex;align-items:baseline;justify-content:space-between;gap:20px;padding:11px 0}
  .fw-sd-target-row span{font-size:11.5px;color:#7f847f;letter-spacing:.03em}
  .fw-sd-target-row b{font-family:var(--ui);font-size:26px;font-weight:430;letter-spacing:-.028em;color:#33413a;font-variant-numeric:tabular-nums}
  .fw-sd-target-row.fw-actual b{color:#3f5a4a}
  .fw-sd-target-bar{height:4px;border-radius:2px;background:rgba(52,62,56,.09);position:relative;overflow:hidden;margin:4px 0 16px}
  .fw-sd-target-bar i{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#6d8578,#94a99c);border-radius:2px}
  .fw-sd-target-bar em{position:absolute;top:-4px;width:1.5px;height:12px;background:#a89880}
  .fw-sd-target-note{font-size:10.5px;color:#8d918c;line-height:1.8;letter-spacing:.02em}

  .fw-sd-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:0;border:1px solid rgba(52,62,56,.085);border-radius:3px;background:rgba(255,255,255,.32);overflow:hidden;margin-top:52px}
  .fw-sd-stat{padding:21px 20px;border-right:1px solid rgba(52,62,56,.075)}
  .fw-sd-stat:last-child{border-right:0}
  .fw-sd-stat span{display:block;font-size:10.5px;color:#7f847f;letter-spacing:.04em;margin-bottom:11px}
  .fw-sd-stat b{font-family:var(--ui);font-size:22px;font-weight:430;letter-spacing:-.026em;color:#33413a;font-variant-numeric:tabular-nums}
  .fw-sd-stat b small{font-size:11px;font-weight:400;color:#838983;letter-spacing:.02em;margin-left:3px}

  .fw-sd-fold{margin-top:48px;border:1px solid rgba(52,62,56,.09);border-radius:3px;background:rgba(255,255,255,.24);overflow:hidden}
  .fw-sd-fold-head{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:19px 24px;cursor:pointer;user-select:none}
  .fw-sd-fold-head:hover{background:rgba(255,255,255,.38)}
  .fw-sd-fold-name{font-family:var(--human);font-size:16px;color:#39433d;letter-spacing:.05em}
  .fw-sd-fold-hint{font-size:10.5px;color:#8d918c;letter-spacing:.03em;display:flex;align-items:center;gap:9px}
  .fw-sd-fold-hint i{width:7px;height:7px;border-right:1px solid #8d918c;border-bottom:1px solid #8d918c;transform:rotate(45deg) translate(-2px,-2px);transition:transform .22s;display:block}
  .fw-sd-fold.fw-on .fw-sd-fold-hint i{transform:rotate(225deg) translate(-1px,-1px)}
  .fw-sd-fold-body{display:none;padding:4px 24px 22px;border-top:1px solid rgba(52,62,56,.075)}
  .fw-sd-fold.fw-on .fw-sd-fold-body{display:block}
  .fw-sd-sig{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-top:1px solid rgba(52,62,56,.06);margin-top:6px}
  .fw-sd-sig > div{padding:17px 20px 15px;border-right:1px solid rgba(52,62,56,.06)}
  .fw-sd-sig > div:last-child{border-right:0}
  .fw-sd-sig span{display:block;font-size:10.5px;color:#7f847f;letter-spacing:.04em;margin-bottom:10px}
  .fw-sd-sig b{font-family:var(--ui);font-size:19px;font-weight:430;color:#3a453e;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
  .fw-sd-sig em{display:block;font-style:normal;font-size:10px;color:#9a9e99;margin-top:6px;letter-spacing:.02em;line-height:1.7}
  .fw-sd-quality{display:flex;align-items:center;gap:22px;padding:20px 20px 6px}
  .fw-sd-qbar{flex:1;height:5px;border-radius:3px;background:rgba(52,62,56,.09);position:relative;overflow:hidden}
  .fw-sd-qbar i{position:absolute;inset:0 auto 0 0;border-radius:3px;background:linear-gradient(90deg,#7b9184,#a3b5a8)}
  .fw-sd-quality b{font-family:var(--ui);font-size:19px;font-weight:430;color:#3a453e;font-variant-numeric:tabular-nums}
  .fw-sd-quality span{font-size:11px;color:#8b908b;letter-spacing:.03em}
  .fw-sd-disclaimer{padding:16px 20px 4px;font-size:10.5px;color:#9a9e99;line-height:1.8;letter-spacing:.02em;border-top:1px solid rgba(52,62,56,.06);margin-top:8px}

  /* ===== responsive ================================================= */
  @media(max-width:1180px){
    .fw-cards{grid-template-columns:repeat(3,1fr)}
    .fw-card:nth-child(3){border-right:0}
    .fw-card:nth-child(-n+3){border-bottom:1px solid rgba(52,62,56,.075)}
    .fw-sd-stats{grid-template-columns:repeat(3,1fr)}
    .fw-sd-stat:nth-child(3){border-right:0}
    .fw-sd-stat:nth-child(-n+3){border-bottom:1px solid rgba(52,62,56,.075)}
    .fw-adv-grid{grid-template-columns:1fr}
    .fw-adv{border-right:0;border-bottom:1px solid rgba(52,62,56,.075)}
    .fw-adv:last-child{border-bottom:0}
  }
  @media(max-width:1020px){
    .fw-session{grid-template-columns:150px minmax(0,1fr) 132px;gap:22px}
    .fw-session-actions{display:none}
    .fw-sd-hero{grid-template-columns:1fr;gap:38px}
    .fw-insight{grid-template-columns:1fr;gap:8px}
    .fw-week-cards{grid-template-columns:repeat(2,1fr)}
    .fw-week-cards .fw-card:nth-child(2){border-right:0}
    .fw-week-cards .fw-card:nth-child(-n+2){border-bottom:1px solid rgba(52,62,56,.075)}
  }
  @media(max-width:760px){
    #page-archive{padding:0!important}
    #page-archive>.topbar{padding:26px 20px 0}
    .fw-arch{padding:0 20px 68px}
    .fw-arch-head{flex-direction:column;align-items:flex-start;gap:20px;margin:26px 0 34px}
    .fw-arch-title{font-size:29px}
    .fw-cards{grid-template-columns:1fr 1fr}
    .fw-card{border-right:1px solid rgba(52,62,56,.075)!important;border-bottom:1px solid rgba(52,62,56,.075)}
    .fw-card:nth-child(2n){border-right:0!important}
    .fw-card:last-child{border-bottom:0}
    .fw-card-value{font-size:26px}
    .fw-blk{margin-top:46px}
    .fw-session{grid-template-columns:1fr;gap:13px;padding:22px 6px 22px 18px}
    .fw-session-actions{justify-self:start;flex-direction:row;align-items:baseline;gap:18px;display:flex}
    .fw-session-mini{max-width:100%}
    .fw-tl-wrap{padding:18px 15px 14px}
    .fw-tl-svg{height:136px}
    .fw-tl-legend{gap:13px;font-size:10.5px}
    .fw-sd-shell{padding:26px 20px 80px}
    .fw-sd-task{font-size:31px}
    .fw-sd-stats{grid-template-columns:1fr 1fr}
    .fw-sd-stat{border-right:1px solid rgba(52,62,56,.075)!important}
    .fw-sd-stat:nth-child(2n){border-right:0!important}
    .fw-sd-sig{grid-template-columns:1fr}
    .fw-sd-sig > div{border-right:0;border-bottom:1px solid rgba(52,62,56,.06)}
    .fw-chart-axis span{font-size:9px}
    .fw-trend-axis span{font-size:9px}
    .fw-cal{padding:18px 15px 16px}
    .fw-cal-grid{gap:3px;max-width:100%}
    .fw-insight-text{font-size:15.5px}
  }
  `;
  document.head.appendChild(style);
})();
