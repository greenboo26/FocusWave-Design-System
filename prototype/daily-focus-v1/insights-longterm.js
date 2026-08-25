/* FocusWave long-term insights
 * Prototype interaction: long-term karesansui history + drill-down pattern analysis.
 * Production replaces HISTORY with persisted comparable sessions.
 */
(() => {
  const HISTORY = [
    {date:'8/10',task:'阅读',duration:38,focus:61,stable:54,recovery:58,theme:'ocean'},
    {date:'8/11',task:'写作',duration:45,focus:64,stable:57,recovery:62,theme:'mountain'},
    {date:'8/12',task:'阅读',duration:52,focus:66,stable:60,recovery:65,theme:'ocean'},
    {date:'8/13',task:'编程',duration:41,focus:72,stable:68,recovery:71,theme:'incense'},
    {date:'8/14',task:'写作',duration:58,focus:75,stable:71,recovery:76,theme:'mountain'},
    {date:'8/15',task:'阅读',duration:34,focus:68,stable:62,recovery:67,theme:'dusk'},
    {date:'8/17',task:'编程',duration:46,focus:63,stable:58,recovery:61,theme:'incense'},
    {date:'8/18',task:'阅读',duration:60,focus:66,stable:63,recovery:72,theme:'ocean'},
    {date:'8/19',task:'写作',duration:49,focus:77,stable:73,recovery:78,theme:'mountain'},
    {date:'8/20',task:'阅读',duration:55,focus:80,stable:76,recovery:82,theme:'ocean'},
    {date:'8/21',task:'编程',duration:43,focus:76,stable:70,recovery:74,theme:'incense'},
    {date:'8/23',task:'阅读',duration:45,focus:79,stable:75,recovery:81,theme:'dusk'},
    {date:'8/24',task:'写作',duration:58,focus:83,stable:79,recovery:85,theme:'mountain'},
    {date:'8/25',task:'阅读',duration:42,focus:81,stable:77,recovery:83,theme:'ocean'}
  ];

  const PATTERNS = {
    evening: {
      title:'傍晚更容易进入稳定段',
      subtitle:'18:00–21:00 的可比阅读 / 写作 session',
      summary:'在当前模拟历史里，傍晚时段的稳定片段比例整体更高，且进入稳定状态所需时间更短。',
      basis:'比较最近 14 次中的 8 次可比阅读 / 写作记录；按开始时段分为傍晚与其它时段。',
      rows:[['18:00–21:00','稳定片段 74%','进入稳定段 6.8 min'],['其它时段','稳定片段 62%','进入稳定段 10.9 min']],
      note:'这是个人历史模式，不代表因果关系。正式版本会显示样本量、波动区间和数据质量覆盖。'
    },
    duration: {
      title:'45–60 分钟更适合你',
      subtitle:'按 session 时长区间比较后半程恢复表现',
      summary:'当前模拟历史中，45–60 分钟 session 的后半程恢复效率高于更短的 session，且稳定段更容易持续。',
      basis:'把最近 14 次记录按 <45 min 与 45–60 min 分组，比较后半段恢复效率与稳定片段比例。',
      rows:[['45–60 min','恢复效率 81%','后半段稳定 76%'],['<45 min','恢复效率 64%','后半段稳定 60%']],
      note:'正式版本会按任务类型做可比性筛选，避免把阅读、写作、编程直接混在同一个结论里。'
    }
  };

  let metric='stable';
  let selected=HISTORY.length-1;
  let hover=-1;
  let canvas=null;
  let tooltip=null;
  let detailPage=null;

  function injectStyles(){
    if(document.querySelector('style[data-focuswave-longterm-insights]')) return;
    const style=document.createElement('style');
    style.dataset.focuswaveLongtermInsights='true';
    style.textContent=`
      #page-insights .insight-grid{grid-template-columns:minmax(560px,1.25fr) minmax(360px,.75fr);gap:54px;align-items:start}
      #page-insights .trend,#page-insights .notes{padding-top:18px}
      #page-insights .trend svg{display:none}
      .fw-longterm-head{display:flex;justify-content:space-between;align-items:center;gap:22px;margin-bottom:16px}
      .fw-longterm-tabs{display:flex;gap:6px}
      .fw-longterm-tabs button{border:1px solid var(--hair);background:transparent;border-radius:999px;padding:6px 10px;font-size:10px;color:#737d78;cursor:pointer}
      .fw-longterm-tabs button.active{border-color:#8ba096;color:var(--ink);background:rgba(130,153,143,.05)}
      .fw-garden-wrap{position:relative;height:350px;border-bottom:1px solid var(--hair);overflow:hidden}
      .fw-garden-wrap canvas{width:100%;height:100%;display:block;cursor:crosshair}
      .fw-garden-tooltip{position:absolute;pointer-events:none;display:none;min-width:132px;padding:9px 11px;border:1px solid rgba(41,51,47,.10);background:rgba(247,244,237,.94);backdrop-filter:blur(7px);border-radius:12px;font-size:10px;color:#6b746f;line-height:1.6;box-shadow:0 8px 24px rgba(41,51,47,.05)}
      .fw-garden-tooltip b{display:block;font-family:var(--human);font-size:14px;font-weight:400;color:var(--ink);margin-bottom:2px}
      .fw-session-readout{display:grid;grid-template-columns:1.25fr repeat(3,.75fr);gap:18px;padding:17px 0 0;align-items:end}
      .fw-session-readout .context{font-family:var(--human);font-size:17px;line-height:1.45}
      .fw-session-readout span{display:block;font-size:10px;color:var(--muted);margin-bottom:5px}
      .fw-session-readout strong{font-family:var(--ui);font-size:17px;font-weight:400;font-variant-numeric:tabular-nums;color:#45504b}
      #page-insights .notes .eyebrow{margin-bottom:5px}
      #page-insights .note{position:relative;padding:22px 32px 22px 0;cursor:pointer;transition:opacity .16s ease}
      #page-insights .note:hover{opacity:.68}
      #page-insights .note:after{content:'→';position:absolute;right:2px;top:26px;font-size:15px;color:#7f8b85}
      #page-insights .note b{font-size:21px}
      #page-insights .note p{max-width:390px;margin-bottom:9px}
      .fw-note-link{font-size:10px;letter-spacing:.08em;color:#819189}
      .fw-pattern-page{position:fixed;inset:0 0 0 84px;z-index:39;background:var(--paper);overflow:auto;display:none}
      .fw-pattern-page.open{display:block}
      .fw-pattern-shell{max-width:1140px;margin:0 auto;padding:34px 54px 72px}
      .fw-pattern-top{height:46px;display:flex;align-items:center;justify-content:space-between}
      .fw-pattern-hero{margin-top:58px;display:grid;grid-template-columns:.85fr 1.15fr;gap:72px;padding-bottom:40px;border-bottom:1px solid var(--hair)}
      .fw-pattern-hero h1{font-family:var(--human);font-size:42px;font-weight:400;line-height:1.35;margin:10px 0 18px}
      .fw-pattern-hero .summary{font-family:var(--human);font-size:20px;line-height:1.75;color:#4b5751}
      .fw-evidence{padding-top:7px}
      .fw-evidence .label{font-size:10px;letter-spacing:.12em;color:var(--muted);margin-bottom:13px}
      .fw-evidence p{font-size:12px;line-height:1.8;color:#747d78;margin:0 0 20px}
      .fw-compare-row{display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:16px;padding:17px 0;border-top:1px solid var(--hair);align-items:baseline}
      .fw-compare-row:last-of-type{border-bottom:1px solid var(--hair)}
      .fw-compare-row b{font-family:var(--human);font-size:18px;font-weight:400}
      .fw-compare-row span{font-size:12px;color:#65706b}
      .fw-pattern-note{font-size:11px;line-height:1.8;color:var(--muted);margin-top:18px}
      .fw-pattern-viz{margin-top:42px}
      .fw-pattern-viz h2{font-family:var(--human);font-size:27px;font-weight:400;margin:7px 0 20px}
      .fw-pattern-viz canvas{width:100%;height:230px;display:block}
      @media(max-width:1000px){#page-insights .insight-grid{grid-template-columns:1fr}.fw-pattern-page{left:64px}.fw-pattern-hero{grid-template-columns:1fr}.fw-session-readout{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }

  function metricValue(d){return metric==='focus'?d.focus:metric==='recovery'?d.recovery:d.stable}
  function seeded(n){let x=n>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}}
  function sizeCanvas(c){const d=Math.min(devicePixelRatio||1,2),r=c.getBoundingClientRect(),w=Math.max(10,Math.round(r.width*d)),h=Math.max(10,Math.round(r.height*d));if(c.width!==w||c.height!==h){c.width=w;c.height=h}return{w,h,d}}

  function drawGarden(){
    if(!canvas)return;
    const {w,h,d}=sizeCanvas(canvas),ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,w,h);
    const padX=24*d,padY=25*d,plotW=w-padX*2,plotH=h-padY*2;
    const sessionW=plotW/HISTORY.length;
    const lines=25;
    ctx.lineCap='round';ctx.lineJoin='round';

    // subtle chronological baseline: one long field, local session history deforms the rake.
    for(let li=0;li<lines;li++){
      const baseY=padY+(li/(lines-1))*plotH;
      ctx.beginPath();
      const samples=300;
      for(let s=0;s<=samples;s++){
        const x=padX+s/samples*plotW;
        const idx=Math.min(HISTORY.length-1,Math.floor((x-padX)/sessionW));
        const datum=HISTORY[idx];
        const val=metricValue(datum);
        const disorder=(100-val)/100;
        const center=padX+(idx+.5)*sessionW;
        const local=(x-center)/(sessionW*.66);
        const envelope=Math.exp(-local*local*1.7);
        const phase=idx*.79+li*.17;
        const drift=Math.sin((x/plotW)*Math.PI*4.2 + phase)*3.2*d*(.25+disorder);
        const bend=Math.sin(local*Math.PI*1.35 + li*.12 + idx*.4)*envelope*(4+disorder*19)*d;
        const y=baseY+drift+bend;
        s===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.strokeStyle='rgba(111,137,125,.23)';
      ctx.lineWidth=Math.max(.65*d,.85*d);
      ctx.stroke();
    }

    // selected / hover session is a quiet wash, not a chart bar.
    const active=hover>=0?hover:selected;
    if(active>=0){
      const x=padX+active*sessionW;
      const grad=ctx.createLinearGradient(x,0,x+sessionW,0);
      grad.addColorStop(0,'rgba(130,153,143,0)');grad.addColorStop(.5,'rgba(130,153,143,.055)');grad.addColorStop(1,'rgba(130,153,143,0)');
      ctx.fillStyle=grad;ctx.fillRect(x,padY,sessionW,plotH);
      ctx.strokeStyle='rgba(107,133,121,.34)';ctx.lineWidth=.7*d;ctx.beginPath();ctx.moveTo(x+sessionW*.5,padY);ctx.lineTo(x+sessionW*.5,h-padY);ctx.stroke();
    }
  }

  function updateReadout(){
    const root=document.querySelector('#fwSessionReadout');if(!root)return;
    const d=HISTORY[selected];
    root.innerHTML=`<div class="context"><span>选中记录</span>${d.date} · ${d.task} · ${d.duration} min</div><div><span>Focus Index</span><strong>${d.focus}</strong></div><div><span>稳定片段</span><strong>${d.stable}%</strong></div><div><span>恢复效率</span><strong>${d.recovery}%</strong></div>`;
  }

  function eventIndex(ev){
    const r=canvas.getBoundingClientRect(),x=ev.clientX-r.left;
    return Math.max(0,Math.min(HISTORY.length-1,Math.floor(x/r.width*HISTORY.length)));
  }

  function bindCanvas(){
    canvas.addEventListener('mousemove',ev=>{
      hover=eventIndex(ev);drawGarden();
      const d=HISTORY[hover],r=canvas.parentElement.getBoundingClientRect();
      tooltip.style.display='block';tooltip.style.left=Math.min(ev.clientX-r.left+12,r.width-150)+'px';tooltip.style.top=Math.max(12,ev.clientY-r.top-55)+'px';
      tooltip.innerHTML=`<b>${d.date} · ${d.task}</b>${d.duration} min · Focus ${d.focus}<br>稳定 ${d.stable}% · 恢复 ${d.recovery}%`;
    });
    canvas.addEventListener('mouseleave',()=>{hover=-1;tooltip.style.display='none';drawGarden()});
    canvas.addEventListener('click',ev=>{selected=eventIndex(ev);updateReadout();drawGarden()});
  }

  function buildInsights(){
    const page=document.querySelector('#page-insights');if(!page)return;
    const trend=page.querySelector('.trend'),notes=page.querySelector('.notes');if(!trend||!notes)return;
    trend.innerHTML=`
      <div class="fw-longterm-head"><div class="eyebrow">LONG-TERM KARESANSUI · 14 SESSIONS</div><div class="fw-longterm-tabs"><button class="active" data-metric="stable">稳定片段</button><button data-metric="focus">Focus Index</button><button data-metric="recovery">恢复效率</button></div></div>
      <div class="fw-garden-wrap"><canvas id="fwLongtermGarden"></canvas><div class="fw-garden-tooltip" id="fwGardenTooltip"></div></div>
      <div class="fw-session-readout" id="fwSessionReadout"></div>`;
    notes.innerHTML=`
      <div class="eyebrow">RECENT PATTERNS</div>
      <div class="note" data-pattern="evening" tabindex="0"><b>傍晚更容易进入稳定段</b><p>过去两周，18:00–21:00 的可比阅读 / 写作 session 稳定段比例较高。</p><span class="fw-note-link">查看依据与比较</span></div>
      <div class="note" data-pattern="duration" tabindex="0"><b>45–60 分钟更适合你</b><p>当前个人历史中，这个时长区间的后半程恢复表现更稳定。</p><span class="fw-note-link">查看依据与比较</span></div>`;
    canvas=trend.querySelector('#fwLongtermGarden');tooltip=trend.querySelector('#fwGardenTooltip');
    trend.querySelector('.fw-longterm-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-metric]');if(!b)return;metric=b.dataset.metric;trend.querySelectorAll('[data-metric]').forEach(x=>x.classList.toggle('active',x===b));drawGarden()});
    notes.querySelectorAll('[data-pattern]').forEach(el=>{const open=()=>openPattern(el.dataset.pattern);el.addEventListener('click',open);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}})});
    bindCanvas();updateReadout();requestAnimationFrame(drawGarden);
    window.addEventListener('resize',()=>requestAnimationFrame(drawGarden));
  }

  function ensureDetailPage(){
    if(detailPage)return detailPage;
    detailPage=document.createElement('section');detailPage.className='fw-pattern-page';detailPage.id='fwPatternPage';
    detailPage.innerHTML=`<div class="fw-pattern-shell"><div class="fw-pattern-top"><button class="link-btn" id="fwPatternBack">← 返回洞察</button><div class="topmeta">PATTERN ANALYSIS · PROTOTYPE</div></div><div id="fwPatternBody"></div></div>`;
    document.body.appendChild(detailPage);
    detailPage.querySelector('#fwPatternBack').onclick=()=>{detailPage.classList.remove('open');history.replaceState(null,'',location.pathname+location.search+'#insights')};
    return detailPage;
  }

  function drawPatternViz(key){
    const c=detailPage.querySelector('#fwPatternViz'),{w,h,d}=sizeCanvas(c),ctx=c.getContext('2d');ctx.clearRect(0,0,w,h);
    const rand=seeded(key==='evening'?71:109),pad=28*d;
    ctx.strokeStyle='rgba(41,51,47,.08)';ctx.lineWidth=1;
    for(let i=0;i<4;i++){const y=pad+(h-pad*2)*i/3;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(w-pad,y);ctx.stroke()}
    const groups=key==='evening'?[[74,71,78,75,72,77],[58,65,61,64,60,66]]:[[79,82,77,84,81,80],[61,67,63,66,62,65]];
    const colors=['rgba(113,143,130,.72)','rgba(166,151,130,.56)'];
    groups.forEach((arr,gi)=>{ctx.beginPath();arr.forEach((v,i)=>{const x=pad+(w-pad*2)*(i/(arr.length-1)),y=h-pad-(v-45)/45*(h-pad*2)+(rand()-.5)*3*d;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.strokeStyle=colors[gi];ctx.lineWidth=1.2*d;ctx.stroke();arr.forEach((v,i)=>{const x=pad+(w-pad*2)*(i/(arr.length-1)),y=h-pad-(v-45)/45*(h-pad*2);ctx.beginPath();ctx.arc(x,y,2.2*d,0,Math.PI*2);ctx.fillStyle=colors[gi];ctx.fill()})});
  }

  function openPattern(key){
    const data=PATTERNS[key];if(!data)return;
    ensureDetailPage();
    detailPage.querySelector('#fwPatternBody').innerHTML=`
      <div class="fw-pattern-hero"><div><div class="eyebrow">RECENT PATTERN</div><h1>${data.title}</h1><div class="summary">${data.summary}</div></div><div class="fw-evidence"><div class="label">分析依据 · 原型模拟历史</div><p>${data.basis}</p>${data.rows.map(r=>`<div class="fw-compare-row"><b>${r[0]}</b><span>${r[1]}</span><span>${r[2]}</span></div>`).join('')}<div class="fw-pattern-note">${data.note}</div></div></div>
      <div class="fw-pattern-viz"><div class="eyebrow">COMPARABLE SESSIONS</div><h2>${data.subtitle}</h2><canvas id="fwPatternViz"></canvas></div>`;
    detailPage.classList.add('open');history.replaceState(null,'','#insight-'+key);requestAnimationFrame(()=>drawPatternViz(key));
  }

  function bindNavigationRedraw(){
    document.querySelectorAll('[data-nav="insights"],[data-go="insights"]').forEach(el=>el.addEventListener('click',()=>setTimeout(()=>drawGarden(),0)));
  }

  function init(){injectStyles();buildInsights();bindNavigationRedraw();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
