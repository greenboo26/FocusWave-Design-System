/* FocusWave curated content library + focus-session regulation */
(() => {
  const MIND_WANDER_THRESHOLD_MS=60_000;
  const PROMPT_TIMEOUT_MS=15_000;
  const FOCUS_PRACTICE_MS=60_000;
  const TRANSITION_MS=5_000;
  const focusStates=[
    {key:'stable',title:'凝神',sub:'心无旁骛，继续保持',index:78,conf:.82,amp:.42,disorder:.10,speed:.14},
    {key:'drift',title:'分神',sub:'略有分心，及时调整',index:66,conf:.76,amp:.72,disorder:.36,speed:.42},
    {key:'dispersed',title:'神驰',sub:'走神已久，重新专注',index:53,conf:.78,amp:1.0,disorder:.72,speed:.86}
  ];

  let curatedLibrary=[];
  let libraryReady=null;
  let reminderEnabled=true;
  let wanderSince=0;
  let wanderTimer=0;
  let promptTimer=0;
  let practiceEndTimer=0;
  let practiceTicker=0;
  let transitionTimer=0;
  let practiceStartedAt=0;
  let practiceRunning=false;
  let audioContext=null;
  let noiseSource=null;
  let noiseGain=null;
  const regulationEvents=[];

  async function loadLibrary(){
    try{
      const data=await fetch('./content/curated-quotes.json').then(response=>response.ok?response.json():null);
      curatedLibrary=(data?.items||[]).filter(item=>item?.text&&item?.source);
    }catch(error){
      console.warn('FocusWave curated library unavailable',error);
    }
  }

  function recordRegulation(action,extra={}){
    regulationEvents.push({action,at:Date.now(),...extra});
  }

  function currentFocusState(){
    if(typeof states==='undefined'||typeof stateIndex==='undefined')return null;
    return states[stateIndex]||states[0]||null;
  }

  function isMindWandering(){
    const state=currentFocusState();
    return state?.key==='dispersed'||state?.title==='神驰';
  }

  function clearWanderTimer(){
    clearTimeout(wanderTimer);
    wanderTimer=0;
  }

  function resetWanderWindow(){
    clearWanderTimer();
    wanderSince=0;
  }

  function scheduleMindWanderWatch(){
    clearWanderTimer();
    if(!reminderEnabled||practiceRunning||typeof currentPage==='undefined'||currentPage!=='live'){
      if(typeof currentPage!=='undefined'&&currentPage!=='live')wanderSince=0;
      return;
    }
    if(!isMindWandering()){
      wanderSince=0;
      return;
    }
    if(!wanderSince)wanderSince=Date.now();
    const remaining=MIND_WANDER_THRESHOLD_MS-(Date.now()-wanderSince);
    if(remaining<=0){
      openMindWanderPrompt();
      return;
    }
    wanderTimer=setTimeout(scheduleMindWanderWatch,remaining+30);
  }

  function installFocusStates(){
    if(typeof states==='undefined'||!Array.isArray(states))return;
    states.splice(0,states.length,...focusStates.map(state=>({...state})));
    if(typeof stateIndex!=='undefined'&&stateIndex>=states.length)stateIndex=0;
  }

  function renderLiveState(){
    const state=currentFocusState();
    if(!state)return;
    const title=document.querySelector('#stateTitle');
    const sub=document.querySelector('#stateSub');
    const index=document.querySelector('#focusIndex');
    if(title)title.textContent=state.title;
    if(sub)sub.textContent=state.sub;
    if(index)index.textContent=String(state.index);
  }

  function refresh(){
    renderLiveState();
    scheduleMindWanderWatch();
  }

  function patchApplyState(){
    if(typeof window.applyState!=='function')return;
    window.applyState=function focusWaveThreeStateApply(){
      renderLiveState();
      scheduleMindWanderWatch();
    };
    renderLiveState();
  }

  function ensureFocusSessionStyles(){
    if(document.querySelector('style[data-focuswave-focus-session]'))return;
    const style=document.createElement('style');
    style.dataset.focuswaveFocusSession='true';
    style.textContent=`
      #page-live .live-shell{grid-template-rows:92px 1fr!important}
      #page-live .state-copy{align-self:center}
      #page-live .live-focus-index{display:flex;align-items:baseline;gap:10px;margin-top:34px;padding:0;border:0;min-height:0;justify-content:flex-start;font-family:var(--ui);white-space:nowrap;color:#59615d}
      #page-live .live-focus-index span{font-size:12px;color:var(--muted)}
      #page-live .live-focus-index strong{font-family:var(--ui);font-variant-numeric:tabular-nums;font-size:30px;font-weight:430;letter-spacing:-.03em;color:var(--ink)}
      #page-live .live-focus-index small{font-size:11px;color:var(--muted)}

      #page-setup .setup-wrap>.section-sub{display:none}
      #page-setup .actions{justify-content:flex-end;margin-top:44px}
      #page-setup .actions .link-btn{display:none}
      #page-setup .wander-reminder-card{display:flex;align-items:flex-start;gap:12px;border:1px solid var(--hair);border-radius:18px;padding:15px 16px;background:rgba(255,255,255,.08);cursor:pointer;position:relative}
      #page-setup .wander-reminder-card input{position:absolute;opacity:0;pointer-events:none}
      #page-setup .wander-check{width:19px;height:19px;border-radius:50%;border:1px solid #9baaa2;display:grid;place-items:center;flex:0 0 19px;margin-top:1px;color:transparent;background:transparent;transition:.16s}
      #page-setup .wander-check:after{content:'✓';font-size:11px;line-height:1}
      #page-setup .wander-reminder-card input:checked + .wander-check{background:#71887c;border-color:#71887c;color:var(--paper)}
      #page-setup .wander-reminder-card b{display:block;font-family:var(--ui);font-size:14px;font-weight:450}
      #page-setup .wander-reminder-card small{display:block;margin-top:6px;color:var(--muted);font-size:11px;line-height:1.6}
      #page-setup .custom-duration{display:none;margin-top:12px;align-items:center;gap:10px}
      #page-setup .custom-duration.open{display:flex}
      #page-setup .custom-duration input{width:118px;height:38px;border:1px solid var(--hair);border-radius:999px;background:rgba(255,255,255,.12);outline:0;padding:0 14px;font-family:var(--ui);font-size:13px;color:var(--ink)}
      #page-setup .custom-duration input:focus{border-color:#7f958a;box-shadow:0 0 0 2px rgba(127,149,138,.08)}
      #page-setup .custom-duration span{font-size:12px;color:var(--muted)}
      #page-setup .custom-duration-error{min-height:16px;margin-top:7px;font-size:11px;color:#9b705f}

      #regOverlay .mind-wander-modal{width:min(560px,90vw)}
      #regOverlay .prompt-timeout{margin-top:14px;color:#929893;font-size:11px}
      #focusCountPracticeOverlay{z-index:80}
      #focusCountPracticeOverlay .focus-practice-modal{position:relative;width:min(620px,92vw);padding:38px 42px 34px;text-align:center}
      #focusCountPracticeOverlay .focus-practice-close{position:absolute;right:22px;top:18px;width:34px;height:34px;border:0;border-radius:50%;background:transparent;color:#7e8580;font-size:23px;cursor:pointer}
      #focusCountPracticeOverlay .focus-practice-close:hover{background:rgba(41,51,47,.05);color:var(--ink)}
      #focusCountPracticeOverlay .breath-stage{display:flex;flex-direction:column;align-items:center}
      #focusCountPracticeOverlay .breath-ring-wrap{height:270px;width:270px;display:grid;place-items:center;margin:18px auto 8px;position:relative}
      #focusCountPracticeOverlay .breath-ring{width:150px;height:150px;border:1.4px solid rgba(111,142,128,.62);border-radius:50%;box-shadow:0 0 0 20px rgba(111,142,128,.045),0 0 0 42px rgba(111,142,128,.025);animation:fw-count-breath 10s linear infinite;display:grid;place-items:center}
      #focusCountPracticeOverlay .breath-cue{font-family:var(--human);font-size:26px;color:#4c5a54;letter-spacing:.08em}
      #focusCountPracticeOverlay .practice-reminder{font-family:var(--human);font-size:20px;line-height:1.7;margin:8px 0 5px;color:#3d4944}
      #focusCountPracticeOverlay .practice-guide{max-width:470px;margin:0 auto;color:var(--muted);font-size:12px;line-height:1.8}
      #focusCountPracticeOverlay .practice-meta{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:18px}
      #focusCountPracticeOverlay .practice-remaining{font-variant-numeric:tabular-nums;color:#66706b;font-size:13px}
      #focusCountPracticeOverlay .noise-toggle{height:34px}
      #focusCountPracticeOverlay .transition-stage{display:none;min-height:360px;align-items:center;justify-content:center;flex-direction:column}
      #focusCountPracticeOverlay[data-stage="transition"] .breath-stage{display:none}
      #focusCountPracticeOverlay[data-stage="transition"] .transition-stage{display:flex}
      #focusCountPracticeOverlay .transition-stage h2{font-family:var(--human);font-size:38px;font-weight:400;margin:0 0 28px}
      @keyframes fw-count-breath{0%{transform:scale(.72);opacity:.62}40%{transform:scale(1.16);opacity:1}100%{transform:scale(.72);opacity:.62}}
      @media(max-width:720px){
        #page-live .live-focus-index{margin-top:24px}
        #page-setup .actions{justify-content:stretch}
        #page-setup .actions .primary{width:100%}
        #focusCountPracticeOverlay .focus-practice-modal{padding:34px 22px 28px}
        #focusCountPracticeOverlay .breath-ring-wrap{width:220px;height:220px}
        #focusCountPracticeOverlay .breath-ring{width:132px;height:132px}
      }
      @media(prefers-reduced-motion:reduce){#focusCountPracticeOverlay .breath-ring{animation:none;transform:scale(.94)}}
    `;
    document.head.appendChild(style);
  }

  function patchLiveLayout(){
    const copy=document.querySelector('#page-live .state-copy');
    if(!copy)return;
    copy.querySelector('.short-rule')?.remove();
    document.querySelector('#stateQuote')?.remove();
    document.querySelector('#stateImagery')?.remove();
    document.querySelector('#page-live .live-foot')?.remove();
    if(!copy.querySelector('.live-focus-index')){
      const metric=document.createElement('div');
      metric.className='live-focus-index';
      metric.innerHTML='<span>专注指数</span><strong id="focusIndex">78</strong><small>/ 100</small>';
      copy.appendChild(metric);
    }
    const regButton=document.querySelector('#regBtn');
    if(regButton)regButton.textContent='专注练习';
  }

  function setReminderEnabled(value){
    reminderEnabled=!!value;
    const toggle=document.querySelector('#wanderReminderToggle');
    if(toggle)toggle.checked=reminderEnabled;
    if(!reminderEnabled){
      resetWanderWindow();
      closeMindWanderPrompt('reminder-disabled',false);
    }else scheduleMindWanderWatch();
  }

  function patchSetupPage(){
    const page=document.querySelector('#page-setup');
    if(!page)return;
    const title=page.querySelector('.section-title');
    if(title)title.textContent='设置任务，开始专注';
    page.querySelector('.setup-wrap>.section-sub')?.remove();
    page.querySelector('.actions .link-btn')?.remove();

    const regulationBlock=document.querySelector('#regulationGroup')?.closest('.setup-block');
    if(regulationBlock){
      regulationBlock.innerHTML=`
        <span class="choice-label">专注提醒</span>
        <label class="wander-reminder-card">
          <input id="wanderReminderToggle" type="checkbox" checked />
          <span class="wander-check" aria-hidden="true"></span>
          <span><b>严重走神时允许提醒</b><small>默认开启。连续检测到严重走神 ≥ 1 分钟时，询问是否开始专注练习。</small></span>
        </label>`;
      regulationBlock.querySelector('#wanderReminderToggle')?.addEventListener('change',event=>setReminderEnabled(event.target.checked));
    }

    const durationGroup=document.querySelector('#durationGroup');
    if(durationGroup&&!document.querySelector('#customDurationWrap')){
      const wrap=document.createElement('div');
      wrap.id='customDurationWrap';
      wrap.className='custom-duration';
      wrap.innerHTML='<input id="customDurationInput" type="number" min="1" max="480" step="1" inputmode="numeric" placeholder="例如 90" aria-label="自定义专注时长（分钟）" /><span>分钟</span>';
      durationGroup.insertAdjacentElement('afterend',wrap);
      const error=document.createElement('div');
      error.id='customDurationError';
      error.className='custom-duration-error';
      wrap.insertAdjacentElement('afterend',error);

      const syncCustomDuration=()=>{
        const free=durationGroup.querySelector('[data-value="0"]')?.classList.contains('selected');
        wrap.classList.toggle('open',!!free);
        if(free)setTimeout(()=>document.querySelector('#customDurationInput')?.focus(),0);
        else if(error)error.textContent='';
      };
      durationGroup.addEventListener('click',event=>{
        if(event.target.closest('[data-value]'))setTimeout(syncCustomDuration,0);
      });
      syncCustomDuration();
    }

    const toDevice=document.querySelector('#toDevice');
    if(toDevice){
      toDevice.onclick=()=>{
        const selected=document.querySelector('#durationGroup .selected')?.dataset.value||'45';
        let minutes=Number(selected);
        const error=document.querySelector('#customDurationError');
        if(selected==='0'){
          const input=document.querySelector('#customDurationInput');
          minutes=Number(input?.value);
          if(!Number.isFinite(minutes)||minutes<1||minutes>480){
            if(error)error.textContent='请输入 1–480 分钟的专注时长。';
            input?.focus();
            return;
          }
        }
        if(error)error.textContent='';
        if(typeof activeTheme!=='undefined')activeTheme=document.querySelector('#themeGroup .selected')?.dataset.value||'ocean';
        const liveTask=document.querySelector('#liveTask');
        const taskInput=document.querySelector('#taskInput');
        const planned=document.querySelector('#plannedTime');
        if(liveTask)liveTask.textContent=taskInput?.value||'专注';
        if(planned)planned.textContent=`${String(Math.floor(minutes)).padStart(2,'0')}:00`;
        if(typeof showPage==='function')showPage('device');
        const quality=document.querySelector('#qualityReady');
        const begin=document.querySelector('#beginLive');
        if(quality){quality.textContent='正在确认';quality.className='waiting';}
        if(begin)begin.disabled=true;
        setTimeout(()=>{
          if(quality){quality.textContent='良好 · 94%';quality.className='ready';}
          if(begin)begin.disabled=false;
        },1300);
      };
    }

    [document.querySelector('#startFocus'),document.querySelector('#practiceToSetup')].filter(Boolean).forEach(button=>{
      button.addEventListener('click',()=>setReminderEnabled(true));
    });
  }

  function installMindWanderPrompt(){
    const overlay=document.querySelector('#regOverlay');
    if(!overlay)return;
    overlay.innerHTML=`
      <div class="modal mind-wander-modal">
        <div class="eyebrow">ATTENTION CHECK</div>
        <h2>已经严重走神了一会儿。</h2>
        <p>连续检测到严重走神已超过 1 分钟。要用一小段数息练习重新专注吗？</p>
        <div class="modal-actions">
          <button class="primary" id="mindWanderPractice" type="button">开始练习</button>
          <button class="ghost" id="mindWanderContinue" type="button">继续任务</button>
        </div>
        <div class="prompt-timeout">15 秒无响应将自动关闭，继续监测。</div>
      </div>`;
    overlay.querySelector('#mindWanderPractice').onclick=()=>{
      recordRegulation('practice-accepted',{trigger:'mind-wander'});
      closeMindWanderPrompt('accepted',false);
      startFocusPractice('mind-wander');
    };
    overlay.querySelector('#mindWanderContinue').onclick=()=>{
      recordRegulation('declined',{trigger:'mind-wander'});
      closeMindWanderPrompt('declined',true);
    };
  }

  function openMindWanderPrompt(){
    if(!reminderEnabled||practiceRunning||typeof currentPage==='undefined'||currentPage!=='live'||!isMindWandering())return;
    const overlay=document.querySelector('#regOverlay');
    if(!overlay||overlay.classList.contains('open'))return;
    clearWanderTimer();
    overlay.classList.add('open');
    clearTimeout(promptTimer);
    promptTimer=setTimeout(()=>{
      recordRegulation('prompt-timeout',{trigger:'mind-wander'});
      closeMindWanderPrompt('timeout',true);
    },PROMPT_TIMEOUT_MS);
  }

  function closeMindWanderPrompt(reason='closed',rearm=false){
    clearTimeout(promptTimer);
    promptTimer=0;
    document.querySelector('#regOverlay')?.classList.remove('open');
    if(rearm&&reminderEnabled&&typeof currentPage!=='undefined'&&currentPage==='live'&&isMindWandering()){
      wanderSince=Date.now();
      scheduleMindWanderWatch();
    }else if(reason!=='accepted'){
      wanderSince=0;
    }
  }

  function ensureFocusPracticeOverlay(){
    if(document.querySelector('#focusCountPracticeOverlay'))return;
    const overlay=document.createElement('div');
    overlay.id='focusCountPracticeOverlay';
    overlay.className='overlay';
    overlay.dataset.stage='practice';
    overlay.innerHTML=`
      <div class="modal focus-practice-modal" role="dialog" aria-modal="true" aria-labelledby="focusPracticeTitle">
        <button class="focus-practice-close" id="focusPracticeClose" type="button" aria-label="结束专注练习">×</button>
        <div class="breath-stage">
          <div class="eyebrow">FOCUS PRACTICE · 60 SEC</div>
          <h2 id="focusPracticeTitle">数息 · 呼吸锚定</h2>
          <div class="practice-reminder">数丢了？没关系，从 1 重来。</div>
          <div class="practice-guide">跟随圆环：吸气 4 秒，呼气 6 秒。心里默数“吸 1、呼 1……”；数到 10 后从 1 重新开始。</div>
          <div class="breath-ring-wrap"><div class="breath-ring" id="breathRing"><div class="breath-cue" id="breathCue">吸 1</div></div></div>
          <div class="practice-meta"><span class="practice-remaining" id="focusPracticeRemaining">01:00</span><button class="ghost noise-toggle" id="practiceNoiseToggle" type="button">白噪音：关</button></div>
        </div>
        <div class="transition-stage">
          <div class="eyebrow">RETURN TO TASK</div>
          <h2>好，我们继续。</h2>
          <button class="primary" id="practiceContinueTask" type="button">好，继续吧</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#focusPracticeClose').onclick=()=>finishFocusPractice('cancelled');
    overlay.querySelector('#practiceContinueTask').onclick=()=>finishFocusPractice('continued');
    overlay.querySelector('#practiceNoiseToggle').onclick=toggleWhiteNoise;
  }

  function formatRemaining(ms){
    const seconds=Math.max(0,Math.ceil(ms/1000));
    const minutes=Math.floor(seconds/60),rest=seconds%60;
    return `${String(minutes).padStart(2,'0')}:${String(rest).padStart(2,'0')}`;
  }

  function updatePracticeCue(){
    if(!practiceRunning)return;
    const elapsed=Date.now()-practiceStartedAt;
    const cycle=Math.floor(elapsed/10_000);
    const within=elapsed%10_000;
    const count=(cycle%10)+1;
    const cue=document.querySelector('#breathCue');
    const remaining=document.querySelector('#focusPracticeRemaining');
    if(cue)cue.textContent=within<4_000?`吸 ${count}`:`呼 ${count}`;
    if(remaining)remaining.textContent=formatRemaining(FOCUS_PRACTICE_MS-elapsed);
  }

  function resetBreathAnimation(){
    const ring=document.querySelector('#breathRing');
    if(!ring)return;
    ring.style.animation='none';
    void ring.offsetWidth;
    ring.style.animation='';
  }

  function startFocusPractice(trigger='manual'){
    ensureFocusPracticeOverlay();
    closeMindWanderPrompt('practice-start',false);
    resetWanderWindow();
    practiceRunning=true;
    recordRegulation('practice-started',{trigger});
    const overlay=document.querySelector('#focusCountPracticeOverlay');
    overlay.dataset.stage='practice';
    overlay.classList.add('open');
    const noiseButton=overlay.querySelector('#practiceNoiseToggle');
    stopWhiteNoise();
    if(noiseButton)noiseButton.textContent='白噪音：关';
    practiceStartedAt=Date.now();
    resetBreathAnimation();
    updatePracticeCue();
    clearInterval(practiceTicker);
    practiceTicker=setInterval(updatePracticeCue,250);
    clearTimeout(practiceEndTimer);
    practiceEndTimer=setTimeout(showPracticeTransition,FOCUS_PRACTICE_MS);
  }

  function showPracticeTransition(){
    if(!practiceRunning)return;
    clearInterval(practiceTicker);
    practiceTicker=0;
    stopWhiteNoise();
    const overlay=document.querySelector('#focusCountPracticeOverlay');
    if(!overlay)return;
    overlay.dataset.stage='transition';
    clearTimeout(transitionTimer);
    transitionTimer=setTimeout(()=>finishFocusPractice('auto-continued'),TRANSITION_MS);
  }

  function finishFocusPractice(reason='completed'){
    clearInterval(practiceTicker);
    clearTimeout(practiceEndTimer);
    clearTimeout(transitionTimer);
    practiceTicker=0;
    practiceEndTimer=0;
    transitionTimer=0;
    stopWhiteNoise();
    document.querySelector('#focusCountPracticeOverlay')?.classList.remove('open');
    if(practiceRunning)recordRegulation('practice-ended',{reason});
    practiceRunning=false;
    if(reminderEnabled&&typeof currentPage!=='undefined'&&currentPage==='live'&&isMindWandering()){
      wanderSince=Date.now();
      scheduleMindWanderWatch();
    }else wanderSince=0;
  }

  function startWhiteNoise(){
    if(noiseSource)return;
    const AudioCtor=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtor)return;
    audioContext=audioContext||new AudioCtor();
    if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
    const length=audioContext.sampleRate*2;
    const buffer=audioContext.createBuffer(1,length,audioContext.sampleRate);
    const channel=buffer.getChannelData(0);
    for(let i=0;i<length;i++)channel[i]=(Math.random()*2-1)*.22;
    noiseSource=audioContext.createBufferSource();
    noiseGain=audioContext.createGain();
    noiseGain.gain.value=.045;
    noiseSource.buffer=buffer;
    noiseSource.loop=true;
    noiseSource.connect(noiseGain).connect(audioContext.destination);
    noiseSource.start();
  }

  function stopWhiteNoise(){
    try{noiseSource?.stop();}catch(_){/* already stopped */}
    try{noiseSource?.disconnect();}catch(_){/* already disconnected */}
    try{noiseGain?.disconnect();}catch(_){/* already disconnected */}
    noiseSource=null;
    noiseGain=null;
  }

  function toggleWhiteNoise(){
    const button=document.querySelector('#practiceNoiseToggle');
    if(noiseSource){
      stopWhiteNoise();
      if(button)button.textContent='白噪音：关';
    }else{
      startWhiteNoise();
      if(button)button.textContent=noiseSource?'白噪音：开':'白噪音不可用';
    }
  }

  function bindPracticeEntry(){
    const button=document.querySelector('#regBtn');
    if(button){
      button.textContent='专注练习';
      button.onclick=()=>startFocusPractice('manual');
    }
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&document.querySelector('#focusCountPracticeOverlay')?.classList.contains('open'))finishFocusPractice('cancelled');
    });
  }

  function ensureLibraryStyles(){
    if(document.querySelector('style[data-focuswave-library-ui]'))return;
    const style=document.createElement('style');
    style.dataset.focuswaveLibraryUi='true';
    style.textContent=`
      #contentLibraryOverlay .library-modal{position:relative;width:min(900px,92vw);max-height:84vh;overflow:hidden;padding:34px 38px 30px}
      #contentLibraryOverlay .library-close{position:absolute;right:27px;top:22px;width:34px;height:34px;border:0;background:transparent;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:#6f7772;font-size:25px;font-weight:300;line-height:1}
      #contentLibraryOverlay .library-close:hover{background:rgba(41,51,47,.05);color:var(--ink)}
      #contentLibraryOverlay .library-list{border-top:1px solid var(--hair);margin-top:20px;padding:18px 6px 0 0;overflow:auto;max-height:calc(84vh - 145px)}
      #contentLibraryOverlay .library-item{border:1px solid var(--hair);border-radius:16px;background:rgba(255,255,255,.04);padding:16px 18px;margin-bottom:10px;color:var(--ink)}
      #contentLibraryOverlay .library-text{font-family:var(--human);font-size:18px;line-height:1.7;letter-spacing:.025em;color:#39443f}
      #contentLibraryOverlay .library-source{display:block;margin-top:7px;font-family:var(--ui);font-size:11px;line-height:1.65;color:var(--muted)}
      @media(max-width:760px){
        #contentLibraryOverlay .library-modal{width:calc(100vw - 24px);max-height:calc(100vh - 24px);padding:30px 24px 24px}
        #contentLibraryOverlay .library-close{right:17px;top:17px}
        #contentLibraryOverlay .library-list{max-height:calc(100vh - 145px)}
        #contentLibraryOverlay .library-text{font-size:17px}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureLibraryModal(){
    if(document.querySelector('#contentLibraryOverlay'))return;
    ensureLibraryStyles();
    const overlay=document.createElement('div');
    overlay.id='contentLibraryOverlay';
    overlay.className='overlay';
    overlay.innerHTML=`
      <div class="modal library-modal" role="dialog" aria-modal="true" aria-labelledby="contentLibraryTitle">
        <button class="library-close" id="closeLibrary" type="button" aria-label="关闭文字库">×</button>
        <div class="eyebrow">CONTENT LIBRARY</div>
        <h2 id="contentLibraryTitle">文字库</h2>
        <div class="library-list" id="libraryList"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#closeLibrary').onclick=()=>overlay.classList.remove('open');
  }

  function renderLibrary(){
    ensureLibraryModal();
    const list=document.querySelector('#libraryList');
    if(!list)return;
    list.innerHTML=curatedLibrary.map(item=>`
      <article class="library-item">
        <div class="library-text">${item.text}</div>
        <span class="library-source">${item.source}</span>
      </article>`).join('')||'<p class="library-source">内容加载中。</p>';
    list.scrollTop=0;
  }

  async function openLibrary(){
    if(!libraryReady)libraryReady=loadLibrary();
    await libraryReady;
    renderLibrary();
    document.querySelector('#contentLibraryOverlay')?.classList.add('open');
  }

  function bindLibraryEntry(){
    const panel=document.querySelector('#setting-ai');
    if(!panel)return;
    const target=panel.querySelector('.content-library-entry')||[...panel.querySelectorAll('.pill')].find(item=>item.textContent.trim()==='内容库');
    if(!target||target.dataset.bound)return;
    target.dataset.bound='1';
    target.style.cursor='pointer';
    target.onclick=openLibrary;
  }

  function removeSessionTextMode(){
    document.querySelector('#textGroup')?.closest('.setup-block')?.remove();
  }

  function installFocusSessionExperience(){
    installFocusStates();
    ensureFocusSessionStyles();
    patchLiveLayout();
    patchSetupPage();
    installMindWanderPrompt();
    ensureFocusPracticeOverlay();
    bindPracticeEntry();
    patchApplyState();
  }

  function bind(){
    removeSessionTextMode();
    installFocusSessionExperience();
    libraryReady=loadLibrary();
    setTimeout(bindLibraryEntry,80);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  window.FocusWaveContentEngine={refresh,openLibrary,startFocusPractice,regulationEvents};
})();