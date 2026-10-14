import * as THREE from 'three';
import { BAYS,EQUIPMENT,FAB_Y } from '../data/layout.js';
import { Builder } from './Builder.js';
import { buildEtcher } from './EtchModels.js';
import { buildStocker } from './Stocker.js';
export function buildFab(scene,collision,interactions){
  const groups=new Map();
  for(const bay of BAYS){
    const group=new THREE.Group();group.name=`Bay ${bay.id}`;scene.add(group);groups.set(bay.id,group);const b=new Builder(group,collision,FAB_Y);
    const inner=bay.side*8;
    for(const offset of [-21,21])b.box(bay.x,2.7,bay.z+offset,60,5.4,.22,0xd1dfd9,true);
    for(const [start,end] of [[-15,-2],[4,14]])b.box(inner,2.7,bay.z+(start+end)/2,.22,5.4,end-start,0xe1e9e4,true);
    b.sign(`${bay.id}  /  ${bay.area}`,bay.side*7.82,3.7,bay.z-17,6,.8,'#eff6ef',`#${bay.color.toString(16)}`,bay.side<0?Math.PI/2:-Math.PI/2);
    b.sign(`${bay.id}   ${bay.area} BAY`,bay.x,4.4,bay.z+20.82,17,1.15,'#365c5c','#e2ece6',Math.PI);
    for(const e of EQUIPMENT.filter(e=>e.bayId===bay.id)){
      const {x,z,id}=e;
      if(bay.area==='ETCH')buildEtcher(b,e);else {
      b.box(x,1.9,z,7,3.8,7.6,0xebefec,true);b.box(x,.2,z,7.15,.4,7.75,0x788e8d);
      for(const offset of [-2.35,0,2.35]){b.box(x+offset,2,z-3.83,2.28,3.45,.08,0xd9e0db);b.box(x+offset+.8,1.9,z-3.91,.06,.5,.08,0x6e8585);}
      b.box(x+2.4,2.3,z-3.94,1.2,.9,.14,0x34545b);
      b.box(x-.7,2.4,z-3.92,2.8,1.15,.12,0x49686b);
      b.sign(id,x-1,3.08,z-3.95,3.5,.58,'#234f52','#eef1e6',Math.PI);
      for(const offset of [-2.2,-.35]){b.box(x+offset,.72,z-4.5,1.5,1.44,1.25,0xb6c5c2,true);b.box(x+offset,1.48,z-4.5,1.55,.08,1.3,0x738d8c);}
      b.box(x+2.5,4.05,z,.13,.6,.13,0x617b7c);b.box(x,3.89,z+2,5,.12,2.5,0xa8b8b5);
      if(bay.area==='LITHO')b.box(x,2.4,z+1,6.6,2.1,3.5,0xd9d5b7);
      if(bay.area==='WET')for(const n of [-2,0,2])b.box(x+n,4.1,z+1,1.2,.45,2.5,0x91afb4);
      if(bay.area==='CMP')for(const n of [-2,0,2])b.box(x+n,3.95,z,1.5,.25,3,0xb3c5be);
      }
      interactions.push({id,x,y:FAB_Y,z:z-6,title:id,action:'查看生產狀態',kind:'equipment',equipmentId:id});
    }
    buildStocker(b,bay);
    for(const z of [bay.z-17,bay.z+1])b.box(bay.x,.021,z,59,.025,.065,0x8aada0);
    for(const x of [bay.x-22,bay.x,bay.x+22])for(const z of [bay.z-15,bay.z,bay.z+15])b.box(x,7.08,z,1,.06,5.5,0xf6f8e8);
    b.finish();
  }
  return groups;
}
