/* FocusWave long-term insight garden v2
 * A dedicated physical karesansui scene for longitudinal reflection.
 * Other FocusWave pages keep the existing 2D line language.
 */
(() => {
  const HISTORY = [
    {date:'8/10',task:'阅读',duration:38,focus:61,stable:54,recovery:58},
    {date:'8/11',task:'写作',duration:45,focus:64,stable:57,recovery:62},
    {date:'8/12',task:'阅读',duration:52,focus:66,stable:60,recovery:65},
    {date:'8/13',task:'编程',duration:41,focus:72,stable:68,recovery:71},
    {date:'8/14',task:'写作',duration:58,focus:75,stable:71,recovery:76},
    {date:'8/15',task:'阅读',duration:34,focus:68,stable:62,recovery:67},
    {date:'8/17',task:'编程',duration:46,focus:63,stable:58,recovery:61},
    {date:'8/18',task:'阅读',duration:60,focus:66,stable:63,recovery:72},
    {date:'8/19',task:'写作',duration:49,focus:77,stable:73,recovery:78},
    {date:'8/20',task:'阅读',duration:55,focus:80,stable:76,recovery:82},
    {date:'8/21',task:'编程',duration:43,focus:76,stable:70,recovery:74},
    {date:'8/23',task:'阅读',duration:45,focus:79,stable:75,recovery:81},
    {date:'8/24',task:'写作',duration:58,focus:83,stable:79,recovery:85},
    {date:'8/25',task:'阅读',duration:42,focus:81,stable:77,recovery:83}
  ];

  const PATTERNS = {
    evening: {
      title:'傍晚更容易进入稳定段',
      sub:'18:00–21:00 的可比阅读 / 写作 session',
      summary:'在当前个人历史中，傍晚时段的稳定片段比例更高，进入稳定状态所需时间也更短。',
      rows:[['18:00–21:00','稳定片段 74%','进入稳定段 6.8 min'],['其它时段','稳定片段 62%','进入稳定段 10.9 min']]
    },
    duration: {
      title:'45–60 分钟更适合你',
      sub:'按 session 时长比较后半程恢复表现',
      summary:'45–60 分钟 session 的后半程恢复效率更高，稳定状态也更容易持续。',
      rows:[['45–60 min','恢复效率 81%','后半段稳定 76%'],['<45 min','恢复效率 64%','后半段稳定 60%']]
    }
  };

  let gardenCanvas, userCanvas, detailOverlay;
  let editing = false;
  let tool = 'move';
  let dragging = null;
  let activeStroke = null;
  let rewardCount = 4;
  let strokes = [];

  const stones = [
    {id:'s1',x:.17,y:.22,size:82,shape:0,rotation:-5},
    {id:'s2',x:.13,y:.58,size:34,shape:2,rotation:4},
    {id:'s3',x:.53,y:.74,size:74,shape:1,rotation:-3},
    {id:'s4',x:.86,y:.60,size:68,shape:3,rotation:7},
    {id:'s5',x:.78,y:.27,size:32,shape:2,rotation:-8}
  ];

  const SHAPES = [
    'polygon(17% 25%,34% 7%,67% 12%,88% 37%,81% 75%,56% 94%,20% 85%,5% 55%)',
    'polygon(22% 15%,57% 3%,87% 31%,93% 64%,69% 92%,31% 96%,7% 69%,5% 38%)',
    'polygon(30% 5%,68% 12%,91% 45%,78% 83%,45% 96%,12% 78%,4% 38%)',
    'polygon(24% 11%,59% 4%,88% 30%,94% 63%,71% 92%,33% 95%,7% 69%,3% 39%)'
  ];

  function injectStyles() {
    if (document.querySelector('style[data-focuswave-garden-v2]')) return;
    const style = document.createElement('style');
    style.dataset.focuswaveGardenV2 = 'true';
    style.textContent = `
      body.fw-insights-active{background:#f7f6f2}
      body.fw-insights-active .rail{display:none!important}
      body.fw-insights-active .app{display:block}
      body.fw-insights-active .main{grid-column:1}
      #page-insights{padding:0!important;background:#f7f6f2;color:#30332f;min-height:100vh}
      #page-insights .section-title,#page-insights .section-sub,#page-insights>.topbar,#page-insights>.insight-grid{display:none!important}
      .fw-i-shell{min-height:100vh;background:#f7f6f2}
      .fw-i-top{height:98px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 42px}
      .fw-i-brand{display:inline-flex;align-items:center;gap:14px;border:0;background:transparent;padding:0;cursor:pointer;font-family:Georgia,serif;font-size:18px;color:#313632;justify-self:start}
      .fw-wave-mark{width:32px;height:16px;position:relative;display:block}
      .fw-wave-mark:before,.fw-wave-mark:after,.fw-wave-mark i{content:'';position:absolute;left:0;width:31px;height:8px;border-top:1.4px solid #43524c;border-radius:50%}
      .fw-wave-mark:before{top:0}.fw-wave-mark i{top:5px;left:4px;width:28px}.fw-wave-mark:after{top:10px;left:1px;width:29px}
      .fw-i-session{display:flex;align-items:center;gap:26px;font-size:12px;color:#454b47;letter-spacing:.035em;justify-self:center;font-variant-numeric:tabular-nums}
      .fw-live{display:inline-flex;align-items:center;gap:7px;color:#6f7772}.fw-live:before{content:'';width:7px;height:7px;border-radius:50%;background:#7d927f}
      .fw-i-actions{justify-self:end;display:flex;gap:14px}
      .fw-icon-btn{width:42px;height:42px;border:1px solid rgba(48,51,47,.10);border-radius:50%;background:rgba(255,255,255,.14);display:grid;place-items:center;cursor:pointer;color:#5c645f;transition:background .18s,border-color .18s}
      .fw-icon-btn:hover{background:rgba(255,255,255,.64);border-color:rgba(48,51,47,.16)}
      .fw-icon-btn svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.45}
      .fw-i-hero{padding:28px 5.4vw 76px}
      .fw-i-heading{display:grid;grid-template-columns:1fr auto;gap:40px;align-items:end;margin:0 0 30px}
      .fw-title-row{display:flex;align-items:baseline;gap:14px}.fw-i-title{font-family:var(--human);font-weight:400;font-size:40px;letter-spacing:.06em;margin:0;color:#2f3531}.fw-title-en{font-family:Georgia,serif;color:#858984;font-size:17px}
      .fw-i-sub{font-family:var(--human);font-size:15px;color:#8a8d88;margin-top:8px;letter-spacing:.03em}
      .fw-reward-block{display:grid;grid-template-columns:auto auto;gap:9px 15px;align-items:end}
      .fw-reward-label{grid-column:1/-1;font-size:11px;color:#858984;letter-spacing:.05em}
      .fw-reward-tray{display:flex;gap:12px;align-items:end;height:38px}
      .fw-mini-stone{width:26px;height:24px;filter:drop-shadow(0 5px 4px rgba(44,45,42,.16));background:linear-gradient(145deg,#9f9f9b 0%,#737671 42%,#4e514d 76%,#92928d 100%);clip-path:polygon(30% 3%,67% 12%,94% 58%,72% 95%,20% 83%,4% 43%)}
      .fw-mini-stone:nth-child(2){width:31px;height:27px;transform:rotate(-4deg)}.fw-mini-stone:nth-child(3){width:27px;height:25px;transform:rotate(4deg)}.fw-mini-stone:nth-child(4){width:28px;height:29px}
      .fw-add-stone{width:38px;height:38px;border-radius:50%;border:1px dashed #b9bbb6;background:transparent;font-size:22px;font-weight:300;color:#8c918b;cursor:pointer}
      .fw-edit-btn{height:39px;border:1px solid rgba(48,51,47,.11);border-radius:12px;background:rgba(255,255,255,.27);padding:0 17px;display:flex;gap:8px;align-items:center;cursor:pointer;color:#6b716c;font-size:12px}.fw-edit-btn svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.5}
      .fw-garden-frame{position:relative;height:min(48vw,520px);min-height:430px;padding:13px;border-radius:6px;background:linear-gradient(180deg,#dedbd4,#d0ccc3);box-shadow:0 19px 30px rgba(45,44,40,.14),0 3px 7px rgba(45,44,40,.09);overflow:visible}
      .fw-garden-inner{position:relative;width:100%;height:100%;overflow:hidden;border:1px solid rgba(102,100,94,.20);background:#f4f4f0;box-shadow:inset 0 0 20px rgba(79,77,70,.08)}
      .fw-garden-inner:after{content:'';position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 16px rgba(57,55,50,.06)}
      #fwGardenCanvas,#fwGardenUserCanvas{position:absolute;inset:0;width:100%;height:100%;display:block}
      #fwGardenUserCanvas{z-index:4;pointer-events:none}
      .fw-stone-layer{position:absolute;inset:0;z-index:5;pointer-events:none}
      .fw-stone{position:absolute;transform:translate(-50%,-50%);pointer-events:auto;filter:drop-shadow(0 11px 8px rgba(39,39,36,.19));transition:filter .18s}
      .fw-stone .body{width:100%;height:100%;clip-path:var(--stone-shape);background:radial-gradient(circle at 31% 23%,rgba(255,255,255,.27),transparent 22%),conic-gradient(from 210deg at 48% 50%,#555955,#7c7d78 18%,#9a9993 32%,#646762 46%,#464a46 62%,#81817c 78%,#5b5e59 100%);position:relative;overflow:hidden}
      .fw-stone .body:before{content:'';position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,.22),transparent 34%,rgba(29,31,29,.18) 70%,transparent);clip-path:polygon(0 0,58% 0,42% 48%,100% 73%,100% 100%,0 100%)}
      .fw-stone .body:after{content:'';position:absolute;inset:8% 10% 12%;border-radius:50%;box-shadow:inset -10px -11px 17px rgba(24,27,24,.14),inset 7px 6px 11px rgba(255,255,255,.10)}
      .fw-editing .fw-stone{cursor:grab}.fw-editing .fw-stone:hover{filter:drop-shadow(0 15px 11px rgba(39,39,36,.23))}.fw-stone.dragging{cursor:grabbing!important;filter:drop-shadow(0 18px 14px rgba(39,39,36,.24));z-index:10}
      .fw-edit-tools{position:absolute;right:-66px;top:50%;transform:translateY(-50%);width:52px;padding:8px 6px;border:1px solid rgba(48,51,47,.10);border-radius:18px;background:rgba(250,249,246,.92);box-shadow:0 10px 26px rgba(48,48,44,.08);display:none;z-index:12}
      .fw-editing .fw-edit-tools{display:flex;flex-direction:column;gap:4px}.fw-tool{height:42px;border:0;border-radius:12px;background:transparent;cursor:pointer;font-size:11px;color:#777d78}.fw-tool.active,.fw-tool:hover{background:#ebece7;color:#414a45}.fw-tool svg{display:block;margin:0 auto 2px;width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.4}
      .fw-garden-help{text-align:center;height:31px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#8c908b;opacity:0;transition:opacity .2s}.fw-editing+.fw-garden-help{opacity:1}
      .fw-stats{margin:34px 0 0;border:1px solid rgba(48,51,47,.08);border-radius:17px;display:grid;grid-template-columns:repeat(4,1fr);min-height:104px;background:rgba(255,255,255,.15)}
      .fw-stat{padding:20px 28px;display:grid;grid-template-columns:1fr auto;align-items:center;border-right:1px solid rgba(48,51,47,.075)}.fw-stat:last-child{border-right:0}.fw-stat-label{font-size:11px;color:#7f847f;margin-bottom:8px}.fw-stat-value{font-family:Georgia,var(--human),serif;font-size:29px;color:#313631;font-weight:400;font-variant-numeric:tabular-nums}.fw-stat-value small{font-family:var(--ui);font-size:11px;color:#747a75;margin-left:5px}.fw-stat-viz{width:76px;height:44px}.fw-stat-bars{display:flex;align-items:end;gap:5px;height:38px}.fw-stat-bars i{width:4px;background:#b9c1b8;display:block}.fw-stat-line svg{width:78px;height:42px;overflow:visible}.fw-stat-pebbles{display:flex;gap:3px;align-items:end}.fw-stat-pebbles i{width:15px;height:14px;background:linear-gradient(145deg,#a3a39f,#676b66);clip-path:polygon(28% 3%,70% 10%,95% 56%,72% 94%,18% 83%,4% 44%);filter:drop-shadow(0 3px 2px rgba(30,32,30,.12))}.fw-stat-pebbles i:nth-child(2){width:22px;height:22px}.fw-quality{display:flex;align-items:center;gap:10px}.fw-quality-ring{width:42px;height:42px;border-radius:50%;background:conic-gradient(#7d9880 0 82%,#e0e2dc 82%);position:relative}.fw-quality-ring:after{content:'';position:absolute;inset:5px;border-radius:50%;background:#f7f6f2}
      .fw-i-quote{text-align:center;font-family:var(--human);font-size:14px;letter-spacing:.09em;color:#8d918c;margin-top:23px}
      .fw-deep{padding:82px 8vw 110px;border-top:1px solid rgba(48,51,47,.065);background:#f8f7f4}
      .fw-deep-head{display:flex;align-items:end;justify-content:space-between;gap:30px;margin-bottom:45px}.fw-deep-title{font-family:var(--human);font-size:31px;font-weight:400;letter-spacing:.05em;margin:0 0 8px}.fw-deep-sub{font-size:12px;color:#888d88}.fw-range{display:flex;gap:7px}.fw-range button{border:1px solid rgba(48,51,47,.09);background:transparent;border-radius:999px;padding:7px 12px;color:#7b817c;font-size:11px;cursor:pointer}.fw-range button.active{background:#e9ebe6;color:#48534d}
      .fw-analysis-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);gap:66px}.fw-chart-block{border-top:1px solid rgba(48,51,47,.10);padding-top:20px}.fw-chart-label{font-size:11px;color:#818681;margin-bottom:16px}.fw-history-chart{width:100%;height:260px;display:block}.fw-pattern-list{border-top:1px solid rgba(48,51,47,.10)}.fw-pattern{padding:23px 30px 23px 0;border-bottom:1px solid rgba(48,51,47,.085);position:relative;cursor:pointer}.fw-pattern h3{font-family:var(--human);font-size:20px;font-weight:400;margin:0 0 8px}.fw-pattern p{font-size:12px;line-height:1.75;color:#818681;margin:0}.fw-pattern:after{content:'→';position:absolute;right:0;top:27px;color:#89908a}.fw-pattern:hover h3{color:#667a6d}
      .fw-detail{position:fixed;inset:0;z-index:80;background:rgba(247,246,242,.98);display:none;overflow:auto}.fw-detail.open{display:block}.fw-detail-shell{max-width:1100px;margin:0 auto;padding:42px 54px 90px}.fw-detail-top{display:flex;justify-content:space-between;align-items:center}.fw-detail-back{border:0;background:transparent;padding:8px 0;border-bottom:1px solid rgba(48,51,47,.16);cursor:pointer;color:#626b65}.fw-detail-hero{margin-top:76px;display:grid;grid-template-columns:.9fr 1.1fr;gap:80px}.fw-detail-hero h2{font-family:var(--human);font-size:40px;font-weight:400;line-height:1.4;margin:12px 0 19px}.fw-detail-summary{font-family:var(--human);font-size:19px;line-height:1.85;color:#58615c}.fw-compare{border-top:1px solid rgba(48,51,47,.10)}.fw-compare-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;padding:19px 0;border-bottom:1px solid rgba(48,51,47,.08);align-items:baseline}.fw-compare-row b{font-family:var(--human);font-size:17px;font-weight:400}.fw-compare-row span{font-size:12px;color:#747a75}.fw-detail-note{font-size:11px;line-height:1.8;color:#8a8e89;margin-top:17px}
      @media(max-width:1050px){.fw-i-top{padding:0 24px}.fw-i-hero{padding-left:4vw;padding-right:4vw}.fw-garden-frame{min-height:380px}.fw-edit-tools{right:10px}.fw-stats{grid-template-columns:1fr 1fr}.fw-stat:nth-child(2){border-right:0}.fw-stat:nth-child(-n+2){border-bottom:1px solid rgba(48,51,47,.075)}.fw-analysis-grid{grid-template-columns:1fr}.fw-detail-hero{grid-template-columns:1fr}.fw-reward-block{display:none}}
      @media(max-width:720px){.fw-i-top{grid-template-columns:1fr auto;height:76px}.fw-i-session{display:none}.fw-i-heading{grid-template-columns:1fr}.fw-i-title{font-size:32px}.fw-garden-frame{height:420px;min-height:0;padding:8px}.fw-stats{grid-template-columns:1fr}.fw-stat{border-right:0;border-bottom:1px solid rgba(48,51,47,.075)}.fw-stat:last-child{border-bottom:0}.fw-deep{padding:60px 24px}.fw-i-hero{padding:22px 20px 60px}.fw-detail-shell{padding:28px 24px 60px}}
    `;
    document.head.appendChild(style);
  }

  function icon(name) {
    const icons = {
      gear:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M19 13.3v-2.6l-2-.7a7.6 7.6 0 0 0-.8-1.9l.9-1.9-1.8-1.8-1.9.9a7.8 7.8 0 0 0-1.9-.8L10.7 2H8.2l-.7 2a7.5 7.5 0 0 0-1.9.8l-1.9-.9-1.8 1.8.9 1.9a7.6 7.6 0 0 0-.8 1.9L0 10.7v2.6l2 .7c.2.7.5 1.3.8 1.9l-.9 1.9 1.8 1.8 1.9-.9c.6.4 1.2.6 1.9.8l.7 2h2.6l.7-2a7.8 7.8 0 0 0 1.9-.8l1.9.9 1.8-1.8-.9-1.9c.4-.6.6-1.2.8-1.9z" transform="translate(1.5 0) scale(.9)"/></svg>',
      user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.6-4.2 2.7-6.3 6.5-6.3s5.9 2.1 6.5 6.3"/></svg>',
      edit:'<svg viewBox="0 0 24 24"><path d="M4 20h4l11-11-4-4L4 16v4zM13.5 6.5l4 4"/></svg>',
      rake:'<svg viewBox="0 0 24 24"><path d="M4 7h11M6 4v6M9 4v6M12 4v6M15 4v6M13 9l7 11"/></svg>',
      move:'<svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/></svg>',
      clear:'<svg viewBox="0 0 24 24"><path d="M7 18h10M8 15l8-8 3 3-8 8H7l-2-2 3-3"/></svg>'
    };
    return icons[name] || '';
  }

  function buildPage() {
    const page = document.querySelector('#page-insights');
    if (!page) return;
    page.innerHTML = `
      <div class="fw-i-shell">
        <header class="fw-i-top">
          <button class="fw-i-brand" id="fwBackToday"><span class="fw-wave-mark"><i></i></span><span>FocusWave</span></button>
          <div class="fw-i-session"><span>SART 任务中</span><span>06:42 / 20:00</span><span class="fw-live">LIVE</span></div>
          <div class="fw-i-actions"><button class="fw-icon-btn" id="fwGoSettings" aria-label="设置">${icon('gear')}</button><button class="fw-icon-btn" aria-label="个人资料">${icon('user')}</button></div>
        </header>
        <main class="fw-i-hero">
          <div class="fw-i-heading">
            <div><div class="fw-title-row"><h1 class="fw-i-title">洞察</h1><span class="fw-title-en">/ Personal Baseline</span></div><div class="fw-i-sub">你的专注基线 · 随时间沉淀的专注轨迹</div></div>
            <div class="fw-reward-block"><div class="fw-reward-label">奖励石头&nbsp; <span id="fwRewardCount">4 / 12</span></div><div class="fw-reward-tray"><i class="fw-mini-stone"></i><i class="fw-mini-stone"></i><i class="fw-mini-stone"></i><i class="fw-mini-stone"></i><button class="fw-add-stone" id="fwAddStone" title="领取并放置新的奖励石头">＋</button></div><button class="fw-edit-btn" id="fwEditGarden">${icon('edit')}<span>编辑庭院</span></button></div>
          </div>
          <div class="fw-garden-frame" id="fwGardenFrame">
            <div class="fw-garden-inner" id="fwGardenInner"><canvas id="fwGardenCanvas"></canvas><canvas id="fwGardenUserCanvas"></canvas><div class="fw-stone-layer" id="fwStoneLayer"></div></div>
            <div class="fw-edit-tools" id="fwEditTools"><button class="fw-tool active" data-tool="move">${icon('move')}移动</button><button class="fw-tool" data-tool="rake">${icon('rake')}耙纹</button><button class="fw-tool" id="fwClearRake">${icon('clear')}整理</button></div>
          </div>
          <div class="fw-garden-help">拖动石头改变庭院布局；切换“耙纹”后可以直接在沙面留下自己的纹路。</div>
          <div class="fw-stats">
            <div class="fw-stat"><div><div class="fw-stat-label">总专注次数</div><div class="fw-stat-value">128 <small>次</small></div></div><div class="fw-stat-viz fw-stat-bars"><i style="height:9px"></i><i style="height:14px"></i><i style="height:19px"></i><i style="height:25px"></i><i style="height:31px"></i><i style="height:38px"></i></div></div>
            <div class="fw-stat"><div><div class="fw-stat-label">连续进步</div><div class="fw-stat-value">18 <small>天</small></div></div><div class="fw-stat-viz fw-stat-line"><svg viewBox="0 0 80 44"><path d="M2 36 C12 29 17 24 25 27 S40 33 48 20 S61 13 68 18 S75 7 79 4" fill="none" stroke="#8da192" stroke-width="1.3"/><circle cx="79" cy="4" r="2" fill="#82988a"/></svg></div></div>
            <div class="fw-stat"><div><div class="fw-stat-label">新增奖励</div><div class="fw-stat-value">3 <small>颗</small></div></div><div class="fw-stat-viz fw-stat-pebbles"><i></i><i></i><i></i></div></div>
            <div class="fw-stat"><div><div class="fw-stat-label">专注时长（本周）</div><div class="fw-stat-value">14 <small>h</small> 32 <small>m</small></div></div><div class="fw-quality"><div class="fw-quality-ring"></div><span style="font-size:12px;color:#767d77">82%</span></div></div>
          </div>
          <div class="fw-i-quote">继续保持，让专注成为你的自然状态。</div>
        </main>
        <section class="fw-deep" id="fwDeepInsights">
          <div class="fw-deep-head"><div><h2 class="fw-deep-title">深入洞察</h2><div class="fw-deep-sub">把庭院背后的长期变化放到第二层查看。</div></div><div class="fw-range"><button class="active">近 14 次</button><button>近 30 天</button><button>全部时间</button></div></div>
          <div class="fw-analysis-grid"><div class="fw-chart-block"><div class="fw-chart-label">个人基线 · Focus Index</div><canvas class="fw-history-chart" id="fwHistoryChart"></canvas></div><div class="fw-pattern-list"><article class="fw-pattern" data-pattern="evening"><h3>傍晚更容易进入稳定段</h3><p>过去两周，可比阅读 / 写作记录中的傍晚时段更稳定。</p></article><article class="fw-pattern" data-pattern="duration"><h3>45–60 分钟更适合你</h3><p>这个时长区间的后半程恢复表现更稳定。</p></article></div></div>
        </section>
      </div>`;
    gardenCanvas = page.querySelector('#fwGardenCanvas');
    userCanvas = page.querySelector('#fwGardenUserCanvas');
    bindPage(page);
    renderStones();
    requestAnimationFrame(() => { drawGarden(); drawUserRakes(); drawHistory(); });
  }

  function sizeCanvas(canvas) {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    const w = Math.max(10, Math.round(r.width * d));
    const h = Math.max(10, Math.round(r.height * d));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return {w,h,d,cssW:r.width,cssH:r.height};
  }

  function seeded(seed) { let x=seed>>>0; return () => ((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296); }

  function drawGarden() {
    if (!gardenCanvas || !document.body.contains(gardenCanvas)) return;
    const {w,h,d} = sizeCanvas(gardenCanvas);
    const ctx = gardenCanvas.getContext('2d');
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = '#f4f4f0'; ctx.fillRect(0,0,w,h);

    const rand = seeded(20260826);
    ctx.fillStyle = 'rgba(98,97,92,.055)';
    const grains = Math.min(2100, Math.floor(w*h/1100));
    for (let i=0;i<grains;i++) {
      const x=rand()*w, y=rand()*h, r=(.25+rand()*.45)*d;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }

    const lineGap = 10*d;
    const lineCount = Math.ceil(h/lineGap)+8;
    ctx.lineCap='round'; ctx.lineJoin='round';
    for (let li=-4; li<lineCount; li++) {
      const baseY = li*lineGap;
      const pts=[];
      const samples=260;
      for (let s=0;s<=samples;s++) {
        const x=s/samples*w;
        let y=baseY + Math.sin(x/w*Math.PI*4.1 + li*.08)*3.0*d + Math.sin(x/w*Math.PI*8.2-li*.035)*1.15*d;
        stones.forEach(st => {
          const sx=st.x*w, sy=st.y*h;
          const dx=x-sx;
          const radius=(st.size*d*.90);
          const influence=Math.exp(-(dx*dx)/(radius*radius*3.8));
          const side=(baseY-sy);
          const ring=Math.sin((Math.abs(side)/(lineGap*.9))+Math.abs(dx)/(lineGap*3.5));
          y += influence * Math.sign(side || 1) * (14*d + st.size*.07*d) + influence*ring*3.2*d;
        });
        pts.push([x,y]);
      }
      ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]+.9*d):ctx.moveTo(p[0],p[1]+.9*d));
      ctx.strokeStyle='rgba(117,115,109,.18)'; ctx.lineWidth=.82*d; ctx.stroke();
      ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]-.65*d):ctx.moveTo(p[0],p[1]-.65*d));
      ctx.strokeStyle='rgba(255,255,255,.80)'; ctx.lineWidth=.75*d; ctx.stroke();
    }

    stones.forEach((st,idx)=>{
      const sx=st.x*w, sy=st.y*h;
      const rings = st.size>45 ? 6 : 4;
      for(let k=1;k<=rings;k++){
        const rx=(st.size*.56+k*10)*d, ry=rx*.62;
        ctx.beginPath();
        for(let i=0;i<=120;i++){
          const a=i/120*Math.PI*2;
          const wobble=1+Math.sin(a*3+idx*.7)*.012;
          const x=sx+Math.cos(a)*rx*wobble, y=sy+Math.sin(a)*ry*wobble;
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }
        ctx.strokeStyle='rgba(109,108,102,.18)';ctx.lineWidth=.8*d;ctx.stroke();
      }
    });
  }

  function renderStones() {
    const layer=document.querySelector('#fwStoneLayer'); if(!layer)return;
    layer.innerHTML='';
    stones.forEach(st=>{
      const el=document.createElement('div');
      el.className='fw-stone'; el.dataset.stoneId=st.id;
      el.style.left=(st.x*100)+'%'; el.style.top=(st.y*100)+'%';
      el.style.width=st.size+'px'; el.style.height=Math.round(st.size*.72)+'px';
      el.style.setProperty('--stone-shape',SHAPES[st.shape%SHAPES.length]);
      el.style.rotate=st.rotation+'deg';
      el.innerHTML='<div class="body"></div>';
      layer.appendChild(el);
    });
  }

  function drawUserRakes() {
    if(!userCanvas)return;
    const {w,h,d,cssW,cssH}=sizeCanvas(userCanvas),ctx=userCanvas.getContext('2d');
    ctx.clearRect(0,0,w,h);
    const sx=w/cssW, sy=h/cssH;
    strokes.forEach(stroke=>{
      for(let offset=-2;offset<=2;offset++){
        ctx.beginPath();
        stroke.forEach((p,i)=>{
          const x=p.x*sx, y=(p.y+offset*4)*sy;
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        });
        ctx.strokeStyle=offset===-2?'rgba(255,255,255,.72)':'rgba(111,110,104,.22)';
        ctx.lineWidth=(offset===-2?.65:.82)*d; ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
      }
    });
  }

  function drawHistory() {
    const canvas=document.querySelector('#fwHistoryChart'); if(!canvas)return;
    const {w,h,d}=sizeCanvas(canvas),ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);
    const pad=24*d;
    ctx.strokeStyle='rgba(48,51,47,.07)';ctx.lineWidth=1;
    for(let i=0;i<4;i++){const y=pad+(h-pad*2)*i/3;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(w-pad,y);ctx.stroke()}
    ctx.beginPath();HISTORY.forEach((item,i)=>{const x=pad+(w-pad*2)*i/(HISTORY.length-1),y=h-pad-(item.focus-50)/40*(h-pad*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.strokeStyle='rgba(112,139,124,.75)';ctx.lineWidth=1.45*d;ctx.stroke();
    HISTORY.forEach((item,i)=>{const x=pad+(w-pad*2)*i/(HISTORY.length-1),y=h-pad-(item.focus-50)/40*(h-pad*2);ctx.beginPath();ctx.arc(x,y,2.1*d,0,Math.PI*2);ctx.fillStyle='#819689';ctx.fill()});
  }

  function bindPage(page) {
    page.querySelector('#fwBackToday')?.addEventListener('click',()=>typeof showPage==='function'&&showPage('today'));
    page.querySelector('#fwGoSettings')?.addEventListener('click',()=>typeof showPage==='function'&&showPage('settings'));
    page.querySelector('#fwEditGarden')?.addEventListener('click',toggleEdit);
    page.querySelector('#fwAddStone')?.addEventListener('click',addRewardStone);
    page.querySelector('#fwEditTools')?.addEventListener('click',e=>{
      const b=e.target.closest('[data-tool]'); if(!b)return;
      tool=b.dataset.tool; page.querySelectorAll('.fw-tool[data-tool]').forEach(x=>x.classList.toggle('active',x===b));
      userCanvas.style.pointerEvents=tool==='rake'?'auto':'none';
    });
    page.querySelector('#fwClearRake')?.addEventListener('click',()=>{strokes=[];drawUserRakes()});
    page.querySelectorAll('.fw-pattern').forEach(el=>el.addEventListener('click',()=>openPattern(el.dataset.pattern)));

    const inner=page.querySelector('#fwGardenInner');
    inner.addEventListener('pointerdown',startStoneDrag);
    window.addEventListener('pointermove',moveStoneDrag);
    window.addEventListener('pointerup',endStoneDrag);
    userCanvas.addEventListener('pointerdown',startRake);
    userCanvas.addEventListener('pointermove',moveRake);
    window.addEventListener('pointerup',endRake);
    window.addEventListener('resize',()=>requestAnimationFrame(()=>{drawGarden();drawUserRakes();drawHistory()}));
  }

  function toggleEdit() {
    editing=!editing;
    const frame=document.querySelector('#fwGardenFrame'); const btn=document.querySelector('#fwEditGarden');
    frame?.classList.toggle('fw-editing',editing);
    if(btn) btn.querySelector('span').textContent=editing?'完成编辑':'编辑庭院';
    userCanvas.style.pointerEvents=editing&&tool==='rake'?'auto':'none';
  }

  function startStoneDrag(ev) {
    if(!editing || tool!=='move')return;
    const el=ev.target.closest('.fw-stone');if(!el)return;
    const st=stones.find(s=>s.id===el.dataset.stoneId); if(!st)return;
    dragging={el,st,pointerId:ev.pointerId}; el.classList.add('dragging'); el.setPointerCapture?.(ev.pointerId); ev.preventDefault();
  }
  function moveStoneDrag(ev) {
    if(!dragging)return;
    const inner=document.querySelector('#fwGardenInner'),r=inner.getBoundingClientRect();
    dragging.st.x=Math.max(.04,Math.min(.96,(ev.clientX-r.left)/r.width));
    dragging.st.y=Math.max(.07,Math.min(.93,(ev.clientY-r.top)/r.height));
    dragging.el.style.left=(dragging.st.x*100)+'%';dragging.el.style.top=(dragging.st.y*100)+'%';
    requestAnimationFrame(drawGarden);
  }
  function endStoneDrag() { if(!dragging)return;dragging.el.classList.remove('dragging');dragging=null; }

  function startRake(ev) {
    if(!editing || tool!=='rake')return;
    const r=userCanvas.getBoundingClientRect();activeStroke=[{x:ev.clientX-r.left,y:ev.clientY-r.top}];strokes.push(activeStroke);userCanvas.setPointerCapture?.(ev.pointerId);ev.preventDefault();
  }
  function moveRake(ev) {
    if(!activeStroke)return;const r=userCanvas.getBoundingClientRect();const p={x:ev.clientX-r.left,y:ev.clientY-r.top};const last=activeStroke[activeStroke.length-1];if(Math.hypot(p.x-last.x,p.y-last.y)>4){activeStroke.push(p);requestAnimationFrame(drawUserRakes)}
  }
  function endRake(){activeStroke=null}

  function addRewardStone() {
    if(rewardCount>=12)return;
    rewardCount++;
    const r=seeded(Date.now()&0xffffffff);const size=38+Math.round(r()*45);
    stones.push({id:'s'+Date.now(),x:.42+r()*.18,y:.38+r()*.25,size,shape:Math.floor(r()*SHAPES.length),rotation:Math.round(-10+r()*20)});
    document.querySelector('#fwRewardCount').textContent=rewardCount+' / 12';
    renderStones();drawGarden();
    if(!editing)toggleEdit();
  }

  function openPattern(key) {
    const data=PATTERNS[key];if(!data)return;
    if(!detailOverlay){detailOverlay=document.createElement('section');detailOverlay.className='fw-detail';detailOverlay.innerHTML='<div class="fw-detail-shell"><div class="fw-detail-top"><button class="fw-detail-back">← 返回洞察</button><div style="font-size:10px;letter-spacing:.12em;color:#8b908b">PATTERN ANALYSIS · PERSONAL BASELINE</div></div><div id="fwDetailBody"></div></div>';document.body.appendChild(detailOverlay);detailOverlay.querySelector('.fw-detail-back').onclick=()=>detailOverlay.classList.remove('open')}
    detailOverlay.querySelector('#fwDetailBody').innerHTML=`<div class="fw-detail-hero"><div><div style="font-size:10px;letter-spacing:.12em;color:#8b908b">RECENT PATTERN</div><h2>${data.title}</h2><div class="fw-detail-summary">${data.summary}</div></div><div><div style="font-size:11px;color:#858a85;margin-bottom:14px">${data.sub}</div><div class="fw-compare">${data.rows.map(r=>`<div class="fw-compare-row"><b>${r[0]}</b><span>${r[1]}</span><span>${r[2]}</span></div>`).join('')}</div><div class="fw-detail-note">这是个人历史中的描述性模式。正式版本会同时显示样本量、波动区间、任务可比性与有效信号覆盖。</div></div></div>`;
    detailOverlay.classList.add('open');
  }

  function syncImmersiveState() {
    const page=document.querySelector('#page-insights');
    document.body.classList.toggle('fw-insights-active',!!page?.classList.contains('active'));
    if(page?.classList.contains('active'))requestAnimationFrame(()=>{drawGarden();drawUserRakes();drawHistory()});
  }

  function init() {
    injectStyles();buildPage();syncImmersiveState();
    const page=document.querySelector('#page-insights');if(page)new MutationObserver(syncImmersiveState).observe(page,{attributes:true,attributeFilter:['class']});
    document.querySelectorAll('[data-nav="insights"],[data-go="insights"]').forEach(el=>el.addEventListener('click',()=>setTimeout(syncImmersiveState,0)));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();