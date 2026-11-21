import { SECTOR, getSeat, eyePosition, seatMetrics } from './stadium-data.js';

const $ = id => document.getElementById(id);
const viewport=$('viewport'), panel=document.querySelector('.visual-panel');
const rowSelect=$('row-select'), seatSelect=$('seat-select');
let selected=getSeat(16,12), mode='overview', threeState=null;
const cs=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1});
for(let row=1;row<=SECTOR.rows;row++) rowSelect.add(new Option(String(row),String(row)));
for(let seat=1;seat<=SECTOR.seatsPerRow;seat++) seatSelect.add(new Option(String(seat),String(seat)));
rowSelect.value='16';seatSelect.value='12';
const svgNS='http://www.w3.org/2000/svg';
const map=$('seat-map');
for(let row=SECTOR.rows;row>=1;row--){
  const y=9+(SECTOR.rows-row)*6.35;
  if(row%4===0||row===1){const text=document.createElementNS(svgNS,'text');text.setAttribute('x','18');text.setAttribute('y',String(y+5));text.setAttribute('text-anchor','end');text.setAttribute('class','map-row-label');text.dataset.row=String(row);text.textContent=String(row);map.append(text);}
  for(let n=1;n<=SECTOR.seatsPerRow;n++){
    const rect=document.createElementNS(svgNS,'rect');rect.setAttribute('x',String(32+(n-1)*11.2));rect.setAttribute('y',String(y));rect.setAttribute('width','7.7');rect.setAttribute('height','4.7');rect.setAttribute('rx','1.2');rect.setAttribute('class','map-seat');rect.dataset.row=String(row);rect.dataset.seat=String(n);rect.setAttribute('aria-hidden','true');
    const title=document.createElementNS(svgNS,'title');title.textContent=`Řada ${row}, sedadlo ${n}`;rect.append(title);map.append(rect);
  }
}
map.addEventListener('click',event=>{const el=event.target.closest('.map-seat');if(el)selectSeat(+el.dataset.row,+el.dataset.seat,true);});
rowSelect.addEventListener('change',()=>selectSeat(+rowSelect.value,+seatSelect.value,true));
seatSelect.addEventListener('change',()=>selectSeat(+rowSelect.value,+seatSelect.value,true));
function selectSeat(row,n,focus=false){
  selected=getSeat(row,n);rowSelect.value=String(row);seatSelect.value=String(n);
  $('selection-title').textContent=`Řada ${row}, sedadlo ${n}`;
  $('map-selection').textContent=`Řada ${row} · místo ${n}`;
  $('seat-caption-text').textContent=`Sektor 115 · řada ${row} · sedadlo ${n}`;
  const metrics=seatMetrics(selected);
  $('distance-metric').textContent=`${cs.format(metrics.distanceToPitch)} m`;
  $('height-metric').textContent=`${cs.format(metrics.eyeHeight)} m`;
  for(const el of map.querySelectorAll('.map-seat')){el.classList.toggle('same-row',+el.dataset.row===row);el.classList.toggle('chosen',+el.dataset.row===row&&+el.dataset.seat===n);}
  for(const el of map.querySelectorAll('.map-row-label'))el.classList.toggle('current',+el.dataset.row===row);
  threeState?.highlightSelected(selected);
  if(focus&&threeState){if(mode==='seat')threeState.setView('seat');else if(mode==='overview')threeState.setView('sector');}
}
selectSeat(16,12);
const dialog=$('about-dialog');
for(const id of ['about-button','sources-button'])$(id).addEventListener('click',()=>dialog.showModal());
$('close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
function updateMode(next){
  mode=next;viewport.dataset.view=next;
  panel.classList.toggle('seat-view',next==='seat');
  panel.classList.toggle('sector-view',next==='sector');
  $('seat-caption').hidden=next!=='seat';
  $('sector-label').hidden=next!=='overview';
  $('interaction-hint').querySelector('span').textContent=next==='seat'?'Tažením se rozhlížej · šipky také fungují':next==='sector'?'Klikni na sedadlo ve zvýrazněném sektoru':'Tažením otáčej · kolečkem přibližuj';
  $('view-button').querySelector('span').textContent=next==='seat'?'Zpět k výběru sedadla':'Podívat se z místa';
  for(const [id,value] of [['overview-button','overview'],['sector-button','sector'],['seat-mode-button','seat']]){$(id).classList.toggle('active',next===value);$(id).setAttribute('aria-pressed',String(next===value));}
}
updateMode('overview');

async function init(){
  const THREE=await import('three');
  const [{OrbitControls},{createStadium}]=await Promise.all([import('three/addons/controls/OrbitControls.js'),import('./stadium.js')]);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));renderer.setClearColor('#182128',0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  renderer.domElement.setAttribute('aria-label','3D model Edenu');viewport.append(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(43,1,.08,1100);
  scene.add(new THREE.HemisphereLight('#d6eafa','#666853',1.9));
  const sun=new THREE.DirectionalLight('#fff2da',2.4);sun.position.set(-80,160,50);scene.add(sun);
  const fill=new THREE.DirectionalLight('#b7d1e9',1.1);fill.position.set(80,50,-80);scene.add(fill);
  const stadium=createStadium(scene);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.09;controls.enablePan=false;controls.minDistance=35;controls.maxDistance=450;controls.maxPolarAngle=Math.PI/2-.025;controls.minPolarAngle=.12;controls.rotateSpeed=.55;controls.zoomSpeed=.75;controls.target.set(0,5,0);
  let width=1,height=1,transition=null,seatYaw=-Math.PI/2,seatPitch=-.12;
  let dragged=false,pointerStart=null,previousPointer=null,pointerId=null;
  let selectedIndex=(selected.row-1)*SECTOR.seatsPerRow+selected.number-1, hoveredIndex=-1;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gold=new THREE.Color('#ffd69a'), normal=new THREE.Color('#dc4b55'), hoverColor=new THREE.Color('#ffb78b');
  const colorAt=(i,c)=>{if(i<0)return;stadium.activeMeshes.pan.setColorAt(i,c);stadium.activeMeshes.back.setColorAt(i,c);};
  const refreshColors=()=>{stadium.activeMeshes.pan.instanceColor.needsUpdate=true;stadium.activeMeshes.back.instanceColor.needsUpdate=true;};
  function highlightSelected(seat){
    colorAt(selectedIndex,normal);selectedIndex=(seat.row-1)*SECTOR.seatsPerRow+seat.number-1;colorAt(selectedIndex,gold);refreshColors();
    stadium.marker.position.set(seat.x,seat.y+1.08,seat.z);
  }
  highlightSelected(selected);
  function overviewPose(){
    const narrow=width/height<1.05;
    return {position:new THREE.Vector3(narrow?180:158,narrow?181:151,narrow?219:187),target:new THREE.Vector3(0,4,0),fov:narrow?49:43};
  }
  function sectorPose(){return {position:new THREE.Vector3(13,37,22),target:new THREE.Vector3(54,8,SECTOR.centerZ),fov:width/height<1?58:48};}
  function poseFor(next){
    if(next==='overview')return overviewPose();
    if(next==='sector')return sectorPose();
    const eye=eyePosition(selected);return {position:new THREE.Vector3(eye.x,eye.y,eye.z),target:new THREE.Vector3(0,1,0),fov:70};
  }
  function finishTransition(){
    controls.target.copy(transition.toTarget);
    if(mode==='seat'){
      const d=transition.toTarget.clone().sub(camera.position).normalize();seatYaw=Math.atan2(d.x,d.z);seatPitch=Math.asin(d.y);controls.enabled=false;
    }else{controls.enabled=true;controls.update();}
    transition=null;viewport.dataset.transition='complete';
  }
  function setView(next,{immediate=false}={}){
    const previousMode=mode;
    updateMode(next);
    const pose=poseFor(next);
    controls.enabled=false;
    // Leaving seat view restores the open overview; roof remains user-toggleable.
    if(next==='seat'&&previousMode!=='seat'){$('roof-toggle').checked=true;stadium.roof.visible=true;}
    if(next!=='seat'&&previousMode==='seat'){$('roof-toggle').checked=false;stadium.roof.visible=false;}
    scene.background=next==='seat'?new THREE.Color('#aabec8'):null;
    stadium.marker.visible=next!=='seat';stadium.highlight.visible=next!=='seat';
    $('tooltip').hidden=true;hoveredIndex=-1;renderer.domElement.style.cursor=next==='seat'?'grab':'default';
    const dir=new THREE.Vector3();camera.getWorldDirection(dir);
    const fromTarget=previousMode==='seat'?camera.position.clone().addScaledVector(dir,60):controls.target.clone();
    transition={start:performance.now(),duration:immediate||reducedMotion?0:1250,from:camera.position.clone(),to:pose.position,fromTarget,toTarget:pose.target,fromFov:camera.fov,toFov:pose.fov,lift:next==='seat'?12:5};
    viewport.dataset.transition='moving';
    if(immediate||reducedMotion){camera.position.copy(pose.position);camera.fov=pose.fov;camera.updateProjectionMatrix();camera.lookAt(pose.target);finishTransition();}
  }
  function zoom(multiplier){
    if(transition)return;
    if(mode==='seat'){camera.fov=THREE.MathUtils.clamp(camera.fov*multiplier,40,90);camera.updateProjectionMatrix();}
    else{const offset=camera.position.clone().sub(controls.target);const length=THREE.MathUtils.clamp(offset.length()*multiplier,controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(offset.setLength(length));controls.update();}
  }
  function resize(){
    const r=viewport.getBoundingClientRect();width=r.width;height=r.height;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(viewport);resize();setView('overview',{immediate:true});
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function pick(event){
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    // Check only the small, interactive sector, never all decorative seats.
    const hits=raycaster.intersectObjects([stadium.activeMeshes.pan,stadium.activeMeshes.back],false);
    if(!hits.length)return -1;
    if(stadium.roof.visible){const roofHits=raycaster.intersectObject(stadium.roof,true);if(roofHits.length&&roofHits[0].distance<hits[0].distance)return -1;}
    return hits[0].instanceId;
  }
  const hideHover=()=>{if(hoveredIndex>=0&&hoveredIndex!==selectedIndex){colorAt(hoveredIndex,normal);refreshColors();}hoveredIndex=-1;$('tooltip').hidden=true;};
  renderer.domElement.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};previousPointer={...pointerStart};dragged=false;pointerId=e.pointerId;if(mode==='seat'){renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.style.cursor='grabbing';}hideHover();});
  renderer.domElement.addEventListener('pointermove',e=>{
    if(pointerStart&&e.pointerId===pointerId){
      if(Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>5)dragged=true;
      if(mode==='seat'&&!transition){seatYaw-=(e.clientX-previousPointer.x)*.004;seatPitch=THREE.MathUtils.clamp(seatPitch+(e.clientY-previousPointer.y)*.003,-.75,.65);}
      previousPointer={x:e.clientX,y:e.clientY};return;
    }
    if(mode==='seat'||transition||e.pointerType==='touch')return;
    const index=pick(e);if(index!==hoveredIndex){hideHover();hoveredIndex=index;if(index>=0){if(index!==selectedIndex)colorAt(index,hoverColor);refreshColors();}}
    renderer.domElement.style.cursor=index>=0?'pointer':'grab';
    if(index>=0){const seat=stadium.active[index];const r=viewport.getBoundingClientRect();$('tooltip').textContent=`Řada ${seat.row} · sedadlo ${seat.number}`;$('tooltip').style.left=`${Math.min(e.clientX-r.left+15,width-165)}px`;$('tooltip').style.top=`${Math.max(10,e.clientY-r.top-36)}px`;$('tooltip').hidden=false;}
  });
  renderer.domElement.addEventListener('pointerup',e=>{
    if(mode!=='seat'&&!transition&&!dragged&&pointerStart){const index=pick(e);if(index>=0){const seat=stadium.active[index];selectSeat(seat.row,seat.number,true);}}
    pointerStart=null;previousPointer=null;pointerId=null;if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);renderer.domElement.style.cursor='grab';
  });
  renderer.domElement.addEventListener('pointercancel',()=>{pointerStart=null;previousPointer=null;pointerId=null;dragged=false;hideHover();});
  renderer.domElement.addEventListener('pointerleave',()=>{if(!pointerStart)hideHover();});
  renderer.domElement.addEventListener('wheel',e=>{if(mode==='seat'){e.preventDefault();zoom(e.deltaY>0?1.04:.96);}},{passive:false});
  viewport.addEventListener('keydown',e=>{
    if(mode==='seat'){
      if(e.key==='ArrowLeft'){seatYaw+=.07;e.preventDefault();}
      if(e.key==='ArrowRight'){seatYaw-=.07;e.preventDefault();}
      if(e.key==='ArrowUp'){seatPitch=Math.min(.65,seatPitch+.05);e.preventDefault();}
      if(e.key==='ArrowDown'){seatPitch=Math.max(-.75,seatPitch-.05);e.preventDefault();}
    }
    if(e.key==='+'||e.key==='='){zoom(.85);e.preventDefault();}if(e.key==='-'){zoom(1.15);e.preventDefault();}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mode==='seat'&&!dialog.open)setView('sector');});
  $('overview-button').addEventListener('click',()=>setView('overview'));
  $('sector-button').addEventListener('click',()=>setView('sector'));
  $('sector-label').addEventListener('click',()=>setView('sector'));
  $('seat-mode-button').addEventListener('click',()=>{setView('seat');viewport.focus({preventScroll:true});});
  $('view-button').addEventListener('click',()=>{setView(mode==='seat'?'sector':'seat');if(mode==='seat'){viewport.scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'center'});viewport.focus({preventScroll:true});}});
  $('reset-button').addEventListener('click',()=>setView(mode));
  $('zoom-in').addEventListener('click',()=>zoom(.85));$('zoom-out').addEventListener('click',()=>zoom(1.15));
  $('roof-toggle').addEventListener('change',e=>stadium.roof.visible=e.target.checked);
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();$('loading').hidden=false;$('loading').innerHTML='<div class="model-error"><strong>3D zobrazení bylo přerušeno</strong><p>Obnov stránku a zkus model znovu otevřít.</p><button class="primary-button" onclick="location.reload()">Obnovit stránku</button></div>';});
  const labelPoint=new THREE.Vector3(57,11.5,SECTOR.centerZ);
  function animate(time){
    if(transition){
      const t=transition.duration?Math.min((time-transition.start)/transition.duration,1):1;
      const k=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.to,k);camera.position.y+=Math.sin(Math.PI*k)*transition.lift;
      const target=new THREE.Vector3().lerpVectors(transition.fromTarget,transition.toTarget,k);camera.lookAt(target);camera.fov=THREE.MathUtils.lerp(transition.fromFov,transition.toFov,k);camera.updateProjectionMatrix();
      if(t===1)finishTransition();
    }else if(mode==='seat'){
      camera.lookAt(camera.position.x+Math.sin(seatYaw)*Math.cos(seatPitch)*100,camera.position.y+Math.sin(seatPitch)*100,camera.position.z+Math.cos(seatYaw)*Math.cos(seatPitch)*100);
    }else controls.update();
    if(mode==='overview'){
      const p=labelPoint.clone().project(camera);const left=(p.x*.5+.5)*width,top=(-p.y*.5+.5)*height;
      $('sector-label').style.left=`${left}px`;$('sector-label').style.top=`${top}px`;$('sector-label').hidden=p.z>1||left<35||left>width-35||top<90||top>height-70;
    }
    if(mode!=='seat'){
      const p0=new THREE.Vector3(0,0,0).project(camera),pn=new THREE.Vector3(0,0,-20).project(camera);
      const angle=Math.atan2((pn.x-p0.x)*width,(pn.y-p0.y)*height)*180/Math.PI;
      document.querySelector('.north-mark svg').style.transform=`rotate(${angle}deg)`;
    }
    renderer.render(scene,camera);
  }
  renderer.setAnimationLoop(animate);
  $('loading').hidden=true;viewport.dataset.rendered='true';
  threeState={setView,highlightSelected};
}
init().catch(error=>{
  console.error('Eden 3D initialization failed',error);
  document.body.classList.add('webgl-error');
  $('loading').innerHTML='<div class="model-error"><strong>3D model se nepodařilo načíst</strong><p>Zkus aktuální prohlížeč s podporou WebGL a zapnutou hardwarovou akcelerací. Plán sedadel je nadále dostupný.</p><button class="text-button" onclick="location.reload()">Zkusit znovu</button></div>';
});
