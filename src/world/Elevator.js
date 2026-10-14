import * as THREE from 'three';
import { Builder } from './Builder.js';
import { FLOORS, LIFT } from '../data/layout.js';
export class Elevator {
 constructor(scene,collision,interactions,bus,config={}){this.id=config.id??'office';this.location=config.location??LIFT;this.floors=config.floors??FLOORS;this.bus=bus;this.remaining=0;this.level=6;this.doors=[];this.landings=[];
  const {x,z}=this.location,b=new Builder(scene,collision);
  const bottom=Math.min(...this.floors.map(f=>f.y)),top=Math.max(...this.floors.map(f=>f.y))+5,mid=(bottom+top)/2;for(const side of [-1,1])b.box(x+side*2.5,mid,z,.22,top-bottom,6,0x9da69e,true);b.box(x,mid,z-3,5.2,top-bottom,.22,0x9da69e,true);
  for(const f of this.floors){
   for(const side of [-1,1])b.box(x+side*2.03,f.y+2,z+3,.95,4,.25,0x86948f,true);
   b.box(x,f.y+3.8,z+3,3.1,.8,.25,0xb7bdb2,true);b.sign(f.label,x,f.y+3.3,z+3.17,4.4,.5);
   const blocker=collision.add(x,z+3,3,.16,3.2,f.y+1.6,'lift-door'),pair=[];
   for(const side of [-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(1.5,3.2,.15),new THREE.MeshStandardMaterial({color:0xaebbb1,metalness:.3,roughness:.5}));m.position.set(x+side*.75,f.y+1.6,z+3);scene.add(m);pair.push({mesh:m,side});}
   this.landings.push({y:f.y,blocker,pair});
   interactions.push({id:`${this.id==='office'?'':'fab-'}lift-${f.y}`,elevatorId:this.id,kind:'elevator',x,z,y:f.y,title:`電梯 · ${f.label}`,action:'選擇樓層',area:{minX:x-1.4,maxX:x+1.4,minZ:z-2,maxZ:z+2}});
  }
  b.finish();this.cabin=new THREE.Group();scene.add(this.cabin);const c=new Builder(this.cabin,{add(){}});c.box(x,.015,z,4.65,.06,5.7,0xb8b3a1);c.box(x,4.1,z,4.65,.12,5.7,0xe5e0cb);c.box(x,3.99,z,1.8,.05,2,0xffefbd);c.box(x,1.1,z-2.78,4.4,.08,.09,0x788980);c.finish();this.sync(6);
 }
 get busy(){return this.remaining>0;}
 setDoors(level,opening){for(const l of this.landings){const o=l.y===level?opening:0;l.blocker.enabled=o<.95;for(const d of l.pair)d.mesh.position.x=this.location.x+d.side*(.75+1.55*o);}}
 start(player,to){if(this.busy||!this.floors.some(f=>f.y===to)||Math.abs(player.position.y-to)<.1)return false;this.from=player.position.y;this.to=to;this.duration=1.4+Math.abs(to-this.from)/2.3;this.remaining=this.duration;this.player=player;this.bus.emit('ELEVATOR_STARTED',{to});return true;}
 update(dt,player){
  if(!this.busy){if(player&&Math.abs(player.position.x-this.location.x)<8&&Math.abs(player.position.z-this.location.z)<8&&this.floors.some(f=>Math.abs(f.y-player.position.y)<.05))this.sync(player.position.y);return;}
  this.remaining=Math.max(0,this.remaining-dt);const elapsed=this.duration-this.remaining,move=Math.max(0,Math.min(1,(elapsed-.7)/(this.duration-1.4)));const smooth=move*move*(3-2*move),y=this.from+(this.to-this.from)*smooth;this.player.position.y=y;this.cabin.position.y=y;
  if(elapsed<.7)this.setDoors(this.from,1-elapsed/.7);else if(this.remaining<.7)this.setDoors(this.to,1-this.remaining/.7);else this.setDoors(null,0);
  if(this.remaining===0){this.level=this.to;this.setDoors(this.to,1);this.bus.emit('FLOOR_CHANGED',this.to);this.bus.emit('ELEVATOR_ARRIVED',{id:this.id,to:this.to});}
 }
 sync(y){if(!this.busy){this.level=y;this.cabin.position.y=y;this.setDoors(y,1);}}
}
