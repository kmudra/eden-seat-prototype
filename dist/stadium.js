import * as THREE from 'three';
import { BOWL, SECTOR, PITCH, generateSectorSeats } from './stadium-data.js';

const mat = (color,opts={}) => new THREE.MeshStandardMaterial({color,roughness:0.86,metalness:0,...opts});
const concrete = mat('#8d9394');
const darkConcrete = mat('#636d71');
const steel = mat('#c4c8c7',{metalness:.3,roughness:.6});
const redPanel = mat('#962332');
const white = mat('#e5e7d8');
const black = mat('#17242b');
function box(parent,w,h,d,x,y,z,material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material); m.position.set(x,y,z);parent.add(m);return m;
}
function tube(parent,a,b,r,material) {
  const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),6),material);
  m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());parent.add(m);return m;
}
function labelTexture(text,{bg='#a91d35',color='#fff4df',width=1024,height=128,font=72}={}) {
  const c=document.createElement('canvas');c.width=width;c.height=height;
  const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);ctx.fillStyle=color;ctx.font=`600 ${font}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,width/2,height/2);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function sign(parent,text,w,h,x,y,z,rotation=0,options={}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:labelTexture(text,options),side:THREE.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.y=rotation;parent.add(mesh);return mesh;
}
function terraceMesh(parent,vertices) {
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();const m=new THREE.Mesh(g,concrete);m.receiveShadow=true;parent.add(m);return m;
}
function quad(v,a,b,c,d){v.push(...a,...b,...c,...a,...c,...d);}

function pitch(parent) {
  box(parent,137,1.8,178,0,-1.1,0,mat('#333f43'));
  box(parent,137.6,.25,178.6,0,-.25,0,mat('#4b595c'));
  box(parent,79,.12,119,0,-.04,0,mat('#4a6258'));
  const canvas=document.createElement('canvas');canvas.width=1360;canvas.height=2100;
  const ctx=canvas.getContext('2d');
  const rand=(x,y)=>((Math.sin(x*127.1+y*311.7)*43758.5453)%1+1)%1;
  ctx.fillStyle='#447c50';ctx.fillRect(0,0,1360,2100);
  for(let i=0;i<20;i++){ctx.fillStyle=i%2?'#568b58':'#467c4c';ctx.fillRect(0,i*105,1360,105);}
  for(let i=0;i<16000;i++){const x=rand(i,2)*1360,y=rand(i,3)*2100;ctx.fillStyle=i%2?'#ffffff07':'#0a2a0710';ctx.fillRect(x,y,1.5,5);}
  // One texture pixel corresponds to 5 cm. Paint regulation field markings.
  ctx.strokeStyle='#ecefdc';ctx.lineWidth=2.4;
  const rect=(x,y,w,h)=>ctx.strokeRect(x*20,y*20,w*20,h*20);
  rect(.07,.07,67.86,104.86);
  ctx.beginPath();ctx.moveTo(0,1050);ctx.lineTo(1360,1050);ctx.stroke();
  ctx.beginPath();ctx.arc(680,1050,183,0,Math.PI*2);ctx.stroke();
  for(const end of [0,1]){
    const y=end?105-16.5:0;rect(13.84,y,40.32,16.5);rect(24.84,end?99.5:0,18.32,5.5);
    ctx.beginPath();ctx.arc(680,(end?94:11)*20,2.5,0,Math.PI*2);ctx.fillStyle='#ecefdc';ctx.fill();
    ctx.beginPath();if(end)ctx.arc(680,94*20,183,Math.PI+0.645,2*Math.PI-0.645);else ctx.arc(680,11*20,183,0.645,Math.PI-0.645);ctx.stroke();
  }
  ctx.beginPath();ctx.arc(680,1050,2.6,0,Math.PI*2);ctx.fill();
  for(const x of [0,1360])for(const y of [0,2100]){ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);ctx.stroke();}
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  const field=new THREE.Mesh(new THREE.PlaneGeometry(PITCH.width,PITCH.length),mat('#ffffff',{map:tex}));field.rotation.x=-Math.PI/2;field.position.y=.06;field.receiveShadow=true;parent.add(field);
  const goalMat=mat('#f6f7ee');const netMat=new THREE.LineBasicMaterial({color:'#cbd9cb',transparent:true,opacity:.44});
  for(const s of [-1,1]){
    const z=s*52.5,back=z+s*2.1;
    tube(parent,[-3.66,.1,z],[-3.66,2.54,z],.06,goalMat);tube(parent,[3.66,.1,z],[3.66,2.54,z],.06,goalMat);tube(parent,[-3.66,2.54,z],[3.66,2.54,z],.06,goalMat);
    const pts=[];const line=(a,b)=>pts.push(...a,...b);
    for(let x=-3.66;x<=3.67;x+=.305){line([x,.13,back],[x,2.54,back]);line([x,2.54,back],[x,2.54,z]);}
    for(let y=.13;y<2.55;y+=.24){line([-3.66,y,back],[3.66,y,back]);for(const x of [-3.66,3.66])line([x,y,back],[x,y,z]);}
    for(const x of [-3.66,3.66]){tube(parent,[x,2.54,z],[x,2.54,back],.027,goalMat);tube(parent,[x,.1,back],[x,2.54,back],.027,goalMat);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));parent.add(new THREE.LineSegments(g,netMat));
  }
  for(const x of [-34,34])for(const z of [-52.5,52.5]){tube(parent,[x,.1,z],[x,1.6,z],.025,white);const flag=box(parent,.38,.25,.018,x+.19,1.5,z,redPanel);flag.rotation.y=.3;}
  for(const side of [-1,1]){
    box(parent,.18,.8,107,side*37,.45,0,black);
    for(let i=-42;i<45;i+=21)sign(parent,i===0?'EDEN':'SLAVIA PRAHA',15,.63,side*36.89,.47,i,side===1?-Math.PI/2:Math.PI/2,{bg:'#17242b',color:'#e6e9db',font:56});
    box(parent,70,.8,.18,0,.45,side*55.5,black);sign(parent,'DOMA V EDENU',31,.65,0,.47,side*55.39,side===1?Math.PI:0,{bg:'#17242b',font:52});
  }
}

function createSeats(parent,poses,color) {
  const material=mat(color,{roughness:.62,metalness:.04});
  const panGeo=new THREE.BoxGeometry(.46,.095,.47);
  const backGeo=new THREE.BoxGeometry(.46,.48,.07);
  const pan=new THREE.InstancedMesh(panGeo,material,poses.length),back=new THREE.InstancedMesh(backGeo,material,poses.length);
  const dummy=new THREE.Object3D();
  for(let i=0;i<poses.length;i++){
    const p=poses[i],yaw=p.yaw;
    dummy.position.set(p.x,p.y+.48,p.z);dummy.rotation.set(0,yaw,0);dummy.updateMatrix();pan.setMatrixAt(i,dummy.matrix);
    dummy.position.set(p.x-Math.sin(yaw)*.21,p.y+.75,p.z-Math.cos(yaw)*.21);dummy.rotation.set(-.1,yaw,0,'YXZ');dummy.updateMatrix();back.setMatrixAt(i,dummy.matrix);
    const tone = new THREE.Color(color);tone.multiplyScalar(.86+((i*17)%19)/100);
    pan.setColorAt(i,tone);back.setColorAt(i,tone);
  }
  // Use a white base so instance colors remain true to their requested color.
  material.color.set('#ffffff');
  pan.instanceMatrix.needsUpdate=true;back.instanceMatrix.needsUpdate=true;
  pan.computeBoundingSphere();back.computeBoundingSphere();parent.add(pan,back);return {pan,back};
}

function stands(parent){
  const vertices=[],otherSeats=[];
  const sideConfigs=[
    {name:'east',length:103,base:40.5,nx:1,nz:0,yaw:-Math.PI/2},
    {name:'west',length:103,base:40.5,nx:-1,nz:0,yaw:Math.PI/2},
    {name:'north',length:66,base:59,nx:0,nz:-1,yaw:0},
    {name:'south',length:66,base:59,nx:0,nz:1,yaw:Math.PI}
  ];
  const position=(cfg,t,depth,y)=>cfg.nx?[cfg.nx*(cfg.base+depth),y,t]:[t,y,cfg.nz*(cfg.base+depth)];
  for(const cfg of sideConfigs){
    const blocks=cfg.nx?7:5;const blockWidth=cfg.length/blocks;
    for(let r=0;r<BOWL.rows;r++){
      const upper=cfg.name==='west'&&r>=16;
      const offset=upper?2.7:0;
      const y=BOWL.baseHeight+r*BOWL.rowRise+(upper?3.2:0),d=r*BOWL.rowDepth+offset;
      const a=position(cfg,-cfg.length/2,d,y),b=position(cfg,cfg.length/2,d,y),c=position(cfg,cfg.length/2,d+BOWL.rowDepth,y),e=position(cfg,-cfg.length/2,d+BOWL.rowDepth,y);
      // Both sides are accepted below, avoiding winding differences between stands.
      quad(vertices,a,b,c,e);quad(vertices,[...a.slice(0,1),y-.46,a[2]],[...b.slice(0,1),y-.46,b[2]],b,a);
      // Stair aisles and entrances break up the otherwise continuous bowl.
      for(let block=0;block<blocks;block++){
        const center=-cfg.length/2+(block+.5)*blockWidth;
        const count=Math.floor((blockWidth-1.3)/.55);
        for(let s=0;s<count;s++){
          const t=center+(s-(count-1)/2)*.55;
          if(cfg.name==='east'&&Math.abs(t-SECTOR.centerZ)<SECTOR.width/2)continue;
          if(r>=13&&r<=17&&Math.abs(t-center)<1.15)continue;
          const pos=position(cfg,t,d+BOWL.rowDepth/2,y);
          otherSeats.push({x:pos[0],y,z:pos[2],yaw:cfg.yaw});
        }
        if(r===14){
          const pos=position(cfg,center,d+.7,y+1.05);
          if(!(cfg.name==='east'&&Math.abs(center-SECTOR.centerZ)<SECTOR.width/2)){
            const door=box(parent,cfg.nx?.2:2.25,2.15,cfg.nx?2.25:.2,...pos,black);
            sign(parent,cfg.name==='east'?String(113+block):cfg.name==='west'?'VIP':cfg.name==='north'?String(106+block):String(122+block),2.15,.45,pos[0]+cfg.nx*-.15,pos[1]+1.4,pos[2]+cfg.nz*-.15,cfg.yaw,{bg:'#343d41',font:66,width:256});
          }
        }
        // Handrails over the last rows on each stairway.
        if(r===22){const t=center+blockWidth/2-.1;
          const p1=position(cfg,t,22*.78+(cfg.name==='west'?2.7:0),1+22*.46+(cfg.name==='west'?3.2:0)+1);
          const p2=position(cfg,t,31*.78+(cfg.name==='west'?2.7:0),1+31*.46+(cfg.name==='west'?3.2:0)+1);
          tube(parent,p1,p2,.035,steel);
        }
      }
    }
  }
  // Four rounded corners, blended into the raised upper main stand.
  for(const sx of [-1,1])for(const sz of [-1,1]){
    for(let r=0;r<BOWL.rows;r++){
      const n=16;
      const point=(angle,outer)=>{
        const west=sx<0&&r>=16?Math.cos(angle):0;
        const radius=BOWL.cornerRadius+(r+(outer?1:0))*.78+west*2.7;
        return [sx*(33+Math.cos(angle)*radius),1+r*.46+west*3.2,sz*(51.5+Math.sin(angle)*radius)];
      };
      for(let i=0;i<n;i++){
        const t1=i/n*Math.PI/2,t2=(i+1)/n*Math.PI/2;
        const a=point(t1,false),b=point(t2,false),c=point(t2,true),d=point(t1,true);
        quad(vertices,a,b,c,d);quad(vertices,[a[0],a[1]-.46,a[2]],[b[0],b[1]-.46,b[2]],b,a);
      }
      const radius=7.5+(r+.5)*.78, seats=Math.floor(Math.PI/2*radius/.56);
      for(let i=1;i<seats-1;i++){
        const angle=(i+.5)/seats*Math.PI/2;
        if(Math.abs(angle-Math.PI/4)<.045)continue;
        const west=sx<0&&r>=16?Math.cos(angle):0;
        const rad=radius+west*2.7;
        const nx=sx*Math.cos(angle),nz=sz*Math.sin(angle);
        otherSeats.push({x:sx*33+nx*rad,y:1+r*.46+west*3.2,z:sz*51.5+nz*rad,yaw:Math.atan2(-nx,-nz)});
      }
    }
  }
  concrete.side=THREE.DoubleSide;terraceMesh(parent,vertices);
  createSeats(parent,otherSeats,'#bb3947');
  const active=generateSectorSeats(),activeMeshes=createSeats(parent,active,'#dc4b55');
  // Main stand: lower seats, hospitality ribbon and raised upper terrace.
  const glass=mat('#314b54',{metalness:.5,roughness:.28});
  box(parent,3.4,3.1,103,-54.5,10.9,0,glass);
  box(parent,3.6,.3,104,-54.5,12.5,0,white);
  box(parent,.2,.8,103,-52.76,9.5,0,redPanel);
  for(let z=-50;z<=50;z+=4.2)box(parent,.21,2.9,.09,-52.72,10.95,z,steel);
  sign(parent,'FORTUNA  ★  ARENA',41,2.35,-66.4,20.2,0,Math.PI/2,{font:65});
  sign(parent,'TRIBUNA SEVER',34,1.5,0,17.4,-84.2,0,{bg:'#a72138',font:58});
  sign(parent,'SLAVIA PRAHA',34,1.5,0,17.4,84.2,Math.PI,{bg:'#a72138',font:64});
  // Low perimeter fascia and outer walls remain visible with the roof removed.
  box(parent,1.5,17,108,67.5,7.5,0,darkConcrete);box(parent,1.5,21,108,-69.8,9.5,0,darkConcrete);
  box(parent,67,17,1.5,0,7.5,86,darkConcrete);box(parent,67,17,1.5,0,7.5,-86,darkConcrete);
  for(const x of [-68.3,68.3])box(parent,1,1.2,110,x,18,0,redPanel);
  for(const z of [-86.8,86.8])box(parent,69,1.2,1,0,18,z,redPanel);
  // Dugouts on the western touchline.
  const canopy=mat('#b4d1d5',{transparent:true,opacity:.45,side:THREE.DoubleSide,roughness:.24});
  for(const z of [-12,12]){box(parent,2.3,.3,9,-38.3,.2,z,darkConcrete);box(parent,.12,2,9,-39.4,1.2,z,canopy);box(parent,2.3,.12,9,-38.3,2.2,z,canopy);
    for(let i=0;i<12;i++){box(parent,.6,.1,.5,-38.4,.65,z-4+i*.72,redPanel);box(parent,.1,.6,.5,-38.8,.97,z-4+i*.72,redPanel);}
  }
  // Two simple scoreboards, supported from outside the viewing bowl.
  for(const s of [-1,1]){const screen=sign(parent,'SLAVIA   0 : 0   HOSTÉ',10,3.3,s*35,19,-s*73,s===1?.25:Math.PI+.25,{bg:'#15262c',font:52});}
  const highlight=new THREE.Group();parent.add(highlight);
  const z1=SECTOR.centerZ-SECTOR.width/2+.35,z2=SECTOR.centerZ+SECTOR.width/2-.35;
  const edgePts=[new THREE.Vector3(40.5,1.04,z1),new THREE.Vector3(65.46,15.3,z1),new THREE.Vector3(65.46,15.3,z2),new THREE.Vector3(40.5,1.04,z2),new THREE.Vector3(40.5,1.04,z1)];
  const edge=new THREE.Line(new THREE.BufferGeometry().setFromPoints(edgePts),new THREE.LineBasicMaterial({color:'#f5c57e'}));highlight.add(edge);
  return { active, activeMeshes, highlight, decorativeSeatCount:otherSeats.length };
}

function roof(parent){
  const group=new THREE.Group();parent.add(group);group.visible=false;
  const roofTop=mat('#7d898b',{roughness:.75,side:THREE.DoubleSide});
  const cedar=mat('#a88c69',{side:THREE.DoubleSide});
  // A ring with a rectangular pitch opening. Underside is cedar-inspired.
  const panels=[{w:34,d:179,x:-54,z:0},{w:34,d:179,x:54,z:0},{w:74,d:33,x:0,z:-73},{w:74,d:33,x:0,z:73}];
  for(const p of panels){box(group,p.w,.4,p.d,p.x,23.3,p.z,roofTop);box(group,p.w,.1,p.d,p.x,23.04,p.z,cedar);}
  for(const x of [-1,1])for(let z=-80;z<=80;z+=10){tube(group,[x*37,22.8,z],[x*71,23.1,z],.12,steel);tube(group,[x*71,23.1,z],[x*71,18,z],.12,steel);box(group,.65,.25,2.5,x*37.4,22.5,z,mat('#fff6d6',{emissive:'#c7b98e',emissiveIntensity:.2}));}
  for(const z of [-1,1])for(let x=-30;x<=30;x+=10){tube(group,[x,22.8,z*56.5],[x,23.1,z*89.5],.12,steel);box(group,2.5,.25,.65,x,22.5,z*57,white);}
  // Slender exterior supports and roof edge are visible in the open model.
  for(const x of [-1,1])for(let z=-75;z<=75;z+=15){tube(parent,[x*71,0,z],[x*71,25,z],.14,steel);tube(parent,[x*71,25,z],[x*54,23.5,z],.055,steel);}
  for(const z of [-1,1])for(let x=-30;x<=30;x+=15){tube(parent,[x,0,z*89.5],[x,25,z*89.5],.14,steel);tube(parent,[x,25,z*89.5],[x,23.5,z*73],.055,steel);}
  return group;
}

export function createStadium(scene) {
  const group=new THREE.Group();scene.add(group);pitch(group);const seats=stands(group);const roofGroup=roof(group);
  const marker=new THREE.Mesh(new THREE.TorusGeometry(.39,.045,6,32),new THREE.MeshBasicMaterial({color:'#ffdc9a',depthTest:false}));marker.rotation.x=-Math.PI/2;marker.renderOrder=10;group.add(marker);
  return {group,...seats,roof:roofGroup,marker};
}
