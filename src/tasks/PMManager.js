import {ASSISTANT_REPORT,reportTask} from '../phone/AssistantReport.js';
import {FAB_Y} from '../data/layout.js';
import {PM_BALANCE as B,PM_STATES,ASSISTANT_EVENTS} from '../data/pm.js';
import {repairProgress} from '../minigames/registry.js';
// Authoritative jobs use game time. Movement and rendering belong to the assistant adapter.
export class PMManager {
 constructor({tasks,alarms,clock,bus,random,agents,repair}){Object.assign(this,{tasks,alarms,clock,bus,random,agents,repair});this.jobs=new Map();this.last=clock.seconds;this.phone=null;this.incidents=0;}
 generate(count){const choices=[...this.alarms.owned];for(let i=choices.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}const n=count??B.minCount+Math.floor(this.random()*(B.maxCount-B.minCount+1));for(const id of choices.slice(0,n)){const e=this.alarms.equipment.byId.get(id),t={id:`pm:${id}`,kind:'pm',equipmentId:id,name:`${id} PM`,x:e.x,z:e.z-6,y:FAB_Y,created:this.clock.seconds,status:'PENDING',progress:0,duration:B.durationMin+this.random()*(B.durationMax-B.durationMin),assistantId:null,checked:false,incidentChecked:false,incident:null};this.jobs.set(id,t);this.tasks.add(t);}this.bus.emit('PM_DAY_READY',this.jobs);}
 get(id){return this.jobs.get(id);}
 blocker(t){return t?.status==='PENDING'?this.alarms.get(t.equipmentId):null;}
 canAssign(t){return t?.status==='PENDING'&&!this.alarms.get(t.equipmentId)&&!this.alarms.equipment.byId.get(t.equipmentId)?.workStatus;}
 navigationTarget(t){const alarm=this.blocker(t);return alarm?{...alarm,sourceTaskId:t.id,name:`${t.equipmentId} · PM 前置異常 · ${alarm.y===0?'2F Sub FAB':'3F FAB'}`} :t;}

 agent(id){return this.agents.find(a=>a.id===id);}
 available(a){return a&&!a.onLeave&&!a.job&&!a.chatting;}
 status(t){return PM_STATES[t.status]??t.status;}
 transition(t,state){t.status=state;t.nextCall=this.clock.seconds;this.tasks.changed(t);this.bus.emit(`PM_${state}`,t);}
 assignPM(id,agentId){const t=this.get(id),a=this.agent(agentId),e=this.alarms.equipment.byId.get(id);if(t?.status!=='PENDING')return'這台 PM 已經指派或完成。';if(!this.available(a))return a?.onLeave?'這位助理今天請假，請找其他到班助工。':'NO ASSISTANT AVAILABLE · 這位助理正在工作。';if(e.workStatus||this.alarms.get(id))return'設備仍有 Alarm 或 製程 確認，請先處理。';if(!a.go(t))return'路線暫時無法通行，請稍後再試。';a.job={kind:'pm',equipmentId:id};a.state='TRAVELLING';t.assistantId=a.id;e.workStatus='PM';this.transition(t,'TRAVELLING');this.bus.emit('PM_ASSIGNED',t);return `${a.name} 已出發，抵達後自行開工；會自行排除異常、驗收及結案。`;}
 canHelp(t){return t?.status==='DOWN'&&!t.assistantId;}
 assignRepair(id,agentId){const t=this.alarms.get(id),a=this.agent(agentId);if(!this.available(a))return a?.onLeave?'這位助理今天請假，請找其他到班助工。':'NO ASSISTANT AVAILABLE · 這位助理正在工作。';if(!this.canHelp(t))return'此 Alarm 已有人接手，或目前不需維修。';if(!a.go(t))return'路線暫時無法通行。';a.job={kind:'repair',equipmentId:id,serial:t.serial};a.state='TRAVELLING';t.assistantId=a.id;this.tasks.changed(t);return `${a.name} 正在前往；到場後完成修機並通知製程，你不必再到場。`;}
 canTakeField(t){return t?.kind==='office-work'&&!t.assistantId&&['field','subfield'].includes(this.work?.step(t)?.place)&&this.activity?.()?.taskId!==t.id;}
 assignField(taskId,agentId){const t=this.tasks.tasks.get(taskId),a=this.agent(agentId);if(!this.available(a))return a?.onLeave?'這位助理今天請假。':'這位助理正在工作，沒空接新工作。';if(!this.canTakeField(t))return'這個步驟需要你操作電腦，或已有人處理。';if(!a.go(t))return'路線暫時無法通行。';a.job={kind:'field',taskId:t.id,equipmentId:t.subjectId,stepIndex:t.stepIndex};a.state='TRAVELLING';t.assistantId=a.id;this.tasks.changed(t);return`${a.name} 已接手現場檢查；需要電腦的後續步驟會留給你。`;}
 closePM(t){t.progress=1;this.transition(t,'CLOSED');this.alarms.equipment.byId.get(t.equipmentId).workStatus=null;this.release(this.agent(t.assistantId));this.tasks.complete(t.id);this.bus.emit('PM_CLOSED',t);}
 sendAhead(id,agentId){const a=this.agent(agentId),e=this.alarms.equipment.byId.get(id);if(!this.available(a))return'這位助理正在工作，無法離開。';if(!e||!this.alarms.owned.includes(id))return'請選擇今日負責機台。';if(!a.go(this.alarms.get(id)??{x:e.x,z:e.z-6,y:FAB_Y}))return'路線暫時無法通行。';a.job={kind:'standby',equipmentId:id,holdPosition:true};a.state='TRAVELLING';return`${a.name} 正在前往 ${id} 待命。`;}
 returnOffice(agentId){const a=this.agent(agentId);if(!this.available(a))return'這位助理仍有工作，暫時無法離開。';if(!a.go(a.home?.approach??{x:0,z:7,y:6}))return'路線暫時無法通行。';a.job={kind:'return',equipmentId:null};a.state='RETURN_OFFICE';return'收到，我先回辦公室待命。';}
 near(t,p){return p&&Math.abs(p.y-(t.y??FAB_Y))<.5&&Math.hypot(p.x-t.x,p.z-t.z)<3;}
 confirm(id,p){const t=this.get(id);if(!t||!this.near(t,p))return'請親自到設備前確認。';if(t.status==='WAIT_START'){this.transition(t,'RUNNING');this.bus.emit('PM_STARTED',t);return'開工確認完成，助理開始 PM。';}if(t.status==='WAIT_CHECK'){t.checked=true;this.transition(t,'RUNNING');return'重要步驟已確認，可以離開，助理繼續工作。';}if(t.status==='WAIT_INCIDENT')return this.resolve(id);if(t.status==='WAIT_CLOSE'){this.closePM(t);return'PM 已由助理驗收結案。';}return'目前不需要現場確認。';}
 resolve(id){const t=this.get(id);if(t?.status!=='WAIT_INCIDENT')return'狀態已更新，請重新確認。';t.recheckRemaining=B.recheckSeconds;this.transition(t,'RECHECK');return t.incident.reply;}
 forceIncident(id){const t=this.get(id);if(t?.status!=='RUNNING')return false;t.incidentChecked=true;t.incident=ASSISTANT_EVENTS[Math.floor(this.random()*ASSISTANT_EVENTS.length)];this.incidents++;this.transition(t,'WAIT_INCIDENT');this.bus.emit('ASSISTANT_INCIDENT',t);this.resolve(id);return true;}
 release(a,hold=false){if(!a)return;const stay=hold||a.holdAfterJob&&['pm','repair','field'].includes(a.job?.kind);a.job=null;a.state=stay?'STANDBY_EQUIPMENT':'STANDBY';if(!stay)a.returnToSeat?.();}
 validCall(c){const a=this.agent(c.contactId);if(!a||a.onLeave)return false;if(c.reason===ASSISTANT_REPORT)return !!reportTask(this.tasks,c);if(c.reason==='outgoing'||c.reason==='debug')return true;const t=this.get(c.equipmentId);return false;}
 update(){const dt=Math.max(0,this.clock.seconds-this.last);this.last=this.clock.seconds;
  for(const a of this.agents){if(a.onLeave)continue;const job=a.job;if(!job)continue;
   if(job.kind==='return'||job.kind==='standby'){if(a.arrived){this.release(a,!!job.holdPosition);}continue;}
   if(job.kind==='field'){const t=this.tasks.tasks.get(job.taskId);if(!t||t.assistantId!==a.id||t.stepIndex!==job.stepIndex||!['field','subfield'].includes(this.work?.step(t)?.place)){if(t?.assistantId===a.id)t.assistantId=null;this.release(a);continue;}if(!a.arrived)continue;a.state='WORK_FIELD';this.work.advance(t.id,dt);if(!this.tasks.tasks.has(t.id)||t.stepIndex!==job.stepIndex){t.lastAssistantId=a.id;t.assistantId=null;this.release(a);this.bus.emit('ASSISTANT_FIELD_COMPLETED',t);}continue;}
   if(job.kind==='repair'){const t=this.alarms.get(job.equipmentId);if(!t||t.serial!==job.serial||t.status!=='DOWN'){if(t?.assistantId===a.id)t.assistantId=null;this.release(a);continue;}if(!a.arrived)continue;
    if(a.state!=='REPAIRING'){a.state='REPAIRING';if(this.repair.active===t){this.repair.suspend();this.bus.emit('ASSISTANT_REPAIR_TAKEOVER',t);}this.bus.emit('ASSISTANT_REPAIR_STARTED',t);}
    t.repair.assistantProgress=Math.min(1,repairProgress(t.repair)+dt/B.repairSeconds);this.tasks.changed(t);if(repairProgress(t.repair)>=1){this.alarms.repaired(t,'assistant');this.alarms.notify(t.id);this.release(a);}continue;
   }
   const t=this.get(job.equipmentId);if(!t||!this.tasks.tasks.has(t.id)){this.release(a);continue;}if(t.status==='TRAVELLING'&&a.arrived){a.state='WORK_PM';this.transition(t,['WAIT_START','WAIT_CHECK',undefined].includes(t.resumeStatus)?'RUNNING':t.resumeStatus);delete t.resumeStatus;this.bus.emit('PM_STARTED',t);}
   else if(['WAIT_START','WAIT_CHECK'].includes(t.status)){t.checked=t.checked||t.status==='WAIT_CHECK';this.transition(t,'RUNNING');}
   else if(t.status==='RUNNING'){t.progress=Math.min(1,t.progress+dt*(this.research?.effects.pmRate??1)/t.duration);if(!t.checked&&t.progress>=B.checkAt){t.checked=true;this.bus.emit('PM_AUTO_CHECKED',t);}
    if(!t.incidentChecked&&t.progress>=B.incidentAt){t.incidentChecked=true;if(this.random()<(this.incidentChance??B.incidentChance))this.forceIncident(t.equipmentId);}
    if(t.status==='RUNNING'&&t.progress>=1){this.bus.emit('PM_COMPLETED',t);this.closePM(t);}this.bus.emit('PM_PROGRESS',t);
   }else if(t.status==='WAIT_CLOSE'){this.closePM(t);}else if(t.status==='WAIT_INCIDENT'){this.resolve(t.equipmentId);}else if(t.status==='RECHECK'){t.recheckRemaining-=dt;if(t.recheckRemaining<=0)this.transition(t,'RUNNING');}
   if(a.job&&t.status!=='TRAVELLING')a.state='WORK_PM';
  }
 }
}
