import {Builder} from './Builder.js';
import {CORE_ROOMS,STAIR,LIFT} from '../data/layout.js';
import {buildSwitchbackStair,buildStairGuards} from './SwitchbackStair.js';
export function buildVerticalCore(scene,collision){const b=new Builder(scene,collision);
 for(const room of CORE_ROOMS){const {y}=room,end=y===-6?-12:0;
  for(let x=-11.5;x<12;x++)for(let z=-25.5;z<end;z++){
   if(Math.abs(x-LIFT.x)<2.6&&Math.abs(z-LIFT.z)<3.1)continue;
   if(x>STAIR.minX-.2&&x<STAIR.maxX+.2&&z>STAIR.minZ-2.2&&z<STAIR.maxZ+.2)continue;
   b.box(x,y-.15,z,1,.3,1,0xc7c8b8,true,'floor');}
  for(const x of [-12,12])b.box(x,y+2.7,(-26+end)/2,.3,5.4,end+26,0xdde0d4,true);
  b.box(0,y+2.7,-26,24,5.4,.3,0xdde0d4,true);
  if(y>=0)for(const x of [-8,8])b.box(x,y+2.7,0,8,5.4,.3,0xdde0d4,true);
  b.sign(`${y===6?'3F OFFICE':y===0?'2F LOBBY':'1F FOOD'} / 電梯 ← 折返樓梯 →`,0,y+3.7,-12,13,.65);
  for(const z of [-22,-11,-4])if(z<end)b.box(0,y+5.25,z,1.4,.06,3,0xfff1ce);
 }
 b.box(0,11.55,-13,24,.25,26,0xe9e9de,true);
 for(const base of STAIR.bases)buildSwitchbackStair(b,collision,STAIR,base);
 buildStairGuards(b,collision,STAIR);b.finish();}
