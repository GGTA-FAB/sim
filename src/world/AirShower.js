import {AirShowerAccess} from './AirShowerAccess.js';
import {CLEAN_ACCESS} from '../data/layout.js';
import {BALANCE} from '../data/balance.js';
import * as THREE from 'three';
import { Builder } from './Builder.js';
const FAB_Y=CLEAN_ACCESS.y;
export class AirShower {
 constructor(scene,collision,bus){this.bus=bus;this.access=new AirShowerAccess(this);this.mode='ENTRY';this.remaining=0;this.doors=[];const b=new Builder(scene,collision,FAB_Y);
  for(const z of [70,76]){const collider=collision.add(0,z,16,.18,3.5,FAB_Y+1.75,'gate'),leaves=[];for(const side of [-1,1]){const mesh=new THREE.Group(),glass=new THREE.Mesh(new THREE.BoxGeometry(4.86,3.12,.045),new THREE.MeshStandardMaterial({color:0xc5e7e5,transparent:true,opacity:.14,depthWrite:false,roughness:.25}));mesh.add(glass);const frame=new THREE.MeshStandardMaterial({color:0x738e91,metalness:.35,roughness:.5});for(const [x,y,w,h]of [[-2.46,0,.08,3.3],[2.46,0,.08,3.3],[0,-1.61,5,.08],[0,1.61,5,.08],[0,-.45,5,.045]]){const rail=new THREE.Mesh(new THREE.BoxGeometry(w,h,.09),frame);rail.position.set(x,y,0);mesh.add(rail);}mesh.position.set(side*2.5,FAB_Y+1.65,z);scene.add(mesh);leaves.push({mesh,side});}this.doors.push({collider,leaves,open:0});b.box(0,3.6,z,10,.45,.5,0x788f85);b.sign(z===70?'AIR SHOWER / 風淋通道':'CLEANROOM / 潔淨入口',0,3.6,z-.28,8,.37,'#f5f0d2','#526f62',Math.PI);}
  for(const side of [-1,1]){b.box(side*6.5,1.65,73,3,3.3,5.7,0xc5cdbd,true);b.box(side*4.8,1.65,73,.24,3.3,5.7,0xb4c2b7,true);for(const z of [71,72,73,74,75])for(const y of [.7,1.5,2.3]){b.box(side*4.64,y,z,.1,.19,.3,0x506b65);}}
  b.box(0,3.65,73,9.7,.13,5.7,0xc5cdbd);b.box(0,.015,73,9.5,.03,5.7,0x91a395);for(let x=-4.4;x<4.5;x+=.22)b.box(x,.037,73,.045,.025,5.5,0x566d65);b.finish();
  this.air=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xdfece2,transparent:true,opacity:.5}),30);this.air.frustumCulled=false;scene.add(this.air);this.dummy=new THREE.Object3D();this.time=0;
 }
 get busy(){return this.remaining>0;}
 setDoor(index,open,dt){const d=this.doors[index];d.open=THREE.MathUtils.damp(d.open,open?1:0,12,dt);d.collider.enabled=d.open<.94;for(const l of d.leaves)l.mesh.position.x=l.side*(2.5+d.open*4.9);}
 update(dt,player){this.time+=dt;const z=Math.abs(player.position.y-FAB_Y)<.5?player.position.z:0;
  if(this.mode==='ENTRY'&&player.gowned&&z>72.2&&z<76){this.mode='BLOW_IN';this.remaining=BALANCE.airShowerSeconds;this.bus.emit('AIRSHOWER_STARTED');}
  if(this.mode==='FAB'&&z<73.8&&z>70){this.mode='BLOW_OUT';this.remaining=BALANCE.airShowerSeconds;this.bus.emit('AIRSHOWER_STARTED');}
  if(this.busy){this.remaining=Math.max(0,this.remaining-dt);if(this.remaining===0){this.mode=this.mode==='BLOW_IN'?'EXIT':'RETURN';this.bus.emit('AIRSHOWER_COMPLETED');}}
  if(this.mode==='EXIT'&&z>77)this.mode='FAB';if(this.mode==='RETURN'&&z<69)this.mode='ENTRY';
  this.setDoor(0,(this.mode==='RETURN'||player.gowned&&this.mode==='ENTRY')&&this.doors[1].open<.06,dt);this.setDoor(1,(this.mode==='EXIT'||this.mode==='FAB')&&this.doors[0].open<.06,dt);
  this.air.visible=this.busy; if(this.busy){for(let i=0;i<30;i++){const side=i%2?1:-1,travel=(this.time*3+i*.13)%1;this.dummy.position.set(side*(4.5-travel*3.7),FAB_Y+.6+(i%3)*.8,71+(Math.floor(i/3)%5));this.dummy.scale.set(.7,.025,.035);this.dummy.updateMatrix();this.air.setMatrixAt(i,this.dummy.matrix);}this.air.instanceMatrix.needsUpdate=true;}
 }
}
