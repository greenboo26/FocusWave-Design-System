/* FocusWave focus archive v1
 * ---------------------------------------------------------------
 * The 专注档案 view. It is its own top-level page (#page-archive) with its own
 * entry in the left rail — it no longer sits below the lotus pond.
 *
 * Structure (top to bottom), exactly as the brief specifies:
 *   档案页
 *     ├ 日 / 周 / 月 switch (defaults to 日)
 *     ├ 日 : 今日摘要 → 专注状态时间线 → 单次任务档案 → 高级模块
 *     ├ 周 : 四个概要 → 两张共享横轴的图 → 这一周的变化
 *     └ 月 : 专注日历 → 有效专注比例趋势 → 一天中的专注节律
 *
 * Copy rules enforced throughout:
 *   - no causal claims ("练习让你的专注提升了…" is never written)
 *   - no streak / gamification language ("连续专注 X 天" is never written)
 *   - no raw physiological values in the archive; they live behind the
 *     "数据依据" fold inside Session Detail only
 *
 * The bloom ↔ record link spans two pages now. The pond exposes its bloom order
 * (bloom N is the Nth completed session of the day). Clicking a bloom switches
 * to the archive page and highlights record N; hovering a record switches back
 * to the pond and draws the linked ring on bloom N. Both directions route
 * through window.showPage so the rail's active state stays correct.
 * ---------------------------------------------------------------
 */
(() => {
  if (window.FocusWaveArchive) return;

  const D = () => window.FocusWaveArchiveData;
  const TL = () => window.FocusWaveTimeline;

  const MONTH_LABEL = ['一', '二', '三', '四', '五', '六', '日'];

  let root = null;
  let view = 'day';
  let focusDate = null;
  let detailOverlay = null;
  let currentDayTimeline = null;
  let visible = false;

  function fmtClock(ms) {
    const d = new Date(ms);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  function fmtHM(seconds) {
    const total = Math.round(seconds / 60);
    if (total < 60) return `${total}m`;
    return `${Math.floor(total / 60)}h ${total % 60}m`;
  }
  function fmtMS(seconds) {
    const s = Math.round(seconds);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    return `${m}m ${s % 60}s`;
  }
  function pct(v) { return `${Math.round(v * 100)}%`; }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  /* ----------------------------------------------------------------- shell */

  function markup() {
    return `
    <div class="fw-arch-inner">
      <div class="fw-arch-head">
        <div>
          <div class="fw-arch-title-row">
            <h2 class="fw-arch-title">专注档案</h2>
            <span class="fw-arch-title-en">/ Focus Archive</span>
          </div>
          <div class="fw-arch-sub">记录每一次凝神、分神与重新回到任务的过程。</div>
        </div>
        <div class="fw-arch-switch" role="tablist" aria-label="档案范围">
          <button type="button" role="tab" data-arch-view="day" aria-selected="true">日</button>
          <button type="button" role="tab" data-arch-view="week" aria-selected="false">周</button>
          <button type="button" role="tab" data-arch-view="month" aria-selected="false">月</button>
        </div>
      </div>
      <div class="fw-arch-view fw-active" data-arch-panel="day"></div>
      <div class="fw-arch-view" data-arch-panel="week"></div>
      <div class="fw-arch-view" data-arch-panel="month"></div>
    </div>`;
  }

  /* ------------------------------------------------------------- day view */

  function renderDay() {
    const D0 = D();
    const day = focusDate ? D0.getDay(focusDate) : D0.today();
    const a = D0.aggregateDay(day);
    const panel = root.querySelector('[data-arch-panel="day"]');

    /* Note: deliberately no "连续 X 天" tile. The day view reports what
     * happened today and nothing about momentum. */
    const cards = [
      {
        label: '专注时长',
        value: fmtHM(a.focusSeconds),
        foot: `${a.sessionCount} 段有效采集`
      },
      {
        label: '有效专注比例',
        value: pct(a.effectiveRatio),
        bar: a.effectiveRatio,
        goal: a.focusTarget,
        foot: `目标 ${pct(a.focusTarget)}`
      },
      {
        label: '完成任务',
        value: `${a.sessionCount}`,
        unit: '次',
        foot: a.sessionCount ? `最近 ${fmtClock(day.sessions[day.sessions.length - 1].end)} 结束` : '今天还没有记录'
      },
      {
        label: '神驰片段',
        value: `${a.dispersedEpisodes}`,
        unit: '次',
        foot: `连续神驰达 ${D0.DISPERSED_EPISODE_SECONDS}s 计 1 段`
      },
      {
        label: '专注练习',
        value: `${a.practiceSessions}`,
        unit: '次',
        foot: a.practiceSessions === 0 ? '今天没有启动练习' : `共 ${fmtHM(a.practiceSeconds)}`
      }
    ];

    panel.innerHTML = `
      <div class="fw-blk">
        <div class="fw-blk-head">
          <h3 class="fw-blk-title">本日总览</h3>
          <div class="fw-blk-note">有效专注比例 = 凝神时间 ÷ 有效采集时间 · 分神按 0 计</div>
        </div>
        <div class="fw-cards">
          ${cards.map(c => `
            <div class="fw-card">
              <div class="fw-card-label">${c.label}</div>
              <div class="fw-card-value">${c.value}${c.unit ? `<small>${c.unit}</small>` : ''}</div>
              ${c.bar !== undefined ? `
                <div class="fw-card-bar">
                  <i style="width:${(c.bar * 100).toFixed(1)}%"></i>
                  <span class="fw-goal-mark" style="left:${(c.goal * 100).toFixed(1)}%"></span>
                </div>` : ''}
              <div class="fw-card-foot">${c.foot}</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="fw-blk">
        <div class="fw-blk-head">
          <h3 class="fw-blk-title">专注状态时间线</h3>
          <div class="fw-blk-note">${fmtClock(day.sessions[0]?.start || day.date.getTime())} – ${day.sessions.length ? fmtClock(day.sessions[day.sessions.length - 1].end) : '—'}</div>
        </div>
        <div class="fw-tl-wrap">
          <div class="fw-tl-holder" id="fwTlHolder"></div>
          <div class="fw-tl-hint">点击时间线上的圆点查看每次专注练习；色带中的留白表示两段专注之间的间隔。</div>
        </div>
      </div>

      <div class="fw-blk">
        <div class="fw-blk-head">
          <h3 class="fw-blk-title">单次任务档案</h3>
          <div class="fw-blk-note">今日荷花与记录一一对应 · 点击任一条查看完整详情</div>
        </div>
        <div class="fw-sessions" id="fwSessionList"></div>
      </div>

      <div class="fw-blk">
        <div class="fw-blk-head">
          <h3 class="fw-blk-title">状态转移与稳定性</h3>
          <div class="fw-blk-note">近 ${D0.days.length} 天，描述性统计</div>
        </div>
        <div class="fw-adv-grid" id="fwAdvGrid"></div>
        <div class="fw-privacy">
          以上均为状态序列的描述性统计，不构成评分，也不包含任何原始生理指标。心率、呼吸与眼动信号仅在单次任务详情的「数据依据」中查看。
        </div>
      </div>`;

    /* timeline */
    currentDayTimeline = TL().renderDay(panel.querySelector('#fwTlHolder'), day.sessions);
    bindPracticeDots(panel.querySelector('#fwTlHolder'));

    /* session records */
    const list = panel.querySelector('#fwSessionList');
    if (!day.sessions.length) {
      list.innerHTML = '<div class="fw-tl-empty">这一天没有完成任何专注任务。</div>';
    } else {
      list.innerHTML = day.sessions.map((s, i) => {
        const st = s.stats;
        return `
        <div class="fw-session" data-session-index="${i}" data-session-id="${s.id}" tabindex="0" role="button"
             aria-label="查看 ${esc(s.task)} 的详情">
          <span class="fw-session-idx">${String(i + 1).padStart(2, '0')}</span>
          <div>
            <div class="fw-session-task">${esc(s.task)}</div>
            <div class="fw-session-time">${fmtClock(s.start)}–${fmtClock(s.end)} · ${s.plannedMinutes} min</div>
          </div>
          <div class="fw-session-stats">
            有效专注 <b>${pct(st.effectiveRatio)}</b><span class="fw-sep">·</span>凝神 <b>${st.deep / 60 >= 1 ? Math.round(st.deep / 60) + 'm' : st.deep + 's'}</b><span class="fw-sep">·</span>分神 <b>${Math.round(st.drift / 60)}m</b><span class="fw-sep">·</span>神驰 <b>${Math.round(st.dispersed / 60)}m</b>
            <div style="margin-top:4px">专注练习 <b>${st.practiceSessions}</b> 次</div>
          </div>
          <div>
            <div class="fw-session-ratio"><b>${pct(st.effectiveRatio)}</b><span>有效专注</span></div>
            <div class="fw-session-mini"></div>
          </div>
          <div class="fw-session-actions">
            <button class="fw-session-pond" type="button" title="在荷花池中定位这朵荷花">在池中查看</button>
            <button class="fw-session-go" type="button">查看详情</button>
          </div>
        </div>`;
      }).join('');

      list.querySelectorAll('.fw-session').forEach((row, i) => {
        const session = day.sessions[i];
        const mini = row.querySelector('.fw-session-mini');
        if (mini) TL().renderMini(mini, session);
        const open = () => openDetail(session);
        row.addEventListener('click', open);
        row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
        /* Reverse link: each record carries a small "在池中查看" button that
         * jumps to the pond and circles the matching bloom. It is a deliberate
         * click rather than a hover, because the pond is now a different page —
         * navigating away on mouseenter would yank the reader out mid-scan. */
        row.querySelector('.fw-session-pond')?.addEventListener('click', e => {
          e.stopPropagation();
          emitBloomHighlight(i);
        });
      });
    }

    /* advanced modules */
    renderAdvanced(panel.querySelector('#fwAdvGrid'), D0.days);

    /* tell the pond which order the blooms correspond to */
    window.FocusWaveArchive.daySessions = day.sessions;
  }

  function bindPracticeDots(container) {
    const pop = document.createElement('div');
    pop.className = 'fw-practice-pop';
    pop.innerHTML = '<div class="fw-practice-pop-inner"></div>';
    container.appendChild(pop);

    container.querySelectorAll('.fw-tl-practice-dot').forEach(dot => {
      dot.addEventListener('mouseenter', () => {
        const sessionId = dot.dataset.session;
        const pid = dot.dataset.practice;
        const day = window.FocusWaveArchive.daySessions || [];
        const session = day.find(s => s.id === sessionId)
          || day.find(s => s.segments.some(g => g.practiceId === pid));
        if (!session) return;
        const seg = session.segments.find(g => g.practiceId === pid);
        if (!seg) return;
        pop.querySelector('.fw-practice-pop-inner').textContent = TL().practiceDetail(session, seg);
        const holder = container.querySelector('.fw-tl-holder') || container;
        const rect = dot.getBoundingClientRect();
        const holderRect = holder.getBoundingClientRect();
        pop.style.left = `${rect.left - holderRect.left + rect.width / 2}px`;
        pop.style.top = `${rect.top - holderRect.top - 6}px`;
        pop.classList.add('fw-on');
      });
      dot.addEventListener('mouseleave', () => pop.classList.remove('fw-on'));
      /* touch: show on tap and let it fade */
      dot.addEventListener('click', () => {
        dot.dispatchEvent(new MouseEvent('mouseenter'));
        setTimeout(() => pop.classList.remove('fw-on'), 2600);
      });
    });
  }

  /* --------------------------------------------------------- advanced block */

  function renderAdvanced(grid, days) {
    const D0 = D();
    const t = D0.transitionStats(days);
    const pair = (k) => t.pairs.get(k) || 0;
    const mean = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    /* stability — deliberately NOT scaled to 0–100 per the brief */
    let deepRuns = [], switches = 0, hours = 0;
    for (const day of days) {
      for (const s of day.sessions) {
        let run = 0;
        for (const seg of s.segments) {
          if (seg.state === 'deep') run += (seg.end - seg.start) / 1000;
          else { if (run) deepRuns.push(run); run = 0; }
        }
        if (run) deepRuns.push(run);
        const segs = s.segments.filter(x => x.state !== 'practice');
        for (let i = 1; i < segs.length; i++) if (segs[i].state !== segs[i - 1].state) switches++;
        hours += s.stats.effectiveSampleTime / 3600;
      }
    }
    const meanRun = mean(deepRuns);
    const maxRun = deepRuns.length ? Math.max(...deepRuns) : 0;
    const switchesPerHour = hours > 0 ? switches / hours : 0;

    /* practice closure */
    let triggered = 0, accepted = 0, returned = 0;
    for (const day of days) {
      for (const s of day.sessions) {
        for (let i = 0; i < s.segments.length; i++) {
          const seg = s.segments[i];
          if (seg.state === 'dispersed' && (seg.end - seg.start) / 1000 >= D0.PRACTICE_TRIGGER_SECONDS) triggered++;
          if (seg.state !== 'practice') continue;
          accepted++;
          const nx = s.segments.slice(i + 1).find(x => x.state === 'deep');
          if (nx && nx.start - seg.end <= 300000) returned++;
        }
      }
    }

    grid.innerHTML = `
      <div class="fw-adv">
        <div class="fw-adv-name">状态转移统计</div>
        <div class="fw-adv-hint">近 ${days.length} 天状态序列中相邻状态的切换次数。</div>
        <div class="fw-adv-flow">
          <span>凝神→分神 <b>${pair('deep→drift')}</b></span>
          <span>分神→凝神 <b>${pair('drift→deep')}</b></span>
          <span>分神→神驰 <b>${pair('drift→dispersed')}</b></span>
          <span>神驰→凝神 <b>${pair('dispersed→deep')}</b></span>
        </div>
        <div class="fw-adv-row"><span>平均从神驰恢复到凝神</span><b>${fmtMS(mean(t.dispersedToDeep) / 1000)}</b></div>
        <div class="fw-adv-row"><span>平均分神后回到凝神</span><b>${fmtMS(mean(t.driftToDeep) / 1000)}</b></div>
      </div>
      <div class="fw-adv">
        <div class="fw-adv-name">专注稳定性</div>
        <div class="fw-adv-hint">不使用 0–100 评分，只报告可核对的时间量。</div>
        <div class="fw-adv-row"><span>平均连续凝神时长</span><b>${fmtMS(meanRun)}</b></div>
        <div class="fw-adv-row"><span>最长连续凝神时长</span><b>${fmtMS(maxRun)}</b></div>
        <div class="fw-adv-row"><span>每小时状态切换次数</span><b>${switchesPerHour.toFixed(1)}</b></div>
        <div class="fw-adv-row"><span>凝神片段数</span><b>${deepRuns.length}</b></div>
      </div>
      <div class="fw-adv">
        <div class="fw-adv-name">专注练习闭环</div>
        <div class="fw-adv-hint">练习由用户主动启动，人数与结果分开统计。</div>
        <div class="fw-adv-row"><span>触发严重神驰</span><b>${triggered} 次</b></div>
        <div class="fw-adv-row"><span>接受练习</span><b>${accepted} 次</b></div>
        <div class="fw-adv-row"><span>练习后回到凝神</span><b>${returned}/${accepted}</b></div>
        <div class="fw-adv-row"><span>练习后 5 分钟内回到凝神</span><b>${accepted ? pct(returned / accepted) : '—'}</b></div>
      </div>`;
  }

  /* ------------------------------------------------------------ week view */

  function renderWeek() {
    const D0 = D();
    const anchor = focusDate || D0.today().date;
    const w = D0.weekInsights(anchor);
    const panel = root.querySelector('[data-arch-panel="week"]');
    const days = D0.weekDays(anchor);
    const daily = days.map(d => D0.aggregateDay(d));

    const wd = ['一', '二', '三', '四', '五', '六', '日'];
    const maxMinutes = Math.max(60, ...daily.map(d => Math.round(d.deepSeconds / 60)));

    /* Two charts, one shared x-axis, never a dual-Y chart: each chart gets its
     * own scale but they are stacked and share the weekday labels. */
    const W = 700, barH = 134, pad = 4;
    const barW = (W - pad * 2) / 7;
    const bars = daily.map((d, i) => {
      const m = Math.round(d.deepSeconds / 60);
      const h = maxMinutes > 0 ? (m / maxMinutes) * (barH - 26) : 0;
      const x = pad + i * barW + barW * 0.24;
      const bw = barW * 0.52;
      const y = barH - 20 - h;
      return `
        <g class="fw-bar-hit">
          <rect x="${x - bw * 0.3}" y="0" width="${bw * 1.6}" height="${barH}" fill="transparent"/>
          <rect x="${x}" y="${y}" width="${bw}" height="${Math.max(h, m > 0 ? 2 : 0)}" rx="1.5"
                fill="url(#fwBarInk)"/>
          <text x="${x + bw / 2}" y="${y - 6}" text-anchor="middle" class="fw-tl-tick">${m > 0 ? m : ''}</text>
          <title>${wd[i]} · ${m > 0 ? m + ' 分钟凝神' : '无记录'}</title>
        </g>`;
    }).join('');

    const linePts = daily.map((d, i) => {
      const x = pad + i * barW + barW / 2;
      const ratio = d.sessionCount ? d.effectiveRatio : null;
      const y = ratio === null ? null : 110 - ratio * 90;
      return { x, y, ratio, has: ratio !== null };
    });
    const drawn = linePts.filter(p => p.has);
    const path = drawn.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const dots = drawn.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.4" fill="#fdfbf6" stroke="#6c8a7b" stroke-width="1.6"/>`).join('');
    const goalLine = `<line x1="${pad}" y1="${(110 - D0.FOCUS_TARGET * 90).toFixed(1)}" x2="${W - pad}" y2="${(110 - D0.FOCUS_TARGET * 90).toFixed(1)}" stroke="#bdb9ad" stroke-width="1" stroke-dasharray="4 5"/>`;

    panel.innerHTML = `
      <div class="fw-week-cards">
        ${[
          { label: '本周专注时长', value: fmtHM(w.current.deepSeconds), unit: '' },
          { label: '平均有效专注比例', value: pct(w.current.effectiveRatio), unit: '' },
          { label: '完成任务', value: String(w.current.sessionCount), unit: '次' },
          { label: '专注练习', value: String(w.current.practiceSessions), unit: '次' }
        ].map(c => `
          <div class="fw-card">
            <div class="fw-card-label">${c.label}</div>
            <div class="fw-card-value">${c.value}${c.unit ? `<small>${c.unit}</small>` : ''}</div>
          </div>`).join('')}
      </div>

      <div class="fw-blk" style="margin-top:0">
        <div class="fw-blk-head">
          <h3 class="fw-blk-title">每日专注时长与有效专注比例</h3>
          <div class="fw-blk-note">两张图共享同一横轴，纵轴各自独立</div>
        </div>
        <div class="fw-charts">
          <div class="fw-chart-block">
            <div class="fw-chart-cap">
              <div class="fw-chart-name">每日专注时长<b>${Math.round(w.current.deepSeconds / 60)} min 合计</b></div>
            </div>
            <svg class="fw-bar-svg" viewBox="0 0 ${W} ${barH}" preserveAspectRatio="none">
              <defs>
                <linearGradient id="fwBarInk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="#7d917f"/><stop offset="1" stop-color="#5c6f63"/>
                </linearGradient>
              </defs>
              <line x1="${pad}" y1="${barH - 20}" x2="${W - pad}" y2="${barH - 20}" stroke="rgba(52,62,56,.14)" stroke-width="1"/>
              ${bars}
            </svg>
            <div class="fw-chart-axis">${wd.map(d => `<span>${d}</span>`).join('')}</div>
          </div>

          <div class="fw-chart-block">
            <div class="fw-chart-cap">
              <div class="fw-chart-name">每日有效专注比例<b>${pct(w.current.effectiveRatio)} 本周平均</b></div>
              <div class="fw-blk-note" style="font-size:10.5px">虚线为 ${pct(D0.FOCUS_TARGET)} 目标</div>
            </div>
            <svg class="fw-line-svg" viewBox="0 0 ${W} 134" preserveAspectRatio="none">
              <line x1="${pad}" y1="110" x2="${W - pad}" y2="110" stroke="rgba(52,62,56,.14)" stroke-width="1"/>
              <line x1="${pad}" y1="65" x2="${W - pad}" y2="65" stroke="rgba(52,62,56,.06)" stroke-width="1"/>
              <line x1="${pad}" y1="20" x2="${W - pad}" y2="20" stroke="rgba(52,62,56,.06)" stroke-width="1"/>
              ${goalLine}
              ${drawn.length > 1 ? `<path d="${path}" fill="none" stroke="#6c8a7b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
              ${dots}
            </svg>
            <div class="fw-chart-axis">${wd.map((d, i) => `<span>${d}${daily[i].sessionCount ? '' : ' ·'}</span>`).join('')}</div>
          </div>
        </div>
      </div>

      <div class="fw-blk">
        <div class="fw-blk-head">
          <h3 class="fw-blk-title">这一周的变化</h3>
          <div class="fw-blk-note">仅描述本周记录中出现的现象，不作因果推断</div>
        </div>
        <div class="fw-insight-list">
          ${w.lines.map(l => `
            <div class="fw-insight">
              <div class="fw-insight-text">${esc(l.text)}</div>
              <div class="fw-insight-note">${esc(l.note)}</div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  /* ----------------------------------------------------------- month view */

  function renderMonth() {
    const D0 = D();
    const anchor = focusDate || D0.today().date;
    const m = D0.monthView(anchor);
    const panel = root.querySelector('[data-arch-panel="month"]');
    const maxMin = Math.max(1, ...m.cells.map(c => c.minutes));

    /* ink calendar — GitHub-contribution shape, ink-wash severity. There is no
     * streak counter and no "keep it up" framing; a blank day is simply blank. */
    const firstDow = (m.cells[0].date.getDay() + 6) % 7;

    const wdHeads = MONTH_LABEL.map(d => `<div class="fw-cal-wd">${d}</div>`).join('');

    /* rhythm chart, 6:00–21:00 */
    const RW = 700, RH = 152;
    const slots = m.rhythm;
    const stepX = RW / (slots.length - 1);
    const yOf = (r) => 118 - r * 96;
    const pts = slots.map((s, i) => ({ x: i * stepX, y: s.ratio === null ? null : yOf(s.ratio), ...s }));
    const segs = [];
    let cur = [];
    for (const p of pts) {
      if (p.y === null) { if (cur.length > 1) segs.push(cur); cur = []; }
      else cur.push(p);
    }
    if (cur.length > 1) segs.push(cur);
    const areaPath = segs.map(seg =>
      `M${seg[0].x.toFixed(1)} 118 ` + seg.map(p => `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') +
      ` L${seg[seg.length - 1].x.toFixed(1)} 118 Z`).join(' ');
    const linePath = segs.map(seg =>
      seg.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')).join(' ');
    const rDots = pts.filter(p => p.y !== null).map(p =>
      `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.8" fill="#fdfbf6" stroke="#6c8a7b" stroke-width="1.4"/>`).join('');

    /* highlight the best window */
    const bestBand = m.best ? (() => {
      const i0 = m.rhythm.findIndex(r => r.hour === m.best.from);
      const i1 = m.rhythm.findIndex(r => r.hour === m.best.to - 1);
      if (i0 < 0 || i1 < 0) return '';
      const x0 = i0 * stepX - stepX * 0.5, x1 = (i1 + 0.5) * stepX;
      return `<rect x="${x0.toFixed(1)}" y="8" width="${Math.max(0, x1 - x0).toFixed(1)}" height="112" fill="rgba(170,140,104,.10)" rx="3"/>
              <line x1="${x0.toFixed(1)}" y1="8" x2="${x0.toFixed(1)}" y2="120" stroke="rgba(170,140,104,.28)" stroke-width="1"/>
              <line x1="${x1.toFixed(1)}" y1="8" x2="${x1.toFixed(1)}" y2="120" stroke="rgba(170,140,104,.28)" stroke-width="1"/>`;
    })() : '';

    /* weekly trend */
    const TW = 700, TH = 158;
    const tw = m.weekly;
    const tStep = TW / Math.max(1, tw.length - 1);
    const tyOf = (r) => 112 - r * 92;
    const tPts = tw.map((x, i) => ({ x: i * tStep, y: tyOf(x.ratio), ...x }));
    const tPath = tPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const tDots = tPts.map(p => `
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.6" fill="#fdfbf6" stroke="#6c8a7b" stroke-width="1.7"/>
      <text x="${p.x.toFixed(1)}" y="${(p.y - 11).toFixed(1)}" text-anchor="middle" class="fw-tl-tick">${pct(p.ratio)}</text>`).join('');

    panel.innerHTML = `
      <div class="fw-blk" style="margin-top:0">
        <div class="fw-blk-head">
          <h3 class="fw-blk-title">专注日历</h3>
          <div class="fw-blk-note">每格深浅表示当天凝神分钟数 · 点击某一天查看该日档案</div>
        </div>
        <div class="fw-cal">
          <div class="fw-cal-scroll">
            <div class="fw-cal-grid">
              <div></div>${wdHeads}
              ${(() => {
                /* Lay cells out in rows of seven with a week label column. */
                const all = [...Array(firstDow).fill(null), ...m.cells];
                const rows = [];
                for (let i = 0; i < all.length; i += 7) rows.push(all.slice(i, i + 7));
                return rows.map((row, ri) => {
                  const filled = row.map(c => {
                    if (!c) return '<div class="fw-cal-cell fw-empty"></div>';
                    const t = c.minutes / maxMin;
                    const alpha = c.minutes === 0 ? 0.028 : 0.14 + t * 0.62;
                    return `<div class="fw-cal-cell" data-cal-date="${c.key}"
                                 style="background:rgba(74,94,82,${alpha.toFixed(3)})"
                                 title="${c.date.getMonth() + 1}/${c.date.getDate()} · ${c.minutes} 分钟凝神 · ${c.sessionCount} 次"></div>`;
                  }).join('');
                  return `<div class="fw-cal-wk">${ri + 1}</div>${filled}`;
                }).join('');
              })()}
            </div>
          </div>
          <div class="fw-cal-legend">
            <span>少</span>
            ${[0.028, 0.20, 0.40, 0.58, 0.76].map(a => `<i style="background:rgba(74,94,82,${a})"></i>`).join('')}
            <span>多</span>
          </div>
          <div class="fw-cal-note">空白格表示当天没有完成专注任务，不作为任何连续记录的判断依据。</div>
        </div>
      </div>

      <div class="fw-blk">
        <div class="fw-blk-head">
          <h3 class="fw-blk-title">有效专注比例趋势</h3>
          <div class="fw-blk-note">按周聚合的 4 个点 · 虚线为目标 ${pct(D0.FOCUS_TARGET)}</div>
        </div>
        <div class="fw-charts">
          <svg class="fw-trend-svg" viewBox="0 0 ${TW} ${TH}" preserveAspectRatio="none">
            <line x1="0" y1="112" x2="${TW}" y2="112" stroke="rgba(52,62,56,.14)" stroke-width="1"/>
            <line x1="0" y1="66" x2="${TW}" y2="66" stroke="rgba(52,62,56,.06)" stroke-width="1"/>
            <line x1="0" y1="20" x2="${TW}" y2="20" stroke="rgba(52,62,56,.06)" stroke-width="1"/>
            <line x1="0" y1="${tyOf(D0.FOCUS_TARGET).toFixed(1)}" x2="${TW}" y2="${tyOf(D0.FOCUS_TARGET).toFixed(1)}" stroke="#bdb9ad" stroke-width="1" stroke-dasharray="4 5"/>
            <path d="${tPath}" fill="none" stroke="#6c8a7b" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
            ${tDots}
          </svg>
          <div class="fw-trend-axis">
            ${tw.map(x => `<span>${x.label}<em>${x.range}</em></span>`).join('')}
          </div>
        </div>
      </div>

      <div class="fw-blk">
        <div class="fw-blk-head">
          <h3 class="fw-blk-title">一天中的专注节律</h3>
          <div class="fw-blk-note">横轴 6:00–21:00 · 纵轴为历史平均有效专注比例</div>
        </div>
        <div class="fw-charts">
          <svg class="fw-rhythm-svg" viewBox="0 0 ${RW} ${RH}" preserveAspectRatio="none">
            <defs>
              <linearGradient id="fwRhythmFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#6c8a7b" stop-opacity=".30"/>
                <stop offset="1" stop-color="#6c8a7b" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <line x1="0" y1="118" x2="${RW}" y2="118" stroke="rgba(52,62,56,.14)" stroke-width="1"/>
            <line x1="0" y1="70" x2="${RW}" y2="70" stroke="rgba(52,62,56,.06)" stroke-width="1"/>
            <line x1="0" y1="22" x2="${RW}" y2="22" stroke="rgba(52,62,56,.06)" stroke-width="1"/>
            ${bestBand}
            <path d="${areaPath}" fill="url(#fwRhythmFill)"/>
            <path d="${linePath}" fill="none" stroke="#6c8a7b" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
            ${rDots}
          </svg>
          <div class="fw-rhythm-axis"><span>6:00</span><span>9:00</span><span>12:00</span><span>15:00</span><span>18:00</span><span>21:00</span></div>
        </div>
        ${m.best ? `
        <div class="fw-insight-list" style="margin-top:26px">
          <div class="fw-insight">
            <div class="fw-insight-text">根据过去 4 周记录，你在 ${String(m.best.from).padStart(2, '0')}:00–${String(m.best.to).padStart(2, '0')}:00 的有效专注比例最高</div>
            <div class="fw-insight-note">该时段平均 ${pct(m.best.ratio)}，基于 ${m.best.n} 次记录。阴影区间为统计窗口。</div>
          </div>
        </div>` : ''}
      </div>`;

    panel.querySelectorAll('[data-cal-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        const [y, mo, d] = cell.dataset.calDate.split('-').map(Number);
        focusDate = new Date(y, mo - 1, d);
        setView('day');
        root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ------------------------------------------------------- session detail */

  function ensureDetailOverlay() {
    if (detailOverlay) return detailOverlay;
    detailOverlay = document.createElement('section');
    detailOverlay.className = 'fw-sd';
    detailOverlay.innerHTML = `
      <div class="fw-sd-shell">
        <div class="fw-sd-top">
          <button class="fw-sd-back" type="button">← 返回专注档案</button>
          <div class="fw-sd-eyebrow">Session Detail · 单次任务</div>
        </div>
        <div id="fwSdBody"></div>
      </div>`;
    document.body.appendChild(detailOverlay);
    detailOverlay.querySelector('.fw-sd-back').addEventListener('click', closeDetail);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && detailOverlay.classList.contains('fw-open')) closeDetail();
    });
    return detailOverlay;
  }

  function closeDetail() {
    detailOverlay?.classList.remove('fw-open');
    document.body.style.overflow = '';
  }

  function openDetail(session) {
    const D0 = D();
    const ov = ensureDetailOverlay();
    const st = session.stats;
    const body = ov.querySelector('#fwSdBody');
    const cov = session.coverage;

    /* Signal coverage numbers live ONLY here, behind the fold. The main archive
     * never shows them. */
    const hrCoverage = cov * 100;
    const respCoverage = Math.max(0, cov * 100 - 3.5);
    const eyeCoverage = Math.max(0, cov * 100 - 7.2);

    body.innerHTML = `
      <div class="fw-sd-hero">
        <div>
          <div class="fw-sd-eyebrow" style="margin-bottom:4px">${session.plannedMinutes} 分钟任务</div>
          <h2 class="fw-sd-task">${esc(session.task)}</h2>
          <div class="fw-sd-meta">
            ${fmtClock(session.start)} – ${fmtClock(session.end)} · 时长 ${fmtHM(st.durationSeconds)}<br>
            完成于 ${new Date(session.start).getMonth() + 1} 月 ${new Date(session.start).getDate()} 日
          </div>
        </div>
        <div class="fw-sd-target">
          <div class="fw-sd-eyebrow" style="margin-bottom:12px">有效专注比例</div>
          <div class="fw-sd-target-row"><span>实际</span><b>${pct(st.effectiveRatio)}</b></div>
          <div class="fw-sd-target-bar">
            <i style="width:${(st.effectiveRatio * 100).toFixed(1)}%"></i>
            <em style="left:${(session.focusTarget * 100).toFixed(1)}%"></em>
          </div>
          <div class="fw-sd-target-row"><span>目标</span><b style="font-size:19px;color:#7f847f">${pct(session.focusTarget)}</b></div>
          <div class="fw-sd-target-note">有效专注比例 = 凝神时间 ÷ 有效采集时间。本版本中分神按 0 计，不做加权；专注练习时间不计入分母。</div>
        </div>
      </div>

      <div class="fw-blk" style="margin-top:56px">
        <div class="fw-blk-head">
          <h3 class="fw-blk-title">完整状态时间线</h3>
          <div class="fw-blk-note">${fmtClock(session.start)} – ${fmtClock(session.end)}</div>
        </div>
        <div class="fw-tl-wrap"><div class="fw-tl-holder" id="fwSdTl"></div></div>
      </div>

      <div class="fw-sd-stats">
        <div class="fw-sd-stat"><span>最长连续凝神</span><b>${fmtMS(st.longestDeep)}</b></div>
        <div class="fw-sd-stat"><span>神驰片段</span><b>${st.dispersedEpisodes}<small>次</small></b></div>
        <div class="fw-sd-stat"><span>最长神驰</span><b>${fmtMS(st.longestDispersed)}</b></div>
        <div class="fw-sd-stat"><span>专注练习</span><b>${st.practiceSessions}<small>次</small></b></div>
        <div class="fw-sd-stat"><span>有效信号覆盖</span><b>${pct(cov)}</b></div>
      </div>

      <div class="fw-sd-fold" id="fwSdFold">
        <div class="fw-sd-fold-head" role="button" tabindex="0" aria-expanded="false">
          <div class="fw-sd-fold-name">数据依据</div>
          <div class="fw-sd-fold-hint"><span>设备信号覆盖率与质量</span><i></i></div>
        </div>
        <div class="fw-sd-fold-body">
          <div class="fw-sd-sig">
            <div>
              <span>心率信号覆盖</span>
              <b>${hrCoverage.toFixed(0)}%</b>
              <em>仅用于状态判定的信号质量核对</em>
            </div>
            <div>
              <span>呼吸信号覆盖</span>
              <b>${respCoverage.toFixed(0)}%</b>
              <em>仅用于状态判定的信号质量核对</em>
            </div>
            <div>
              <span>眼动信号覆盖</span>
              <b>${eyeCoverage.toFixed(0)}%</b>
              <em>仅用于状态判定的信号质量核对</em>
            </div>
          </div>
          <div class="fw-sd-quality">
            <span>设备质量</span>
            <div class="fw-sd-qbar"><i style="width:${(cov * 100).toFixed(0)}%"></i></div>
            <b>${cov >= 0.95 ? '良好' : cov >= 0.90 ? '可用' : '一般'}</b>
          </div>
          <div class="fw-sd-disclaimer">
            上述覆盖率为信号可用的时间占本次采集时间的比例，用于判断本页统计的可信范围。本页不展示任何原始生理数值，也不基于生理信号给出结论。
          </div>
        </div>
      </div>`;

    TL().renderFull(body.querySelector('#fwSdTl'), session);

    const fold = body.querySelector('#fwSdFold');
    const head = fold.querySelector('.fw-sd-fold-head');
    const toggle = () => {
      const on = fold.classList.toggle('fw-on');
      head.setAttribute('aria-expanded', String(on));
    };
    head.addEventListener('click', toggle);
    head.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });

    ov.classList.add('fw-open');
    document.body.style.overflow = 'hidden';
    ov.scrollTop = 0;
  }

  /* ------------------------------------------------------- bloom ↔ record */

  /* Called when a bloom on the pond is clicked. `index` is the 0-based bloom
   * order, which maps onto the day's completed sessions in chronological order
   * — bloom N is session N. */
  function selectSession(index, options = {}) {
    if (!root) mount();
    if (!root) return false;
    if (view !== 'day') setView('day');
    const rows = root.querySelectorAll('.fw-session');
    rows.forEach(r => r.classList.remove('fw-hot'));
    const row = rows[index];
    if (!row) return false;
    row.classList.add('fw-hot');
    currentDayTimeline?.highlightSession(row.dataset.sessionId);
    if (options.scroll !== false) {
      /* The row must be laid out and visible before scrollIntoView means
       * anything; on a page switch that is one frame away. */
      waitForVisible(() => row.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    }
    if (options.open) {
      const session = (window.FocusWaveArchive.daySessions || [])[index];
      if (session) waitForVisible(() => openDetail(session));
    }
    return true;
  }

  /* Called when a record row is hovered/clicked so the pond can light the
   * matching bloom. Records now live on their own page, so pointing at one has
   * to bring the pond back into view — otherwise the ring would be drawn on a
   * page the user cannot see. index < 0 means "clear the ring", which needs no
   * navigation. */
  function emitBloomHighlight(index) {
    window.dispatchEvent(new CustomEvent('focuswave:bloom-highlight', { detail: { index } }));
    if (index < 0) return;
    if (typeof window.showPage === 'function') window.showPage('insights');
    window.FocusWaveInkPondV3?.mount?.();
  }

  /* ------------------------------------------------------------------ view */

  function setView(next) {
    if (next === view) return;
    view = next;
    root.querySelectorAll('[data-arch-view]').forEach(b => {
      b.setAttribute('aria-selected', String(b.dataset.archView === next));
    });
    root.querySelectorAll('[data-arch-panel]').forEach(p => {
      p.classList.toggle('fw-active', p.dataset.archPanel === next);
    });
    renderActive();
    window.dispatchEvent(new CustomEvent('focuswave:archive-view', { detail: { view: next } }));
  }

  function renderActive() {
    if (view === 'day') renderDay();
    else if (view === 'week') renderWeek();
    else renderMonth();
  }

  function mount() {
    const page = document.querySelector('#page-archive');
    if (!page) return false;

    let shell = page.querySelector('#fwFocusArchive');
    if (!shell) {
      shell = document.createElement('section');
      shell.id = 'fwFocusArchive';
      shell.className = 'fw-arch';
      shell.innerHTML = markup();
      page.appendChild(shell);

      root = shell;
      root.querySelectorAll('[data-arch-view]').forEach(btn => {
        btn.addEventListener('click', () => setView(btn.dataset.archView));
      });
    } else {
      root = shell;
    }
    renderActive();
    return true;
  }

  /* The archive page is display:none until the rail switches to it. Rendering
   * into a hidden container is fine, but scrollIntoView needs a visible target,
   * so selectSession() waits for this before positioning. */
  function isVisible() {
    const page = document.querySelector('#page-archive');
    return !!page && page.classList.contains('active');
  }

  function waitForVisible(cb, tries = 24) {
    if (isVisible()) { cb(); return; }
    if (tries <= 0) return;
    requestAnimationFrame(() => waitForVisible(cb, tries - 1));
  }

  /* Switch to the archive page through the app's own router so the rail's
   * active state follows. showPage is redefined by navigation-controller.js,
   * so always resolve it at call time rather than caching it. */
  function goToArchivePage() {
    visible = true;
    if (typeof window.showPage === 'function') window.showPage('archive');
    else document.querySelector('#page-archive')?.classList.add('active');
    mount();
  }

  window.FocusWaveArchive = {
    mount, selectSession, setView, openDetail, goToArchivePage, waitForVisible,
    get view() { return view; },
    get daySessions() { return this._daySessions || []; },
    set daySessions(v) { this._daySessions = v; },
    reopen() { if (root) renderActive(); }
  };

  /* The pond dispatches this when a bloom is clicked. The bloom lives on the
   * 洞察 page, so we first route to the archive page, then position. */
  window.addEventListener('focuswave:bloom-selected', e => {
    const index = e.detail?.index;
    if (typeof index !== 'number') return;
    goToArchivePage();
    waitForVisible(() => selectSession(index));
  });

  function boot() {
    [0, 120, 380, 900, 1800].forEach(d => setTimeout(mount, d));
    document.addEventListener('click', e => {
      if (e.target?.closest?.('[data-nav="archive"],[data-go="archive"]')) {
        visible = true;
        setTimeout(mount, 0);
        setTimeout(mount, 260);
      }
    }, { capture: true });
    window.addEventListener('pageshow', mount, { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
