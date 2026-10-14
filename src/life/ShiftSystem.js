import {ASSISTANT_REPORT} from '../phone/AssistantReport.js';
import {LIFE_BALANCE as B,LIFE_LOCATIONS} from '../data/life.js';
import {repairProgress} from '../minigames/registry.js';
export class ShiftSystem {
 constructor({clock,tasks,alarms,pm,bus,random,phone,reportEnabled=true}){Object.assign(this,{clock,tasks,alarms,pm,bus,random,phone});this.workAssigned=false;this.morning=false;this.evening=false;this.missedMorning=false;this.missedEvening=false;this.morningWarned=false;this.warned=false;this.endWarned=false;this.endedAt=null;this.transfers=[];this.nextShift=[];
  if(reportEnabled&&random()<B.reportChance)tasks.add({name:'Issue Report',...LIFE_LOCATIONS.desk,id:'issue-report',kind:'report',created:clock.seconds,status:'PENDING'});
 }
 pending(){return [...this.tasks.tasks.values()];}
 reportTask(){return this.tasks.tasks.get('issue-report');}
 completeReport(){if(this.reportTask()){this.tasks.complete('issue-report');this.bus.emit('REPORT_SUBMITTED');}}
 canAttend(which){const t=this.clock.seconds;return which==='morning'?!this.morning&&t>=B.morningStart&&t<B.morningEnd:!this.evening&&t>=B.eveningStart&&t<B.eveningEnd;}
 attend(which){this[which]=true;this.bus.emit('HANDOVER_COMPLETED',{which,time:this.clock.seconds});}
 near(p){const t=LIFE_LOCATIONS.handover;return Math.abs(p.y-t.y)<.7&&Math.hypot(p.x-t.x,p.z-t.z)<2.6;}
 isTransferred(id){return this.alarms.reassigned.has(id);}
 transfer(ids,p){if(!this.near(p)||(!this.evening&&this.clock.seconds<B.eveningEnd)||this.clock.seconds<B.eveningStart)return 0;let count=0;
  for(const id of new Set(ids)){const t=this.tasks.tasks.get(id);if(!t)continue;const e=this.alarms.equipment.byId.get(t.equipmentId);const remaining=t.kind==='pm'?Math.max(600,(1-t.progress)*t.duration+300):['report','office-work'].includes(t.kind)?B.reportSeconds:Math.max(180,(1-repairProgress(t.repair))*240+300);
   t.owner='next-shift';t.handedOverAt=this.clock.seconds;this.transfers.push(t);this.tasks.tasks.delete(id);if(e)this.alarms.reassigned.add(e.id);
   const a=this.pm.agent(t.assistantId);if(a){if(a.arrived)this.pm.release(a);else a.job={kind:'standby',equipmentId:t.equipmentId};}if(t.kind==='pm')t.status='HANDED_OVER';
   this.nextShift.push({task:t,equipment:e,remaining,checking:false});this.nextShift.sort((a,b)=>Number(a.task.kind==='pm')-Number(b.task.kind==='pm'));if(e&&!e.workStatus)e.workStatus=t.kind==='pm'?'PM':'DOWN';if(e)this.phone.queue=this.phone.queue.filter(c=>c.reason===ASSISTANT_REPORT||c.equipmentId!==t.equipmentId);this.bus.emit('TASK_TRANSFERRED',t);count++;
  }return count;
 }
 update(dt,activity){const now=this.clock.seconds;if(now>=B.morningStart&&!this.morningWarned){this.morningWarned=true;if(now<B.morningEnd&&!this.morning)this.bus.emit('SHIFT_NOTICE','08:30 早交班開始，請前往 3F 交班會議室（09:30 結束）。');}if(now>=B.morningEnd&&!this.morning&&activity?.type!=='handover-morning'&&!this.missedMorning){this.missedMorning=true;this.bus.emit('SHIFT_NOTICE','已錯過早交班；今日工作仍在任務清單，PC 可查看交班資訊。');}
  if(now>=B.eveningWarning&&!this.warned){this.warned=true;if(now<B.eveningEnd&&!this.evening)this.bus.emit('SHIFT_NOTICE','16:30 晚交班開始，請前往 3F 交班會議室（17:30 結束）。');}
  if(now>=B.shiftEnd&&!this.endWarned){this.endWarned=true;this.bus.emit('SHIFT_NOTICE','17:30 名義下班時間。可以交班下班，或繼續處理工作。');}
  if(now>=B.eveningEnd&&!this.evening&&activity?.type!=='handover-evening')this.missedEvening=true;
  const activeTools=new Set();for(let i=0;i<this.nextShift.length;i++){const job=this.nextShift[i],e=job.equipment;if(e&&activeTools.has(e.id))continue;if(e){activeTools.add(e.id);if(!job.checking)e.workStatus=job.task.kind==='pm'?'PM':'DOWN';}job.remaining-=dt;if(job.remaining>0)continue;
   if(e&&!job.checking){e.workStatus='PROCESS_CHECK';job.checking=true;job.remaining=B.nextShiftCheck;}
   else{this.nextShift.splice(i--,1);if(e){const next=this.nextShift.find(j=>j.equipment===e);e.workStatus=next?(next.task.kind==='pm'?'PM':'DOWN'):null;e.alarm=null;}job.task.status='NEXT_SHIFT_DONE';this.bus.emit('NEXT_SHIFT_COMPLETED',job.task);}
  }
 }
 finish(p){if(this.clock.seconds<B.shiftEnd)return'尚未到 17:30。';if(!this.near(p))return'請回 3F 交班會議室辦理下班。';if(this.pending().length)return'仍有工作，請勾選交給下一班，或留下處理。';this.endedAt=this.clock.seconds;this.bus.emit('SHIFT_ENDED',this);return null;}
 get overtime(){return Math.max(0,(this.endedAt??this.clock.seconds)-B.shiftEnd);}
}
