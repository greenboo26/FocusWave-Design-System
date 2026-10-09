/* Regression checks for actual AI output and asynchronous homepage library loads.
 * No packages required: node --test scripts/test-integration.cjs
 * Browser interaction/lifecycle checks complement these tests.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=name=>fs.readFileSync(path.join(__dirname,'../prototype/daily-focus-v1',name),'utf8');

test('local reflection follows supplied duration and practice count without invented comparisons',async()=>{
  const sandbox={window:{},document:{readyState:'loading',addEventListener(){}},setTimeout:fn=>fn(),Date};
  vm.runInNewContext(source('ai-assistant-controller.js'),sandbox);
  const output=await sandbox.window.FocusWaveAIAdapter.explainSession({session_id:7,task:'代码审查',duration_minutes:1,practice_count:0,effective_focus_percent:62,valid_signal_coverage_percent:88},'reflection');
  assert.equal(output.headline,'代码审查：1 分钟，主动练习 0 次。');
  assert.match(output.body,/62%.*88%/);
  assert.doesNotMatch(output.headline,/中后段|几次游移|更稳/);
  assert.equal(output.provenance.session_id,7);
  assert.match(output.provenance.provider,/示例数据/);
});

function homepage(){
  const listeners=new Map(),pending=new Map();
  let selectedMode='global';
  function element(html=''){
    let content=html;
    const e={children:[],dataset:{},classList:{contains:()=>true,add(){},remove(){},toggle(){}},
      appendChild(child){this.children.push(child)},addEventListener(){},setAttribute(){},removeAttribute(){},querySelector(){return null},closest(){return null},remove(){}};
    Object.defineProperties(e,{innerHTML:{get:()=>content,set:value=>content=value},textContent:{get:()=>content,set:value=>content=value}});
    return e;
  }
  const title=element('原始首页标题'),body=element('原始首页说明'),copy=element();
  copy.querySelector=s=>s==='h1'?title:s==='p'?body:null;
  const map={'#page-today':element(),'#todayCanvas':element(),'.today-art':element(),'.today-copy':copy,'.tiny-stat':element()};
  const window={drawField(){},addEventListener:(name,fn)=>listeners.set(name,fn)};
  const sandbox={window,document:{readyState:'complete',hidden:false,head:element(),querySelector:s=>map[s]||null,createElement:()=>element(),addEventListener(){}},
    localStorage:{getItem:()=>selectedMode},fetch:url=>new Promise(resolve=>pending.set(url,resolve)),matchMedia:()=>({matches:true}),
    MutationObserver:class{observe(){}},performance:{now:()=>0},requestAnimationFrame:fn=>{fn(0);return 1},cancelAnimationFrame(){},setInterval:()=>1,clearInterval(){},setTimeout:fn=>{fn();return 1},clearTimeout(){}};
  vm.runInNewContext(source('home-concept-carousel.js'),sandbox);
  return {title,body,choose(value){selectedMode=value;listeners.get('focuswave:text-mode-changed')()},respond(file,data){const resolve=pending.get('./content/'+file);assert.ok(resolve,'expected pending request '+file);pending.delete('./content/'+file);resolve({ok:true,json:async()=>data})}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('a late library response cannot replace the latest chosen mode',async()=>{
  const page=homepage(); // world library request is still pending
  page.choose('original');
  page.respond('original-state-lines.json',{themes:{ocean:{stable:['最新原创']}}});
  page.respond('generated-state-lines.json',{provenance:{review_status:'prototype-curated'},themes:{}});
  await settle();
  assert.equal(page.title.textContent,'最新原创');
  page.respond('world-public-domain.json',{items:[{verified:true,translation_zh:'过期世界文学',author:'过期作者'}]});
  await settle();
  assert.equal(page.title.textContent,'最新原创');
  assert.equal(page.body.textContent,'FocusWave 原创短句');
});

test('minimal survives pending responses and unverified literature is excluded',async()=>{
  const page=homepage();
  page.choose('minimal');
  page.respond('world-public-domain.json',{items:[{verified:true,translation_zh:'迟到文本'}]});
  await settle();
  assert.equal(page.title.textContent,'原始首页标题');
  page.choose('global');
  page.respond('world-public-domain.json',{items:[{verified:false,translation_zh:'未经审核文本'}]});
  await settle();
  assert.equal(page.title.textContent,'原始首页标题');
});
