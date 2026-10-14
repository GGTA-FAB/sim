import {newProgression,upgradeProgression,RANKS} from '../data/careerProgression.js';
import {STAFF_RESEARCH} from '../data/research.js';
import {legacyEquipment} from './LegacyLayout.js';
import {planDay} from './WorkloadDirector.js';
import {CONTACT_NAMES,DEPARTMENTS,MANAGER_CONTACT} from '../data/phone.js';
import {LAYOUT_VERSION,EQUIPMENT,DESTINATIONS,FAB_Y,STAIR,FAB_STAIR,LIFT} from '../data/layout.js';
import {OFFICE_WORK} from '../data/officeWork.js';
import {ASSISTANT_COUNT,assistantContacts} from '../data/pm.js';
import {LIFE_LOCATIONS} from '../data/life.js';
// Upgrade existing careers in place: no job or partial repair is discarded.
export function upgradeCareer(data){
 if(!data)return data;data.plan.module??='ETCH';data.plan.absentAssistants??=[];const s=data.snapshot;
 // Existing careers retain their roster; only new careers begin with one assistant.
 if(data.plan.staffingVersion!==1){data.plan.staffingVersion=1;data.plan.assistants=ASSISTANT_COUNT;data.research??={version:1,progress:{}};for(const p of STAFF_RESEARCH)data.research.progress[p.id]=p.seconds;if(s)s.rosterNotice=true;}
 let capacity=data.plan.assistants;
 if(!data.progression){data.progression=newProgression(Math.min(3,capacity-1));data.plan.rank=data.progression.rank;if(s){s.careerNotice=true;for(const a of s.agents){if(a.job?.equipmentId)a.relocateJob=true;else if(a.returningSeat)a.replanHome=true;}const p=s.player.position;if(p[1]===6&&p[0]>10.7&&p[0]<15.3&&p[2]>20.9&&p[2]<24.2)s.player.position=[10,6,20.2];}}
 if(upgradeProgression(data.progression,data.day,data.history)){capacity=RANKS[data.progression.rank].assistants;data.plan.assistants=capacity;data.plan.rank=data.progression.rank;}
 if(![2,3].includes(data.plan.workloadVersion)){const fresh=planDay(data.seed,data.day,data.plan.profile,data.plan.module,capacity);if(s&&!s.ended){const past=data.plan.schedule.slice(0,s.director.index),future=fresh.schedule.filter(t=>t>s.seconds);data.plan.schedule=[...past,...future.slice(0,30-past.length)];s.director.index=past.length;}else if(!s)data.plan=fresh;data.plan.workloadVersion=2;data.plan.incidentChance=fresh.incidentChance;}
 data.plan.workloadVersion=3;
 if(!s)return data;
 if((s.shiftVersion??1)<2){if(s.shift&&!s.shift.evening&&!s.ended){s.shift.warned=false;s.shift.missedEvening=s.seconds>=63000;}s.shiftVersion=2;}
 if(!s.phone.contacts.some(c=>c.id===MANAGER_CONTACT.id))s.phone.contacts.push({...MANAGER_CONTACT});
 // Preserve today's jobs and extend small legacy assignments to six tools.
 if(!s.ended&&!data.progression&&s.alarms?.owned?.length<6){const extras=EQUIPMENT.filter(e=>e.area===data.plan.module&&!s.alarms.owned.includes(e.id));const offset=(data.seed>>>0)%extras.length;while(s.alarms.owned.length<6){const e=extras.splice(offset%extras.length,1)[0];s.alarms.owned.push(e.id);}s.alarms.owned.sort();}
 const sourceLayout=s.layoutVersion??1;
 const p=s.player.position;if(p[2]<0&&Math.abs(p[0])>14.3)p[0]=Math.sign(p[0])*13;if(p[2]>=76&&p[2]<=100)p[0]=Math.max(-15.8,Math.min(12.8,p[0]));

 if(s.navigation?.target?.id==='handover')s.navigation.target={...LIFE_LOCATIONS.handover,name:'3F · 交班會議室'};
 if(s.agents.length<capacity)s.rosterNotice=true;
 const kept=s.agents.filter(a=>assistantContacts(capacity).some(c=>c.id===a.id));
 const tasks=[...s.tasks,...s.completed,...s.transfers,...s.pm.jobs];
 for(const extra of s.agents.filter(a=>!kept.includes(a))){const free=kept.find(a=>!a.job);
  if(extra.job&&free){const id=free.id;Object.assign(free,extra,{id});for(const t of tasks)if(t.assistantId===extra.id)t.assistantId=id;if(s.air.operator===extra.id)s.air.operator=id;}
  else {for(const t of tasks)if(t.assistantId===extra.id){t.assistantId=null;if(t.kind==='pm'&&!['CLOSED','HANDED_OVER','NEXT_SHIFT_DONE'].includes(t.status)){if(['WAIT_CHECK','WAIT_INCIDENT','RECHECK','WAIT_CLOSE'].includes(t.status))t.resumeStatus=t.status;t.status='PENDING';const e=s.equipment.find(e=>e.id===t.equipmentId);if(e?.workStatus==='PM')e.workStatus=null;s.rosterNotice=true;}}if(s.air.operator===extra.id){s.air.operator=null;s.air.remaining=0;s.air.mode=s.player.position[2]>116?'FAB':'ENTRY';}}
 }
 for(let i=0;i<capacity;i++)if(!kept.some(a=>a.id===`assistant-${i}`))kept.push({id:`assistant-${i}`,position:[0,6,6+i*2],heading:0,gowned:false,state:'STANDBY',job:null,route:[],index:0,arrived:true,gownWait:0,seated:true});
 s.agents=kept.sort((a,b)=>a.id.localeCompare(b.id));for(const a of s.agents)a.holdAfterJob=!!a.holdAfterJob;
 for(const c of s.phone.contacts)if(c.role==='assistant'){if(!kept.some(a=>a.id===c.id))c.retired=true;else delete c.retired;}
 for(const c of assistantContacts(capacity))if(!s.phone.contacts.some(p=>p.id===c.id))s.phone.contacts.push(c);
 if((s.layoutVersion??1)<3){
  const moved=id=>['ETCH-02','ETCH-04','ETCH-06'].includes(id),byId=new Map(EQUIPMENT.map(e=>[e.id,e]));
  const locate=t=>{const field=t.kind!=='office-work'||OFFICE_WORK[t.workType]?.steps[t.stepIndex]?.place!=='pc',e=byId.get(t.equipmentId??t.subjectId??t.id);if(e&&field){t.x=e.x;t.y=OFFICE_WORK[t.workType]?.steps[t.stepIndex]?.place==='subfield'?0:FAB_Y;t.z=e.z-6;}};
  for(const t of tasks)locate(t);
  const nav=s.navigation?.target;if(nav){const t=tasks.find(t=>t.id===nav.id),destination=DESTINATIONS.find(t=>t.id===nav.id);if(t)s.navigation.target={...t};else if(destination)s.navigation.target={...destination};}
  for(const a of s.agents)if(a.job?.equipmentId)a.relocateJob=true;
  if(s.activity?.type==='work-field'){const e=byId.get(s.activity.item.equipmentId);if(e)Object.assign(s.activity.item,{x:e.x,z:e.z-6,y:FAB_Y});}
  if(s.player.position[1]===0&&s.player.position[2]>=100)s.player.position[1]=FAB_Y;
  if(s.standing?.y===0&&s.standing.z>=100)s.standing.y=FAB_Y;
  if(s.activity?.item?.y===0&&s.activity.item.z>=100)s.activity.item.y=FAB_Y;
  for(const a of s.agents){if(a.position[1]===0&&a.position[2]>=100)a.position[1]=FAB_Y;if(a.returningSeat||a.job?.kind==='return')a.replanHome=true;}
  if(s.navigation?.target?.y===0&&s.navigation.target.z>=100&&!DESTINATIONS.some(d=>d.id===s.navigation.target.id))s.navigation.target.y=FAB_Y;
  s.layoutVersion=3;
 }
 if(s.layoutVersion<4){
  const moveEntry=position=>{if(position[1]===6&&position[2]>=103&&position[2]<=117){position[1]=0;position[2]-=40;position[0]=0;}else if(position[1]===0&&position[2]>=60&&position[2]<=76){position[0]=0;position[2]=67;}};
  moveEntry(s.player.position);s.player.gowned=s.player.position[2]>=70||s.player.gowned&&s.player.position[2]>=63;
  for(const a of s.agents){moveEntry(a.position);a.gowned=a.position[2]>=70||a.gowned&&a.position[2]>=63;if(a.job?.equipmentId)a.relocateJob=true;else if(!a.seated)a.replanHome=true;}
  const showerActor=s.agents.find(a=>a.id===s.air.operator)??s.player;s.air.operator=showerActor===s.player?'player':showerActor.id;if(s.air.remaining>0){showerActor.position=[0,0,73];showerActor.gowned=true;}s.air.mode=s.air.remaining>0?s.air.mode:showerActor.position[2]>76?'FAB':'ENTRY';s.air.doors=[0,0];
  if(s.navigation?.target?.id==='gowning')s.navigation.target={...DESTINATIONS.find(d=>d.id==='gowning')};
  s.layoutVersion=4;
 }
 if(s.layoutVersion<5){
  const byId=new Map(EQUIPMENT.map(e=>[e.id,e]));
  const movePosition=position=>{if(position[0]>8&&[0,6].includes(position[1])){if(position[2]>=122&&position[2]<=164)position[2]+=144;else if(position[2]>=266&&position[2]<=308)position[2]-=144;}};
  // Existing pre-3 saves were already relocated to the current definitions above.
  if(sourceLayout>=3){movePosition(s.player.position);for(const a of s.agents)movePosition(a.position);}
  for(const t of tasks){const e=byId.get(t.equipmentId??t.subjectId??t.id),place=t.kind==='office-work'?OFFICE_WORK[t.workType]?.steps[t.stepIndex]?.place:null;if(e&&place!=='pc'){t.x=e.x;t.z=e.z-6;}}
  const nav=s.navigation?.target;if(nav){const task=tasks.find(t=>t.id===nav.id),destination=DESTINATIONS.find(t=>t.id===nav.id),e=byId.get(nav.equipmentId??nav.subjectId??nav.id);if(task)s.navigation.target={...task};else if(destination)s.navigation.target={...destination};else if(e)s.navigation.target={...nav,x:e.x,z:e.z-6};}
  for(const a of s.agents)if(a.job?.equipmentId)a.relocateJob=true;else if(!a.seated)a.replanHome=true;
  if(s.activity?.type==='work-field'){const e=byId.get(s.activity.item.equipmentId);if(e){Object.assign(s.activity.item,{x:e.x,z:e.z-6});s.player.position=[e.x,s.activity.item.y,e.z-6];}}
  s.layoutVersion=5;
 }
 if(s.layoutVersion<6){
  const moveEntrance=p=>{if(p[1]===0&&p[2]>=28&&p[2]<76){p[1]=6;if(p[2]<50){p[0]=22;p[2]=Math.max(22,p[2]);}else if(p[2]<60){p[0]=0;p[2]=54;}}};
  moveEntrance(s.player.position);for(const a of s.agents){moveEntrance(a.position);if(a.job?.equipmentId)a.relocateJob=true;else if(!a.seated)a.replanHome=true;}
  if(s.navigation?.target?.id==='gowning')s.navigation.target={...DESTINATIONS.find(d=>d.id==='gowning')};
  if(s.air.remaining>0){const actor=s.agents.find(a=>a.id===s.air.operator)??s.player;actor.position=[0,6,73];actor.gowned=true;}
  s.layoutVersion=6;
 }
 if(s.layoutVersion<7){
  const onNewStair=(p,stair,base)=>{const f=Math.max(0,Math.min(1,(p[1]-base)/6)),mid=(stair.minX+stair.maxX)/2;p[0]=f<.5?(stair.minX+mid-.3)/2:(mid+.3+stair.maxX)/2;p[2]=f<.5?stair.maxZ-f*16:stair.minZ+(f-.5)*16;if(f===.5){p[0]=mid;p[2]=stair.minZ-1;}if(f===0||f===1)p[2]=stair.maxZ+1;};
  const move=p=>{if(p[0]>=6&&p[0]<=10&&p[2]>=80&&p[2]<=96){onNewStair(p,FAB_STAIR,0);return;}if(p[2]>=0)return;if(Math.abs(p[0]+12)<2.6&&p[2]>=-34&&p[2]<=-28){p[0]+=3;p[2]+=10;return;}if(p[0]>=6&&p[0]<=10&&p[2]>=-32&&p[2]<=-16){const base=Math.max(-6,Math.min(0,Math.floor((p[1]-.001)/6)*6));onNewStair(p,STAIR,base);return;}p[0]=Math.max(-11,Math.min(11,p[0]));p[2]=Math.max(-12,p[2]);};
  move(s.player.position);for(const a of s.agents){move(a.position);if(a.job?.equipmentId)a.relocateJob=true;else if(!a.seated)a.replanHome=true;}
  const nav=s.navigation?.target;if(nav){if(['elevator','stairs'].includes(nav.id))s.navigation.target={...DESTINATIONS.find(d=>d.id===nav.id)};else if(nav.id?.startsWith('lift-'))Object.assign(nav,LIFT);}
  s.navigation.stairLeg=null;s.layoutVersion=7;
 }
 if(s.layoutVersion<8){
  const byId=new Map(EQUIPMENT.map(e=>[e.id,e])),legacy=legacyEquipment();
  const move=p=>{if(![0,6].includes(p[1])||Math.abs(p[0])<=8||p[2]<122)return;const old=legacy.filter(e=>Math.sign(e.x)===Math.sign(p[0])).reduce((best,e)=>!best||Math.hypot(e.x-p[0],e.z-p[2])<Math.hypot(best.x-p[0],best.z-p[2])?e:best,null);if(!old)return;const e=byId.get(old.id);p[0]+=e.x-old.x;p[2]+=e.z-old.z;};
  move(s.player.position);for(const a of s.agents){move(a.position);if(a.job?.equipmentId)a.relocateJob=true;else if(!a.seated)a.replanHome=true;}
  for(const t of tasks){const e=byId.get(t.equipmentId??t.subjectId??t.id),place=t.kind==='office-work'?OFFICE_WORK[t.workType]?.steps[t.stepIndex]?.place:null;if(e&&place!=='pc'){t.x=e.x;t.z=e.z-6;}}
  const nav=s.navigation?.target;if(nav){const task=tasks.find(t=>t.id===nav.id),e=byId.get(nav.equipmentId??nav.subjectId??nav.id),destination=DESTINATIONS.find(d=>d.id===nav.id);if(task)s.navigation.target={...task};else if(e)s.navigation.target={...nav,x:e.x,z:e.z-6};else if(destination)s.navigation.target={...destination};}
  if(s.activity?.type==='work-field'){const t=tasks.find(t=>t.id===s.activity.taskId),e=byId.get(t?.subjectId??s.activity.item.equipmentId);if(e){Object.assign(s.activity.item,{x:e.x,z:e.z-6});s.player.position=[e.x,s.activity.item.y,e.z-6];}}
  s.navigation.stairLeg=null;s.layoutVersion=8;
 }
 for(const c of s.phone.contacts){const match=/^contact-(\d+)$/.exec(c.id);if(match&&CONTACT_NAMES[Number(match[1])])c.name=CONTACT_NAMES[Number(match[1])];const assistant=assistantContacts(capacity).find(a=>a.id===c.id);if(assistant)c.name=assistant.name;c.department=DEPARTMENTS[c.role]??c.department;}
 if((s.assistantDeskVersion??1)<2){for(const a of s.agents)if(a.id==='assistant-3'&&(a.returningSeat||a.job?.kind==='return'||!a.job&&!a.seated)){if(a.job?.kind==='return')a.job=null;a.replanHome=true;}s.assistantDeskVersion=2;}
 if((s.playerDeskVersion??1)<2){
  const desk=LIFE_LOCATIONS.desk;
  for(const t of tasks)if(t.kind==='report'||t.kind==='office-work'&&OFFICE_WORK[t.workType]?.steps[t.stepIndex]?.place==='pc')Object.assign(t,{x:desk.x,y:desk.y,z:desk.z});
  const nav=s.navigation?.target,task=nav&&tasks.find(t=>t.id===nav.id);if(nav?.id==='desk')s.navigation.target={...DESTINATIONS.find(d=>d.id==='desk')};else if(task&&(task.kind==='report'||task.kind==='office-work'))Object.assign(nav,{x:task.x,y:task.y,z:task.z});
  if(s.activity?.item?.id==='desk'){s.activity.item={...desk,seat:{...desk.seat}};s.player.position=[desk.seat.x,desk.seat.y,desk.seat.z];s.player.heading=desk.seat.heading;s.standing={x:desk.x,y:desk.y,z:desk.z,heading:desk.seat.heading};}
  else if(!s.activity&&s.player.position[1]===6&&s.player.position[0]>4.35&&s.player.position[0]<6.85&&s.player.position[2]>7.98&&s.player.position[2]<9.55)s.player.position=[desk.x,desk.y,desk.z];
  s.playerDeskVersion=2;
 }
 if(!s.lobbyVersion){
  const p=s.player.position;if(p[1]===0&&p[2]>=0&&p[2]<=28&&(p[0]<-8.5||p[0]>7||Math.abs(p[2]-1.2)<1||p[2]>27)){p[0]=0;p[2]=10;}
  s.lobbyVersion=1;
 }
 if(!s.connectorWallVersion){
  // Old saves could stand on the formerly open outer edge of the connector.
  const p=s.player.position;if(p[1]===6&&p[0]>25.4&&p[0]<26.5&&p[2]>27.5&&p[2]<58.5){p[0]=25.4;if(s.standing)s.standing.x=25.4;}
  s.connectorWallVersion=1;
 }
 const retired=id=>s.phone.contacts.find(c=>c.id===id)?.retired;
 s.phone.queue=s.phone.queue.filter(c=>!retired(c.contactId));if(s.phone.active&&retired(s.phone.active.contactId)){s.phone.history.unshift({...s.phone.active,status:'Cancelled',endReason:'roster-change',ended:s.seconds});s.phone.active=null;}
 if(s.activity?.item?.id==='dining'){s.activity.item={...LIFE_LOCATIONS.dining};s.player.position=[LIFE_LOCATIONS.dining.seat.x,-6,LIFE_LOCATIONS.dining.seat.z];s.player.heading=Math.PI;s.standing={x:LIFE_LOCATIONS.dining.x,y:-6,z:LIFE_LOCATIONS.dining.z,heading:Math.PI};}
 if(['dining','mart'].includes(s.navigation?.target?.id))s.navigation.target={...DESTINATIONS.find(d=>d.id===s.navigation.target.id)};
 const translate=value=>{if(Array.isArray(value))return value.map(translate);if(value&&typeof value==='object'){for(const key of Object.keys(value))value[key]=translate(value[key]);return value;}return typeof value==='string'?value.replace(/\bProcess\b/g,'製程'):value;};translate(s);
 return data;
}
