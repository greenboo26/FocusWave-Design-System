/* FocusWave live-session visual refinements.
 * Keep this layer side-effect-light: no MutationObserver and no global DOM polling.
 */
(() => {
  function install() {
    const liveSession = document.querySelector('#page-live .live-session');
    if (liveSession) {
      [...liveSession.childNodes].forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('LIVE')) {
          node.textContent = node.textContent.replace(/\s*LIVE\s*/g, ' ');
        }
      });
    }

    if (document.querySelector('style[data-focuswave-live-refinements]')) return;
    const style = document.createElement('style');
    style.dataset.focuswaveLiveRefinements = 'true';
    style.textContent = `
      #page-live .state-copy h1{font-size:58px!important}
      #page-live .state-sub{font-size:22px!important;line-height:1.72}
      #page-live .live-focus-index{margin-top:38px!important;gap:12px!important}
      #page-live .live-focus-index span{font-size:14px!important}
      #page-live .live-focus-index strong{font-size:36px!important}
      #page-live .live-focus-index small{font-size:13px!important}
      #page-live #finishBtn{border-color:rgba(158,101,82,.42);background:rgba(158,101,82,.06);color:#956451}
      #page-live #finishBtn:hover{border-color:rgba(158,101,82,.58);background:rgba(158,101,82,.11);color:#835443}
      @media(max-width:720px){
        #page-live .state-copy h1{font-size:50px!important}
        #page-live .state-sub{font-size:20px!important}
        #page-live .live-focus-index span{font-size:13px!important}
        #page-live .live-focus-index strong{font-size:33px!important}
        #page-live .live-focus-index small{font-size:12px!important}
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, {once:true});
  } else {
    install();
  }
})();
