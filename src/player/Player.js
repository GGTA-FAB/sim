import * as THREE from 'three';
import {SPAWN} from '../data/layout.js';
import {gaitPose} from './gait.js';
import {createCharacterRig,syncCharacterBones} from './CharacterRig.js';
const box=new THREE.BoxGeometry(1,1,1);
export class Player {
 constructor(scene,appearance={}){
  this.group=new THREE.Group();this.position=this.group.position;this.position.set(SPAWN.x,SPAWN.y,SPAWN.z);scene.add(this.group);
  Object.assign(this,createCharacterRig(this.group,appearance));this.gowned=false;this.phase=0;this.travel=0;this.motion=0;this.poseTime=0;this.lifePose=null;this.gait={};
  this.setGowned(false);
  const mesh=(parent,geo,mat,x,y,z,w,h,d)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(w,h,d);parent.add(m);return m;};
  this.carryKind=null;this.meal=new THREE.Group();this.rig.add(this.meal);
  const trayMat=new THREE.MeshStandardMaterial({color:0x9baea7,roughness:.6}),boxMat=new THREE.MeshStandardMaterial({color:0xd8c79c}),white=new THREE.MeshStandardMaterial({color:0xeee7cf}),green=new THREE.MeshStandardMaterial({color:0x72994b}),brown=new THREE.MeshStandardMaterial({color:0x9b613a});
  this.tray=mesh(this.meal,box,trayMat,0,0,0,.72,.045,.48);for(const side of [-1,1]){mesh(this.tray,box,trayMat,side*.47,.8,0,.035,1.2,1);}
  this.bento=mesh(this.meal,box,boxMat,0,.045,0,.51,.1,.35);this.lid=mesh(this.meal,box,boxMat,0,.12,0,.54,.03,.38);
  this.food=new THREE.Group();this.meal.add(this.food);this.rice=mesh(this.food,box,white,-.13,.115,0,.22,.05,.27);mesh(this.food,box,green,.14,.12,-.08,.18,.07,.11);this.mainCourse=mesh(this.food,box,brown,.14,.12,.075,.18,.07,.13);
  this.spoon=mesh(this.elbows[1],box,trayMat,0,-.30,.13,.035,.025,.23);this.spoon.visible=false;
  this.cup=mesh(this.rig,new THREE.CylinderGeometry(.065,.055,.15,8),new THREE.MeshStandardMaterial({color:0xf2ead6}),.33,1.36,.30,1,1,1);this.meal.visible=this.cup.visible=false;
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.43,20),new THREE.MeshBasicMaterial({color:0x385956,transparent:true,opacity:.14,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.018;this.group.add(shadow);
 }
 setGowned(value){this.gowned=value;for(let j=0;j<2;j++)for(const m of this.outfits[j])if(m)m.visible=j===(value?1:0);}
 syncSkeleton(){syncCharacterBones(this);}

 setLifePose(type){this.lifePose=type;this.cup.visible=type==='coffee';this.motion=0;this.applyPose(0,0);}
 setCarry(kind){const changed=this.carryKind!==kind;this.carryKind=kind;if(changed)this.applyPose(0,0);else this.syncMeal();}
 syncMeal(){const eating=this.lifePose==='eat',seated=['nap','eat','rest','report','work-pc','research','meeting'].includes(this.lifePose),kind=this.carryKind;this.meal.visible=eating||!!kind;this.tray.visible=kind==='tray'||kind==='empty-tray';this.bento.visible=kind!=='empty-tray';this.food.visible=kind!=='empty-tray'&&(eating||kind==='tray');this.lid.visible=kind==='bento'&&!eating;this.meal.position.set(0,seated?1.3:1.04,seated?.68:.52);this.spoon.visible=eating;}
 applyPose(dt,speed){
  this.syncMeal();this.poseTime+=dt;const seated=['nap','rest','eat','report','work-pc','research','meeting'].includes(this.lifePose);this.rig.position.y=seated?-.32:0;this.rig.rotation.set(0,0,0);
  for(let i=0;i<2;i++){gaitPose(this.phase,i,this.motion,speed,this.gait);this.arms[i].rotation.x=this.gait.arm;this.elbows[i].rotation.x=this.gait.elbow;this.legs[i].rotation.x=this.gait.hip;this.knees[i].rotation.x=this.gait.knee;this.feet[i].rotation.x=this.gait.ankle;
   if(seated){this.legs[i].rotation.x=-1.48;this.knees[i].rotation.x=1.48;this.feet[i].rotation.x=0;this.arms[i].rotation.x=-.3;this.elbows[i].rotation.x=-1.15;}
  }
  if(this.carryKind&&!seated){for(let i=0;i<2;i++){this.arms[i].rotation.x=-.4;this.elbows[i].rotation.x=-1;}}
  if(this.lifePose==='eat'){const bite=(Math.sin(this.poseTime*1.8)+1)/2;this.arms[1].rotation.x=-.7-bite*.35;this.elbows[1].rotation.x=-.65-bite*.9;this.arms[0].rotation.x=-.5;}
  else if(this.lifePose==='coffee'){this.arms[1].rotation.x=-.5;this.elbows[1].rotation.x=-1.1+Math.sin(this.poseTime*1.6)*.18;}
  else if(['report','work-pc','research'].includes(this.lifePose)){this.arms[0].rotation.x=this.arms[1].rotation.x=-.5;}
  if(!this.lifePose){this.rig.position.y=Math.abs(Math.sin(this.phase))*.018*this.motion;this.rig.rotation.y=Math.sin(this.phase)*.035*this.motion;this.rig.rotation.x=Math.min(1,Math.max(0,(speed-7)/5))*.08*this.motion;}
  this.syncSkeleton();
 }
 animate(dt,speed,heading){this.motion=THREE.MathUtils.damp(this.motion,speed>.05?1:0,12,dt);if(speed>.05){const run=Math.min(1,Math.max(0,(speed-7.2)/4.4));this.phase=(this.phase+dt*(1.45+run*.6)*Math.PI*2)%(Math.PI*2);const delta=Math.atan2(Math.sin(heading-this.group.rotation.y),Math.cos(heading-this.group.rotation.y));this.group.rotation.y+=delta*Math.min(1,dt*12);}this.applyPose(dt,speed);this.travel+=speed*dt;}
}
