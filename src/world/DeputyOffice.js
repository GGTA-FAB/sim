import * as THREE from 'three';
import {Builder} from './Builder.js';
import {Player} from '../player/Player.js';
import {label,plant} from './DecorPrimitives.js';
import {DEPUTY_DESK as D,DEPUTY_NAME} from '../data/deputyOffice.js';

export class DeputyOffice {
 constructor(scene,collision){
  this.owned=false;this.timer=0;
  const b=new Builder(scene,collision,6);
  b.box(-11.85,.02,23.4,11.1,.035,8.25,0x5f9eab);
  // Open on the east side: a 3.4 m entrance clear of the office/meeting aisle.
  b.box(-11.85,1.15,19.2,11.3,2.3,.16,0x528491,true);
  for(const [z,d] of [[19.9,1.4],[25.9,3.6]])b.box(-6.2,1.15,z,.16,2.3,d,0x528491,true);
  b.box(-11.85,2.32,19.2,11.3,.09,.2,0xe0b16b);
  b.sign('副理辦公區 / DEPUTY MANAGER',-11.85,1.6,19.09,8,.6,'#fff4db','#355b67',Math.PI);
  b.sign('請進 · 先說重點，再說故事',-6.08,1.8,25.6,3,.35,'#fff4db','#355b67',Math.PI/2);
  b.box(D.x,.78,D.z,4.8,.18,1.45,0xcf9d64,true);
  for(const x of [D.x-1.8,D.x+1.8])b.box(x,.36,D.z,.3,.72,1.2,0x365d67);
  b.box(D.x-2.65,.75,D.z+.7,1.1,.15,2.9,0xcf9d64,true);
  b.box(D.x-2.65,.35,D.z+1.5,.95,.7,.95,0x54808a,true);
  b.box(D.x,1.25,D.z-.2,.85,.65,.1,0x2d4953);b.box(D.x,1.25,D.z-.14,.65,.47,.015,0x7ca8a3);
  b.box(D.x,.885,D.z+.25,.62,.035,.3,0x526561);
  // Chairs are visual seats; their centres remain reachable for seated activities.
  b.box(D.seat.x,.46,D.seat.z,1,.12,.85,0x354e61);b.box(D.seat.x,1.02,D.seat.z+.4,1,1.15,.13,0x354e61);
  for(const x of [D.x-.53,D.x+.53])b.box(x,.75,D.seat.z,.11,.12,.65,0x354e61);
  b.cylinder(D.x,.23,D.seat.z,.1,.46,0x71868b);
  for(const x of [-13.4,-10.8]){b.box(x,.46,21.45,.85,.12,.8,0xd88f5c,true);b.box(x,.86,21.1,.85,.75,.12,0xd88f5c);}
  b.box(-16.75,1,25.3,1,2,3.3,0x365d67,true);
  for(const z of [24.5,25.3,26.1])b.box(-16.15,1.35,z,.1,.5,.45,0xe5ca8c);
  b.sign('XSMC · 帶人，也要帶便當',-11.8,3,27.7,7,.65,'#355b67','#f2e3ba',Math.PI);
  b.finish();
  this.decor=new THREE.Group();scene.add(this.decor);plant(this.decor,-7.3,6,26.8).scale.setScalar(3.4);
  this.boss=new Player(scene,{variant:4,shirt:0x354c60});this.boss.position.set(D.seat.x,6,D.seat.z);this.boss.group.rotation.y=Math.PI;this.boss.setLifePose('work-pc');
  this.rename(DEPUTY_NAME+' · 副理');
 }
 rename(text){if(text===this.name)return;this.name=text;if(this.nameplate){this.decor.remove(this.nameplate);this.nameplate.geometry.dispose();this.nameplate.material.map.dispose();this.nameplate.material.dispose();}this.nameplate=label(this.decor,text,-10.65,7.15,23.37,2.4,.34,Math.PI,'#f9e5b6','#35515d');}
 setOwner(owned,name){this.owned=owned;this.boss.group.visible=!owned;this.rename((owned?name:DEPUTY_NAME)+' · 副理');}
 update(dt,position){this.boss.group.visible=!this.owned&&Math.abs(position.y-6)<2&&position.z<65;this.timer+=dt;if(!this.boss.group.visible||this.timer<.12)return;this.boss.animate(this.timer,0,Math.PI);this.timer=0;}
}
