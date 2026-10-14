import {FAB_Y} from '../data/layout.js';
import { FAB_BALANCE as B } from '../data/balance.js';
import { NPC_NAMES,NPC_ROLES } from '../data/npc.js';
export class NPCManager {
  constructor(bays,equipment,random,collision=null){
    this.collision=collision;
    this.random=random;this.byBay=new Map();this.entities=[];this.equipment=equipment;
    for(const bay of bays){const list=[];for(let i=0;i<B.npcPerBay;i++){
      const e=equipment.byBay.get(bay.id)[i*2],npc={id:`${bay.id}-NPC-${i}`,bayId:bay.id,y:FAB_Y,side:bay.side,name:NPC_NAMES[(bay.row*2+i)%NPC_NAMES.length],role:NPC_ROLES[i%NPC_ROLES.length],targetId:e.id,x:e.x+bay.side*1.2,z:e.z-6.5,heading:0,state:'WORK_EQUIPMENT',until:2+i*2+random()*6,route:[],waypoint:0,lastUpdate:0,phase:i,speed:0};
      if(i%2===0){npc.x=bay.side*4;npc.z=bay.z-17+i*1.8;npc.until=0;}
      npc.prevX=npc.x;npc.prevZ=npc.z;npc.lastDt=.1;list.push(npc);this.entities.push(npc);collision?.traffic?.add(npc,npc);
    }this.byBay.set(bay.id,list);}
  }
  decide(npc,now){const list=this.equipment.byBay.get(npc.bayId).filter(e=>!this.byBay.get(npc.bayId).some(n=>n!==npc&&n.targetId===e.id));if(!list.length){npc.until=now+2;return;}const e=list[Math.floor(this.random()*list.length)];npc.targetId=e.id;npc.route=[{x:npc.side*4,z:npc.z},{x:npc.side*4,z:e.z-6.5},{x:e.x+npc.side*1.2,z:e.z-6.5}];npc.waypoint=0;npc.state='WALK_TO_EQUIPMENT';npc.until=now;}

  update(now,bayManager){
    for(const npc of this.entities){const tier=bayManager.byId.get(npc.bayId).tier,interval=tier==='near'?.1:tier==='medium'?.5:2;if(now-npc.lastUpdate+1e-6<interval)continue;let dt=now-npc.lastUpdate;npc.lastUpdate=now;
      npc.prevX=npc.x;npc.prevZ=npc.z;npc.lastDt=dt;
      if(npc.chatting){npc.speed=0;continue;}
      if(npc.state==='WORK_EQUIPMENT'){npc.speed=0;if(now>=npc.until)this.decide(npc,now);else continue;}
      let travel=Math.min(dt,.5)*B.npcSpeed,moved=0;while(travel>0&&npc.waypoint<npc.route.length){const target=npc.route[npc.waypoint],dx=target.x-npc.x,dz=target.z-npc.z,d=Math.hypot(dx,dz);if(d<.08){npc.waypoint++;continue;}const step=Math.min(d,travel),x=npc.x,z=npc.z;npc.heading=Math.atan2(dx,dz);
       if(this.collision?.traffic)this.collision.traffic.move(npc,npc,dx/d*step,dz/d*step,{target});else{npc.x+=dx/d*step;npc.z+=dz/d*step;}const actual=Math.hypot(npc.x-x,npc.z-z);moved+=actual;travel-=step;if(actual<.0001)break;if(Math.hypot(npc.x-target.x,npc.z-target.z)<.08)npc.waypoint++;
      }npc.speed=moved/Math.max(.001,dt);
      if(npc.waypoint>=npc.route.length){npc.state='WORK_EQUIPMENT';npc.heading=0;npc.until=now+6+this.random()*14;npc.speed=0;}
    }
  }
}
