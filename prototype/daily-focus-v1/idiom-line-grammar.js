/* FocusWave idiom line grammar v1
 * Theme supplies the base field; AttentionState supplies intensity/speed;
 * this layer supplies local motion grammar.
 */
window.FocusWaveIdiomGrammar = (() => {
  const grammars = {
    stable: { id:'single-course', label:'心无旁骛' },
    drift: { id:'passing-glance', label:'走马观花' },
    dispersed: { id:'competing-currents', label:'心猿意马' },
    refocus: { id:'returning-one', label:'收心归一' }
  };

  function petal(x,y,cx,cy,w,h,t,phase,strength){
    const dx=(x-cx)/w, dy=(y-cy)/h;
    const r=Math.sqrt(dx*dx+dy*dy);
    if(r>.115) return {dx:0,dy:0};
    const a=Math.atan2(dy,dx);
    const envelope=Math.exp(-r*r*130)*strength;
    const petals=Math.sin(a*4 + phase + t*.55);
    return {dx:Math.cos(a)*w*.018*envelope*petals,dy:Math.sin(a)*h*.030*envelope*petals};
  }
  function stable(x,y,w,h,t,lineIndex){
    const breathe=Math.sin(t*.12 + lineIndex*.025)*h*.0018;
    return {dx:0,dy:breathe};
  }
  function passingGlance(x,y,w,h,t,lineIndex,seed=0){
    const xn=x/w,sweep=Math.exp(-Math.pow((xn-.46)/.22,2));
    let dx=w*.010*sweep*Math.sin(t*.75+lineIndex*.08),dy=h*.005*sweep*Math.sin(t*.54+lineIndex*.11);
    const c1=petal(x,y,w*.58,h*.38,w,h,t,seed*.31,.82),c2=petal(x,y,w*.73,h*.67,w,h,t,seed*.47+1.3,.58);
    dx+=c1.dx+c2.dx;dy+=c1.dy+c2.dy;return {dx,dy};
  }
  function competingCurrents(x,y,w,h,t,lineIndex,seed=0){
    const points=[{x:w*.36,y:h*.37,s:1},{x:w*.69,y:h*.64,s:-1}];let ox=0,oy=0;
    points.forEach((p,k)=>{const dx=(x-p.x)/w,dy=(y-p.y)/h,r2=dx*dx+dy*dy+.012,e=Math.exp(-r2*19),a=Math.atan2(dy,dx)+p.s*(.8+.16*Math.sin(t*.7+k));ox+=Math.cos(a)*w*.026*e*(.62+.22*Math.sin(lineIndex*.17+k+seed));oy+=Math.sin(a)*h*.038*e*(.62+.22*Math.cos(lineIndex*.13+k));});
    return {dx:ox,dy:oy};
  }
  function returningOne(x,y,w,h,t,lineIndex){
    const xn=x/w,convergence=Math.max(0,Math.min(1,(xn-.18)/.68)),center=h*.5;
    return {dx:0,dy:(center-y)*.022*convergence+Math.sin(t*.22+lineIndex*.13)*h*.004*(1-convergence)};
  }
  function offset(stateKey,x,y,w,h,t,lineIndex,seed=0){
    if(stateKey==='stable')return stable(x,y,w,h,t,lineIndex);
    if(stateKey==='drift')return passingGlance(x,y,w,h,t,lineIndex,seed);
    if(stateKey==='dispersed')return competingCurrents(x,y,w,h,t,lineIndex,seed);
    return returningOne(x,y,w,h,t,lineIndex);
  }
  return {grammars,offset};
})();

// Keep homepage boot deliberately small. Heavy page runtimes are loaded on demand
// by settings-controller.js only after the user enters the corresponding flow.
import('./theme-rain-controller.js?v=3');
const settingsReady = import('./settings-controller.js?v=8');
settingsReady.then(() => import('./ai-assistant-controller.js?v=5'));
import('./navigation-controller.js?v=2');
import('./home-concept-carousel.js?v=6');
