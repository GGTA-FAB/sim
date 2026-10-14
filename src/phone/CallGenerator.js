import {PRAISE_REASON,praiseDay} from '../data/lifestyleResearch.js';
import {ASSISTANT_REPORT} from '../phone/AssistantReport.js';
import { PHONE_BALANCE as B,RANK_CALL_INTERVAL } from '../data/phone.js';
export class CallGenerator {
 constructor(phone,alarms,clock,random,bus,rank=0){Object.assign(this,{phone,alarms,clock,random,rank});this.pending=new Map();this.nextCheck=0;this.nextManufacturing=clock.seconds+this.between(B.mfgStatusMin,B.mfgStatusMax)*this.rankInterval;this.contactCursor=0;this.nextProcess=clock.seconds+this.between(B.processMin,B.processMax)*this.rankInterval;this.nextManager=clock.seconds+this.between(B.managerMin,B.managerMax);
  bus.on('ALARM_CREATED',t=>this.pending.set(t.id,{at:clock.seconds+this.between(B.firstDelayMin,B.firstDelayMax),role:'manufacturing'}));
  bus.on('ALARM_REPAIRED',t=>this.pending.set(t.id,{at:clock.seconds+B.processReminder,role:'process'}));
  bus.on('PROCESS_NOTIFIED',t=>{this.pending.delete(t.id);phone.queue=phone.queue.filter(c=>c.reason===ASSISTANT_REPORT||c.equipmentId!==t.id);});
 }
 get rankInterval(){return RANK_CALL_INTERVAL[this.rank]??1;}
 between(a,b){return a+this.random()*(b-a);}
 person(role){const list=this.phone.contacts.filter(c=>c.role===role);return list[this.contactCursor++%list.length];}
 update(){const now=this.clock.seconds;if(now<this.nextCheck)return;this.nextCheck=now+20;
  if(!this.praiseAttempted&&now>=14*3600&&this.research?.complete('fun-boss-praise')){if(!praiseDay(this.seed??0))this.praiseAttempted=true;else if(this.phone.enqueue('manager-0',this.alarms.owned[0],PRAISE_REASON))this.praiseAttempted=true;}
  for(const[id,p]of this.pending){const task=this.alarms.get(id);if(!task){this.pending.delete(id);continue;}if(task.assistantId){p.at=now+B.repeatMin;continue;}if(now<p.at)continue;const role=task.status==='WAIT_PROCESS'?'process':p.role,person=this.person(role);this.phone.enqueue(person.id,id,task.status==='WAIT_PROCESS'?'handover':'alarm');p.at=now+this.between(B.repeatMin,B.repeatMax)*this.rankInterval*(this.frequencyFactor??1)*(role==='manufacturing'?(this.research?.effects.callInterval??1):1);}
  this.nextManufacturing??=now+this.between(B.mfgStatusMin,B.mfgStatusMax)*this.rankInterval;if(now>=this.nextManufacturing){const ids=this.alarms.owned.filter(id=>!this.alarms.reassigned?.has(id));if(ids.length)this.phone.enqueue(this.person('manufacturing').id,ids[Math.floor(this.random()*ids.length)],'status');this.nextManufacturing=now+this.between(B.mfgStatusMin,B.mfgStatusMax)*this.rankInterval*(this.research?.effects.callInterval??1);}
  this.nextManager??=now+this.between(B.managerMin,B.managerMax);if(now>=this.nextManager){const down=this.alarms.owned.map(id=>this.alarms.get(id)).filter(t=>t?.status==='DOWN'&&!t.assistantId&&!this.alarms.reassigned?.has(t.id)).sort((a,b)=>a.created-b.created),boss=this.phone.contacts.find(c=>c.role==='manager');if(boss&&down.length&&(down.length>=2||now-down[0].created>=B.managerDownAge))this.phone.enqueue(boss.id,down[0].id,'pressure');this.nextManager=now+this.between(B.managerMin,B.managerMax);}
  if(now>=this.nextProcess){const available=this.alarms.owned.filter(id=>!this.alarms.reassigned?.has(id));if(!available.length){this.nextProcess=now+this.between(B.processMin,B.processMax)*this.rankInterval*(this.frequencyFactor??1);return;}const person=this.person('process'),id=available[Math.floor(this.random()*available.length)];this.phone.enqueue(person.id,id,'status');this.nextProcess=now+this.between(B.processMin,B.processMax)*this.rankInterval*(this.frequencyFactor??1);}
 }
}
