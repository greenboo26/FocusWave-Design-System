/* FocusWave focus-state timeline v1
 * ---------------------------------------------------------------
 * The state timeline is the core component of the archive. It is deliberately
 * NOT a line chart: a line implies a continuous quantity and invites reading
 * "how high", whereas attention is categorical — you are either with the task
 * or you are not. A continuous ribbon (like a sleep-stage chart) answers the
 * questions the brief actually asks: when did state drop, how long did a
 * 神驰 stretch last, did the user practice, and did they come back.
 *
 * Renders as SVG so it scales crisply at any width and can carry per-segment
 * tooltips and markers without a canvas hit-testing layer.
 *
 * Layout, per timeline:
 *   [ axis labels ]
 *   [ state ribbon    ]  ← one row, colour changes at each state boundary
 *   [ 神驰 markers     ]  ← annotated only when >= DISPERSED_EPISODE_SECONDS
 *   [ practice dots    ]  ← clickable
 *   [ clock ticks      ]
 *
 * Two modes:
 *   full    the full-width timeline under 今日摘要
 *   mini    a 1-row sparkline-ish ribbon for each 单次任务档案 entry and for
 *           the weekly bars' tooltips
 * ---------------------------------------------------------------
 */
(() => {
  if (window.FocusWaveTimeline) return;

  const D = () => window.FocusWaveArchiveData;

  /* Ink-wash state palette. Low saturation throughout — the ribbon should read
   * as a wash on paper, never as a UI traffic light. Deep focus is the most
   * "settled" ink (near-black-green), drift is a lighter wash, dispersed is a
   * warm dust tone (the only warm note, so a long stretch is visible at a
   * glance), practice is a hollow ring in the accent colour. */
  const COLORS = {
    deep: { fill: '#5b6b62', label: '凝神' },
    drift: { fill: '#a9b3ac', label: '分神' },
    dispersed: { fill: '#c2a98d', label: '神驰' },
    practice: { fill: '#8aa39a', label: '专注练习' }
  };

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs = {}) {
    const node = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined) continue;
      node.setAttribute(k, String(v));
    }
    return node;
  }

  function fmtClock(ms) {
    const d = new Date(ms);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  function fmtDuration(seconds) {
    const s = Math.round(seconds);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60), r = s % 60;
    if (m < 60) return r ? `${m}m ${r}s` : `${m}m`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  }

  /* ------------------------------------------------------------------ full */

  /* Build the full timeline for one session (or a whole day's sessions laid
   * out end-to-end). `options.gaps` draws the empty spaces between sessions as
   * paper rather than ink, so the ribbon never implies focus during a break. */
  function renderFull(container, session, options = {}) {
    container.innerHTML = '';
    const segs = session.segments;
    if (!segs.length) {
      container.innerHTML = '<div class="fw-tl-empty">这一天没有采集到专注记录。</div>';
      return { destroy() {} };
    }

    const start = session.start;
    const end = session.end;
    const span = end - start;
    const W = options.width || 1000;
    const H = 118;
    const PAD_L = 0, PAD_R = 0;
    const ribbonY = 30, ribbonH = 34;
    const usableW = W - PAD_L - PAD_R;

    const svg = el('svg', {
      viewBox: `0 0 ${W} ${H}`,
      preserveAspectRatio: 'none',
      class: 'fw-tl-svg',
      role: 'img',
      'aria-label': `专注状态时间线，${fmtClock(start)} 至 ${fmtClock(end)}`
    });

    /* --- paper backdrop with a faint ruled texture, so the ribbon sits on
     * something rather than floating on the page background. --- */
    const defs = el('defs');
    defs.innerHTML = `
      <filter id="fwTlPaper" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.055"/></feComponentTransfer>
      </filter>
      <linearGradient id="fwTlDeep" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#67776d"/><stop offset="1" stop-color="#4e5d54"/>
      </linearGradient>
      <linearGradient id="fwTlDrift" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#b3bcb5"/><stop offset="1" stop-color="#9aa59d"/>
      </linearGradient>
      <linearGradient id="fwTlDispersed" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#cbb59b"/><stop offset="1" stop-color="#b89c7e"/>
      </linearGradient>`;
    svg.appendChild(defs);

    svg.appendChild(el('rect', {
      x: 0, y: ribbonY - 8, width: W, height: ribbonH + 16,
      fill: '#fdfbf6', opacity: .7
    }));
    svg.appendChild(el('rect', {
      x: 0, y: ribbonY - 8, width: W, height: ribbonH + 16,
      filter: 'url(#fwTlPaper)', opacity: .5
    }));

    const xOf = (t) => PAD_L + ((t - start) / span) * usableW;
    const fillFor = (state) => {
      if (state === 'deep') return 'url(#fwTlDeep)';
      if (state === 'drift') return 'url(#fwTlDrift)';
      if (state === 'dispersed') return 'url(#fwTlDispersed)';
      return COLORS.practice.fill;
    };

    /* --- state ribbon: one rect per segment, hairline gaps between them so
     * the eye can count transitions without the ribbon breaking apart. --- */
    const ribbon = el('g', { class: 'fw-tl-ribbon' });
    const markers = el('g', { class: 'fw-tl-markers' });
    const practiceRow = el('g', { class: 'fw-tl-practice' });
    const hits = [];

    for (const seg of segs) {
      const x = xOf(seg.start);
      const w = Math.max(1.2, xOf(seg.end) - x);
      const isPractice = seg.state === 'practice';

      if (isPractice) {
        /* Practice is not a state the device observed — it is something the
         * user did. Render it as a hollow band so it reads as an interlude
         * inside the state sequence rather than a fourth attention level. */
        ribbon.appendChild(el('rect', {
          x, y: ribbonY, width: w, height: ribbonH,
          fill: '#f4f1e9', stroke: COLORS.practice.fill, 'stroke-width': 1, rx: 2
        }));
      } else {
        const rect = el('rect', {
          x, y: ribbonY, width: w, height: ribbonH,
          fill: fillFor(seg.state), rx: 1.2
        });
        rect.style.cursor = 'default';
        ribbon.appendChild(rect);
      }

      /* Invisible full-height hit target so tooltips work over hairline
       * segments too. */
      const hit = el('rect', {
        x, y: ribbonY - 10, width: w, height: ribbonH + 20, fill: 'transparent'
      });
      const seconds = Math.round((seg.end - seg.start) / 1000);
      const label = COLORS[seg.state].label;
      hit.appendChild(el('title', {})).textContent =
        `${label} · ${fmtClock(seg.start)}–${fmtClock(seg.end)} · ${fmtDuration(seconds)}`;
      hits.push({ seg, x, y: ribbonY - 10, w, seconds });
      ribbon.appendChild(hit);

      /* 神驰 marker — only where the stretch is long enough to be worth
       * naming, per the brief (>= 1 minute). */
      if (seg.state === 'dispersed' && seconds >= 60) {
        const cx = x + w / 2;
        markers.appendChild(el('line', {
          x1: cx, y1: ribbonY + ribbonH, x2: cx, y2: ribbonY + ribbonH + 7,
          stroke: '#a98a64', 'stroke-width': 1
        }));
        const labelText = `神驰 ${fmtDuration(seconds)}`;
        const text = el('text', {
          x: cx, y: ribbonY + ribbonH + 19,
          'text-anchor': 'middle', class: 'fw-tl-marker-text'
        });
        text.textContent = labelText;
        markers.appendChild(text);
      }

      if (isPractice) {
        const cx = x + w / 2;
        practiceRow.appendChild(el('circle', {
          cx, cy: ribbonY - 15, r: 4.4,
          fill: '#fdfbf6', stroke: COLORS.practice.fill, 'stroke-width': 1.5,
          class: 'fw-tl-practice-dot', 'data-practice': seg.practiceId || ''
        }));
        practiceRow.appendChild(el('line', {
          x1: cx, y1: ribbonY - 11, x2: cx, y2: ribbonY,
          stroke: COLORS.practice.fill, 'stroke-width': .8, opacity: .5
        }));
      }
    }

    svg.appendChild(ribbon);
    svg.appendChild(markers);
    svg.appendChild(practiceRow);

    /* --- clock ticks along the bottom --- */
    const axis = el('g', { class: 'fw-tl-axis' });
    const tickCount = options.ticks || 6;
    axis.appendChild(el('line', {
      x1: 0, y1: ribbonY + ribbonH, x2: W, y2: ribbonY + ribbonH + 8,
      stroke: 'rgba(52,62,56,.13)', 'stroke-width': 1
    }));
    for (let i = 0; i <= tickCount; i++) {
      const t = start + (span * i) / tickCount;
      const x = xOf(t);
      axis.appendChild(el('line', {
        x1: x, y1: ribbonY + ribbonH + 8, x2: x, y2: ribbonY + ribbonH + 12,
        stroke: 'rgba(52,62,56,.18)', 'stroke-width': 1
      }));
      const text = el('text', {
        x: Math.min(W - 2, Math.max(2, x)),
        y: H - 4,
        'text-anchor': i === 0 ? 'start' : i === tickCount ? 'end' : 'middle',
        class: 'fw-tl-tick'
      });
      text.textContent = fmtClock(t);
      axis.appendChild(text);
    }
    svg.appendChild(axis);

    container.appendChild(svg);

    /* --- legend: built from the states actually present, so a clean session
     * does not advertise a colour it never uses. --- */
    const present = [...new Set(segs.map(s => s.state))];
    const legend = document.createElement('div');
    legend.className = 'fw-tl-legend';
    legend.innerHTML = present.map(st => {
      const c = COLORS[st];
      return st === 'practice'
        ? `<span><i style="background:#f4f1e9;border:1px solid ${c.fill}"></i>${c.label}</span>`
        : `<span><i style="background:${c.fill}"></i>${c.label}</span>`;
    }).join('');
    container.appendChild(legend);

    return {
      /* Programmatically highlight one segment — used when a bloom in the pond
       * points at a specific session. */
      highlight(segmentIndex) {
        ribbon.querySelectorAll('rect').forEach(r => r.classList.remove('fw-tl-hot'));
        const target = ribbon.querySelectorAll('rect')[segmentIndex];
        target?.classList.add('fw-tl-hot');
      },
      destroy() { container.innerHTML = ''; }
    };
  }
  /* ------------------------------------------------------------------ mini */

  /* A one-row ribbon used inside each session record and inside the monthly
   * calendar tooltip. No axis, no markers — just the shape of the session. */
  function renderMini(container, session, options = {}) {
    container.innerHTML = '';
    const W = options.width || 260;
    const H = options.height || 16;
    const span = session.end - session.start;
    if (span <= 0) return;

    const svg = el('svg', {
      viewBox: `0 0 ${W} ${H}`,
      preserveAspectRatio: 'none',
      class: 'fw-tl-mini-svg',
      role: 'img',
      'aria-label': `${session.task} 的状态缩略色带`
    });

    for (const seg of session.segments) {
      const x = ((seg.start - session.start) / span) * W;
      const w = Math.max(.9, ((seg.end - seg.start) / span) * W);
      if (seg.state === 'practice') {
        svg.appendChild(el('rect', {
          x, y: 0, width: w, height: H,
          fill: '#fdfbf6', stroke: COLORS.practice.fill, 'stroke-width': .8
        }));
      } else {
        svg.appendChild(el('rect', {
          x, y: 0, width: w, height: H, fill: COLORS[seg.state].fill
        }));
      }
    }
    container.appendChild(svg);
  }

  /* ------------------------------------------------- day ribbon (all sessions) */

  /* The 今日 timeline shows the whole waking day. The problem with a strictly
   * linear time axis is that a day contains ~3 hours of focus spread over ~11
   * hours of wall clock, so every state segment collapses to a 1–2px sliver and
   * the ribbon reads as hatching instead of as a state sequence.
   *
   * The fix is to keep the idle stretches between sessions — they are real
   * information, they show that focus came in blocks — but to compress them to a
   * fixed, narrow fraction of the width. Time inside a session stays linear, so
   * segment lengths remain comparable across the day; only the empty gaps are
   * shortened. Each gap keeps its true duration in its tooltip, and the axis is
   * drawn from the real wall-clock labels so nothing is misreported. */
  function renderDay(container, daySessions, options = {}) {
    container.innerHTML = '';
    if (!daySessions.length) {
      container.innerHTML = '<div class="fw-tl-empty">这一天没有采集到专注记录。</div>';
      return { destroy() {} };
    }

    const W = options.width || 1000;
    const H = 158;
    const ribbonY = 34, ribbonH = 36;

    /* Build a piecewise-linear position map: sessions get width proportional to
     * their duration, gaps get a fixed budget. */
    const GAP_FRACTION = 0.055;          // share of total width per gap
    const totalSessionMs = daySessions.reduce((a, s) => a + (s.end - s.start), 0);
    const gapCount = Math.max(1, daySessions.length - 1);
    /* Reserve GAP_FRACTION for each gap, then divide the rest by session time. */
    const sessionBudget = Math.max(0.35, 1 - GAP_FRACTION * gapCount);
    const msToUnit = sessionBudget / totalSessionMs;

    /* pieces: ordered list of {kind, start, end, u0, u1} */
    const pieces = [];
    let cursorU = 0;
    daySessions.forEach((s, i) => {
      if (i > 0) {
        const prev = daySessions[i - 1];
        const gapMs = s.start - prev.end;
        pieces.push({ kind: 'gap', start: prev.end, end: s.start, ms: gapMs, u0: cursorU, u1: cursorU + GAP_FRACTION });
        cursorU += GAP_FRACTION;
      }
      const u0 = cursorU;
      const u1 = cursorU + (s.end - s.start) * msToUnit;
      pieces.push({ kind: 'session', session: s, start: s.start, end: s.end, u0, u1 });
      cursorU = u1;
    });
    /* normalise so the ribbon always fills the full width */
    const totalU = cursorU || 1;
    pieces.forEach(p => { p.u0 /= totalU; p.u1 /= totalU; });

    const xOfU = (u) => u * W;
    /* Map any absolute timestamp to an x position. Timestamps outside a session
     * resolve to the edge of the surrounding gap. */
    const xOfT = (t) => {
      for (const p of pieces) {
        if (p.kind === 'gap') {
          if (t <= p.start) return xOfU(p.u0);
          if (t < p.end) return xOfU(p.u0 + (p.u1 - p.u0) * ((t - p.start) / (p.end - p.start || 1)));
          continue;
        }
        if (t < p.start) return xOfU(p.u0);
        if (t <= p.end) return xOfU(p.u0 + (p.u1 - p.u0) * ((t - p.start) / (p.end - p.start)));
      }
      return W;
    };
    /* x position of a timestamp inside a specific session. */
    const xInSession = (t) => {
      const p = pieces.find(q => q.kind === 'session' && t >= q.start && t <= q.end);
      if (!p) return xOfT(t);
      return xOfU(p.u0 + (p.u1 - p.u0) * ((t - p.start) / (p.end - p.start || 1)));
    };

    const svg = el('svg', {
      viewBox: `0 0 ${W} ${H}`,
      preserveAspectRatio: 'none',
      class: 'fw-tl-svg',
      role: 'img',
      'aria-label': `今日专注状态时间线，${daySessions.length} 段专注`
    });

    const defs = el('defs');
    defs.innerHTML = `
      <filter id="fwTlPaperD" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="12"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.055"/></feComponentTransfer>
      </filter>
      <linearGradient id="fwTlDeepD" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#67776d"/><stop offset="1" stop-color="#4e5d54"/>
      </linearGradient>
      <linearGradient id="fwTlDriftD" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#b3bcb5"/><stop offset="1" stop-color="#9aa59d"/>
      </linearGradient>
      <linearGradient id="fwTlDispersedD" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#cbb59b"/><stop offset="1" stop-color="#b89c7e"/>
      </linearGradient>`;
    svg.appendChild(defs);

    /* paper strip only behind the session blocks, so idle time reads as bare
     * paper rather than as a ribbon that simply has no state in it */
    for (const p of pieces) {
      if (p.kind !== 'session') continue;
      svg.appendChild(el('rect', {
        x: xOfU(p.u0), y: ribbonY - 9, width: xOfU(p.u1) - xOfU(p.u0), height: ribbonH + 18,
        fill: '#fdfbf6', opacity: .75
      }));
      svg.appendChild(el('rect', {
        x: xOfU(p.u0), y: ribbonY - 9, width: xOfU(p.u1) - xOfU(p.u0), height: ribbonH + 18,
        filter: 'url(#fwTlPaperD)', opacity: .45
      }));
    }

    const fillFor = (state) => {
      if (state === 'deep') return 'url(#fwTlDeepD)';
      if (state === 'drift') return 'url(#fwTlDriftD)';
      return 'url(#fwTlDispersedD)';
    };

    const ribbon = el('g', { class: 'fw-tl-ribbon' });
    const markers = el('g', { class: 'fw-tl-markers' });
    const practiceRow = el('g', { class: 'fw-tl-practice' });

    /* Dashed separators in the gap between sessions. */
    daySessions.forEach((s, i) => {
      if (i === 0) return;
      const x = xOfU(pieces.find(p => p.kind === 'session' && p.session === s).u0);
      svg.appendChild(el('line', {
        x1: x, y1: ribbonY - 6, x2: x, y2: ribbonY + ribbonH + 6,
        stroke: 'rgba(52,62,56,.10)', 'stroke-width': 1, 'stroke-dasharray': '2 5'
      }));
    });

    const markerTexts = [];
    daySessions.forEach(session => {
      for (const seg of session.segments) {
        const x = xInSession(seg.start);
        const xEnd = xInSession(seg.end);
        const w = Math.max(1.4, xEnd - x);
        const seconds = Math.round((seg.end - seg.start) / 1000);
        const isPractice = seg.state === 'practice';

        if (isPractice) {
          ribbon.appendChild(el('rect', {
            x, y: ribbonY, width: w, height: ribbonH, rx: 2, 'data-session': session.id,
            fill: '#f4f1e9', stroke: COLORS.practice.fill, 'stroke-width': 1
          }));
          const cx = x + w / 2;
          practiceRow.appendChild(el('circle', {
            cx, cy: ribbonY - 16, r: 4.6,
            fill: '#fdfbf6', stroke: COLORS.practice.fill, 'stroke-width': 1.5,
            class: 'fw-tl-practice-dot', 'data-practice': seg.practiceId || '',
            'data-session': session.id
          }));
          practiceRow.appendChild(el('line', {
            x1: cx, y1: ribbonY - 11.5, x2: cx, y2: ribbonY,
            stroke: COLORS.practice.fill, 'stroke-width': .8, opacity: .5
          }));
        } else {
          ribbon.appendChild(el('rect', {
            x, y: ribbonY, width: w, height: ribbonH, rx: 1.2,
            'data-session': session.id, fill: fillFor(seg.state)
          }));
        }

        const hit = el('rect', { x, y: ribbonY - 12, width: w, height: ribbonH + 24, fill: 'transparent' });
        hit.appendChild(el('title', {})).textContent =
          `${session.task} · ${COLORS[seg.state].label} · ${fmtClock(seg.start)}–${fmtClock(seg.end)} · ${fmtDuration(seconds)}`;
        ribbon.appendChild(hit);

        if (seg.state === 'dispersed' && seconds >= 60 && markerTexts.length < 8) {
          markerTexts.push({ cx: x + w / 2, seconds });
        }
      }
    });

    /* 神驰 markers. Labels are laid out on rows: a label that would run into the
     * previous one on the same row is pushed down instead of overlapping. The
     * measurement is an estimate of rendered width, which is enough to keep them
     * apart at every breakpoint the ribbon is shown at. */
    markerTexts.sort((a, b) => a.cx - b.cx);
    const CHAR_W = 6.4;                       // ~11px CJK/digit mix
    const ROW_H = 13;
    const rowsEnd = [];                       // right-most x used per row
    markerTexts.forEach(m => {
      const label = `神驰 ${fmtDuration(m.seconds)}`;
      const halfW = (label.length * CHAR_W) / 2;
      let row = 0;
      while (row < rowsEnd.length && m.cx - halfW < rowsEnd[row] + 9) row++;
      rowsEnd[row] = m.cx + halfW;

      markers.appendChild(el('line', {
        x1: m.cx, y1: ribbonY + ribbonH, x2: m.cx, y2: ribbonY + ribbonH + 6 + row * ROW_H,
        stroke: '#a98a64', 'stroke-width': 1, opacity: row ? .55 : 1
      }));
      const text = el('text', {
        x: m.cx, y: ribbonY + ribbonH + 17 + row * ROW_H,
        'text-anchor': 'middle', class: 'fw-tl-marker-text'
      });
      text.textContent = label;
      markers.appendChild(text);
    });

    svg.appendChild(ribbon);
    svg.appendChild(markers);
    svg.appendChild(practiceRow);

    /* Hour ticks: drawn at real clock times, positioned through the piecewise
     * map so they stay aligned with the compressed ribbon. */
    const axis = el('g');
    axis.appendChild(el('line', {
      x1: 0, y1: ribbonY + ribbonH, x2: W, y2: ribbonY + ribbonH + 8,
      stroke: 'rgba(52,62,56,.13)', 'stroke-width': 1
    }));
    const dayStart = new Date(daySessions[0].start); dayStart.setMinutes(0, 0, 0);
    const dayEnd = new Date(daySessions[daySessions.length - 1].end);
    const hourStart = dayStart.getHours();
    const hourEnd = dayEnd.getHours() + 1;
    const step = (hourEnd - hourStart) > 10 ? 2 : 1;
    for (let h = hourStart; h <= hourEnd; h += step) {
      const t = new Date(dayStart); t.setHours(h, 0, 0, 0);
      const x = xOfT(t.getTime());
      axis.appendChild(el('line', {
        x1: x, y1: ribbonY + ribbonH + 8, x2: x, y2: ribbonY + ribbonH + 12,
        stroke: 'rgba(52,62,56,.18)', 'stroke-width': 1
      }));
      const text = el('text', {
        x: Math.min(W - 3, Math.max(3, x)), y: H - 4,
        'text-anchor': h === hourStart ? 'start' : 'middle',
        class: 'fw-tl-tick'
      });
      text.textContent = `${String(h % 24).padStart(2, '0')}:00`;
      axis.appendChild(text);
    }
    svg.appendChild(axis);

    container.appendChild(svg);

    /* Legend with the four states, always all four for the day ribbon. */
    const legend = document.createElement('div');
    legend.className = 'fw-tl-legend';
    legend.innerHTML = ['deep', 'drift', 'dispersed', 'practice'].map(st => {
      const c = COLORS[st];
      return st === 'practice'
        ? `<span><i style="background:#f4f1e9;border:1px solid ${c.fill}"></i>${c.label}</span>`
        : `<span><i style="background:${c.fill}"></i>${c.label}</span>`;
    }).join('');
    container.appendChild(legend);

    return {
      /* Highlight every stretch belonging to one session — used by the bloom ↔
       * record link. Rects carry data-session, so this does not depend on DOM
       * ordering. */
      highlightSession(sessionId) {
        ribbon.querySelectorAll('rect').forEach(r => r.classList.remove('fw-tl-hot'));
        ribbon.querySelectorAll(`rect[data-session="${sessionId}"]`)
          .forEach(r => r.classList.add('fw-tl-hot'));
      },
      destroy() { container.innerHTML = ''; }
    };
  }

  /* ----------------------------------------------------------- practice card */

  /* The popover shown when a practice dot is clicked. Text is built from the
   * segment data, so it always matches what the ribbon shows. */
  function practiceDetail(session, segment) {
    const settle = segment.returnsToDeepAfterSeconds;
    const base = `${fmtClock(segment.start)} 开始练习 · ${Math.round((segment.end - segment.start) / 1000)} 秒`;
    return settle
      ? `${base}，练习结束后 ${settle} 秒重新进入凝神`
      : `${base}，练习结束后回到分神`;
  }

  window.FocusWaveTimeline = {
    COLORS, renderFull, renderMini, renderDay, practiceDetail,
    fmtClock, fmtDuration
  };
})();
