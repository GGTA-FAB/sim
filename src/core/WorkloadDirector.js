import {assistantLeave} from '../data/attendance.js';
import {validModule} from '../data/modules.js';
import {createRandom} from './Random.js';
import {WORKLOADS,DAY_BALANCE as B} from '../data/workloads.js';
export function planDay(seed,day,override,module='ETCH',assistants=1){
 if(!Number.isInteger(assistants)||assistants<1||assistants>4)throw Error('Invalid assistant capacity');
 if(!validModule(module))throw Error('Unknown module');
 const random=createRandom(seed^Math.imul(day,0x45d9f3b));let roll=random()*100;
 const tutorial=day===1&&!override;
 const profile=(tutorial?'easy':override)??Object.keys(WORKLOADS).find(k=>(roll-=WORKLOADS[k].weight)<0)??'normal',p=WORKLOADS[profile];
 const integer=([a,b])=>a+Math.floor(random()*(b-a+1)),schedule=[];
 const count=integer(p.alarms);for(let i=0;i<count;i++)schedule.push(B.start+180+random()*(B.end-B.start-181));
 // Occasional groups of 2–3 opportunities. No extra events are created by being busy.
 if(count>=4&&random()<p.burst){const start=B.start+180+random()*(B.end-B.start-1000),n=2+Math.floor(random()*2);for(let i=0;i<n;i++)schedule[i]=start+i*(B.alarmGap+random()*180);}
 schedule.sort((a,b)=>a-b);for(let i=1;i<schedule.length;i++)schedule[i]=Math.max(schedule[i],schedule[i-1]+B.alarmGap);
 // Backward packing preserves the count and the end-of-shift cutoff.
 for(let i=schedule.length-1;i>=0;i--)schedule[i]=Math.min(schedule[i],i===schedule.length-1?B.end-1:schedule[i+1]-B.alarmGap);
 return {...(tutorial?{tutorialVersion:1}:{}),module,staffingVersion:1,absentAssistants:assistantLeave(seed,day,assistants),workloadVersion:3,day,seed,profile,schedule:tutorial?[]:schedule,pmCount:tutorial?1:integer(p.pm),assistants,incidentChance:tutorial?0:p.incident,callFactor:p.callFactor};
}
export class WorkloadDirector {
 constructor(plan,alarms,clock){this.plan=plan;this.alarms=alarms;this.clock=clock;this.random=createRandom(plan.seed^0x8fab08);this.researchRandom=createRandom(plan.seed^0x72e518);this.prevented=0;this.index=0;this.nextOvertime= B.end+this.interval();this.opportunities=0;this.skipped=0;}
 interval(){const [a,b]=WORKLOADS[this.plan.profile].overtime;return a+this.random()*(b-a);}
 opportunity(){this.opportunities++;const a=this.alarms,ids=a.owned.filter(id=>!a.reassigned.has(id)&&!a.get(id)&&!a.equipment.byId.get(id).workStatus&&!a.takeovers.some(t=>t.id===id));if(ids.length){const id=ids[Math.floor(this.random()*ids.length)];if(this.researchRandom()<(this.research?.effects.alarmReduction??0)){this.prevented++;return;}a.trigger(id);}else this.skipped++;}
 update(){if(this.plan.tutorialVersion===1)return;const now=this.clock.seconds;while(this.index<this.plan.schedule.length&&now>=this.plan.schedule[this.index]){this.index++;this.opportunity();}if(now>=this.nextOvertime){this.opportunity();this.nextOvertime=now+this.interval();}}
 snapshot(){return {researchRandom:this.researchRandom.getState(),prevented:this.prevented,index:this.index,nextOvertime:this.nextOvertime,opportunities:this.opportunities,skipped:this.skipped,random:this.random.getState()};}
 restore(s){Object.assign(this,{index:s.index,nextOvertime:s.nextOvertime,opportunities:s.opportunities,skipped:s.skipped});this.random.setState(s.random);if(s.researchRandom!==undefined)this.researchRandom.setState(s.researchRandom);this.prevented=s.prevented??0;}
}
