/* FocusWave homepage concept carousel.
 * Captures the lightweight built-in line renderer for the homepage so later
 * page-specific visual engines cannot change the approved concept carousel.
 */
(() => {
  const slides = [
    {
      key:'stable',
      title:'专注维持',
      body:'状态较稳定。注意停留在手边这件事上，线条保持连续、舒展而有秩序。',
      stat:'概念状态 · 专注维持',
      state:{key:'stable',amp:.40,disorder:.08},
      lines:72, alpha:.27, t:.18
    },
    {
      key:'dispersed',
      title:'明显分散',
      body:'注意正在外散。局部流向彼此竞争，原本连续的秩序出现更多卷曲与扰动。',
      stat:'概念状态 · 明显分散',
      state:{key:'dispersed',amp:1.03,disorder:.86},
      lines:78, alpha:.29, t:.72
    },
    {
      key:'refocus',
      title:'重新聚焦',
      body:'注意正在回来。复杂的局部扰动逐渐收束，线条重新汇入更清楚的共同方向。',
      stat:'概念状态 · 重新聚焦',
      state:{key:'refocus',amp:.62,disorder:.24},
      lines:74, alpha:.28, t:.46
    }
  ];

  function init(){
    const page=document.querySelector('#page-today');
    const canvas=document.querySelector('#todayCanvas');
    const art=document.querySelector('.today-art');
    const copy=document.querySelector('.today-copy');
    const title=copy?.querySelector('h1');
    const body=copy?.querySelector('p');
    const tiny=document.querySelector('.tiny-stat');
    if(!page||!canvas||!art||!copy||!title||!body||typeof window.drawField!=='function')return;

    const conceptRenderer=window.drawField.bind(window);
    const style=document.createElement('style');
    style.textContent=`
      .today-art{overflow:hidden}
      .today-art canvas{transition:opacity .75s ease,transform 1.35s cubic-bezier(.22,.61,.36,1);transform:scale(1)}
      .today-copy h1,.today-copy p{transition:opacity .55s ease,transform .75s cubic-bezier(.22,.61,.36,1)}
      .today-art.concept-fading canvas{opacity:.12;transform:scale(1.008)}
      .today-copy.concept-fading h1,.today-copy.concept-fading p{opacity:.16;transform:translateY(4px)}
      .concept-dots{position:absolute;left:0;bottom:13px;display:flex;gap:7px;z-index:3}
      .concept-dot{width:22px;height:18px;border:0;background:transparent;padding:0;cursor:pointer;position:relative}
      .concept-dot:before{content:"";position:absolute;left:7px;top:8px;width:8px;height:1px;background:rgba(41,51,47,.24);transition:.28s}
      .concept-dot.active:before{width:15px;left:3px;background:rgba(41,51,47,.62)}
      @media (prefers-reduced-motion:reduce){.today-art canvas,.today-copy h1,.today-copy p{transition:none!important}.concept-dots{display:none}}
    `;
    document.head.appendChild(style);

    const dots=document.createElement('div');
    dots.className='concept-dots';
    dots.setAttribute('aria-label','首页概念状态');
    slides.forEach((s,i)=>{
      const b=document.createElement('button');
      b.className='concept-dot';
      b.type='button';
      b.title=s.title;
      b.setAttribute('aria-label',s.title);
      b.addEventListener('click',()=>{stop();show(i,true);start();});
      dots.appendChild(b);
    });
    art.appendChild(dots);

    let index=0,timer=0,transition=0;
    function paint(slide){
      conceptRenderer(canvas,{theme:'ocean',state:slide.state,lines:slide.lines,alpha:slide.alpha,t:slide.t});
      title.textContent=slide.title;
      body.textContent=slide.body;
      if(tiny)tiny.textContent=slide.stat;
      [...dots.children].forEach((d,i)=>d.classList.toggle('active',i===index));
    }
    function repaint(){requestAnimationFrame(()=>paint(slides[index]));}
    function show(next,animate){
      index=(next+slides.length)%slides.length;
      clearTimeout(transition);
      if(!animate){paint(slides[index]);return}
      art.classList.add('concept-fading');
      copy.classList.add('concept-fading');
      transition=setTimeout(()=>{
        paint(slides[index]);
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
          art.classList.remove('concept-fading');
          copy.classList.remove('concept-fading');
        }));
      },430);
    }
    function start(){
      if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      stop();
      timer=setInterval(()=>{
        if(document.hidden||!page.classList.contains('active'))return;
        show(index+1,true);
      },7600);
    }
    function stop(){clearInterval(timer);timer=0}

    art.addEventListener('mouseenter',stop);
    art.addEventListener('mouseleave',start);
    window.addEventListener('resize',()=>{if(page.classList.contains('active'))setTimeout(repaint,40)});
    new MutationObserver(()=>{
      if(page.classList.contains('active')){setTimeout(repaint,30);start();}
      else stop();
    }).observe(page,{attributes:true,attributeFilter:['class']});
    document.addEventListener('visibilitychange',()=>document.hidden?stop():(repaint(),start()));
    show(0,false);
    start();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
