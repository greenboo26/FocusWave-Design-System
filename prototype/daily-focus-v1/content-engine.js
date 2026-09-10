/* FocusWave live text + curated content library */
(() => {
  const stateNames={stable:'专注维持',drift:'轻度游移',dispersed:'状态起伏',refocus:'重新聚焦'};
  const minimal={stable:'稳',drift:'游',dispersed:'散',refocus:'归'};
  const themeLabels={ocean:'海',mountain:'山',incense:'线香',dusk:'夕照'};
  const GENERATED_DRAFTS_KEY='focuswave.generatedContentDrafts';
  const DEFAULT_TEXT_MODE_KEY='focuswave.defaultTextMode';
  const fallbackOriginal={
    ocean:{stable:['潮声很远，手边的事很近。'],drift:['远潮带走一小段目光。'],dispersed:['水面起了碎浪，注意失去了一处落点。'],refocus:['浪声退后，眼前这一处重新显出来。']},
    mountain:{stable:['云影很慢，峰线很清楚。'],drift:['山还在，目光先随云去了。'],dispersed:['山色被雾分成几层，注意也散开了。'],refocus:['雾气渐薄，山脊又连成一线。']},
    incense:{stable:['烟直而轻，注意停留得很安静。'],drift:['烟身轻轻一折，目光随之偏了半步。'],dispersed:['烟在半空散成薄雾，思绪也变得松散。'],refocus:['散开的烟慢慢并回一缕。']},
    dusk:{stable:['暮光铺平，注意安静地落了下来。'],drift:['晚风带走一点余光，目光跟着远了。'],dispersed:['余晖碎在云间，注意也失去了同一方向。'],refocus:['散开的余光慢慢收回桌面。']}
  };

  let libraries={original:null,generated:null,global:null,classical:null};
  let curatedLibrary=[];
  let lastKey='';
  let librariesReady=null;

  async function loadLibraries(){
    try{
      const [o,n,g,c,q]=await Promise.all([
        fetch('./content/original-state-lines.json').then(r=>r.ok?r.json():null),
        fetch('./content/generated-state-lines.json').then(r=>r.ok?r.json():null),
        fetch('./content/world-public-domain.json').then(r=>r.ok?r.json():null),
        fetch('./content/classical-zh.json').then(r=>r.ok?r.json():null),
        fetch('./content/curated-quotes.json').then(r=>r.ok?r.json():null)
      ]);
      libraries={original:o,generated:n,global:g,classical:c};
      curatedLibrary=(q?.items||[]).filter(item=>item?.text&&item?.source);
      refresh();
      bindLibraryEntry();
    }catch(e){
      console.warn('FocusWave content libraries unavailable',e);
    }
  }

  function selectedMode(){
    const sessionMode=document.querySelector('#textGroup .selected')?.dataset.value;
    if(sessionMode)return sessionMode;
    const saved=localStorage.getItem(DEFAULT_TEXT_MODE_KEY);
    return ['minimal','original','global','classical'].includes(saved)?saved:'original';
  }
  function randPick(arr,key){
    if(!arr?.length)return null;
    let idx=Math.floor(Math.random()*arr.length);
    if(arr.length>1&&`${key}:${idx}`===lastKey)idx=(idx+1)%arr.length;
    lastKey=`${key}:${idx}`;
    return arr[idx];
  }
  function poolItems(items,theme,state){
    if(!items?.length)return[];
    let pool=items.filter(x=>x.verified!==false&&x.theme?.includes(theme)&&x.state?.includes(state));
    if(!pool.length)pool=items.filter(x=>x.verified!==false&&x.state?.includes(state));
    if(!pool.length)pool=items.filter(x=>x.verified!==false&&x.theme?.includes(theme));
    return pool.length?pool:items.filter(x=>x.verified!==false);
  }
  function localGeneratedEntries(){
    try{return JSON.parse(localStorage.getItem(GENERATED_DRAFTS_KEY)||'[]')}catch{return[]}
  }
  function renderFor(mode,theme,state){
    if(mode==='minimal')return{q:minimal[state]||'·',meta:`${themeLabels[theme]} · ${stateNames[state]}`};
    if(mode==='original'){
      const reviewed=libraries.original?.themes?.[theme]?.[state]||fallbackOriginal[theme]?.[state]||[];
      const generated=libraries.generated?.themes?.[theme]?.[state]||[];
      const local=localGeneratedEntries().filter(item=>item.theme===theme&&item.state===state).map(item=>item.text);
      const pool=[...reviewed,...generated,...local];
      return{q:randPick(pool,`o:${theme}:${state}`)||'',meta:`新创 · ${themeLabels[theme]}`};
    }
    if(mode==='global'){
      const item=randPick(poolItems(libraries.global?.items||[],theme,state),`g:${theme}:${state}`);
      if(item)return{q:item.original,meta:`${item.author} · ${item.work}`,translation:item.translation_zh||''};
      return{q:'Look within.',meta:'Marcus Aurelius · Meditations',translation:'向内看。'};
    }
    const item=randPick(poolItems(libraries.classical?.items||[],theme,state),`c:${theme}:${state}`);
    if(item)return{q:item.text,meta:`${item.author} · ${item.work}`};
    return{q:'山气日夕佳，飞鸟相与还。',meta:'陶渊明 · 饮酒·其五'};
  }

  function refresh(){
    if(typeof stateIndex==='undefined'||typeof states==='undefined')return;
    const state=states[stateIndex]?.key||'stable';
    const theme=typeof activeTheme!=='undefined'?activeTheme:'ocean';
    const mode=selectedMode(),out=renderFor(mode,theme,state);
    const quote=document.querySelector('#stateQuote'),meta=document.querySelector('#stateImagery');
    if(!quote||!meta)return;
    if(mode==='global'&&out.translation){
      quote.innerHTML=`<span>${out.q}</span><small style="display:block;margin-top:10px;font-family:var(--ui);font-size:12px;letter-spacing:0;color:var(--muted)">${out.translation}</small>`;
    }else quote.textContent=out.q;
    meta.textContent=out.meta;
  }
  function patchApplyState(){
    if(typeof window.applyState!=='function')return;
    const base=window.applyState;
    window.applyState=function(){base();refresh();};
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
    if(!librariesReady)librariesReady=loadLibraries();
    await librariesReady;
    renderLibrary();
    document.querySelector('#contentLibraryOverlay')?.classList.add('open');
  }
  function bindLibraryEntry(){
    const panel=document.querySelector('#setting-ai');if(!panel)return;
    const target=panel.querySelector('.content-library-entry')||[...panel.querySelectorAll('.pill')].find(x=>x.textContent.trim()==='内容库');
    if(!target||target.dataset.bound)return;
    target.dataset.bound='1';
    target.style.cursor='pointer';
    target.onclick=openLibrary;
  }
  function removeSessionTextMode(){
    document.querySelector('#textGroup')?.closest('.setup-block')?.remove();
  }

  function bind(){
    removeSessionTextMode();
    patchApplyState();
    librariesReady=loadLibraries();
    setTimeout(bindLibraryEntry,80);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  window.FocusWaveContentEngine={refresh,openLibrary};
})();
