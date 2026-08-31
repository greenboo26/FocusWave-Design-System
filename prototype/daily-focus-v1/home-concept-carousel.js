/* FocusWave homepage concept carousel.
 * Captures the lightweight built-in line renderer for the homepage so later
 * page-specific visual engines cannot change the approved concept carousel.
 */
(() => {
  const slides = [
    {
      key:'stable',
      theme:'ocean',
      title:'专注维持',
      body:'状态较稳定。注意停留在手边这件事上，线条保持连续、舒展而有秩序。',
      stat:'概念状态 · 专注维持',
      state:{key:'stable',amp:.68,disorder:.10},
      lines:62, alpha:.37, t:.18, motion:1.10
    },
    {
      key:'dispersed',
      theme:'incense',
      title:'明显分散',
      body:'注意正在外散。局部流向彼此竞争，原本连续的秩序出现更多卷曲与扰动。',
      stat:'概念状态 · 明显分散',
      state:{key:'dispersed',amp:1.48,disorder:1.24},
      lines:78, alpha:.41, t:.72, motion:1.80
    },
    {
      key:'refocus',
      theme:'mountain',
      title:'重新聚焦',
      body:'注意正在回来。复杂的局部扰动逐渐收束，线条重新汇入更清楚的共同方向。',
      stat:'概念状态 · 重新聚焦',
      state:{key:'refocus',amp:.92,disorder:.38},
      lines:68, alpha:.39, t:.46, motion:1.35
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
    const fallbackLiterature=[
      {text:'行到水穷处，坐看云起时。',sub:'王维 · 《终南别业》',theme:'mountain'},
      {text:'永恒，由一个个此刻组成。',sub:'Emily Dickinson · Forever – is composed of Nows –',theme:'dusk'},
      {text:'在此刻，把手边之事做好就已经足够。',sub:'Marcus Aurelius · Meditations',theme:'incense'},
      {text:'我走进树林，因为我想有意识地生活。',sub:'Henry David Thoreau · Walden',theme:'ocean'}
    ];
    let literature=fallbackLiterature.slice(),lastLiteratureId='';
    function normalizedLiterature(world,classical){
      return [
        ...(world?.items||[]).map(item=>({id:item.id,text:item.translation_zh||item.original,sub:`${item.author} · ${item.work}`,theme:item.theme?.[0]})),
        ...(classical?.items||[]).map(item=>({id:item.id,text:item.text,sub:`${item.author} · 《${item.work}》`,theme:item.theme?.[0]}))
      ].filter(item=>item.text&&item.sub);
    }
    async function loadLiterature(){
      try{
        const [world,classical]=await Promise.all([
          fetch('./content/world-public-domain.json').then(response=>response.ok?response.json():null),
          fetch('./content/classical-zh.json').then(response=>response.ok?response.json():null)
        ]);
        const items=normalizedLiterature(world,classical);
        if(items.length)literature=items;
      }catch(_){/* Use the small built-in literary fallback when offline. */}
    }
    function takeLiterature(theme){
      const themed=literature.filter(item=>item.theme===theme);
      const pool=themed.length?themed:literature;
      let item=pool[Math.floor(Math.random()*pool.length)]||fallbackLiterature[0];
      if(pool.length>1&&item.id===lastLiteratureId)item=pool[(pool.indexOf(item)+1)%pool.length];
      lastLiteratureId=item.id||item.text;
      return item;
    }
    const style=document.createElement('style');
    style.textContent=`
      .today-art{overflow:hidden;background:radial-gradient(ellipse at 58% 54%,rgba(123,153,139,.075),transparent 54%)}
      .today-art canvas{transition:opacity .75s ease,transform 1.35s cubic-bezier(.22,.61,.36,1);transform:scale(1)}
      .today-art:after{content:"";position:absolute;inset:12% 5%;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(247,244,237,.32) 48%,transparent);mix-blend-mode:screen;opacity:.52;animation:fw-home-sheen 8s ease-in-out infinite alternate}
      @keyframes fw-home-sheen{from{transform:translateX(-7%)}to{transform:translateX(7%)}}
      .today-copy h1,.today-copy p{transition:opacity .55s ease,transform .75s cubic-bezier(.22,.61,.36,1)}
      .today-art.concept-fading canvas{opacity:.12;transform:scale(1.008)}
      .today-copy.concept-fading h1,.today-copy.concept-fading p{opacity:.16;transform:translateY(4px)}
      .concept-dots{position:absolute;left:0;bottom:13px;display:flex;gap:7px;z-index:3}
      .concept-dot{width:22px;height:18px;border:0;background:transparent;padding:0;cursor:pointer;position:relative}
      .concept-dot:before{content:"";position:absolute;left:7px;top:8px;width:8px;height:1px;background:rgba(41,51,47,.24);transition:.28s}
      .concept-dot.active:before{width:15px;left:3px;background:rgba(41,51,47,.62)}
      @media (prefers-reduced-motion:reduce){.today-art canvas,.today-copy h1,.today-copy p{transition:none!important}.today-art:after{animation:none}.concept-dots{display:none}}
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

    let index=0,timer=0,transition=0,motionRaf=0,motionStart=performance.now(),bag=[];
    function refillBag(previous=-1){
      bag=slides.map((_,i)=>i);
      for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}
      if(bag.length>1&&bag[0]===previous)[bag[0],bag[1]]=[bag[1],bag[0]];
    }
    function nextRandom(){if(!bag.length)refillBag(index);return bag.shift()}
    function drawSlide(slide,t=slide.t){
      conceptRenderer(canvas,{theme:slide.theme,state:slide.state,lines:slide.lines,alpha:slide.alpha,t});
    }
    function paint(slide){
      const quote=takeLiterature(slide.theme);
      drawSlide(slide);
      title.textContent=quote.text;
      body.textContent=quote.sub;
      if(tiny)tiny.textContent='随机文学库';
      [...dots.children].forEach((d,i)=>d.classList.toggle('active',i===index));
    }
    function repaint(){requestAnimationFrame(()=>paint(slides[index]));}
    function show(next,animate){
      index=(next+slides.length)%slides.length;
      motionStart=performance.now();
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
      motionStart=performance.now();
      const motion=now=>{
        if(document.hidden||!page.classList.contains('active'))return;
        const slide=slides[index];
        drawSlide(slide,slide.t+(now-motionStart)/1000*slide.motion);
        motionRaf=requestAnimationFrame(motion);
      };
      motionRaf=requestAnimationFrame(motion);
      timer=setInterval(()=>{
        if(document.hidden||!page.classList.contains('active'))return;
        show(nextRandom(),true);
      },7600);
    }
    function stop(){clearInterval(timer);cancelAnimationFrame(motionRaf);timer=0;motionRaf=0}

    art.addEventListener('mouseenter',stop);
    art.addEventListener('mouseleave',start);
    window.addEventListener('resize',()=>{if(page.classList.contains('active'))setTimeout(repaint,40)});
    new MutationObserver(()=>{
      if(page.classList.contains('active')){setTimeout(repaint,30);start();}
      else stop();
    }).observe(page,{attributes:true,attributeFilter:['class']});
    document.addEventListener('visibilitychange',()=>document.hidden?stop():(repaint(),start()));
    refillBag(-1);
    loadLiterature().finally(()=>{show(nextRandom(),false);start();});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
