/* FocusWave focus archive data layer v1
 * ---------------------------------------------------------------
 * FROZEN DATA CONTRACT — do not adjust without updating the copy too.
 *
 * The whole archive UI reads from the structures produced here. Keeping the
 * data shape close to what a real inference backend would emit means the mock
 * can later be swapped for a fetch() without touching a single view module.
 *
 * Core definition (frozen, first version):
 *   effectiveFocusRatio = sum(deep) / effectiveSampleTime
 *   where effectiveSampleTime = sum(deep) + sum(drift) + sum(dispersed)
 *   Deep focus ("凝神") counts at full weight; drift ("分神") counts as 0.
 *   No weighting of any kind is applied in v1.
 *
 * State enum (mirrors the live page's state machine):
 *   'deep'     凝神  — attention held on the task
 *   'drift'    分神  — attention has left the task, below the alert threshold
 *   'dispersed'神驰  — sustained loss of task focus, above the alert threshold
 *   'practice' 专注练习 — the user started a 60s breath-anchoring practice
 *
 * Segment shape:
 *   { start: <epoch ms>, end: <epoch ms>, state: <enum>, plannedEnd?: <epoch ms>, practiceId?: <string> }
 * Every segment carries absolute timestamps, so any view can re-slice freely.
 * ---------------------------------------------------------------
 */
(() => {
  if (window.FocusWaveArchiveData) return;

  /* ---------------------------------------------------------------- config */

  /* Segment durations, in seconds. A real backend emits whatever the inference
   * loop produced; these ranges are set so that a reading of the state sequence
   * shows a handful of meaningful stretches rather than constant flicker.
   *
   * This matters for the timeline: the day ribbon spans ~10 hours across ~1000
   * px, so a 60s segment is under 2px wide. Attention states in practice run for
   * minutes at a time, and the ribbon only reads as a sleep-stage chart if the
   * segments are wide enough to see. Deep focus is the longest-running state. */
  const STATE_SECONDS = {
    deep: [150, 400],
    drift: [50, 130],
    dispersed: [70, 150]
  };

  /* A "dispersed episode" is continuous dispersed time reaching this threshold.
   * The timeline annotates it, and the day counter counts it. */
  const DISPERSED_EPISODE_SECONDS = 60;

  /* A 60s practice is offered when a dispersed episode crosses this. */
  const PRACTICE_TRIGGER_SECONDS = 90;
  const PRACTICE_DURATION_SECONDS = 60;

  const FOCUS_TARGET = 0.80;

  /* deterministic PRNG so the mock is stable across reloads */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const DAY = 86400000;
  const MIN = 60000;

  function dayKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function startOfDay(date) {
    const d = new Date(date); d.setHours(0, 0, 0, 0); return d;
  }
  function addDays(date, n) {
    return new Date(date.getTime() + n * DAY);
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* --------------------------------------------------------- session build */

  /* Task names are the kind of work the product is actually used for. Kept
   * short and neutral — no productivity-blog language. */
  const TASKS = ['阅读论文', '写作', '编程', '文献整理', '数据分析', '课程笔记'];

  /* Build one session: a contiguous wall-clock block of alternating states.
   * A session always opens and closes on deep focus, because a reward bloom is
   * only granted for a completed focus task. */
  function buildSession(seed, startEpoch, task, plannedMinutes) {
    const rnd = mulberry32(seed);
    const pick = (range) => range[0] + rnd() * (range[1] - range[0]);

    const totalSeconds = Math.round(plannedMinutes * 60);
    /* Effective coverage: the share of the block the device actually sampled.
     * 0.90–0.98 for most sessions; the gap is reported only in 数据依据. */
    const coverage = 0.90 + rnd() * 0.08;
    const sampledSeconds = Math.round(totalSeconds * coverage);

    const segments = [];
    let cursor = startEpoch;
    let remaining = sampledSeconds;
    let lastState = 'deep';
    let practiceCount = 0;
    /* Sessions get slightly less stable in the back half — this is the pattern
     * the weekly copy describes, so the mock has to actually contain it. */
    const midpoint = startEpoch + (sampledSeconds * 1000) / 2;

    while (remaining > 8) {
      let state;
      const progress = 1 - remaining / sampledSeconds;
      const lateRoughness = progress > 0.5 ? 1 : 0;
      const roll = rnd();

      if (lastState === 'deep') {
        state = roll < 0.42 + lateRoughness * 0.09 ? 'drift'
          : roll < 0.52 + lateRoughness * 0.12 ? 'dispersed'
            : 'deep';
      } else if (lastState === 'drift') {
        state = roll < 0.56 ? 'deep' : roll < 0.78 ? 'drift' : 'dispersed';
      } else {
        /* Coming out of a dispersed episode, the user usually returns to the
         * task — sometimes straight to deep, sometimes via a practice. */
        state = roll < 0.52 ? 'deep' : roll < 0.74 ? 'drift' : 'dispersed';
      }

      let seconds = Math.round(pick(STATE_SECONDS[state]));
      seconds = Math.min(seconds, remaining);
      seconds = Math.max(seconds, 6);

      const start = cursor;
      const end = cursor + seconds * 1000;
      const seg = { start, end, state };

      /* Attach a practice segment after a long enough dispersed episode. Only
       * when the episode is late enough to be worth recovering from. */
      if (
        state === 'dispersed' &&
        seconds >= PRACTICE_TRIGGER_SECONDS &&
        practiceCount < 2 &&
        remaining > PRACTICE_DURATION_SECONDS + 30 &&
        rnd() < 0.72
      ) {
        const pStart = end;
        const pEnd = pStart + PRACTICE_DURATION_SECONDS * 1000;
        seg.practiceFollows = true;
        segments.push(seg);
        /* A practice is a recovery attempt, not a guarantee. Most of the time
         * the user settles back into deep focus; sometimes attention goes back
         * to drifting and the episode resumes. Both outcomes exist in the data,
         * so the closure analysis is a real fraction rather than a clean 100%. */
        const recovers = rnd() < 0.78;
        const settleSeconds = Math.round(20 + rnd() * 60);
        segments.push({
          start: pStart,
          end: pEnd,
          state: 'practice',
          practiceId: `p-${seed}-${practiceCount}`,
          returnsToDeepAfterSeconds: recovers ? settleSeconds : null
        });
        practiceCount++;
        if (recovers) {
          segments.push({ start: pEnd, end: pEnd + settleSeconds * 1000, state: 'deep' });
          cursor = pEnd + settleSeconds * 1000;
          remaining -= seconds + PRACTICE_DURATION_SECONDS + settleSeconds;
          lastState = 'deep';
        } else {
          const backSeconds = Math.round(35 + rnd() * 70);
          segments.push({ start: pEnd, end: pEnd + backSeconds * 1000, state: rnd() < 0.5 ? 'drift' : 'dispersed' });
          cursor = pEnd + backSeconds * 1000;
          remaining -= seconds + PRACTICE_DURATION_SECONDS + backSeconds;
          lastState = 'drift';
        }
        continue;
      }

      segments.push(seg);
      cursor = end;
      remaining -= seconds;
      lastState = state;

      if (progress > 0.86 && remaining < 90) break;
    }

    /* Normalise: make sure the very first stretch is deep focus (the task was
     * actually started). The tail is NOT forced — a session that ended in drift
     * should keep that ending, otherwise every practice would look like it led
     * straight back to deep focus. */
    if (segments.length && segments[0].state !== 'deep') {
      segments[0].state = 'deep';
    }
    const merged = [];
    for (const seg of segments) {
      const prev = merged[merged.length - 1];
      if (prev && prev.state === seg.state && !prev.practiceFollows && seg.state !== 'practice') {
        prev.end = seg.end;
        prev.plannedEnd = seg.plannedEnd ?? prev.plannedEnd;
      } else {
        merged.push({ ...seg });
      }
    }

    const session = {
      id: `s-${seed}`,
      task,
      start: merged[0].start,
      end: merged[merged.length - 1].end,
      coverage,
      plannedMinutes,
      segments: merged
    };
    const stats = sessionStats(session);
    session.stats = stats;
    session.focusTarget = FOCUS_TARGET;
    /* The reward rule: a bloom is granted for a completed focus task. The mock
     * withholds it when effective focus collapsed, so the archive never shows a
     * bloom next to a session that would not have earned one. */
    session.earned = stats.effectiveRatio >= 0.45;
    return session;
  }

  /* ------------------------------------------------------------- statistics */

  function sessionStats(session) {
    const sec = (ms) => Math.round(ms / 1000);
    let deep = 0, drift = 0, dispersed = 0, practice = 0;
    let longestDeep = 0;
    let dispersedEpisodes = 0;
    let longestDispersed = 0;
    let practiceSessions = 0;

    for (const seg of session.segments) {
      const d = sec(seg.end - seg.start);
      if (seg.state === 'deep') deep += d;
      else if (seg.state === 'drift') drift += d;
      else if (seg.state === 'dispersed') {
        dispersed += d;
        longestDispersed = Math.max(longestDispersed, d);
        /* A dispersed episode counts once per contiguous run that reaches the
         * threshold. Adjacent dispersed runs are merged upstream, so counting
         * per segment is equivalent to counting per episode. */
        if (d >= DISPERSED_EPISODE_SECONDS) dispersedEpisodes++;
      } else if (seg.state === 'practice') {
        practice += d;
        practiceSessions++;
      }
    }

    /* Longest run of consecutive deep time, walking the merged sequence. */
    let run = 0;
    for (const seg of session.segments) {
      if (seg.state === 'deep') {
        run += sec(seg.end - seg.start);
        longestDeep = Math.max(longestDeep, run);
      } else {
        run = 0;
      }
    }

    const effectiveSampleTime = deep + drift + dispersed;
    const effectiveRatio = effectiveSampleTime > 0 ? deep / effectiveSampleTime : 0;

    return {
      durationSeconds: sec(session.end - session.start),
      effectiveSampleTime,
      deep, drift, dispersed, practice,
      effectiveRatio,
      longestDeep,
      longestDispersed,
      dispersedEpisodes,
      practiceSessions
    };
  }

  /* -------------------------------------------------------------- mock data */

  /* A day is a handful of sessions in realistic wall-clock slots. Sessions are
   * only generated for days the user "worked", so the calendar has texture. */
  function buildDay(date, seedBase, options = {}) {
    const rnd = mulberry32(seedBase);
    const base = startOfDay(date);
    /* Weekends are lighter but not empty — no streak logic, just fewer blocks. */
    const weekend = [0, 6].includes(base.getDay());
    const sessionCount = options.rich
      ? 4
      : weekend
        ? 1 + Math.floor(rnd() * 2)
        : 3 + Math.floor(rnd() * 2);

    /* With four sessions the day needs a wider span than the default slot list,
     * so the timeline shows a morning block, an afternoon block and an evening
     * block with real gaps between them. */
    const slots = options.rich
      ? [8, 11, 14, 19]
      : weekend ? [10, 15] : [9, 10, 14, 16, 19, 20];
    const plannedPool = options.rich ? [30, 45, 60, 45] : [30, 45, 45, 50, 60];
    const sessions = [];
    for (let i = 0; i < sessionCount; i++) {
      const hour = slots[i % slots.length] + Math.floor(rnd() * 2);
      const minute = Math.floor(rnd() * 50);
      const startEpoch = base.getTime() + hour * 3600000 + minute * 60000;
      const planned = plannedPool[i % plannedPool.length];
      /* Walk the task list with a per-day offset so a single day never repeats
       * a task name — the archive reads as four distinct pieces of work. */
      const task = TASKS[(seedBase + i) % TASKS.length];
      const session = buildSession(seedBase * 100 + i, startEpoch, task, planned);
      sessions.push(session);
    }
    sessions.sort((a, b) => a.start - b.start);
    return sessions;
  }

  /* The most recent day is the demo's landing view, so give it a full, varied
   * load regardless of weekday — the brief's own example shows four completed
   * tasks. Earlier days keep the weekday/weekend rhythm. */
  const TODAY = startOfDay(new Date());
  const HISTORY_DAYS = 28;

  const days = [];
  for (let offset = HISTORY_DAYS - 1; offset >= 0; offset--) {
    const date = addDays(TODAY, -offset);
    const seedBase = 1000 + offset * 7;
    const sessions = buildDay(date, seedBase, { rich: offset === 0 });
    /* Leave two days empty so the calendar is not a solid block of ink. */
    const empty = offset === 9 || offset === 21;
    days.push({
      date,
      key: dayKey(date),
      sessions: empty ? [] : sessions
    });
  }

  const dayIndex = new Map(days.map((d, i) => [d.key, i]));
  function getDay(date) {
    const key = dayKey(date instanceof Date ? date : new Date(date));
    return days[dayIndex.get(key)] || { date: startOfDay(new Date(date)), key, sessions: [] };
  }
  function today() { return days[days.length - 1]; }

  /* ------------------------------------------------------------- aggregation */

  /* Day aggregate — powers 本日总览. The four/five metrics in the brief map
   * one-to-one onto these fields. */
  function aggregateDay(day) {
    const sessions = day.sessions;
    let deep = 0, drift = 0, dispersed = 0, practice = 0, coverage = 0;
    let dispersedEpisodes = 0, practiceSessions = 0, planMinutes = 0;

    for (const s of sessions) {
      deep += s.stats.deep;
      drift += s.stats.drift;
      dispersed += s.stats.dispersed;
      practice += s.stats.practice;
      coverage += s.coverage;
      dispersedEpisodes += s.stats.dispersedEpisodes;
      practiceSessions += s.stats.practiceSessions;
      planMinutes += s.plannedMinutes;
    }

    const sampled = deep + drift + dispersed;
    return {
      key: day.key,
      date: day.date,
      sessions,
      sessionCount: sessions.length,
      deepSeconds: deep,
      driftSeconds: drift,
      dispersedSeconds: dispersed,
      practiceSeconds: practice,
      effectiveSampleTime: sampled,
      effectiveRatio: sampled > 0 ? deep / sampled : 0,
      focusTarget: FOCUS_TARGET,
      dispersedEpisodes,
      practiceSessions,
      /* 专注时长 is the sampled block length — the time the device actually
       * watched attention, which is what the ratio is computed over. */
      focusSeconds: sampled,
      coverage: sessions.length ? coverage / sessions.length : 0
    };
  }

  /* Week aggregate. Weeks run Monday–Sunday, which is how a Chinese user reads
   * a calendar; "本周" is the week containing the requested date. */
  function startOfWeek(date) {
    const d = startOfDay(date);
    const shift = (d.getDay() + 6) % 7;
    return addDays(d, -shift);
  }

  function weekDays(date) {
    const start = startOfWeek(date);
    return Array.from({ length: 7 }, (_, i) => getDay(addDays(start, i)));
  }

  function aggregateRange(list) {
    let deep = 0, drift = 0, dispersed = 0, practice = 0;
    let sessions = 0, dispersedEpisodes = 0, practiceSessions = 0;
    for (const day of list) {
      const a = aggregateDay(day);
      deep += a.deepSeconds; drift += a.driftSeconds;
      dispersed += a.dispersedSeconds; practice += a.practiceSeconds;
      sessions += a.sessionCount;
      dispersedEpisodes += a.dispersedEpisodes;
      practiceSessions += a.practiceSessions;
    }
    const sampled = deep + drift + dispersed;
    return {
      days: list,
      deepSeconds: deep,
      effectiveSampleTime: sampled,
      effectiveRatio: sampled > 0 ? deep / sampled : 0,
      sessionCount: sessions,
      practiceSessions,
      dispersedEpisodes
    };
  }

  /* -------------------------------------------------------- derived patterns */

  /* Every string here is a factual description of what the mock data contains.
   * No causal claims, no streaks, no praise. If a number is computed, the copy
   * says what it is computed over. */
  function weekInsights(date) {
    const thisWeek = weekDays(date);
    const prevWeek = weekDays(addDays(startOfWeek(date), -7));
    const cur = aggregateRange(thisWeek);
    const prev = aggregateRange(prevWeek);

    const delta = cur.effectiveRatio - prev.effectiveRatio;

    /* Which sessions and which wall-clock hours held focus best. */
    const hourBuckets = new Map();
    for (const day of thisWeek) {
      for (const s of day.sessions) {
        const hour = new Date(s.start).getHours();
        const bucket = `${String(hour).padStart(2, '0')}:00–${String(hour + 1).padStart(2, '0')}:00`;
        const entry = hourBuckets.get(bucket) || { deep: 0, total: 0, n: 0 };
        entry.deep += s.stats.deep;
        entry.total += s.stats.effectiveSampleTime;
        entry.n++;
        hourBuckets.set(bucket, entry);
      }
    }
    let bestBucket = null;
    for (const [bucket, e] of hourBuckets) {
      const ratio = e.total > 0 ? e.deep / e.total : 0;
      if (!bestBucket || ratio > bestBucket.ratio) bestBucket = { bucket, ratio };
    }

    /* Long vs short sessions, back half only. */
    const longBack = [], shortBack = [];
    for (const day of thisWeek) {
      for (const s of day.sessions) {
        const half = s.start + (s.end - s.start) / 2;
        let backDeep = 0, backTotal = 0;
        for (const seg of s.segments) {
          if (seg.end <= half) continue;
          const overlap = Math.max(0, seg.end - Math.max(seg.start, half));
          const secs = overlap / 1000;
          if (seg.state === 'practice') continue;
          backTotal += secs;
          if (seg.state === 'deep') backDeep += secs;
        }
        if (backTotal < 60) continue;
        const ratio = backDeep / backTotal;
        (s.plannedMinutes >= 45 ? longBack : shortBack).push(ratio);
      }
    }
    const mean = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

    /* Practice closure: of the practices taken, how many were followed by a
     * return to deep focus within 5 minutes. */
    let practices = 0, returned = 0;
    for (const day of thisWeek) {
      for (const s of day.sessions) {
        for (let i = 0; i < s.segments.length; i++) {
          const seg = s.segments[i];
          if (seg.state !== 'practice') continue;
          practices++;
          const after = s.segments.slice(i + 1);
          const nextDeep = after.find(x => x.state === 'deep');
          if (nextDeep && nextDeep.start - seg.end <= 5 * MIN) returned++;
        }
      }
    }

    const lines = [];
    lines.push({
      text: `本周有效专注比例 ${(cur.effectiveRatio * 100).toFixed(0)}%，较上周 ${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(0)}%`,
      note: `有效专注比例 = 凝神时间 ÷ 有效采集时间。本周 ${cur.sessionCount} 次，上周 ${prev.sessionCount} 次。`
    });
    if (bestBucket) {
      lines.push({
        text: `${bestBucket.bucket} 的有效专注比例最高（${(bestBucket.ratio * 100).toFixed(0)}%）`,
        note: `按开始时间落在该小时内的 ${hourBuckets.get(bestBucket.bucket).n} 次记录计算。`
      });
    }
    if (longBack.length && shortBack.length) {
      const l = mean(longBack), sh = mean(shortBack);
      lines.push({
        text: l < sh
          ? `45 分钟以上任务的记录中，后半段有效专注比例平均 ${(l * 100).toFixed(0)}%，低于更短任务的 ${(sh * 100).toFixed(0)}%`
          : `45 分钟以上任务的记录中，后半段有效专注比例平均 ${(l * 100).toFixed(0)}%，高于更短任务的 ${(sh * 100).toFixed(0)}%`,
        note: `仅比较后半段。长任务 ${longBack.length} 次，短任务 ${shortBack.length} 次。`
      });
    }
    if (practices) {
      lines.push({
        text: `${practices} 次专注练习中，有 ${returned} 次在练习结束后 5 分钟内重新进入凝神`,
        note: '统计练习结束到下一段凝神开始的时间。'
      });
    }
    return { current: cur, previous: prev, delta, lines };
  }

  /* Month: per-day minutes for the ink calendar, plus a weekly trend and an
   * hour-of-day rhythm. */
  function monthView(date) {
    const end = startOfDay(date);
    const start = addDays(end, -27);
    const list = [];
    for (let i = 0; i < 28; i++) list.push(getDay(addDays(start, i)));

    const cells = list.map(day => {
      const a = aggregateDay(day);
      return {
        key: day.key,
        date: day.date,
        minutes: Math.round(a.deepSeconds / 60),
        ratio: a.effectiveRatio,
        sessionCount: a.sessionCount
      };
    });

    /* Weekly aggregation, four points. */
    const weekly = [];
    for (let w = 0; w < 4; w++) {
      const slice = list.slice(w * 7, w * 7 + 7);
      const agg = aggregateRange(slice);
      weekly.push({
        label: `第 ${w + 1} 周`,
        range: `${slice[0].date.getMonth() + 1}/${slice[0].date.getDate()}–${slice[6].date.getMonth() + 1}/${slice[6].date.getDate()}`,
        ratio: agg.effectiveRatio,
        minutes: Math.round(agg.deepSeconds / 60),
        sessionCount: agg.sessionCount
      });
    }

    /* Hour-of-day rhythm, 6:00–21:00. */
    const rhythm = [];
    for (let h = 6; h <= 21; h++) rhythm.push({ hour: h, deep: 0, total: 0, n: 0 });
    for (const day of list) {
      for (const s of day.sessions) {
        const h = new Date(s.start).getHours();
        if (h < 6 || h > 21) continue;
        const slot = rhythm[h - 6];
        slot.deep += s.stats.deep;
        slot.total += s.stats.effectiveSampleTime;
        slot.n++;
      }
    }
    for (const slot of rhythm) slot.ratio = slot.total > 0 ? slot.deep / slot.total : null;

    /* Best 2-hour window with enough samples to mean something. */
    let best = null;
    for (let i = 0; i < rhythm.length - 1; i++) {
      const a = rhythm[i], b = rhythm[i + 1];
      const total = a.total + b.total;
      if (total < 600) continue;
      const ratio = (a.deep + b.deep) / total;
      if (!best || ratio > best.ratio) best = { from: a.hour, to: b.hour + 1, ratio, n: a.n + b.n };
    }

    return { cells, weekly, rhythm, best, start, end };
  }

  /* State transition counts for the advanced module. Counted across the whole
   * window so the numbers are stable. */
  function transitionStats(days) {
    const pairs = new Map();
    let dispersedToDeep = [], driftToDeep = [];
    for (const day of days) {
      for (const s of day.sessions) {
        const segs = s.segments.filter(x => x.state !== 'practice');
        for (let i = 1; i < segs.length; i++) {
          const from = segs[i - 1].state, to = segs[i].state;
          const key = `${from}→${to}`;
          pairs.set(key, (pairs.get(key) || 0) + 1);
          if (from === 'dispersed' && to === 'deep') dispersedToDeep.push(segs[i].start - segs[i - 1].end);
          if (from === 'drift' && to === 'deep') driftToDeep.push(segs[i].start - segs[i - 1].end);
        }
      }
    }
    return { pairs, dispersedToDeep, driftToDeep };
  }

  window.FocusWaveArchiveData = {
    /* config */
    DISPERSED_EPISODE_SECONDS,
    PRACTICE_DURATION_SECONDS,
    FOCUS_TARGET,
    STATE_LABELS: { deep: '凝神', drift: '分神', dispersed: '神驰', practice: '专注练习' },
    /* access */
    days, today, getDay, dayKey, addDays, startOfDay, startOfWeek, weekDays,
    /* compute */
    aggregateDay, aggregateRange, weekInsights, monthView, transitionStats,
    buildSession, sessionStats
  };
})();
