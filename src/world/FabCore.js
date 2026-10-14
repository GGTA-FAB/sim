import {buildSwitchbackStair,buildStairGuards} from './SwitchbackStair.js';
import {Builder} from './Builder.js';
import {FAB_STAIR,FAB_CORE_ROOMS} from '../data/layout.js';
export function buildFabCore(scene,collision){
 const b=new Builder(scene,collision);
 for(const room of FAB_CORE_ROOMS){const y=room.y;
  for(let x=-16;x<13.5;x++)for(let z=76.5;z<100;z++){
   if(x>-15&&x<-9&&z>84&&z<92)continue;
   if(x>FAB_STAIR.minX-.5&&x<FAB_STAIR.maxX+.5&&z>FAB_STAIR.minZ-2.5&&z<FAB_STAIR.maxZ+.5)continue;
   b.box(x,y-.15,z,1,.3,1,0xcbd5d6,false);
  }
  for(const x of [-16.5,13.5])b.box(x,y+2.8,88,.3,5.6,24,0xe5e9e7,true);
  for(const z of [76,100]){const opening=z===76&&y===0?0:10;if(!opening)b.box(-1.5,y+2.8,z,30,5.6,.3,0xe5e9e7,true);else for(const [x,w] of [[-10.75,11.5],[9.25,8.5]])b.box(x,y+2.8,z,w,5.6,.3,0xe5e9e7,true);}
  b.sign(y===6?'3F CLEANROOM → 製造層':'2F SUB FAB → 潔淨支援層',0,y+3.8,98,10,.75,'#eafbff','#286b81',Math.PI);
  b.sign(y===6?'← 電梯 / 樓梯 → 下樓到 2F Sub FAB':'← 電梯 / 樓梯 → 回 3F 生產區',0,y+3.5,77,12,.7,'#f7f2cf','#357b86');
  for(const x of [-3,12])b.box(x,y+5.4,88,1,.08,12,0xf5f1d8);
 }
 b.box(-1.5,11.8,88,30,.25,24,0xe8ece9,true);
 buildSwitchbackStair(b,collision,FAB_STAIR,0);buildStairGuards(b,collision,FAB_STAIR);
 b.sign('折返樓梯 · 2F ↔ 3F',7.5,8.3,93.7,5,.55,'#173c50','#f3df91');b.finish();
}
