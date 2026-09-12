/* FocusWave WebGL karesansui garden v1.
 * True 3D tray, sand and reward stones with drag-to-orbit interaction.
 * The existing 2D garden remains as a fallback if WebGL/Three.js cannot load.
 * No MutationObserver and no DOM polling.
 */
(() => {
  if (window.FocusWaveThreeGarden) return;

  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.177.0/build/three.module.js';
  const SAND_W = 9.6;
  const SAND_D = 5.6;
  const SIZE_SCALE = {
    small:  {x:.38,y:.25,z:.34,rings:4},
    medium: {x:.55,y:.34,z:.49,rings:5},
    large:  {x:.74,y:.45,z:.66,rings:6}
  };

  let THREE = null;
  let threePromise = null;
  let mounted = false;
  let mount = null;
  let renderer = null;
  let scene = null;
  let camera = null;
  let stoneGroup = null;
  let grooveGroup = null;
  let animationFrame = 0;
  let resizeFrame = 0;
  let midnightTimer = 0;

  const orbit = {
    azimuth: -0.42,
    elevation: 0.72,
    distance: 11.8,
    targetY: -.08,
    dragging: false,
    pointerId: null,
    lastX: 0,
    lastY: 0
  };

  function loadThree(){
    if (THREE) return Promise.resolve(THREE);
    if (!threePromise) {
      threePromise = import(THREE_URL).then(module => {
        THREE = module;
        return THREE;
      });
    }
    return threePromise;
  }

  function ensureStyles(){
    if (document.querySelector('style[data-focuswave-three-garden]')) return;
    const style = document.createElement('style');
    style.dataset.focuswaveThreeGarden = 'true';
    style.textContent = `
      #page-insights .fw-garden-frame.fw-three-active{padding:0!important;border:0!important;border-radius:22px!important;background:transparent!important;box-shadow:none!important;overflow:visible!important;min-height:470px!important}
      #page-insights .fw-garden-frame.fw-three-active:before{display:none!important}
      #page-insights .fw-garden-frame.fw-three-active #fwGardenInner{position:relative!important;border:0!important;border-radius:22px!important;background:transparent!important;box-shadow:none!important;overflow:hidden!important;min-height:470px!important}
      #page-insights .fw-garden-frame.fw-three-active #fwGardenCanvas,
      #page-insights .fw-garden-frame.fw-three-active #fwGardenUserCanvas,
      #page-insights .fw-garden-frame.fw-three-active #fwDailyGardenCanvas,
      #page-insights .fw-garden-frame.fw-three-active #fwStoneLayer,
      #page-insights .fw-garden-frame.fw-three-active .fw-physical-bay,
      #page-insights .fw-garden-frame.fw-three-active .fw-physical-cursor{display:none!important}
      #fwThreeGardenMount{position:absolute;inset:0;z-index:30;overflow:hidden;border-radius:22px;background:linear-gradient(180deg,#f4f1ea 0%,#e9e3d8 100%);touch-action:none;cursor:grab;box-shadow:0 26px 44px rgba(63,48,31,.14)}
      #fwThreeGardenMount.dragging{cursor:grabbing}
      #fwThreeGardenMount canvas{display:block;width:100%;height:100%;outline:0;touch-action:none}
      #fwThreeGardenHint{position:absolute;right:18px;bottom:15px;z-index:31;padding:8px 11px;border-radius:999px;background:rgba(247,244,238,.78);backdrop-filter:blur(8px);box-shadow:0 3px 13px rgba(51,44,35,.08);font:11px var(--ui);color:#80786c;letter-spacing:.025em;pointer-events:none}
      #page-insights .fw-garden-frame.fw-three-active + .fw-garden-help{height:32px!important;opacity:1!important;color:#8a847a!important}
      @media(max-width:700px){#page-insights .fw-garden-frame.fw-three-active,#page-insights .fw-garden-frame.fw-three-active #fwGardenInner{min-height:390px!important}#fwThreeGardenHint{font-size:10px;right:10px;bottom:10px}}
    `;
    document.head.appendChild(style);
  }

  function makeWoodTexture(){
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0,0,0,canvas.height);
    gradient.addColorStop(0,'#d7ae75');
    gradient.addColorStop(.36,'#bf8750');
    gradient.addColorStop(.68,'#d0a269');
    gradient.addColorStop(1,'#9d6437');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    let seed = 928371;
    const random = () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0) / 4294967296);
    for(let i=0;i<62;i+=1){
      const y=random()*canvas.height;
      const amp=1.5+random()*4.5;
      const freq=.010+random()*.022;
      ctx.beginPath();
      for(let x=0;x<=canvas.width;x+=5){
        const yy=y+Math.sin(x*freq+random()*1.7)*amp;
        if(x===0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);
      }
      ctx.strokeStyle=random()>.55?`rgba(91,50,25,${.05+random()*.13})`:`rgba(255,233,192,${.04+random()*.10})`;
      ctx.lineWidth=.6+random()*1.6;
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2.6,1);
    texture.anisotropy = 8;
    return texture;
  }

  function makeSandTexture(){
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0,0,0,canvas.height);
    gradient.addColorStop(0,'#eee9df');
    gradient.addColorStop(.52,'#e6ded1');
    gradient.addColorStop(1,'#dcd2c3');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    let seed=173921;
    const random=()=>((seed=(Math.imul(seed,1103515245)+12345)>>>0)/4294967296);
    for(let i=0;i<26000;i+=1){
      const x=random()*canvas.width;
      const y=random()*canvas.height;
      const r=.25+random()*1.05;
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fillStyle=random()>.49?`rgba(111,96,74,${.018+random()*.045})`:`rgba(255,255,255,${.04+random()*.10})`;
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2.8,2.2);
    texture.anisotropy = 8;
    return texture;
  }

  function roundedStoneGeometry(seedValue){
    const geometry = new THREE.IcosahedronGeometry(1,3);
    const positions = geometry.attributes.position;
    const seed = (seedValue || 1) * .731;
    for(let i=0;i<positions.count;i+=1){
      let x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
      const wave = Math.sin(x*4.7+seed)*.035 + Math.sin(z*5.9-seed*.7)*.028 + Math.cos((x+z)*3.8+seed*.31)*.022;
      const topFlatten = y>.15 ? 1-(y-.15)*.055 : 1;
      const factor=(1+wave)*topFlatten;
      x*=factor;
      z*=factor;
      y*=factor*(.94 + .025*Math.sin((x-z)*4+seed));
      positions.setXYZ(i,x,y,z);
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  function addRoundedFrame(){
    const woodTexture = makeWoodTexture();
    const wood = new THREE.MeshStandardMaterial({map:woodTexture,color:0xc99358,roughness:.56,metalness:.015});
    const woodDark = new THREE.MeshStandardMaterial({map:woodTexture,color:0x9f673b,roughness:.62,metalness:.01});
    const rail=.62;
    const height=.52;

    const base = new THREE.Mesh(new THREE.BoxGeometry(SAND_W+1.45,.30,SAND_D+1.45),woodDark);
    base.position.y=-.35;
    base.castShadow=true;base.receiveShadow=true;
    scene.add(base);

    const railData=[
      [SAND_W+1.45,height,rail,0,.06,SAND_D/2+rail/2],
      [SAND_W+1.45,height,rail,0,.06,-SAND_D/2-rail/2],
      [rail,height,SAND_D, SAND_W/2+rail/2,.06,0],
      [rail,height,SAND_D,-SAND_W/2-rail/2,.06,0]
    ];
    railData.forEach(([w,h,d,x,y,z],index)=>{
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d,8,2,8),wood);
      mesh.position.set(x,y,z);
      mesh.castShadow=true;mesh.receiveShadow=true;
      if(index<2) mesh.material.map.repeat.set(3.2,1); else mesh.material.map.repeat.set(1.8,1);
      scene.add(mesh);
    });

    const innerLipMat = new THREE.MeshStandardMaterial({color:0x89532f,roughness:.67});
    const lip=.065;
    const lipHeight=.18;
    const lipY=.13;
    [[SAND_W,lipHeight,lip,0,lipY,SAND_D/2-.02],[SAND_W,lipHeight,lip,0,lipY,-SAND_D/2+.02],[lip,lipHeight,SAND_D,SAND_W/2-.02,lipY,0],[lip,lipHeight,SAND_D,-SAND_W/2+.02,lipY,0]].forEach(v=>{
      const m=new THREE.Mesh(new THREE.BoxGeometry(v[0],v[1],v[2]),innerLipMat);m.position.set(v[3],v[4],v[5]);m.castShadow=true;scene.add(m);
    });
  }

  function addSandBed(){
    const sandTexture=makeSandTexture();
    const material=new THREE.MeshStandardMaterial({map:sandTexture,bumpMap:sandTexture,bumpScale:.035,color:0xeee7da,roughness:.96,metalness:0});
    const sand=new THREE.Mesh(new THREE.BoxGeometry(SAND_W,.22,SAND_D,1,1,1),material);
    sand.position.y=-.09;
    sand.receiveShadow=true;
    scene.add(sand);
  }

  function makeLine(points,material){
    const geometry=new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(geometry,material);
  }

  function addBaseRakes(){
    const dark=new THREE.LineBasicMaterial({color:0xb2a58f,transparent:true,opacity:.36});
    const light=new THREE.LineBasicMaterial({color:0xfffdf7,transparent:true,opacity:.58});
    for(let row=0;row<24;row+=1){
      const baseZ=-SAND_D*.46 + row*(SAND_D*.92/23);
      const points=[];
      const highlights=[];
      for(let i=0;i<=120;i+=1){
        const x=-SAND_W*.48 + i/120*SAND_W*.96;
        const z=baseZ + Math.sin(x*.74 + row*.16)*.025 + Math.sin(x*1.63-row*.11)*.012;
        points.push(new THREE.Vector3(x,.035,z));
        highlights.push(new THREE.Vector3(x,.039,z-.025));
      }
      grooveGroup.add(makeLine(points,dark));
      grooveGroup.add(makeLine(highlights,light));
    }
  }

  function rewardStones(){
    return window.FocusWaveDailyGardenRewards?.stones || [];
  }

  function disposeGroup(group){
    while(group.children.length){
      const child=group.children.pop();
      child.geometry?.dispose?.();
      if(Array.isArray(child.material)) child.material.forEach(mat=>mat.dispose?.());
      else child.material?.dispose?.();
    }
  }

  function stonePosition(stone){
    return {
      x:(Number(stone.x)-.5)*SAND_W*.88,
      z:(Number(stone.y)-.5)*SAND_D*.84
    };
  }

  function addStoneRings(stone,scale){
    const p=stonePosition(stone);
    const dark=new THREE.LineBasicMaterial({color:0xa99b83,transparent:true,opacity:.52});
    const light=new THREE.LineBasicMaterial({color:0xfffcf5,transparent:true,opacity:.58});
    for(let ring=1;ring<=scale.rings;ring+=1){
      const rx=scale.x*1.02 + ring*.18;
      const rz=scale.z*.92 + ring*.135;
      const pts=[];
      const hi=[];
      for(let i=0;i<=96;i+=1){
        const a=i/96*Math.PI*2;
        pts.push(new THREE.Vector3(p.x+Math.cos(a)*rx,.047,p.z+Math.sin(a)*rz));
        hi.push(new THREE.Vector3(p.x+Math.cos(a)*(rx+.025),.051,p.z+Math.sin(a)*(rz+.018)));
      }
      grooveGroup.add(makeLine(pts,dark));
      grooveGroup.add(makeLine(hi,light));
    }
  }

  function buildRewardStones(){
    if(!stoneGroup||!grooveGroup||!THREE) return;
    disposeGroup(stoneGroup);
    disposeGroup(grooveGroup);
    addBaseRakes();

    rewardStones().forEach((stone,index)=>{
      const scale=SIZE_SCALE[stone.variant] || SIZE_SCALE.medium;
      const geometry=roundedStoneGeometry(index*17 + (stone.id?.length||3)*11);
      const tone=.33 + Math.max(0,Math.min(1,Number(stone.tone)||.5))*.10;
      const color=new THREE.Color().setHSL(.30,.035,tone);
      const material=new THREE.MeshStandardMaterial({color,roughness:.90,metalness:.025});
      const mesh=new THREE.Mesh(geometry,material);
      const p=stonePosition(stone);
      const s=Number(stone.scale)||1;
      mesh.scale.set(scale.x*s,scale.y*s,scale.z*s);
      mesh.position.set(p.x,scale.y*s*.92,p.z);
      mesh.rotation.y=THREE.MathUtils.degToRad(Number(stone.rotation)||0);
      mesh.rotation.x=THREE.MathUtils.degToRad(-2+index%5);
      mesh.castShadow=true;
      mesh.receiveShadow=true;
      stoneGroup.add(mesh);

      const contact=new THREE.Mesh(
        new THREE.CircleGeometry(scale.x*s*.92,48),
        new THREE.MeshBasicMaterial({color:0x4d463c,transparent:true,opacity:.10,depthWrite:false})
      );
      contact.rotation.x=-Math.PI/2;
      contact.scale.y=.56;
      contact.position.set(p.x,.015,p.z+.035);
      stoneGroup.add(contact);
      addStoneRings(stone,{...scale,x:scale.x*s,z:scale.z*s});
    });
  }

  function addLights(){
    const hemi=new THREE.HemisphereLight(0xfff9ed,0x6d665b,2.05);
    scene.add(hemi);

    const key=new THREE.DirectionalLight(0xfff0d7,3.0);
    key.position.set(-5.2,8.8,4.7);
    key.castShadow=true;
    key.shadow.mapSize.set(2048,2048);
    key.shadow.camera.near=.5;
    key.shadow.camera.far=24;
    key.shadow.camera.left=-8;
    key.shadow.camera.right=8;
    key.shadow.camera.top=7;
    key.shadow.camera.bottom=-7;
    key.shadow.bias=-.0003;
    scene.add(key);

    const fill=new THREE.DirectionalLight(0xdde7e3,.75);
    fill.position.set(5,4,-4);
    scene.add(fill);
  }

  function updateCamera(){
    if(!camera) return;
    const horizontal=orbit.distance*Math.cos(orbit.elevation);
    camera.position.set(
      Math.sin(orbit.azimuth)*horizontal,
      orbit.distance*Math.sin(orbit.elevation),
      Math.cos(orbit.azimuth)*horizontal
    );
    camera.lookAt(0,orbit.targetY,0);
  }

  function resetCamera(){
    orbit.azimuth=-.42;
    orbit.elevation=.72;
    orbit.distance=11.8;
    updateCamera();
  }

  function bindControls(){
    const el=mount;
    el.addEventListener('pointerdown',event=>{
      orbit.dragging=true;
      orbit.pointerId=event.pointerId;
      orbit.lastX=event.clientX;
      orbit.lastY=event.clientY;
      el.classList.add('dragging');
      el.setPointerCapture?.(event.pointerId);
    });
    el.addEventListener('pointermove',event=>{
      if(!orbit.dragging||event.pointerId!==orbit.pointerId)return;
      const dx=event.clientX-orbit.lastX;
      const dy=event.clientY-orbit.lastY;
      orbit.lastX=event.clientX;
      orbit.lastY=event.clientY;
      orbit.azimuth-=dx*.0082;
      orbit.elevation=Math.max(.34,Math.min(1.22,orbit.elevation+dy*.0064));
      updateCamera();
    });
    const release=event=>{
      if(event.pointerId!==orbit.pointerId)return;
      orbit.dragging=false;
      orbit.pointerId=null;
      el.classList.remove('dragging');
      try{el.releasePointerCapture?.(event.pointerId)}catch(_){ }
    };
    el.addEventListener('pointerup',release);
    el.addEventListener('pointercancel',release);
    el.addEventListener('wheel',event=>{
      event.preventDefault();
      orbit.distance=Math.max(8.2,Math.min(16.5,orbit.distance+event.deltaY*.008));
      updateCamera();
    },{passive:false});
    el.addEventListener('dblclick',resetCamera);
  }

  function resize(){
    if(!renderer||!camera||!mount) return;
    const rect=mount.getBoundingClientRect();
    if(rect.width<20||rect.height<20) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.setSize(rect.width,rect.height,false);
    camera.aspect=rect.width/rect.height;
    camera.updateProjectionMatrix();
  }

  function renderLoop(){
    animationFrame=requestAnimationFrame(renderLoop);
    const page=document.querySelector('#page-insights');
    if(page?.classList.contains('active')) renderer?.render(scene,camera);
  }

  async function createScene(){
    await loadThree();
    if(!mount||renderer) return;

    scene=new THREE.Scene();
    scene.background=new THREE.Color(0xf1ede5);
    scene.fog=new THREE.Fog(0xf1ede5,17,25);

    camera=new THREE.PerspectiveCamera(38,1,.1,60);
    updateCamera();

    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.08;
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute('aria-label','可旋转的三维枯山水沙盘');
    mount.prepend(renderer.domElement);

    addLights();
    addRoundedFrame();
    addSandBed();

    grooveGroup=new THREE.Group();
    stoneGroup=new THREE.Group();
    scene.add(grooveGroup);
    scene.add(stoneGroup);

    const floor=new THREE.Mesh(
      new THREE.PlaneGeometry(28,20),
      new THREE.MeshStandardMaterial({color:0xe3ddd2,roughness:1})
    );
    floor.rotation.x=-Math.PI/2;
    floor.position.y=-.53;
    floor.receiveShadow=true;
    scene.add(floor);

    buildRewardStones();
    bindControls();
    resize();
    renderLoop();
  }

  async function tryMount(){
    if(mounted) {
      syncFromRewards();
      resize();
      return true;
    }
    const frame=document.querySelector('#fwGardenFrame');
    const inner=document.querySelector('#fwGardenInner');
    if(!frame||!inner) return false;

    ensureStyles();
    frame.classList.add('fw-three-active');
    mount=document.createElement('div');
    mount.id='fwThreeGardenMount';
    mount.innerHTML='<div id="fwThreeGardenHint">拖动旋转 · 滚轮缩放 · 双击复位</div>';
    inner.appendChild(mount);
    const help=document.querySelector('.fw-garden-help');
    if(help) help.textContent='拖动沙盘旋转观察角度，滚轮缩放；双击沙盘可恢复默认视角。';
    mounted=true;

    try{
      await createScene();
      return true;
    }catch(error){
      console.error('[FocusWave] 3D garden failed; keeping 2D fallback.',error);
      frame.classList.remove('fw-three-active');
      mount?.remove();
      mount=null;
      mounted=false;
      return false;
    }
  }

  function syncFromRewards(){
    if(!mounted||!renderer){
      [0,180,650].forEach(delay=>setTimeout(tryMount,delay));
      return;
    }
    buildRewardStones();
  }

  function scheduleMidnightSync(){
    clearTimeout(midnightTimer);
    const now=new Date();
    const next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,1,0);
    midnightTimer=setTimeout(()=>{
      setTimeout(syncFromRewards,100);
      scheduleMidnightSync();
    },Math.max(1000,next.getTime()-Date.now()));
  }

  function bind(){
    ensureStyles();
    scheduleMidnightSync();
    document.addEventListener('click',event=>{
      const target=event.target.closest('button,[data-nav],[data-go]');
      if(!target)return;
      if(target.matches('[data-nav="insights"],[data-go="insights"]')){
        [80,260,720].forEach(delay=>setTimeout(tryMount,delay));
        return;
      }
      if(target.matches('#finishBtn')){
        [60,180].forEach(delay=>setTimeout(syncFromRewards,delay));
      }
    });
    window.addEventListener('storage',event=>{
      if(event.key==='focuswave.dailyRewardStones.v2') setTimeout(syncFromRewards,0);
    });
    window.addEventListener('resize',()=>{
      cancelAnimationFrame(resizeFrame);
      resizeFrame=requestAnimationFrame(resize);
    });

    // If the insights page was already built before this runtime loaded.
    [0,220,700].forEach(delay=>setTimeout(()=>{
      if(document.querySelector('#page-insights.active')) tryMount();
    },delay));
  }

  window.FocusWaveThreeGarden={
    mount:tryMount,
    refresh:syncFromRewards,
    resetCamera
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();
