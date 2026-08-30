/* FocusWave live text + interactive content library */
(() => {
  const stateNames={stable:'专注维持',drift:'轻度游移',dispersed:'状态起伏',refocus:'重新聚焦'};
  const minimal={stable:'稳',drift:'游',dispersed:'散',refocus:'归'};
  const themeLabels={ocean:'海',mountain:'山',incense:'线香',dusk:'夕照'};
  const GENERATED_DRAFTS_KEY='focuswave.generatedContentDrafts';
  const fallbackOriginal={
    ocean:{stable:['潮声很远，手边的事很近。'],drift:['远潮带走一小段目光。'],dispersed:['水面起了碎浪，注意失去了一处落点。'],refocus:['浪声退后，眼前这一处重新显出来。']},
    mountain:{stable:['云影很慢，峰线很清楚。'],drift:['山还在，目光先随云去了。'],dispersed:['山色被雾分成几层，注意也散开了。'],refocus:['雾气渐薄，山脊又连成一线。']},
    incense:{stable:['烟直而轻，注意停留得很安静。'],drift:['烟身轻轻一折，目光随之偏了半步。'],dispersed:['烟在半空散成薄雾，思绪也变得松散。'],refocus:['散开的烟慢慢并回一缕。']},
    dusk:{stable:['暮光铺平，注意安静地落了下来。'],drift:['晚风带走一点余光，目光跟着远了。'],dispersed:['余晖碎在云间，注意也失去了同一方向。'],refocus:['散开的余光慢慢收回桌面。']}
  };

  let libraries={original:null,generated:null,global:null,classical:null},lastKey='';
  let libraryCategory='original',libraryItemIndex=0;
  let librariesReady=null;

  async function loadLibraries(){
    try{
      const [o,n,g,c]=await Promise.all([
        fetch('./content/original-state-lines.json').then(r=>r.ok?r.json():null),
        fetch('./content/generated-state-lines.json').then(r=>r.ok?r.json():null),
        fetch('./content/world-public-domain.json').then(r=>r.ok?r.json():null),
        fetch('./content/classical-zh.json').then(r=>r.ok?r.json():null)
      ]);
      libraries={original:o,generated:n,global:g,classical:c};
      refresh(); bindLibraryEntry();
    } catch(e) { console.warn('FocusWave content libraries unavailable',e); }
  }

  function selectedMode(){ return document.querySelector('#textGroup .selected')?.dataset.value || 'original'; }
  function randPick(arr,key){
    if(!arr?.length)return null;
    let idx=Math.floor(Math.random()*arr.length);
    if(arr.length>1&&`${key}:${idx}`===lastKey) idx=(idx+1)%arr.length;
    lastKey=`${key}:${idx}`;
    return arr[idx];
  }
  function poolItems(items,theme,state){
    if(!items?.length)return[];
    let pool=items.filter(x=>x.verified!==false&&x.theme?.includes(theme)&&x.state?.includes(state));
    if(!pool.length) pool=items.filter(x=>x.verified!==false&&x.state?.includes(state));
    if(!pool.length) pool=items.filter(x=>x.verified!==false&&x.theme?.includes(theme));
    return pool.length?pool:items.filter(x=>x.verified!==false);
  }
  function renderFor(mode,theme,state){
    if(mode==='minimal') return {q:minimal[state]||'·',meta:`${themeLabels[theme]} · ${stateNames[state]}`};
    if(mode==='original'){
      const reviewed=libraries.original?.themes?.[theme]?.[state]||fallbackOriginal[theme]?.[state]||[];
      const generated=libraries.generated?.themes?.[theme]?.[state]||[];
      const local=localGeneratedEntries().filter(item=>item.theme===theme&&item.state===state).map(item=>item.text);
      const pool=[...reviewed,...generated,...local];
      return {q:randPick(pool,`o:${theme}:${state}`)||'',meta:`新创 · ${themeLabels[theme]}`};
    }
    if(mode==='global'){
      const item=randPick(poolItems(libraries.global?.items||[],theme,state),`g:${theme}:${state}`);
      if(item) return {q:item.original,meta:`${item.author} · ${item.work}`,translation:item.translation_zh||''};
      return {q:'Look within.',meta:'Marcus Aurelius · Meditations',translation:'向内看。'};
    }
    const item=randPick(poolItems(libraries.classical?.items||[],theme,state),`c:${theme}:${state}`);
    if(item) return {q:item.text,meta:`${item.author} · ${item.work}`};
    return {q:'山气日夕佳，飞鸟相与还。',meta:'陶渊明 · 饮酒·其五'};
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
    } else quote.textContent=out.q;
    meta.textContent=out.meta;
  }
  function patchApplyState(){
    if(typeof window.applyState!=='function')return;
    const base=window.applyState;
    window.applyState=function(){base();refresh();};
  }

  function originalEntries(){
    const out=[];
    const themes=libraries.original?.themes||{};
    Object.entries(themes).forEach(([theme,statesObj])=>{
      Object.entries(statesObj||{}).forEach(([state,arr])=>{
        (arr||[]).forEach(text=>out.push({text,meta:`${themeLabels[theme]||theme} · ${stateNames[state]||state}`,theme,state}));
      });
    });
    return out;
  }
  function localGeneratedEntries(){
    try{return JSON.parse(localStorage.getItem(GENERATED_DRAFTS_KEY)||'[]')}catch{return[]}
  }
  function generatedEntries(){
    const out=[];
    const themes=libraries.generated?.themes||{};
    Object.entries(themes).forEach(([theme,statesObj])=>{
      Object.entries(statesObj||{}).forEach(([state,arr])=>{
        (arr||[]).forEach((text,index)=>out.push({text,meta:`${themeLabels[theme]||theme} · ${stateNames[state]||state}`,theme,state,source:`内容批次 ${libraries.generated?.version||'0.2'} · ${index+1}`}));
      });
    });
    return [...out,...localGeneratedEntries()];
  }
  function entriesFor(category){
    if(category==='original') return originalEntries();
    if(category==='generated') return generatedEntries();
    if(category==='global') return (libraries.global?.items||[]).filter(x=>x.verified!==false).map(x=>({
      text:x.original||'', translation:x.translation_zh||'', meta:[x.author,x.work].filter(Boolean).join(' · '), source:x.verified_source||x.source||'', raw:x
    }));
    return (libraries.classical?.items||[]).filter(x=>x.verified!==false).map(x=>({
      text:x.text||'', translation:'', meta:[x.author,x.work].filter(Boolean).join(' · '), source:x.verified_source||x.source||'', raw:x
    }));
  }
  function categoryLabel(category){return category==='original'?'原创短句':category==='generated'?'新创短句':category==='global'?'世界文学':'中文古典';}
  function categoryMode(category){return category==='original'||category==='generated'?'original':category==='global'?'global':'classical';}
  function categoryCoverage(category){
    if(category==='original'||category==='generated')return '16 组';
    return `${entriesFor(category).length} 条`;
  }

  function ensureLibraryStyles(){
    if(document.querySelector('style[data-focuswave-library-ui]'))return;
    const style=document.createElement('style');
    style.dataset.focuswaveLibraryUi='true';
    style.textContent=`
      #contentLibraryOverlay .library-modal{width:min(980px,92vw);max-height:84vh;overflow:hidden;padding:34px 38px 28px}
      #contentLibraryOverlay .library-grid{display:grid;grid-template-columns:290px 1fr;gap:34px;border-top:1px solid var(--hair);margin-top:18px;padding-top:18px;min-height:430px}
      #contentLibraryOverlay .library-cats{border-right:1px solid var(--hair);padding-right:28px}
      #contentLibraryOverlay .library-cat{width:100%;border:0;border-bottom:1px solid var(--hair);background:transparent;text-align:left;padding:16px 4px;cursor:pointer;color:var(--ink);display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center}
      #contentLibraryOverlay .library-cat b{font-size:15px;font-weight:450}.library-cat small{display:block;color:var(--muted);font-size:11px;margin-top:5px;line-height:1.5}
      #contentLibraryOverlay .library-cat.active{background:rgba(41,51,47,.035)}
      #contentLibraryOverlay .library-count{border:1px solid var(--hair);border-radius:999px;padding:5px 9px;font-size:10px;color:var(--muted)}
      #contentLibraryOverlay .library-right{min-width:0;display:grid;grid-template-rows:auto 1fr auto;gap:14px}
      #contentLibraryOverlay .library-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
      #contentLibraryOverlay .library-generate{white-space:nowrap;height:34px;padding:0 12px}
      #contentLibraryOverlay .library-list{overflow:auto;max-height:300px;padding-right:5px}
      #contentLibraryOverlay .library-item{width:100%;display:block;border:1px solid var(--hair);border-radius:14px;background:transparent;text-align:left;padding:13px 14px;margin-bottom:9px;cursor:pointer;color:var(--ink)}
      #contentLibraryOverlay .library-item.active{border-color:#8a9d93;background:rgba(127,149,138,.045)}
      #contentLibraryOverlay .library-item b{font-size:13px;font-weight:450;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #contentLibraryOverlay .library-item span{font-family:var(--human);font-size:15px;line-height:1.55;display:block;margin-top:6px;color:#45504b}
      #contentLibraryOverlay .library-detail{border-top:1px solid var(--hair);padding-top:15px;min-height:98px}
      #contentLibraryOverlay .library-detail .detail-text{font-family:var(--human);font-size:18px;line-height:1.65;margin:0 0 7px}
      #contentLibraryOverlay .library-detail .detail-meta{font-size:11px;color:var(--muted);line-height:1.65}
      #contentLibraryOverlay .library-actions{display:flex;gap:10px;align-items:center;justify-content:space-between}
      @media(max-width:760px){#contentLibraryOverlay .library-grid{grid-template-columns:1fr}.library-cats{border-right:0!important;padding-right:0!important}.library-right{min-height:360px}}
    `;
    document.head.appendChild(style);
  }

  function ensureLibraryModal(){
    if(document.querySelector('#contentLibraryOverlay'))return;
    ensureLibraryStyles();
    const overlay=document.createElement('div');
    overlay.id='contentLibraryOverlay';overlay.className='overlay';
    overlay.innerHTML=`
      <div class="modal library-modal">
        <div class="eyebrow">CONTENT LIBRARY</div>
        <h2>文字内容库</h2>
        <p>查看当前原型实际加载的内容，并按类别进入条目详情。</p>
        <div class="library-grid">
          <div class="library-cats" id="libraryCategories"></div>
          <div class="library-right">
            <div class="library-head"><div><b id="libraryHeading" style="font-size:15px;font-weight:450"></b><p id="libraryHint" style="margin:5px 0 0"></p></div><button class="ghost library-generate" id="generateLibraryBatch" type="button" hidden>生成一组草稿</button></div>
            <div class="library-list" id="libraryList"></div>
            <div class="library-detail" id="libraryDetail"></div>
          </div>
        </div>
        <div class="library-actions">
          <button class="ghost" id="closeLibrary">关闭</button>
          <button class="ghost" id="useLibraryMode">本次使用此模式</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.classList.remove('open')});
    overlay.querySelector('#closeLibrary').onclick=()=>overlay.classList.remove('open');
    overlay.querySelector('#useLibraryMode').onclick=()=>{
      const mode=categoryMode(libraryCategory);
      const group=document.querySelector('#textGroup');
      group?.querySelectorAll('[data-value]').forEach(b=>b.classList.toggle('selected',b.dataset.value===mode));
      refresh();
    };
  }

  function renderLibrary(){
    ensureLibraryModal();
    const overlay=document.querySelector('#contentLibraryOverlay');
    const categories=overlay.querySelector('#libraryCategories');
    const data=[
      {key:'original',label:'原创短句',desc:'按主题 × 注意状态组织。'},
      {key:'generated',label:'新创短句',desc:'可离线批量生成并继续筛选。'},
      {key:'global',label:'世界文学',desc:'公版或已核验可用条目。'},
      {key:'classical',label:'中文古典',desc:'核验原文与作者作品。'}
    ];
    categories.innerHTML=data.map(d=>{
      return `<button class="library-cat ${libraryCategory===d.key?'active':''}" data-cat="${d.key}"><span><b>${d.label}</b><small>${d.desc}</small></span><span class="library-count">${categoryCoverage(d.key)}</span></button>`;
    }).join('');
    categories.querySelectorAll('[data-cat]').forEach(btn=>btn.onclick=()=>{libraryCategory=btn.dataset.cat;libraryItemIndex=0;renderLibrary();});

    const entries=entriesFor(libraryCategory);
    const heading=overlay.querySelector('#libraryHeading'),hint=overlay.querySelector('#libraryHint'),list=overlay.querySelector('#libraryList'),detail=overlay.querySelector('#libraryDetail'),generate=overlay.querySelector('#generateLibraryBatch');
    heading.textContent=`${categoryLabel(libraryCategory)} · 预览 (${entries.length} 条)`;
    hint.textContent=libraryCategory==='generated'?'生成不必发生在专注过程中；草稿保存在当前浏览器，筛选后再进入正式内容库。':'点击任一条目查看完整内容与来源信息。';
    generate.hidden=libraryCategory!=='generated';generate.disabled=false;generate.textContent='生成一组草稿';generate.onclick=generateContentBatch;
    list.innerHTML=entries.slice(0,64).map((item,i)=>`<button class="library-item ${i===libraryItemIndex?'active':''}" data-index="${i}"><b>${item.meta||categoryLabel(libraryCategory)}</b><span>${item.text}</span></button>`).join('') || '<p>内容加载中。</p>';
    list.querySelectorAll('[data-index]').forEach(btn=>btn.onclick=()=>{libraryItemIndex=Number(btn.dataset.index);renderLibrary();});
    const item=entries[libraryItemIndex]||entries[0];
    if(item){
      detail.innerHTML=`<div class="detail-text">${item.text}</div>${item.translation?`<div class="detail-meta">${item.translation}</div>`:''}<div class="detail-meta">${item.meta||''}${item.source?`<br>来源：${item.source}`:''}</div>`;
    } else detail.innerHTML='<div class="detail-meta">暂无可用条目。</div>';
  }

  async function generateContentBatch(){
    const button=document.querySelector('#generateLibraryBatch');if(!button)return;
    const adapter=window.FocusWaveAIAdapter;
    if(!adapter?.generateContentBatch){button.textContent='生成器尚未就绪';return}
    button.disabled=true;button.textContent='正在生成';
    try{
      const drafts=await adapter.generateContentBatch({count:8});
      const existing=localGeneratedEntries();
      localStorage.setItem(GENERATED_DRAFTS_KEY,JSON.stringify([...drafts,...existing].slice(0,80)));
      libraryItemIndex=0;renderLibrary();
    } catch(error){
      button.disabled=false;button.textContent='重试生成';
    }
  }

  async function openLibrary(){
    if(!librariesReady)librariesReady=loadLibraries();
    await librariesReady;
    renderLibrary();document.querySelector('#contentLibraryOverlay').classList.add('open');
  }
  function bindLibraryEntry(){
    const panel=document.querySelector('#setting-ai');if(!panel)return;
    const target=panel.querySelector('.content-library-entry')||[...panel.querySelectorAll('.pill')].find(x=>x.textContent.trim()==='内容库');
    if(!target||target.dataset.bound)return;
    target.dataset.bound='1';target.style.cursor='pointer';target.onclick=openLibrary;
  }

  function bind(){
    patchApplyState();
    document.querySelector('#textGroup')?.addEventListener('click',()=>setTimeout(refresh,0));
    librariesReady=loadLibraries();
    setTimeout(bindLibraryEntry,80);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  window.FocusWaveContentEngine={refresh,openLibrary};
})();
