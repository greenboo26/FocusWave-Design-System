/* FocusWave live text engine */
(() => {
  const stateNames={stable:'专注维持',drift:'轻度游移',dispersed:'状态起伏',refocus:'重新聚焦'};
  const minimal={stable:'稳',drift:'游',dispersed:'散',refocus:'归'};
  const themeLabels={ocean:'海',mountain:'山',incense:'线香',dusk:'夕照'};
  const fallbackOriginal={
    ocean:{stable:['潮声很远，手边的事很近。'],drift:['远潮带走一小段目光。'],dispersed:['水面起了碎浪，注意失去了一处落点。'],refocus:['浪声退后，眼前这一处重新显出来。']},
    mountain:{stable:['云影很慢，峰线很清楚。'],drift:['山还在，目光先随云去了。'],dispersed:['山色被雾分成几层，注意也散开了。'],refocus:['雾气渐薄，山脊又连成一线。']},
    incense:{stable:['烟直而轻，注意停留得很安静。'],drift:['烟身轻轻一折，目光随之偏了半步。'],dispersed:['烟在半空散成薄雾，思绪也变得松散。'],refocus:['散开的烟慢慢并回一缕。']},
    dusk:{stable:['暮光铺平，注意安静地落了下来。'],drift:['晚风带走一点余光，目光跟着远了。'],dispersed:['余晖碎在云间，注意也失去了同一方向。'],refocus:['散开的余光慢慢收回桌面。']}
  };
  let libraries={original:null,global:null,classical:null},lastKey='';

  async function loadLibraries(){
    try{
      const [o,g,c]=await Promise.all([
        fetch('./content/original-state-lines.json').then(r=>r.ok?r.json():null),
        fetch('./content/world-public-domain.json').then(r=>r.ok?r.json():null),
        fetch('./content/classical-zh.json').then(r=>r.ok?r.json():null)
      ]);
      libraries={original:o,global:g,classical:c};refresh();bindLibraryEntry();
    }catch(e){console.warn('FocusWave content libraries unavailable',e)}
  }
  function selectedMode(){return document.querySelector('#textGroup .selected')?.dataset.value||'original'}
  function randPick(arr,key){if(!arr?.length)return null;let idx=Math.floor(Math.random()*arr.length);if(arr.length>1&&`${key}:${idx}`===lastKey)idx=(idx+1)%arr.length;lastKey=`${key}:${idx}`;return arr[idx]}
  function poolItems(items,theme,state){if(!items?.length)return[];let pool=items.filter(x=>x.verified!==false&&x.theme?.includes(theme)&&x.state?.includes(state));if(!pool.length)pool=items.filter(x=>x.verified!==false&&x.state?.includes(state));if(!pool.length)pool=items.filter(x=>x.verified!==false&&x.theme?.includes(theme));return pool.length?pool:items.filter(x=>x.verified!==false)}
  function renderFor(mode,theme,state){
    if(mode==='minimal')return{q:minimal[state]||'·',meta:`${themeLabels[theme]} · ${stateNames[state]}`};
    if(mode==='original'){const pool=libraries.original?.themes?.[theme]?.[state]||fallbackOriginal[theme]?.[state]||[''];return{q:randPick(pool,`o:${theme}:${state}`)||'',meta:`原创 · ${themeLabels[theme]}`}}
    if(mode==='global'){const item=randPick(poolItems(libraries.global?.items||[],theme,state),`g:${theme}:${state}`);if(item)return{q:item.original,meta:`${item.author} · ${item.work}`,translation:item.translation_zh||''};return{q:'Look within.',meta:'Marcus Aurelius · Meditations',translation:'向内看。'}}
    const item=randPick(poolItems(libraries.classical?.items||[],theme,state),`c:${theme}:${state}`);if(item)return{q:item.text,meta:`${item.author} · ${item.work}`};return{q:'山气日夕佳，飞鸟相与还。',meta:'陶渊明 · 饮酒·其五'};
  }
  function refresh(){
    if(typeof stateIndex==='undefined'||typeof states==='undefined')return;
    const state=states[stateIndex]?.key||'stable',theme=typeof activeTheme!=='undefined'?activeTheme:'ocean',mode=selectedMode(),out=renderFor(mode,theme,state);
    const quote=document.querySelector('#stateQuote'),meta=document.querySelector('#stateImagery');if(!quote||!meta)return;
    if(mode==='global'&&out.translation)quote.innerHTML=`<span>${out.q}</span><small style="display:block;margin-top:10px;font-family:var(--ui);font-size:12px;letter-spacing:0;color:var(--muted)">${out.translation}</small>`;else quote.textContent=out.q;
    meta.textContent=out.meta;
  }
  function patchApplyState(){if(typeof window.applyState!=='function')return;const base=window.applyState;window.applyState=function(){base();refresh()}}

  function originalCount(){
    const themes=libraries.original?.themes||{};let n=0;
    Object.values(themes).forEach(group=>Object.values(group||{}).forEach(arr=>n+=Array.isArray(arr)?arr.length:0));return n;
  }
  function ensureLibraryModal(){
    if(document.querySelector('#contentLibraryOverlay'))return;
    const overlay=document.createElement('div');overlay.id='contentLibraryOverlay';overlay.className='overlay';
    overlay.innerHTML=`<div class="modal" style="max-height:82vh;overflow:auto"><div class="eyebrow">CONTENT LIBRARY</div><h2>文字内容库</h2><p>这里展示当前原型实际加载的三类内容源。世界文学与中文古典只展示已标记为可用的条目。</p><div id="libraryRows"></div><div class="modal-actions"><button class="ghost" id="closeLibrary">关闭</button></div></div>`;
    document.body.appendChild(overlay);overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.classList.remove('open')});overlay.querySelector('#closeLibrary').onclick=()=>overlay.classList.remove('open');
  }
  function openLibrary(){
    ensureLibraryModal();const overlay=document.querySelector('#contentLibraryOverlay'),rows=overlay.querySelector('#libraryRows');
    const globalItems=libraries.global?.items||[],classicalItems=libraries.classical?.items||[];
    rows.innerHTML=`
      <div class="settings-row"><div><b>原创短句</b><p>按主题 × 注意状态组织，用于当前状态表达。</p></div><span class="pill">${originalCount()} 条</span></div>
      <div class="settings-row"><div><b>世界文学</b><p>${globalItems.slice(0,2).map(x=>`${x.author||''} · ${x.work||''}`).join('；')||'内容加载中'}</p></div><span class="pill">${globalItems.length} 条</span></div>
      <div class="settings-row"><div><b>中文古典</b><p>${classicalItems.slice(0,2).map(x=>`${x.author||''} · ${x.work||''}`).join('；')||'内容加载中'}</p></div><span class="pill">${classicalItems.length} 条</span></div>`;
    overlay.classList.add('open');
  }
  function bindLibraryEntry(){
    const panel=document.querySelector('#setting-ai');if(!panel)return;
    const pills=[...panel.querySelectorAll('.pill')],target=pills.find(x=>x.textContent.trim()==='内容库');if(!target||target.dataset.bound)return;
    target.dataset.bound='1';target.style.cursor='pointer';target.setAttribute('role','button');target.setAttribute('tabindex','0');target.onclick=openLibrary;target.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openLibrary()}};
  }
  function bind(){patchApplyState();document.querySelector('#textGroup')?.addEventListener('click',()=>setTimeout(refresh,0));loadLibraries();setTimeout(bindLibraryEntry,50)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  window.FocusWaveContentEngine={refresh,openLibrary};
})();
