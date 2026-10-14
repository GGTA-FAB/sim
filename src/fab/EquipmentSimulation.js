import {equipmentStatus} from '../data/equipmentStatus.js';
import { EQUIPMENT } from '../data/layout.js';
import { FAB_BALANCE as B } from '../data/balance.js';
export const EQUIPMENT_STATES=['IDLE','WAIT_FOUP','LOAD','PROCESS','COMPLETE','UNLOAD'];
export class EquipmentSimulation {
  constructor(foups,random,bus){
    this.lastUpdate=0;this.foups=foups;this.random=random;this.bus=bus;this.completed=0;this.entities=EQUIPMENT.map((def,i)=>{
      const loaded=i%3===0||i%5===0,state=loaded?'PROCESS':i%2?'WAIT_FOUP':'IDLE';
      const e={...def,state,since:0,until:loaded?8+random()*30:2+random()*8,processDuration:30,foupId:null,assigned:null,cycles:0};
      if(loaded){e.foupId=foups.reserve(e.bayId,'equipment',e.id);this.placeFoup(e);}return e;
    });this.byId=new Map(this.entities.map(e=>[e.id,e]));this.byBay=new Map();for(const e of this.entities){if(!this.byBay.has(e.bayId))this.byBay.set(e.bayId,[]);this.byBay.get(e.bayId).push(e);}
  }
  placeFoup(e){const f=this.foups.items[e.foupId];if(f){f.x=e.portX;f.y=B.dockHeight;f.z=e.portZ;f.heading=Math.PI;}}
  transition(e,state,now,duration=Infinity){e.state=state;e.since=now;e.until=now+duration;this.bus?.emit('FAB_EQUIPMENT_STATE_CHANGED',{id:e.id,state});}
  update(now){const dt=now-this.lastUpdate;this.lastUpdate=now;for(const e of this.entities){if(e.workStatus){e.since+=dt;e.until+=dt;continue;}if(now<e.until)continue;
    if(e.state==='IDLE')this.transition(e,'WAIT_FOUP',now);
    else if(e.state==='LOAD'){e.processDuration=B.processMin+this.random()*(B.processMax-B.processMin);this.transition(e,'PROCESS',now,e.processDuration);}
    else if(e.state==='PROCESS'){this.transition(e,'COMPLETE',now,B.completeSeconds);e.cycles++;this.completed++;}
    else if(e.state==='COMPLETE')this.transition(e,'UNLOAD',now);
  }}
  delivered(e,foupId,now){e.foupId=foupId;this.foups.transfer(foupId,'equipment',e.id);this.placeFoup(e);this.transition(e,'LOAD',now,B.loadSeconds);}
  pickedUp(e,now){e.foupId=null;e.assigned=null;this.transition(e,'IDLE',now,B.idleMin+this.random()*(B.idleMax-B.idleMin));}
  describe(id,now){const e=this.byId.get(id),progress=e.state==='PROCESS'?Math.min(100,Math.floor((now-e.since)/e.processDuration*100)):null;return{title:e.id,description:`${e.area} · BAY ${e.bayId}\nSTATUS: ${equipmentStatus(e.state)}${progress===null?'':` · ${progress}%`}\n${e.foupId===null?'Load Port：等待 FOUP':`Load Port：FOUP-${String(e.foupId+1).padStart(3,'0')}`}\n已完成批次：${e.cycles}\n\n背景生產持續運作。今日指派機台發生 Alarm 時，請查看今日任務。`};}
}
