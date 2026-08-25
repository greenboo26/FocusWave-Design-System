/* FocusWave product-language patch: internal key remains "ocean", UI theme is "rain". */
(() => {
  const rainCopy = {
    '专注维持': ['细密雨纹有节律地一圈圈落定。','雨 · 细纹 · 静落'],
    '轻度游移': ['几处大小不同的涟漪先后散开。','雨 · 游纹 · 轻落'],
    '状态起伏': ['大圈小圈交错撞开，嘈嘈切切错杂弹。','雨 · 疾落 · 错纹'],
    '重新聚焦': ['雨势渐匀，涟漪重新收回秩序。','雨 · 收纹 · 归静']
  };

  function isRainSelected(){
    return !!document.querySelector('#themeGroup .theme-card.selected[data-value="ocean"]');
  }
  function patchThemeCard(){
    const card=document.querySelector('#themeGroup .theme-card[data-value="ocean"]');
    if(!card)return;
    const b=card.querySelector('b'),small=card.querySelector('small');
    if(b)b.textContent='雨 · 青灰';
    if(small)small.textContent='落雨涟漪';
    const mini=card.querySelector('.theme-mini');
    if(mini){
      mini.classList.remove('ocean-mini');
      mini.innerHTML='<i></i><i></i><i></i>';
      mini.style.position='absolute';
      [...mini.children].forEach((el,i)=>{
        const sizes=[16,28,42],left=[31,25,18],top=[20,14,7];
        el.style.cssText=`position:absolute;left:${left[i]}px;top:${top[i]}px;width:${sizes[i]}px;height:${sizes[i]}px;border:1px solid currentColor;border-radius:50%;opacity:${.78-i*.16};background:transparent;transform:none;`;
      });
    }
  }
  function patchLiveCopy(){
    if(!isRainSelected())return;
    const title=document.querySelector('#stateTitle')?.textContent?.trim();
    const copy=rainCopy[title];if(!copy)return;
    const q=document.querySelector('#stateQuote'),i=document.querySelector('#stateImagery');
    if(q)q.textContent=copy[0];
    if(i)i.textContent=copy[1];
  }
  function patch(){patchThemeCard();patchLiveCopy();}
  function install(){
    patch();
    const root=document.querySelector('#themeGroup');
    if(root){
      root.addEventListener('click',()=>requestAnimationFrame(patch));
      new MutationObserver(patch).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }
    const title=document.querySelector('#stateTitle');
    if(title)new MutationObserver(patchLiveCopy).observe(title,{childList:true,characterData:true,subtree:true});
    setTimeout(patch,50);setTimeout(patch,300);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();