import {validateProfile} from '../data/characterProfile.js';
import {validateTutorial} from '../data/tutorial.js';
import {validateProgression,RANKS} from '../data/careerProgression.js';
import {validModule} from '../data/modules.js';
import {ASSISTANT_REPORT} from '../phone/AssistantReport.js';
import {validateResearch,RESEARCH_BY_ID,assistantCapacity} from '../data/research.js';
import {EQUIPMENT} from '../data/layout.js';
import {FAB_Y} from '../data/layout.js';
import {LAYOUT_VERSION} from '../data/layout.js';
import {OFFICE_WORK} from '../data/officeWork.js';
import {WORKLOADS} from '../data/workloads.js';
import {MINIGAMES} from '../minigames/registry.js';
const fields=(object,keys)=>Object.fromEntries(keys.map(k=>[k,object[k]]));
const shiftKeys=['workAssigned','morning','evening','missedMorning','missedEvening','morningWarned','warned','endWarned','endedAt'];
const lifeKeys=['last','serial','lunch','coffees','conversations','emptyTray'];
const agentKeys=['state','job','route','index','arrived','gownWait','seated','returningSeat','holdAfterJob'];
const phoneKeys=['active','queue','history','serial','gap','unread','contacts'];
export function validateSession(d){
 validateProfile(d.profile);
 const finite=Number.isFinite,p=d.plan,s=d.snapshot;validateResearch(d.research);validateProgression(d.progression);
 if(p.tutorialVersion!==undefined&&(p.tutorialVersion!==1||d.day!==1))throw Error('Invalid tutorial day');
 if(p.module!==undefined&&!validModule(p.module))throw Error('Invalid module');
 if(p.absentAssistants!==undefined&&(!Array.isArray(p.absentAssistants)||p.absentAssistants.length>2||new Set(p.absentAssistants).size!==p.absentAssistants.length||p.absentAssistants.some(id=>!['assistant-0','assistant-1','assistant-2','assistant-3'].includes(id))||d.day===1&&p.absentAssistants.length))throw Error('Invalid attendance');
 if(!WORKLOADS[p.profile]||!Array.isArray(p.schedule)||!p.schedule.every(finite)||p.schedule.length>30||!Number.isInteger(p.assistants)||p.assistants<1||p.assistants>4)throw Error('Invalid day plan');
 if(p.staffingVersion!==undefined&&(p.staffingVersion!==1||p.assistants!==(d.progression?RANKS[d.progression.rank].assistants:assistantCapacity(d.research))||(p.absentAssistants??[]).length>=p.assistants||(p.absentAssistants??[]).some(id=>Number(id.split('-')[1])>=p.assistants)))throw Error('Invalid staffing progression');
 if(!d.history.every(h=>Number.isInteger(h.day)&&h.day>=1&&finite(h.start)&&finite(h.end)&&finite(h.overtime)&&WORKLOADS[h.profile]))throw Error('Invalid history');
 if(!s)return;validateTutorial(s.tutorial);
 if(!finite(s.seconds)||s.seconds<30600||!s.player?.position?.every(finite)||s.player.position.length!==3||!s.director||!Array.isArray(s.tasks)||!Array.isArray(s.completed)||!Array.isArray(s.transfers)||!Array.isArray(s.pm?.jobs)||!Array.isArray(s.agents)||s.agents.length!==p.assistants||!s.phone?.contacts?.length||!Array.isArray(s.phone.queue)||!Array.isArray(s.phone.history)||!s.stats||!s.life||!s.shift||!s.calls||!s.random||!s.record||!s.air||!s.lift||!s.navigation||!Array.isArray(s.equipment)||!Array.isArray(s.inventory))throw Error('Invalid session');
 if(p.staffingVersion===1&&(new Set(s.agents.map(a=>a.id)).size!==s.agents.length||s.agents.some(a=>!Array.from({length:p.assistants},(_,i)=>`assistant-${i}`).includes(a.id))))throw Error('Invalid assistant roster');
 for(const a of s.agents)if(p.absentAssistants?.includes(a.id)&&(a.job||[...s.tasks,...s.pm.jobs].some(t=>t.assistantId===a.id&& !['CLOSED','HANDED_OVER','NEXT_SHIFT_DONE'].includes(t.status))))throw Error('Absent assistant assigned');
 for(const a of s.agents)if(a.holdAfterJob!==undefined&&typeof a.holdAfterJob!=='boolean')throw Error('Invalid assistant preference');
 if(s.calls.praiseAttempted!==undefined&&typeof s.calls.praiseAttempted!=='boolean')throw Error('Invalid praise decision');
 if(s.navigation?.mealReturnTarget&&(!finite(s.navigation.mealReturnTarget.x)||!finite(s.navigation.mealReturnTarget.z)||s.navigation.mealReturnTarget.y!==undefined&&!finite(s.navigation.mealReturnTarget.y)))throw Error('Invalid meal return navigation');
 if(s.life.emptyTray!==undefined&&typeof s.life.emptyTray!=='boolean')throw Error('Invalid tray state');
 for(const food of s.inventory)if(food.bigChicken!==undefined&&typeof food.bigChicken!=='boolean')throw Error('Invalid meal appearance');
 for(const food of s.inventory)if(food.service!==undefined&&!['dine-in','takeaway'].includes(food.service))throw Error('Invalid food service');
 if(!Array.isArray(s.alarms?.owned)||s.alarms.owned.length<3||s.alarms.owned.length>(d.progression?16:8)||new Set(s.alarms.owned).size!==s.alarms.owned.length||!s.alarms.owned.every(id=>EQUIPMENT.some(e=>e.id===id&&e.area===(p.module??'ETCH'))))throw Error('Invalid assignment');
 for(const t of [...s.tasks,...s.completed,...s.transfers,...s.pm.jobs]){if(!t||typeof t.id!=='string'||typeof t.status!=='string'||!finite(t.created))throw Error('Invalid task');if(t.alarm&&(!MINIGAMES[t.repair?.type]||!t.repair?.state))throw Error('Invalid repair');}
 for(const t of [...s.tasks,...s.completed,...s.transfers])for(const key of ['autoAssigned','reportCallStarted'])if(t[key]!==undefined&&typeof t[key]!=='boolean')throw Error('Invalid auto assignment');
 for(const c of [...s.phone.queue,...s.phone.history,...(s.phone.active?[s.phone.active]:[])])if(c.reason===ASSISTANT_REPORT&&(!Number.isInteger(c.report?.serial)||c.report.serial<1||!finite(c.report.completed)||typeof c.report.alarmCode!=='string'||!['2F Sub FAB','3F FAB'].includes(c.report.area)))throw Error('Invalid completion report');
 for(const t of [...s.tasks,...s.completed,...s.transfers])if(t.kind==='office-work'){const def=OFFICE_WORK[t.workType];if(!def||!Number.isInteger(t.stepIndex)||t.stepIndex<0||t.stepIndex>def.steps.length||!finite(t.stepProgress)||t.stepProgress<0||!Array.isArray(t.notes)||!s.alarms.owned.includes(t.subjectId)||!finite(t.x)||!finite(t.y)||!finite(t.z))throw Error('Invalid office work');if(s.tasks.includes(t)&&(t.stepIndex>=def.steps.length||t.stepProgress>def.steps[t.stepIndex].seconds))throw Error('Invalid work step');}
 for(const t of [...s.tasks,...s.completed,...s.transfers])if(t.repair?.autoProgress!==undefined&&(!finite(t.repair.autoProgress)||t.repair.autoProgress<0||t.repair.autoProgress>1))throw Error('Invalid automatic repair');
 if(s.activity?.type==='research'){const a=s.activity,p=Object.hasOwn(RESEARCH_BY_ID,a.researchId)?RESEARCH_BY_ID[a.researchId]:null;if(!p||a.item?.id!=='desk'||!finite(a.remaining)||a.remaining<=0||!finite(a.duration)||a.remaining>a.duration||a.duration>p.seconds||Math.abs(a.remaining-(p.seconds-(d.research?.progress[a.researchId]??0)))>1e-4)throw Error('Invalid research activity');}
 if(s.activity?.type?.startsWith('work-')&&(!s.tasks.some(t=>t.kind==='office-work'&&t.id===s.activity.taskId)||!finite(s.activity.remaining)||!finite(s.activity.duration)))throw Error('Invalid work activity');
 for(const key of ['satiety','fatigue','lowestSatiety','highestFatigue'])if(!finite(s.stats[key])||s.stats[key]<0||s.stats[key]>100)throw Error('Invalid stats');
 for(const c of [...s.phone.queue,...s.phone.history,...(s.phone.active?[s.phone.active]:[])])if(!s.phone.contacts.some(p=>p.id===c.contactId))throw Error('Invalid contact');
 if(!Array.isArray(s.nextShift)||!Array.isArray(s.alarms.reassigned)||!Array.isArray(s.alarms.takeovers)||!Array.isArray(s.calls.pending)||!s.navigation.target||!finite(s.navigation.target.x)||!finite(s.navigation.target.z)||!finite(s.director.index)||!finite(s.director.nextOvertime)||!s.agents.every(a=>Array.isArray(a.position)&&a.position.length===3&&a.position.every(finite)&&Array.isArray(a.route))||!s.equipment.every(e=>EQUIPMENT.some(def=>def.id===e.id&&def.area===(p.module??'ETCH'))))throw Error('Invalid simulation');
 if(!s.nextShift.every(j=>Number.isInteger(j.taskIndex)&&!!s.transfers[j.taskIndex]&&finite(j.remaining)))throw Error('Invalid handover');
 if(!s.phone.contacts.every(c=>typeof c.id==='string'&&typeof c.name==='string'&&['manufacturing','process','equipment','assistant','manager'].includes(c.role)&&['calm','formal','nervous','impatient','talkative'].includes(c.personality)))throw Error('Invalid roster');
 if(s.phone.active&&(!['RINGING','DIALING','CONNECTED'].includes(s.phone.active.phase)||!finite(s.phone.active.remaining)||(s.phone.active.phase==='CONNECTED'&&!Array.isArray(s.phone.active.dialogue?.options))))throw Error('Invalid active call');
 if(s.activity&&(!['research','nap','rest','eat','coffee','chat','report','work-pc','work-field','handover-morning','handover-evening'].includes(s.activity.type)||!s.activity.item||(s.activity.type==='eat'&&!s.inventory[s.activity.foodIndex])))throw Error('Invalid activity');
}
export function captureSession(g){
 const air=g.world.airshower,lift=g.world.elevator,a=g.life.active;
 return {
 lobbyVersion:1,connectorWallVersion:1,playerDeskVersion:2,assistantDeskVersion:2,tutorial:g.tutorial?.snapshot(),layoutVersion:LAYOUT_VERSION,shiftVersion:2,seconds:g.clock.seconds,elapsed:g.elapsed,ended:g.state==='SHIFT_ENDED',player:{position:g.player.position.toArray(),heading:g.player.group.rotation.y,gowned:g.player.gowned,travel:g.player.travel},gownRemaining:g.gownRemaining,
 camera:fields(g.input,['yaw','pitch','distance']),navigation:{mealReturnTarget:g.navigation.mealReturnTarget,target:g.navigation.target,travelMode:g.navigation.travelMode,stairLeg:g.navigation.stairLeg},
 tasks:[...g.tasks.tasks.values()],completed:g.tasks.completed,transfers:g.shift.transfers,shift:fields(g.shift,shiftKeys),nextShift:g.shift.nextShift.map(j=>({taskIndex:g.shift.transfers.indexOf(j.task),equipmentId:j.equipment?.id,remaining:j.remaining,checking:j.checking})),
 alarms:{...fields(g.alarms,['owned','serial','next','takeovers']),reassigned:[...g.alarms.reassigned]},equipment:g.living.equipment.entities.filter(e=>e.workStatus).map(e=>fields(e,['id','workStatus','alarm'])),
 pm:{jobs:[...g.pm.jobs.values()],last:g.pm.last,incidents:g.pm.incidents},agents:g.assistants.map(a=>({...fields(a,agentKeys),id:a.id,position:a.position.toArray(),gowned:a.gowned,heading:a.group.rotation.y})),
 phone:fields(g.phone,phoneKeys),calls:{...fields(g.calls,['nextCheck','contactCursor','nextProcess','nextManufacturing','nextManager','praiseAttempted']),pending:[...g.calls.pending]},
 inventory:g.inventory,stats:fields(g.life.stats,['satiety','fatigue','lowestSatiety','highestFatigue']),life:fields(g.life,lifeKeys),activity:a?{...a,food:undefined,foodIndex:g.inventory.indexOf(a.food),duration:Number.isFinite(a.duration)?a.duration:null,remaining:Number.isFinite(a.remaining)?a.remaining:null}:null,standing:g.lifeUI.standing,
 air:{...fields(air,['mode','remaining','time']),operator:air.operator===g.player?'player':air.operator?.id,doors:air.doors.map(d=>d.open)},lift:fields(lift,['remaining','level','from','to','duration']),fabLift:fields(g.world.fabElevator,['remaining','level','from','to','duration']),officeWork:{subIndex:g.officeWork.subIndex},
 director:g.director.snapshot(),record:{counts:g.record.counts,walking:g.record.walking,fabWalking:g.record.fabWalking},random:{alarm:g.alarms.random.getState(),pm:g.pm.random.getState(),calls:g.calls.random.getState()},
 };
}
export function restoreSession(g,s){
 g.clock.seconds=s.seconds;g.elapsed=s.elapsed;g.player.position.fromArray(s.player.position);g.world.lobby?.restore(g.player.position);g.player.group.rotation.y=s.player.heading;g.player.travel=s.player.travel;g.player.setGowned(s.player.gowned);g.world.setGowned(s.player.gowned);g.gownRemaining=s.gownRemaining;Object.assign(g.input,s.camera);
 for(const receipt of g.workHUD.receipts??[])receipt.row.remove();if(g.workHUD.receipts)g.workHUD.receipts.length=0;for(const row of g.workHUD.rows.values())row.remove();g.workHUD.rows.clear();g.tasks.tasks=new Map(s.tasks.map(t=>[t.id,t]));g.tasks.completed=s.completed;g.shift.transfers=s.transfers;Object.assign(g.shift,fields(s.shift,shiftKeys));
 const tasks=[...s.tasks,...s.completed,...s.transfers];g.pm.jobs=new Map(s.pm.jobs.map(t=>[t.equipmentId,tasks.find(v=>v.id===t.id)??t]));g.pm.last=s.pm.last;g.pm.incidents=s.pm.incidents;
 g.shift.nextShift=s.nextShift.map(j=>({task:g.shift.transfers[j.taskIndex],equipment:g.living.equipment.byId.get(j.equipmentId),remaining:j.remaining,checking:j.checking}));
 Object.assign(g.alarms,fields(s.alarms,['owned','serial','next','takeovers']));g.alarms.reassigned=new Set(s.alarms.reassigned);for(const e of g.living.equipment.entities){e.workStatus=null;e.alarm=null;}for(const e of s.equipment)Object.assign(g.living.equipment.byId.get(e.id),fields(e,['workStatus','alarm']));
 for(const data of s.agents){const a=g.assistants.find(a=>a.id===data.id);Object.assign(a,fields(data,agentKeys));a.position.fromArray(data.position);a.setGowned(data.gowned);a.group.rotation.y=data.heading;if(data.relocateJob&&a.job?.equipmentId){const e=g.living.equipment.byId.get(a.job.equipmentId),target=a.job.kind==='field'?g.tasks.tasks.get(a.job.taskId):a.job.kind==='repair'?g.alarms.get(e.id)??{x:e.x,y:FAB_Y,z:e.z-6}:{x:e.x,y:FAB_Y,z:e.z-6};if(a.arrived){a.position.set(target.x,target.y??FAB_Y,target.z);a.route=[];a.index=0;}else a.go(target);}a.restoreDesk?.();if(data.replanHome)a.returnToSeat();}
 Object.assign(g.phone,fields(s.phone,phoneKeys));for(const c of g.phone.contacts)if(c.role==='assistant')c.onLeave=!!g.pm.agent(c.id)?.onLeave;g.phone.byId=new Map(g.phone.contacts.map(c=>[c.id,c]));Object.assign(g.calls,fields(s.calls,['nextCheck','contactCursor','nextProcess','nextManufacturing','nextManager','praiseAttempted']));g.calls.pending=new Map(s.calls.pending);
 g.inventory.splice(0,g.inventory.length,...s.inventory);Object.assign(g.life.stats,fields(s.stats,['satiety','fatigue','lowestSatiety','highestFatigue']));Object.assign(g.life,fields(s.life,lifeKeys));if(s.activity){g.life.active={...s.activity,duration:s.activity.duration??Infinity,remaining:s.activity.remaining??Infinity,food:g.inventory[s.activity.foodIndex]};g.lifeUI.standing=s.standing;g.player.setLifePose(s.activity.type);}
 const air=g.world.airshower;Object.assign(air,fields(s.air,['mode','remaining','time']));air.operator=s.air.operator==='player'?g.player:g.assistants.find(a=>a.id===s.air.operator);for(let i=0;i<2;i++){air.doors[i].open=s.air.doors[i];air.setDoor(i,false,0);}
 const lift=g.world.elevator;Object.assign(lift,fields(s.lift,['remaining','level','from','to','duration']));if(lift.busy){lift.player=g.player;lift.update(0,g.player);}else lift.sync(s.lift.level);
 const fabLift=g.world.fabElevator;if(s.fabLift){Object.assign(fabLift,s.fabLift);if(fabLift.busy){fabLift.player=g.player;fabLift.update(0,g.player);}else fabLift.sync(s.fabLift.level);}g.officeWork.subIndex=s.officeWork?.subIndex??g.officeWork.subSchedule.filter(e=>e.time<=s.seconds).length;
 Object.assign(g.navigation,fields(s.navigation,['target','travelMode','stairLeg']));g.navigation.mealReturnTarget=s.navigation.mealReturnTarget??null;g.navigation.last.x=Infinity;g.navigation.timer=0;document.querySelector('#travel-mode').value=g.navigation.travelMode;
 g.director.restore(s.director);Object.assign(g.record,fields(s.record,['counts','walking','fabWalking']));g.alarms.random.setState(s.random.alarm);g.pm.random.setState(s.random.pm);g.calls.random.setState(s.random.calls);
 for(const t of g.tasks.tasks.values())g.workHUD.add(t);document.querySelector('#assigned').textContent=`今日負責：${g.alarms.owned.join(' · ')}`;
 g.phoneUI.equipmentId=g.alarms.owned[0];g.phoneUI.signature='';g.phoneUI.update();g.state=s.ended?'SHIFT_ENDED':'PAUSED';
 // Active repair is intentionally reopened at the tool; puzzle progress stays on its task.
 g.repair.active=null;g.repair.release();g.controls();
}
