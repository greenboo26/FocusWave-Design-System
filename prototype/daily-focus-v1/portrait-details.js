/* FocusWave portrait session detail page
 * Prototype data only. Production replaces SESSION_DATA with persisted session history.
 */
(() => {
  const SESSION_DATA = [
    {
      id:'reading-42', task:'阅读', title:'阅读论文', date:'8月25日 · 20:14', duration:42, theme:'ocean', seed:11,
      focus:74, confidence:.81, quality:94, stable:71, recoveries:3, longest:'12 min 40 s',
      summary:'中后段更稳定。两次明显游移都在短时间内重新回到任务。',
      segments:[
        {s:0,e:8,state:'stable'},{s:8,e:12,state:'drift'},{s:12,e:19,state:'stable'},
        {s:19,e:23,state:'dispersed'},{s:23,e:28,state:'refocus'},{s:28,e:37,state:'stable'},{s:37,e:42,state:'drift'}
      ]
    },
    {
      id:'writing-58', task:'写作', title:'论文写作', date:'8月24日 · 19:32', duration:58, theme:'mountain', seed:23,
      focus:69, confidence:.78, quality:91, stable:64, recoveries:5, longest:'10 min 18 s',
      summary:'前半段起伏更明显，后半段形成较长的连续稳定区间。',
      segments:[
        {s:0,e:7,state:'stable'},{s:7,e:13,state:'drift'},{s:13,e:18,state:'refocus'},{s:18,e:25,state:'stable'},
        {s:25,e:31,state:'dispersed'},{s:31,e:36,state:'refocus'},{s:36,e:49,state:'stable'},{s:49,e:54,state:'drift'},{s:54,e:58,state:'stable'}
      ]
    },
    {
      id:'coding-51', task:'编程', title:'代码实现', date:'8月23日 · 21:05', duration:51, theme:'incense', seed:37,
      focus:78, confidence:.84, quality:96, stable:76, recoveries:2, longest:'16 min 05 s',
      summary:'整体稳定度最高，主要波动集中在中段一次短暂分散。',
      segments:[
        {s:0,e:15,state:'stable'},{s:15,e:19,state:'drift'},{s:19,e:23,state:'refocus'},
        {s:23,e:31,state:'stable'},{s:31,e:35,state:'dispersed'},{s:35,e:39,state:'refocus'},{s:39,e:51,state:'stable'}
      ]
    }
  ];

  const STATE_META = {
    stable:{label:'稳定',color:'rgba(103,139,119,.76)',line:'#638675',wash:'rgba(103,139,119,.045)'},
    drift:{label:'游移',color:'rgba(145,146,142,.72)',line:'#92938e',wash:'rgba(145,146,142,.038)'},
    dispersed:{label:'分散',color:'rgba(168,132,101,.74)',line:'#a67f5f',wash:'rgba(168,132,101,.045)'},
    refocus:{label:'回收',color:'rgba(103,145,151,.74)',line:'#679198',wash:'rgba(103,145,151,.042)'}
  };

  let detailPage=null,currentIndex=-1,chartMetric='focus',chartRaf=0;

  function injectStyles(){
    if(document.querySelector('style[data-focuswave-portrait-detail]'))return;
    const style=document.createElement('style');
    style.dataset.focuswavePortraitDetail='true';
    style.textContent=`
      #page-portraits .portrait-card{cursor:pointer;transition:opacity .18s ease,transform .18s ease}
      #page-portraits .portrait-card:hover{opacity:.78;transform:translateY(-2px)}
      #page-portraits .portrait-card:focus-visible{outline:1px solid #82998f;outline-offset:7px}
      .portrait-detail-page{position:fixed;inset:0 0 0 84px;z-index:38;background:var(--paper);overflow:auto;display:none}
      .portrait-detail-page.open{display:block}
      .portrait-detail-shell{max-width:1240px;margin:0 auto;padding:34px 54px 70px}
      .portrait-detail-top{height:46px;display:flex;align-items:center;justify-content:space-between}
      .portrait-detail-top .link-btn{font-size:12px}
      .portrait-detail-head{display:flex;justify-content:space-between;align-items:flex-end;margin-top:56px;padding-bottom:22px;border-bottom:1px solid var(--hair)}
      .portrait-detail-head h1{font-family:var(--human);font-size:42px;font-weight:400;letter-spacing:.05em;margin:8px 0 8px}
      .portrait-detail-head p{font-size:12px;color:var(--muted);margin:0}
      .portrait-detail-theme{font-size:11px;letter-spacing:.11em;color:var(--muted);text-transform:uppercase}
      .portrait-detail-hero{display:grid;grid-template-columns:minmax(480px,1.2fr) minmax(300px,.8fr);gap:62px;align-items:center;margin-top:36px}
      .portrait-detail-art{height:360px}
      .portrait-detail-art canvas{width:100%;height:100%;display:block}
      .portrait-detail-stats{border-top:1px solid var(--hair)}
      .portrait-detail-stat{display:grid;grid-template-columns:1fr auto;gap:28px;padding:17px 0;border-bottom:1px solid var(--hair);align-items:baseline}
      .portrait-detail-stat span{font-size:12px;color:var(--muted)}
      .portrait-detail-stat b{font-family:var(--ui);font-variant-numeric:tabular-nums;font-size:20px;font-weight:400;letter-spacing:-.01em}
      .portrait-detail-summary{font-family:var(--human);font-size:18px;line-height:1.75;margin:24px 0 0;color:#4b5751}
      .portrait-analysis{margin-top:52px;border-top:1px solid var(--hair);padding-top:24px}
      .portrait-analysis-head{display:flex;justify-content:space-between;align-items:flex-end;gap:30px}
      .portrait-analysis-head h2{font-family:var(--human);font-size:28px;font-weight:400;margin:6px 0 0}
      .portrait-metric-tabs{display:flex;gap:7px;flex-wrap:wrap}
      .portrait-metric-tabs button{border:1px solid var(--hair);background:transparent;border-radius:999px;padding:7px 11px;font-size:11px;cursor:pointer;color:#65706b}
      .portrait-metric-tabs button.active{border-color:#83988e;background:rgba(131,152,142,.06);color:var(--ink)}
      .portrait-chart-wrap{height:285px;margin-top:22px;position:relative}
      .portrait-chart-wrap canvas{width:100%;height:100%;display:block}
      .portrait-timeline{margin-top:24px}
      .portrait-timeline-title{font-size:11px;color:var(--muted);letter-spacing:.08em;margin-bottom:10px}
      .portrait-state-track{display:flex;height:12px;border-radius:8px;overflow:hidden;background:#ebe7df}
      .portrait-state-track span{display:block;height:100%}
      .portrait-state-labels{display:flex;gap:18px;flex-wrap:wrap;margin-top:10px;font-size:11px;color:var(--muted)}
      .portrait-state-labels i{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:5px;vertical-align:0}
      .portrait-moments{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:38px;border-top:1px solid var(--hair);padding-top:22px}
      .portrait-moment .time{font-family:var(--ui);font-variant-numeric:tabular-nums;font-size:13px;color:#66706b}
      .portrait-moment b{display:block;font-family:var(--human);font-size:18px;font-weight:400;margin:7px 0}
      .portrait-moment p{font-size:12px;line-height:1.7;color:var(--muted);margin:0}
      @media(max-width:1000px){.portrait-detail-page{left:64px}.portrait-detail-shell{padding:28px}.portrait-detail-hero{grid-template-columns:1fr}.portrait-detail-art{height:300px}.portrait-moments{grid-template-columns:1fr}}
      @media(max-width:720px){.portrait-detail-page{left:0}.portrait-detail-head{display:block}.portrait-detail-theme{margin-top:16px}.portrait-detail-art{height:250px}}
    `;
    document.head.appendChild(style);
  }

  function seeded(seed){
    let x=seed>>>0;
    return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296};
  }

  function segmentAt(session,minute){
    return session.segments.find(seg=>minute>=seg.s&&minute<seg.e)?.state||'stable';
  }

  function buildSeries(session){
    const rand=seeded(session.seed*7919+17),n=Math.max(60,session.duration*2),focus=[],confidence=[],quality=[];
    for(let i=0;i<n;i++){
      const minute=i/(n-1)*session.duration,state=segmentAt(session,minute);
      const penalty=state==='stable'?4:state==='drift'?-5:state==='dispersed'?-15:1;
      const wave=Math.sin(i*.23+session.seed)*3.2+Math.sin(i*.071)*2;
      focus.push(Math.max(34,Math.min(92,session.focus+penalty+wave+(rand()-.5)*5)));
      const confShift=state==='dispersed'?-.08:state==='drift'?-.04:state==='refocus'?.01:.025;
      confidence.push(Math.max(.56,Math.min(.96,session.confidence+confShift+Math.sin(i*.13)*.015+(rand()-.5)*.018)));
      quality.push(Math.max(78,Math.min(100,session.quality+Math.sin(i*.09)*1.8+(rand()-.5)*2.2)));
    }
    return{focus,confidence,quality};
  }

  function ensurePage(){
    if(detailPage)return detailPage;
    detailPage=document.createElement('section');
    detailPage.className='portrait-detail-page';
    detailPage.id='portraitDetailPage';
    detailPage.innerHTML=`
      <div class="portrait-detail-shell">
        <div class="portrait-detail-top"><button class="link-btn" id="portraitDetailBack">← 返回画像</button><div class="topmeta">SESSION DETAIL</div></div>
        <div class="portrait-detail-head">
          <div><div class="eyebrow">ATTENTION PORTRAIT</div><h1 id="pdTitle">阅读论文</h1><p id="pdMeta">8月25日 · 20:14 · 42 min</p></div>
          <div class="portrait-detail-theme" id="pdTheme">海 · session 01</div>
        </div>
        <div class="portrait-detail-hero">
          <div class="portrait-detail-art"><canvas id="pdCanvas"></canvas></div>
          <div>
            <div class="portrait-detail-stats">
              <div class="portrait-detail-stat"><span>平均 Focus Index</span><b id="pdFocus">74</b></div>
              <div class="portrait-detail-stat"><span>稳定片段</span><b id="pdStable">71%</b></div>
              <div class="portrait-detail-stat"><span>恢复次数</span><b id="pdRecovery">3</b></div>
              <div class="portrait-detail-stat"><span>最长稳定段</span><b id="pdLongest">12 min 40 s</b></div>
              <div class="portrait-detail-stat"><span>有效信号覆盖</span><b id="pdCoverage">94%</b></div>
            </div>
            <p class="portrait-detail-summary" id="pdSummary"></p>
          </div>
        </div>
        <div class="portrait-analysis">
          <div class="portrait-analysis-head">
            <div><div class="eyebrow">SESSION TIMELINE</div><h2>这段时间，参数怎样变化</h2></div>
            <div class="portrait-metric-tabs" id="pdMetricTabs">
              <button class="active" data-metric="focus">Focus Index</button>
              <button data-metric="confidence">Confidence</button>
              <button data-metric="quality">Data Quality</button>
            </div>
          </div>
          <div class="portrait-chart-wrap"><canvas id="pdChart"></canvas></div>
          <div class="portrait-timeline">
            <div class="portrait-timeline-title">注意状态区间</div>
            <div class="portrait-state-track" id="pdStateTrack"></div>
            <div class="portrait-state-labels" id="pdStateLabels"></div>
          </div>
          <div class="portrait-moments" id="pdMoments"></div>
        </div>
      </div>`;
    document.body.appendChild(detailPage);
    detailPage.querySelector('#portraitDetailBack').onclick=()=>{
      if(location.hash.startsWith('#portrait-')) history.back(); else closeDetail();
    };
    detailPage.querySelector('#pdMetricTabs').addEventListener('click',e=>{
      const button=e.target.closest('[data-metric]');if(!button)return;
      chartMetric=button.dataset.metric;
      detailPage.querySelectorAll('#pdMetricTabs button').forEach(b=>b.classList.toggle('active',b===button));
      animateChart();
    });
    return detailPage;
  }

  function resizeCanvas(canvas){
    const d=Math.min(devicePixelRatio||1,2),r=canvas.getBoundingClientRect(),w=Math.max(10,Math.floor(r.width*d)),h=Math.max(10,Math.floor(r.height*d));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}return{w,h,d};
  }

  function renderPortrait(session){
    const canvas=detailPage.querySelector('#pdCanvas');
    const engine=window.FocusWaveVisualEngine;
    const state=(typeof states!=='undefined'?states.find(s=>s.key==='stable'):null)||{key:'stable'};
    if(engine?.drawField) engine.drawField(canvas,{theme:session.theme,state,t:session.seed*.73});
  }

  function renderChart(progress=1,phase=0){
    if(currentIndex<0)return;
    const session=SESSION_DATA[currentIndex],series=session._series||(session._series=buildSeries(session));
    const values=series[chartMetric],canvas=detailPage.querySelector('#pdChart'),{w,h,d}=resizeCanvas(canvas),ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,w,h);
    const padL=42*d,padR=12*d,padT=18*d,padB=30*d,plotW=w-padL-padR,plotH=h-padT-padB;
    const ranges={focus:[30,100],confidence:[.5,1],quality:[70,100]},[min,max]=ranges[chartMetric];
    session.segments.forEach(seg=>{
      const x=padL+seg.s/session.duration*plotW,width=(seg.e-seg.s)/session.duration*plotW;
      ctx.fillStyle=STATE_META[seg.state].wash;ctx.fillRect(x,padT,width,plotH);
      ctx.fillStyle=STATE_META[seg.state].color;ctx.fillRect(x,padT,width,2*d);
    });
    ctx.strokeStyle='rgba(41,51,47,.08)';ctx.lineWidth=1;
    for(let k=0;k<4;k++){const y=padT+plotH*k/3;ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(w-padR,y);ctx.stroke()}
    ctx.fillStyle='rgba(90,99,94,.58)';ctx.font=`${10*d}px Inter, sans-serif`;
    ctx.textAlign='right';ctx.textBaseline='middle';
    for(let k=0;k<4;k++){
      const v=max-(max-min)*k/3,label=chartMetric==='confidence'?v.toFixed(2):Math.round(v).toString();
      ctx.fillText(label,padL-8*d,padT+plotH*k/3);
    }
    const points=values.map((v,i)=>({
      x:padL+i/(values.length-1)*plotW,
      y:padT+(1-(v-min)/(max-min))*plotH,
      minute:i/(values.length-1)*session.duration
    }));
    const revealIndex=Math.max(1,Math.floor((points.length-1)*progress));
    ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=1.85*d;
    for(let i=1;i<=revealIndex;i++){
      const previous=points[i-1],point=points[i],state=segmentAt(session,(previous.minute+point.minute)/2);
      ctx.beginPath();ctx.moveTo(previous.x,previous.y);ctx.lineTo(point.x,point.y);
      ctx.strokeStyle=STATE_META[state].line;ctx.stroke();
    }
    session.segments.slice(1).forEach(seg=>{
      if(seg.s/session.duration>progress)return;
      const i=Math.min(points.length-1,Math.round(seg.s/session.duration*(points.length-1))),point=points[i];
      ctx.beginPath();ctx.arc(point.x,point.y,2.25*d,0,Math.PI*2);ctx.fillStyle=STATE_META[seg.state].line;ctx.fill();
    });
    if(progress>=1&&phase>0){
      const position=(phase*.16)%(points.length-1),index=Math.floor(position),mix=position-index,a=points[index],b=points[index+1];
      const x=a.x+(b.x-a.x)*mix,y=a.y+(b.y-a.y)*mix,state=segmentAt(session,a.minute+(b.minute-a.minute)*mix);
      ctx.beginPath();ctx.arc(x,y,(4.8+Math.sin(phase*3)*1.1)*d,0,Math.PI*2);ctx.fillStyle=STATE_META[state].wash;ctx.fill();
      ctx.beginPath();ctx.arc(x,y,2.2*d,0,Math.PI*2);ctx.fillStyle=STATE_META[state].line;ctx.fill();
    }
    ctx.fillStyle='rgba(90,99,94,.58)';ctx.textAlign='center';ctx.textBaseline='top';
    [0,.25,.5,.75,1].forEach(p=>ctx.fillText(`${Math.round(session.duration*p)} min`,padL+plotW*p,h-padB+8*d));
  }

  function animateChart(){
    cancelAnimationFrame(chartRaf);
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){renderChart(1);return}
    const start=performance.now();
    const frame=now=>{
      const raw=Math.min(1,(now-start)/780),progress=1-Math.pow(1-raw,3);
      renderChart(progress,raw>=1?(now-start)/1000:0);
      if(raw<1)chartRaf=requestAnimationFrame(frame);
      else {
        const idle=idleNow=>{if(!detailPage?.classList.contains('open')||document.hidden)return;renderChart(1,(idleNow-start)/1000);chartRaf=requestAnimationFrame(idle)};
        chartRaf=requestAnimationFrame(idle);
      }
    };
    chartRaf=requestAnimationFrame(frame);
  }

  function renderStates(session){
    const track=detailPage.querySelector('#pdStateTrack'),labels=detailPage.querySelector('#pdStateLabels');
    track.innerHTML=session.segments.map(seg=>`<span title="${STATE_META[seg.state].label} ${seg.s}–${seg.e} min" style="width:${(seg.e-seg.s)/session.duration*100}%;background:${STATE_META[seg.state].color}"></span>`).join('');
    labels.innerHTML=Object.entries(STATE_META).map(([,m])=>`<span><i style="background:${m.color}"></i>${m.label}</span>`).join('');
  }

  function renderMoments(session){
    const moments=[];
    const firstDrift=session.segments.find(x=>x.state==='drift');
    const dispersed=session.segments.find(x=>x.state==='dispersed');
    const refocus=session.segments.find(x=>x.state==='refocus');
    if(firstDrift)moments.push({t:`${String(Math.floor(firstDrift.s)).padStart(2,'0')}:00`,title:'注意开始游移',text:'Focus Index 出现连续下降，随后进入一次可恢复的游移段。'});
    if(dispersed)moments.push({t:`${String(Math.floor(dispersed.s)).padStart(2,'0')}:00`,title:'本次最明显起伏',text:'该区间状态分散度最高，同时 Confidence 略有下降。'});
    if(refocus)moments.push({t:`${String(Math.floor(refocus.s)).padStart(2,'0')}:00`,title:'重新回到任务',text:'状态开始回收，Focus Index 在随后数分钟重新上升。'});
    detailPage.querySelector('#pdMoments').innerHTML=moments.map(m=>`<div class="portrait-moment"><div class="time">${m.t}</div><b>${m.title}</b><p>${m.text}</p></div>`).join('');
  }

  function fillDetail(index){
    const s=SESSION_DATA[index],themeNames={ocean:'海',mountain:'山',incense:'线香',dusk:'夕照'};
    detailPage.querySelector('#pdTitle').textContent=s.title;
    detailPage.querySelector('#pdMeta').textContent=`${s.date} · ${s.duration} min`;
    detailPage.querySelector('#pdTheme').textContent=`${themeNames[s.theme]} · ${s.task}`;
    detailPage.querySelector('#pdFocus').textContent=s.focus;
    detailPage.querySelector('#pdStable').textContent=`${s.stable}%`;
    detailPage.querySelector('#pdRecovery').textContent=s.recoveries;
    detailPage.querySelector('#pdLongest').textContent=s.longest;
    detailPage.querySelector('#pdCoverage').textContent=`${s.quality}%`;
    detailPage.querySelector('#pdSummary').textContent=s.summary;
    chartMetric='focus';detailPage.querySelectorAll('#pdMetricTabs button').forEach(b=>b.classList.toggle('active',b.dataset.metric==='focus'));
    requestAnimationFrame(()=>{renderPortrait(s);animateChart();renderStates(s);renderMoments(s)});
  }

  function openDetail(index,push=true){
    ensurePage();currentIndex=index;fillDetail(index);detailPage.classList.add('open');document.body.style.overflow='hidden';
    if(push)history.pushState({portraitDetail:index},'',`#portrait-${index+1}`);
  }
  function closeDetail(){
    if(!detailPage)return;detailPage.classList.remove('open');document.body.style.overflow='';currentIndex=-1;
  }

  function bindCards(){
    document.querySelectorAll('#page-portraits .portrait-card').forEach((card,index)=>{
      card.dataset.sessionIndex=index;card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',`查看第 ${index+1} 次专注详情`);
      card.onclick=()=>openDetail(Number(card.dataset.sessionIndex),true);
      card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openDetail(Number(card.dataset.sessionIndex),true)}};
    });
  }

  function createFromSession(input={}){
    const duration=Math.max(1,Math.round(Number(input.duration)||1));
    const task=(input.task||'专注').trim();
    const theme=['ocean','mountain','incense','dusk'].includes(input.theme)?input.theme:'mountain';
    const seed=Math.floor(Date.now()%100000)+duration*17;
    const stableEnd=Math.max(4,Math.round(duration*.35));
    const driftEnd=Math.max(stableEnd+1,Math.round(duration*.49));
    const refocusEnd=Math.max(driftEnd+1,Math.round(duration*.64));
    const dispersedEnd=Math.max(refocusEnd+1,Math.round(duration*.72));
    const segments=[
      {s:0,e:stableEnd,state:'stable'},
      {s:stableEnd,e:driftEnd,state:'drift'},
      {s:driftEnd,e:refocusEnd,state:'refocus'},
      {s:refocusEnd,e:Math.min(duration,dispersedEnd),state:'dispersed'},
      {s:Math.min(duration,dispersedEnd),e:duration,state:'stable'}
    ].filter(segment=>segment.e>segment.s);
    const session={
      id:`session-${seed}`,task,title:task,date:new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}),duration,theme,seed,
      focus:72,confidence:.81,quality:94,stable:68,recoveries:2,longest:`${Math.max(1,Math.round(duration*.28))} min`,
      summary:'这张画像由本次已保存的时序摘要生成，可在此后回看它的状态变化与恢复节点。',segments
    };
    SESSION_DATA.unshift(session);
    const grid=document.querySelector('#page-portraits .portrait-grid');
    if(grid){
      const card=document.createElement('div');
      card.className='portrait-card';
      card.innerHTML=`<canvas class="portraitMini" data-seed="${seed}" data-theme="${theme}"></canvas><div class="meta"><span>${task} · ${duration} min</span><span>刚刚生成</span></div>`;
      grid.prepend(card);
      requestAnimationFrame(()=>{
        const canvas=card.querySelector('canvas');
        const state=(typeof states!=='undefined'?states.find(item=>item.key==='refocus'):null)||{key:'refocus',amp:.7,disorder:.22};
        if(typeof window.drawField==='function')window.drawField(canvas,{theme,state,lines:44,alpha:.34,t:seed*.01});
      });
      bindCards();
    }
    return 0;
  }

  function init(){
    injectStyles();ensurePage();bindCards();
    window.addEventListener('resize',()=>{if(currentIndex>=0){renderPortrait(SESSION_DATA[currentIndex]);renderChart(1)}});
    window.addEventListener('popstate',e=>{
      const idx=e.state?.portraitDetail;
      if(Number.isInteger(idx))openDetail(idx,false);else closeDetail();
    });
    const match=location.hash.match(/^#portrait-(\d)$/);if(match){const idx=Number(match[1])-1;if(SESSION_DATA[idx])openDetail(idx,false)}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.FocusWavePortraitDetails={open:index=>openDetail(index,true),createFromSession,sessions:SESSION_DATA};
})();
