import {OWNED_EQUIPMENT_MIN,OWNED_EQUIPMENT_MAX} from '../data/balance.js';
import {FAB_Y} from '../data/layout.js';
import { createRepair } from '../minigames/registry.js';
import { ALARMS,ALARM_BALANCE as B } from '../data/alarms.js';
export class AlarmSystem {
  constructor(equipment,tasks,clock,random,bus,module='ETCH',ownedCount=null){
    this.equipment=equipment;this.tasks=tasks;this.clock=clock;this.random=random;this.bus=bus;this.ownedCount=ownedCount;this.serial=0;this.takeovers=[];this.reassigned=new Set();
    this.assignModule(module);
    this.next=clock.seconds+B.firstMin+random()*(B.firstMax-B.firstMin);
  }
  assignModule(module){
    const {equipment,random}=this;
    const choices=equipment.entities.filter(e=>e.id.startsWith(module+'-'));
    for(let i=choices.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
    this.owned=choices.slice(0,this.ownedCount??OWNED_EQUIPMENT_MIN+Math.floor(random()*(OWNED_EQUIPMENT_MAX-OWNED_EQUIPMENT_MIN+1))).map(e=>e.id).sort();
  }
  get(id){return this.tasks.tasks.get(id);}
  trigger(id=this.owned.find(id=>!this.reassigned.has(id)&&!this.get(id)&&!this.takeovers.some(t=>t.id===id)&&!this.equipment.byId.get(id)?.workStatus),options={}){
    if(this.reassigned.has(id)||!this.owned.includes(id)||this.get(id)||this.takeovers.some(t=>t.id===id)||this.equipment.byId.get(id)?.workStatus)return null;
    const e=this.equipment.byId.get(id),alarm=options.alarmCode?ALARMS.find(a=>a.code===options.alarmCode):ALARMS[Math.floor(this.random()*ALARMS.length)];
    if(!alarm)throw Error('Unknown alarm code');const type=options.gameType??alarm.games[Math.floor(this.random()*alarm.games.length)];if(!alarm.games.includes(type))throw Error('Repair not allowed for this alarm');
    const task={id,equipmentId:id,x:e.x,z:e.z-6,y:alarm.service==='subfab'?0:FAB_Y,service:alarm.service??'fab',name:`${id} · ${alarm.service==='subfab'?'2F Sub FAB':'3F FAB'}`,alarm,created:this.clock.seconds,status:'DOWN',repair:createRepair(type,this.random),serial:++this.serial};
    e.workStatus='DOWN';e.alarm=alarm;this.tasks.add(task);this.bus.emit('ALARM_CREATED',task);return task;
  }
  update(dt){
    if(this.director)this.director.update();
    else if(this.clock.seconds>=this.next){
      const available=this.owned.filter(id=>!this.reassigned.has(id)&&!this.get(id)&&!this.takeovers.some(t=>t.id===id)&&!this.equipment.byId.get(id)?.workStatus);if(available.length)this.trigger(available[Math.floor(this.random()*available.length)]);
      this.next=this.clock.seconds+(this.random()<B.shortGapChance?B.shortGapMin+this.random()*(B.shortGapMax-B.shortGapMin):B.intervalMin+this.random()*(B.intervalMax-B.intervalMin));
    }
    for(let i=this.takeovers.length-1;i>=0;i--){const t=this.takeovers[i];t.remaining-=dt;if(t.remaining<=0){const e=this.equipment.byId.get(t.id);e.workStatus=null;e.alarm=null;this.takeovers.splice(i,1);this.bus.emit('PROCESS_TAKEOVER',t);}}
  }
  repaired(task,by='player'){if(task.status!=='DOWN')return;task.status='WAIT_PROCESS';task.repairedBy=by;task.repaired=this.clock.seconds;this.equipment.byId.get(task.id).workStatus='WAIT_PROCESS';this.tasks.changed(task);this.bus.emit('ALARM_REPAIRED',task);}
  notify(id){const task=this.get(id);if(task?.status!=='WAIT_PROCESS')return false;task.notified=this.clock.seconds;task.status='PROCESS_CHECK';this.equipment.byId.get(id).workStatus='PROCESS_CHECK';this.takeovers.push({id,remaining:B.processTakeoverSeconds});this.bus.emit('PROCESS_NOTIFIED',task);this.tasks.complete(id);return true;}
}
