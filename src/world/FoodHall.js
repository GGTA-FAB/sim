import {CLAW_PLACE} from '../life/ClawMachine.js';
import {DINING_SEATS,TRAY_RETURN} from '../data/dining.js';
import { Builder } from './Builder.js';
import { SHOPS } from '../data/shops.js';
export function buildFoodHall(scene,collision,interactions){
 const b=new Builder(scene,collision,-6);collision.add(-29.7,18,2.6,2.2,3.6,-4.2,'claw-machine');interactions.push({...CLAW_PLACE});
 b.box(0,-.15,14,64,.3,52,0xb6ac94);b.box(0,4.85,14,64,.25,52,0xe6dfcc,true);
 for(const x of [-32,32])b.box(x,2.4,14,.3,4.8,52,0xd5cab4,true);
 b.box(0,2.4,40,64,4.8,.3,0xd5cab4,true);for(const x of [-22,22])b.box(x,2.4,-12,20,4.8,.3,0xd5cab4,true);
 for(let z=-8;z<40;z+=4)for(let x=-28;x<32;x+=8)b.box(x,4.64,z,1.5,.06,2,0xffe8b1);
 const f={box:(x,y,z,...args)=>b.box(x,y,28-z,...args),cylinder:(x,y,z,...args)=>b.cylinder(x,y,28-z,...args),sign:(text,x,y,z,w,h,c,bg)=>b.sign(text,x,y,28-z,w,h,c,bg,Math.PI)};
 for(const s of SHOPS){
  const front=s.id==='mart'?26:-2;
  f.box(s.x,.55,front+1,9,1.1,1.3,s.color,true);f.box(s.x,1.15,front+1,9.3,.14,1.5,0xe6dcc5);
  f.box(s.x,2.8,s.id==='mart'?36:-9,10.5,5.6,.3,0xd9d0bb,true);
  f.sign(s.name,s.x,3.5,s.id==='mart'?27:-2,9.5,.8,'#fff5dc',`#${s.color.toString(16)}`);
  f.sign(s.subtitle,s.x,2.82,s.id==='mart'?27:-2,8,.32,'#4a574b','#eee2c2');
  for(const dx of [-4.9,4.9])f.box(s.x+dx,2.4,front+1,.15,4.8,2.3,0x887b61,true);
  f.box(s.x+2.5,1.4,front+1,.9,.55,.2,0x415353);
  if(s.id!=='mart'){f.box(s.x,2.2,-8,6,2.1,1.2,0x8d9388,true);for(const n of [-2,0,2]){f.cylinder(s.x+n,1.4,-5,.42,.35,0x888d7f);f.box(s.x+n,2.35,-8.7,1.65,1.1,.07,0x464f49);}}
  interactions.push({id:`shop-${s.id}`,kind:'shop',shop:s,x:s.x,z:s.id==='mart'?3.5:26.5,y:-6,title:s.name,action:'購買餐點',description:`${s.food}
購買後可在餐廳座位吃，或外帶回 3F 座位。用餐期間世界持續運作。`});
 }
 for(const x of [-23,-13,13,23])for(const z of [7,16]){
  f.box(x,.78,z,4.2,.18,2,0xc1a879,true);for(const dx of [-1.4,1.4])f.box(x+dx,.37,z,.16,.74,1.5,0x626f65);
  for(const dx of [-1.25,1.25])for(const dz of [-1.55,1.55]){f.box(x+dx,.48,z+dz,.85,.12,.85,0x788c72,true);f.box(x+dx,.83,z+dz+Math.sign(dz)*.36,.85,.7,.12,0x788c72);}
 }
 for(const x of [-23,-13,10])for(const z of [29,35]){f.box(x,.77,z,3.7,.15,1.8,0xc1a879,true);for(const dz of [-1.35,1.35])f.box(x,.45,z+dz,3.4,.9,.55,0x819174,true);}
 for(const x of [21,28]){f.box(x,1.1,32,1.2,2.2,4.6,0xc5c6b4,true);for(const y of [.6,1.2,1.8])for(const z of [30.4,31.2,32,32.8,33.6])f.box(x,y,z,.95,.38,.48,(z%2)?0xc6965a:0x92a183);}
 b.sign('1F · FOOD STREET / 餐飲商店街',0,3.7,7,17,.9,'#5b5947','#eee3bf');
 b.sign('↓ LIFT / STAIRS · 2F FAB / 3F OFFICE',0,3.4,-11.7,8,.5,'#e9eddb','#557368');
 b.box(-29.8,.65,3,2.2,1.3,3,0x84958b,true);b.box(-29.8,1.34,3,2.3,.1,3.1,0xc3c9bd);for(let i=0;i<4;i++)b.box(-29.8,1.45+i*.07,3,.85,.05,.65,0xa7b4ae);b.sign('餐盤回收 / TRAY RETURN',-31.8,2.7,3,4,.65,'#fff4d8','#4c7066',Math.PI/2);
 for(const seat of DINING_SEATS)interactions.push({...seat});interactions.push({...TRAY_RETURN});
 b.finish();
}
