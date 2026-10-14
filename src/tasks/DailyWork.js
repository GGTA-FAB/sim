import {FAB_Y} from '../data/layout.js';
import {OFFICE_WORK,OFFICE_WORK_COUNT,OFFICE_PC_COUNT} from '../data/officeWork.js';
import {LIFE_BALANCE,LIFE_LOCATIONS} from '../data/life.js';
import {createRandom} from '../core/Random.js';
export class DailyWork {
 constructor({tasks,clock,bus,shift,alarms,seed,profile}){
  Object.assign(this,{tasks,clock,bus,shift,alarms});
  const random=createRandom(seed^0x5fab09),types=Object.keys(OFFICE_WORK).filter(k=>!OFFICE_WORK[k].requestOnly&&!OFFICE_WORK[k].dailyPC);this.subIndex=0;const subRandom=createRandom(seed^0x5fab18),subTypes=Object.keys(OFFICE_WORK).filter(k=>OFFICE_WORK[k].requestOnly);this.subSchedule=[];if(subRandom()<(profile==='easy'?.35:.8)){const first=10*3600+subRandom()*4*3600;this.subSchedule.push({time:first,type:subTypes[Math.floor(subRandom()*subTypes.length)],subjectId:alarms.owned[Math.floor(subRandom()*alarms.owned.length)]});if(subRandom()<.25)this.subSchedule.push({time:first+3600+subRandom()*3600,type:subTypes[Math.floor(subRandom()*subTypes.length)],subjectId:alarms.owned[Math.floor(subRandom()*alarms.owned.length)]});}
  for(let i=types.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[types[i],types[j]]=[types[j],types[i]];}
  this.plan=types.slice(0,OFFICE_WORK_COUNT[profile]??2).map((type,i)=>({type,subjectId:alarms.owned[(Math.floor(random()*alarms.owned.length)+i)%alarms.owned.length]}));
  const pcRandom=createRandom(seed^0x5fab29),pcTypes=Object.keys(OFFICE_WORK).filter(k=>OFFICE_WORK[k].dailyPC);
  for(let i=pcTypes.length-1;i>0;i--){const j=Math.floor(pcRandom()*(i+1));[pcTypes[i],pcTypes[j]]=[pcTypes[j],pcTypes[i]];}
  for(const type of pcTypes.slice(0,OFFICE_PC_COUNT[profile]??2))this.plan.push({type,subjectId:alarms.owned[Math.floor(pcRandom()*alarms.owned.length)]});
  bus.on('HANDOVER_COMPLETED',e=>{if(e.which==='morning')this.assign();});
 }
 definition(t){return OFFICE_WORK[t.workType];}
 step(t){return this.definition(t)?.steps[t.stepIndex];}
 pending(){return [...this.tasks.tasks.values()].filter(t=>t.kind==='office-work');}
 assign(){
  if(this.shift.workAssigned||this.shift.endedAt!=null)return;
  this.shift.workAssigned=true;
  // Saved tasks/completions take precedence over regeneration.
  if([...this.tasks.tasks.values(),...this.tasks.completed,...this.shift.transfers].some(t=>t.kind==='office-work'))return;
  for(const [i,p] of this.plan.entries()){
   const t={id:`work-${this.clock.day}-${i}`,kind:'office-work',workType:p.type,subjectId:p.subjectId,name:`${OFFICE_WORK[p.type].name} · ${p.subjectId}`,created:this.clock.seconds,status:'PENDING',stepIndex:0,stepProgress:0,notes:[]};
   this.locate(t);this.tasks.add(t);
  }
  this.bus.emit('DAILY_WORK_ASSIGNED',this.pending());
 }
 update(){if(this.shift.morning||this.clock.seconds>=LIFE_BALANCE.morningEnd)this.assign();while(this.shift.endedAt==null&&this.subIndex<this.subSchedule.length&&this.clock.seconds>=this.subSchedule[this.subIndex].time){const p=this.subSchedule[this.subIndex++];this.requestSub(p);}}
 requestSub(p){const id=`subwork-${this.clock.day}-${p.type}-${p.subjectId}`;if([...this.tasks.tasks.values(),...this.tasks.completed,...this.shift.transfers].some(t=>t.id===id))return;const t={id,kind:'office-work',workType:p.type,subjectId:p.subjectId,name:`${OFFICE_WORK[p.type].name} · ${p.subjectId}`,created:this.clock.seconds,status:'PENDING',stepIndex:0,stepProgress:0,notes:[]};this.locate(t);this.tasks.add(t);this.bus.emit('SUBFAB_CHECK_REQUESTED',t);return t;}
 locate(t){const step=this.step(t),e=this.alarms.equipment.byId.get(t.subjectId);const target=step.place==='pc'?LIFE_LOCATIONS.desk:{x:e.x,z:e.z-6,y:step.place==='subfield'?0:FAB_Y};Object.assign(t,{x:target.x,y:target.y,z:target.z,status:step.place==='pc'?'AT_PC':'ON_SITE'});}
 canStart(t,item,position){
  if(!t||t.assistantId||this.tasks.tasks.get(t.id)!==t)return false;
  const s=this.step(t);if(!s)return false;
  const correct=s.place==='pc'?item?.id==='desk'&&item.kind==='desk':item?.kind===(s.place==='subfield'?'sub-equipment':'equipment')&&item.equipmentId===t.subjectId;
  return correct&&Math.abs(position.y-t.y)<.7&&Math.hypot(position.x-t.x,position.z-t.z)<2.6;
 }
 advance(id,dt){
  const t=this.tasks.tasks.get(id),step=t&&this.step(t);if(!step)return;
  t.stepProgress=Math.min(step.seconds,t.stepProgress+dt);
  if(t.stepProgress<step.seconds-1e-6)return;
  t.notes.push({label:step.label,text:step.note,time:this.clock.seconds});t.stepIndex++;t.stepProgress=0;
  if(t.stepIndex===this.definition(t).steps.length){t.status='DONE';t.finished=this.clock.seconds;this.tasks.complete(t.id);this.bus.emit('OFFICE_WORK_COMPLETED',t);}
  else{this.locate(t);this.tasks.changed(t);this.bus.emit('OFFICE_WORK_STEP_COMPLETED',t);}
 }
}
