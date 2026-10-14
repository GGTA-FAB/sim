import * as THREE from 'three';
import {Builder} from './Builder.js';
import {BAYS,EQUIPMENT} from '../data/layout.js';
export function buildSubFab(scene,collision,interactions){const groups=new Map();
 for(const bay of BAYS){const group=new THREE.Group();group.name=`Sub FAB ${bay.id}`;scene.add(group);groups.set(bay.id,group);const b=new Builder(group,collision);
  b.box(bay.x,.015,bay.z,60,.025,42,0xb8c4c7);b.sign(`2F SUB ${bay.id} / 上方 3F ${bay.area}`,bay.x,3.5,bay.z+20.6,20,.9,'#eef8ef','#326575',Math.PI);
  for(const z of [bay.z-17,bay.z+1]){b.box(bay.x,.04,z,59,.02,.12,0xdac057);b.box(bay.x,.04,z+2,59,.02,.07,0xe4ded0);}
  for(const e of EQUIPMENT.filter(e=>e.bayId===bay.id)){
   b.box(e.x,.18,e.z,7,.36,6.8,0x6d848c,true);b.box(e.x-1.7,1.2,e.z-1,2.5,2.1,3.2,0xc9d7d8,true);b.cylinder(e.x-1.7,1.4,e.z-1,.7,1.25,0x677e8a,10);
   b.box(e.x+1.6,1.6,e.z+1,2.4,3.1,2.8,0xe0e4dd,true);b.box(e.x+1.6,1.8,e.z-.43,1.6,.7,.05,0x2d677a);b.box(e.x+1.6,2.65,e.z-.43,.12,.14,.04,0x72c282);
   b.box(e.x-1.3,.9,e.z+1.8,2.7,1.4,1.5,0x759baf,true);b.sign(`↑ 3F ${e.id}`,e.x,2.6,e.z-3.6,5,.55,'#fff2ba','#315c70',Math.PI);b.sign('PUMP / COOLING / EXHAUST',e.x,1.9,e.z-3.6,5,.3,'#f4faf7','#506e7b',Math.PI);
   for(const [dx,color] of [[-2.8,0xd6b859],[0,0x58a5bd],[2.8,0x9385ad]]){b.cylinder(e.x+dx,3.7,e.z+2.5,.14,4.1,color,8);b.beam(e.x+dx,e.z+2.5,e.x+dx,bay.z+18,4.7,.25,color);for(const h of [2.5,4.2])b.box(e.x+dx,h,e.z+2.5,.43,.16,.43,0x718992);}
   interactions.push({id:`sub-${e.id}`,kind:'sub-equipment',equipmentId:e.id,x:e.x,y:0,z:e.z-6,title:`Sub FAB · ${e.id}`,action:'查看支援設備 / 巡檢',description:`上方對應：3F ${e.id}\n本層：真空幫浦、冷卻單元、排氣處理櫃。\n依工單核對狀態與標示，不操作製程參數。`});
  }
  for(const [z,color] of [[bay.z+17,0xd6b859],[bay.z+18,0x58a5bd],[bay.z+19,0x9385ad]])b.beam(bay.side*7,z,bay.side*68,z,5.1,.32,color);
  for(const x of [bay.x-20,bay.x,bay.x+20]){b.box(x,5.25,bay.z,1,.08,30,0xf4f0d7);b.box(x,5.4,bay.z,1.8,.12,38,0x768b91);}
  b.finish();
 }
 return groups;
}
