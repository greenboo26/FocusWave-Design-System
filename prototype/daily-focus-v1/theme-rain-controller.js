/* FocusWave product-language patch: internal key remains "ocean", UI theme is "rain".
 * Keep this controller deliberately passive: no global MutationObserver loops.
 */
(() => {
  function patchThemeCard(){
    const card=document.querySelector('#themeGroup .theme-card[data-value="ocean"]');
    if(!card)return;
    const b=card.querySelector('b');
    if(b)b.textContent='雨 · 青灰';
    card.querySelector('small')?.remove();

    const mini=card.querySelector('.theme-mini');
    if(mini && mini.dataset.rainPatched!=='true'){
      mini.dataset.rainPatched='true';
      mini.classList.remove('ocean-mini');
      mini.innerHTML='<i></i><i></i><i></i>';
      mini.style.position='absolute';
      [...mini.children].forEach((el,i)=>{
        const sizes=[16,28,42],left=[31,25,18],top=[20,14,7];
        el.style.cssText=`position:absolute;left:${left[i]}px;top:${top[i]}px;width:${sizes[i]}px;height:${sizes[i]}px;border:1px solid currentColor;border-radius:50%;opacity:${.78-i*.16};background:transparent;transform:none;`;
      });
    }
  }

  function patchFocusPracticeCopy(){
    const overlay=document.querySelector('#focusCountPracticeOverlay');
    if(!overlay)return;
    const eyebrow=overlay.querySelector('.breath-stage .eyebrow');
    const title=overlay.querySelector('#focusPracticeTitle');
    const guide=overlay.querySelector('.practice-guide');
    if(eyebrow)eyebrow.textContent='60s 专注练习';
    if(title)title.textContent='呼吸锚定';
    overlay.querySelector('.practice-reminder')?.remove();
    if(guide)guide.textContent='跟随圆环，吸气 4 秒，呼气 6 秒，循环6次';
    overlay.querySelector('#practiceNoiseToggle')?.remove();
  }

  function patchPracticeSoon(){
    requestAnimationFrame(()=>{
      patchFocusPracticeCopy();
      setTimeout(patchFocusPracticeCopy,60);
      setTimeout(patchFocusPracticeCopy,180);
    });
  }

  function install(){
    patchThemeCard();
    patchFocusPracticeCopy();

    document.querySelector('#themeGroup')?.addEventListener('click',()=>requestAnimationFrame(patchThemeCard));

    // The focus runtime is loaded lazily. Patch its practice overlay only after
    // user actions that can create/open it instead of observing the whole DOM.
    document.addEventListener('click',event=>{
      if(event.target?.closest?.('#startFocus,#practiceToSetup,#regBtn,#mindWanderPractice')) patchPracticeSoon();
    },{passive:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
