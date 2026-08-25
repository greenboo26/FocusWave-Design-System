/* FocusWave theme copy patch: the former "ocean" theme is now "rain" in product language.
 * Internal key remains ocean to avoid breaking saved prototype settings.
 */
(() => {
  const rainCopy = {
    '专注维持': ['细密的雨纹一圈圈落定。','雨 · 细纹 · 静落'],
    '轻度游移': ['几处涟漪先后散开，注意跟着偏了一瞬。','雨 · 游纹 · 轻落'],
    '状态起伏': ['大圈小圈交错撞开，嘈嘈切切错杂弹。','雨 · 疾落 · 错纹'],
    '重新聚焦': ['雨势渐匀，涟漪重新有了秩序。','雨 · 收纹 · 归静']
  };

  function isRainSelected(){
    return !!document.querySelector('#themeGroup .theme-card.selected[data-value="ocean"]');
  }
  function patchThemeCard(){
    const card=document.querySelector('#themeGroup .theme-card[data-value="ocean"]');
    if(!card)return;
    const b=card.querySelector('b'),small=card.querySelector('small');
    if(b)b.textContent='雨 · 雾蓝';
    if(small)small.textContent='细雨涟漪';
    const mini=card.querySelector('.theme-mini');
    if(mini){
      mini.innerHTML='<i></i><i></i><i></i>';
      mini.style.position='absolute';
      [...mini.children].forEach((el,i)=>{
        const sizes=[18,30,42],top=[19,13,7];
        el.style.cssText=`position:absolute;left:${30-(sizes[i]-18)/2}px;top:${top[i]}px;width:${sizes[i]}px;height:${Math.round(sizes[i]*.62)}px;border:1px solid currentColor;border-radius:50%;opacity:${.72-i*.14};`;
      });
    }
  }
  function patchLiveCopy(){
    if(!isRainSelected())return;
    const title=document.querySelector('#stateTitle')?.textContent?.trim();
    const copy=rainCopy[title];if(!copy)return;
    const q=document.querySelector('#stateQuote'),i=document.querySelector('#stateImagery');
    if(q&&q.textContent!==copy[0])q.textContent=copy[0];
    if(i&&i.textContent!==copy[1])i.textContent=copy[1];
  }
  function install(){
    patchThemeCard();patchLiveCopy();
    const title=document.querySelector('#stateTitle');
    if(title)new MutationObserver(patchLiveCopy).observe(title,{childList:true,characterData:true,subtree:true});
    document.querySelector('#themeGroup')?.addEventListener('click',()=>requestAnimationFrame(()=>{patchThemeCard();patchLiveCopy()}));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();