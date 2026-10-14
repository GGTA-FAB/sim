import {PLAYER_DESK,deskPoint} from '../data/playerDesk.js';
import {Builder} from './Builder.js';
import {Player} from '../player/Player.js';
import {LIFE_LOCATIONS,OFFICE_COLLEAGUES} from '../data/life.js';
export function installDailyPlaces(world,scene){const desk=world.interactions.find(i=>i.id==='desk');Object.assign(desk,LIFE_LOCATIONS.desk);world.interactions.push(LIFE_LOCATIONS.handover,LIFE_LOCATIONS.coffee,...OFFICE_COLLEAGUES);
 const b=new Builder(scene,world.collision,6);const deskBox=(x,y,z,w,h,d,...rest)=>{const p=deskPoint(x,z);b.box(p.x,y,p.z,d,h,w,...rest);};deskBox(4.4,.46,9,.72,.12,.7,0x647e76);deskBox(4.05,.86,9,.12,.8,.72,0x647e76);deskBox(5.6,.77,9,.9,.15,1.8,0xc0ae8c,true);deskBox(5.8,1.25,9,.1,.65,.85,0x354c51);deskBox(5.74,1.25,9,.015,.47,.65,0x7ca8a3);deskBox(5.35,.865,9,.3,.035,.62,0x526561);deskBox(5.35,.88,9.5,.12,.05,.1,0x526561);b.sign('ENGINEER DESK',PLAYER_DESK.x,1.9,8.18,1.6,.3,'#476b5a','#eee9d8');b.box(10,1,26,1.5,2,1,0xb4c2b5,true);b.box(10,2.3,26,1.1,.6,.8,0x40565b);b.sign('COFFEE',10,3,25.45,2,.4,'#fff0cf','#476b5a');b.finish();
 const sign=new Builder(scene,world.collision,-6);sign.sign('用餐座位 →',-9.5,2,7,3,.45,'#fff0cf','#476b5a',Math.PI);sign.finish();
 return OFFICE_COLLEAGUES.map((item,index)=>{const npc=new Player(scene,{variant:index+3,shirt:index?0x709186:0x687991});npc.position.set(item.x,item.y,item.z);npc.group.rotation.y=index?Math.PI/2:-Math.PI/2;return npc;});
}
