import {TRAY_RETURN} from '../data/dining.js';
import {travelLeg} from './TravelRouter.js';
import * as THREE from 'three';
import { DESTINATIONS, LIFT, STAIR } from '../data/layout.js';
import { BALANCE } from '../data/balance.js';
import { Pathfinder } from './Pathfinder.js';
export class NavigationSystem {
 constructor(scene,collision,bus){
  this.collision=collision;this.finders=new Map([-6,0,6].map(y=>[y,new Pathfinder(collision,y)]));this.floor=6;this.pathfinder=this.finders.get(6);this.target=DESTINATIONS[0];this.path=[];this.last={x:Infinity,z:Infinity,y:Infinity};this.timer=0;this.distance=0;this.travelMode='elevator';this.stairLeg=null;
  this.ribbons=[{width:.95,color:0xffffff},{width:.65,color:0x087cff}].map(({width,color})=>{const vertices=new Float32Array(2048*18),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(vertices,3));geometry.setDrawRange(0,0);const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));mesh.frustumCulled=false;scene.add(mesh);return{width,vertices,geometry,mesh};});this.line=this.ribbons[1].mesh;
  this.marker=new THREE.Mesh(new THREE.RingGeometry(.7,1.05,32),new THREE.MeshBasicMaterial({color:0x087cff,side:THREE.DoubleSide}));this.marker.rotation.x=-Math.PI/2;scene.add(this.marker);
  this.mealReturnTarget=null;
  const mealTarget=t=>t?.id==='tray-return'||t?.kind==='dining'||/^dining(?:-|$)/.test(t?.id??'');
  const remember=()=>{if(!this.mealReturnTarget&&!mealTarget(this.target))this.mealReturnTarget={...this.target};};
  bus.on('FOOD_BOUGHT',food=>{if(food.service==='dine-in')remember();});
  bus.on('LIFE_STARTED',a=>{if(a.type==='eat'&&a.food?.service==='dine-in')remember();});
  bus.on('NAVIGATION_SELECTED',id=>{const next=typeof id==='object'?id:(DESTINATIONS.find(t=>t.id===id)||this.target);if(next.id==='tray-return')remember();this.target=next;if(this.mealReturnTarget&&!mealTarget(next))this.mealReturnTarget={...next};this.last.x=Infinity;this.timer=0;});
  bus.on('LIFE_COMPLETED',a=>{if(a.type==='eat'&&a.food?.service==='dine-in'){remember();bus.emit('NAVIGATION_SELECTED',{...TRAY_RETURN});}});
  bus.on('TRAY_RETURNED',()=>{const target=this.mealReturnTarget;this.mealReturnTarget=null;if(this.target.id==='tray-return'&&target)bus.emit('NAVIGATION_SELECTED',target);});
  bus.on('TRAVEL_MODE_CHANGED',mode=>{this.travelMode=mode;this.last.x=Infinity;});
 }
 update(dt,position){
  this.timer-=dt;if(this.timer>0)return;this.timer=BALANCE.navigationInterval;if(Math.hypot(position.x-this.last.x,position.z-this.last.z,position.y-this.last.y)<.8)return;
  const leg=travelLeg(position,this.target,this.finders,this.collision,this.travelMode);Object.assign(this,leg);const path=leg.path;this.floor=Math.max(-6,Math.min(6,Math.round(position.y/6)*6));this.pathfinder=this.finders.get(this.floor);
  this.path=path;Object.assign(this.last,{x:position.x,z:position.z,y:position.y});this.distance=0;let previous=position;for(const p of path){this.distance+=Math.hypot(p.x-previous.x,p.z-previous.z,(p.y??0)-(previous.y??0));previous=p;}
  for(let layer=0;layer<this.ribbons.length;layer++){
   const r=this.ribbons[layer];let n=0;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],length=Math.hypot(b.x-a.x,b.z-a.z);if(length<.001)continue;const ox=-(b.z-a.z)/length*r.width/2,oz=(b.x-a.x)/length*r.width/2,h=((a.y??0)===(b.y??0)?.035:.19)+layer*.008;for(const [p,side] of [[a,-1],[a,1],[b,1],[a,-1],[b,1],[b,-1]]){r.vertices[n++]=p.x+ox*side;r.vertices[n++]=(p.y??this.floor)+h;r.vertices[n++]=p.z+oz*side;}}
   r.geometry.attributes.position.needsUpdate=true;r.geometry.setDrawRange(0,n/3);
  }
  this.marker.position.set(this.routeTarget.x,(this.routeTarget.y??this.floor)+.22,this.routeTarget.z);
 }
}
