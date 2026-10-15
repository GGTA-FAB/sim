import {AUTO_WORK} from '../data/research.js';
import {ASSISTANT_REPORT,reportTask,reportData} from '../phone/AssistantReport.js';
// Poll at game-time intervals. Existing PMManager owns travel, repair, notification and completion.
export class AssistantAutoWork {
 constructor({research,pm,alarms,repair,tasks,phone,clock,bus}){
  Object.assign(this,{research,pm,alarms,repair,tasks,phone,clock,bus});this.nextCheck=0;
  for(const event of ['ALARM_CREATED','TASK_COMPLETED','RESEARCH_COMPLETED'])bus.on(event,()=>{this.nextCheck=0;});
  bus.on('PHONE_CALL_STARTED',call=>{const t=reportTask(tasks,call);if(t)t.reportCallStarted=true;});
 }
 get unlocked(){return this.research.complete(AUTO_WORK.projectId);}
 get enabled(){return this.unlocked&&this.research.autoDispatchEnabled;}
 toggle(){if(!this.unlocked)return;this.research.autoDispatchEnabled=!this.research.autoDispatchEnabled;this.nextCheck=0;this.bus.emit('AUTO_WORK_CHANGED',this.enabled);}
 eligible(t){return !!t.alarm&&t.status==='DOWN'&&!t.assistantId&&!t.manualTakeover&&this.alarms.owned.includes(t.id)&&!this.alarms.reassigned.has(t.id)&&this.repair.active!==t&&this.pm.canHelp(t);}
 get waiting(){let n=0;for(const t of this.tasks.tasks.values())if(this.eligible(t))n++;return n;}
 update(){
  if(this.clock.seconds<this.nextCheck)return;this.nextCheck=this.clock.seconds+AUTO_WORK.pollSeconds;
  // Completed tasks are the persistent outbox. A full/busy phone delays reports without losing them.
  for(const t of this.tasks.completed){
   if(!t.autoAssigned||t.repairedBy!=='assistant'||t.reportCallStarted)continue;
   if([this.phone.active,...this.phone.queue].some(c=>reportTask(this.tasks,c??{})===t))continue;
   this.phone.enqueue(t.assistantId,t.id,ASSISTANT_REPORT,{report:reportData(t)});
  }
  if(!this.enabled)return;
  const waiting=[...this.tasks.tasks.values()].filter(t=>this.eligible(t)).sort((a,b)=>a.created-b.created||a.serial-b.serial);
  for(const a of this.pm.agents){
   if(!this.pm.available(a))continue;
   for(let i=0;i<waiting.length;i++){
    const t=waiting[i];if(!this.eligible(t))continue;
    this.pm.assignRepair(t.id,a.id);
    if(t.assistantId===a.id){t.autoAssigned=true;this.tasks.changed(t);waiting.splice(i,1);this.bus.emit('ALARM_AUTO_ASSIGNED',{task:t,agent:a});break;}
   }
  }
 }
}
