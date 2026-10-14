export class Leadership {
 constructor(g){this.g=g;this.timer=0;this.accumulator=0;this.signature='';const button=this.button=document.createElement('button');button.id='leadership-open';button.hidden=true;button.onclick=()=>g.career.ui.showLeadership();document.querySelector('#assistant-status').prepend(button);}
 get active(){return this.g.progression.rank===3;}
 get state(){const g=this.g;if(!g.progression.management||g.progression.management.day!==g.clock.day)g.progression.management={day:g.clock.day,policy:'balanced',choices:[]};return g.progression.management;}
 pending(){if(!this.active)return [];return [{id:0,time:34200,title:'本日設備處置方針',description:'領班已整理待辦。要優先恢復產能，還是先完成預防保養？'},{id:1,time:50400,title:'午後人力與跨班協調',description:'午後新工單陸續進來，請核定剩餘人力的處理順序。'}].filter(d=>this.g.clock.seconds>=d.time&&!this.state.choices.some(c=>c.id===d.id));}
 choose(id,policy){const g=this.g;if(g.frozen||!this.pending().some(d=>d.id===id)||!['repair','pm','balanced'].includes(policy))return false;this.state.policy=policy;this.timer=0;this.state.choices.push({id,policy,time:g.clock.seconds});g.hud.message(`領班：收到，依「${{repair:'修復優先',pm:'PM 優先',balanced:'先到先處理'}[policy]}」安排下一個空閒人力。`);g.career.persist();g.career.ui.showLeadership();return true;}
 update(dt){const g=this.g;if(!this.active)return;this.accumulator+=dt;if(this.accumulator<5)return;dt=this.accumulator;this.accumulator=0;const state=this.state;this.button.hidden=false;this.button.textContent=`領班 / 重要決策 ${this.pending().length}`;document.body.dataset.leadership='true';
 // PC reporting remains timed and interruptible; field steps still require physical travel.
 for(const t of g.officeWork.pending()){if(g.officeWork.step(t)?.place!=='pc'||g.life.active?.taskId===t.id)continue;t.leaderHandledBy='羅領班';g.officeWork.advance(t.id,dt);break;}
 this.timer-=dt;if(this.timer>0)return;this.timer=15;
 const waiting=[...g.tasks.tasks.values()].filter(t=>t.alarm?g.pm.canHelp(t)&&g.repair.active!==t:t.kind==='pm'?t.status==='PENDING':g.pm.canTakeField(t));
 const priority=t=>state.policy==='balanced'?0:state.policy==='pm'?(t.kind==='pm'?0:1):(t.alarm?0:1);waiting.sort((a,b)=>priority(a)-priority(b)||a.created-b.created);
 for(const a of g.assistants){if(!g.pm.available(a))continue;for(const t of waiting){if(t.assistantId)continue;if(t.alarm)g.pm.assignRepair(t.id,a.id);else if(t.kind==='pm')g.pm.assignPM(t.equipmentId,a.id);else g.pm.assignField(t.id,a.id);if(t.assistantId===a.id){t.leaderHandledBy='羅領班';g.tasks.changed(t);break;}}}
 if(g.officePeople.entities[0]){g.officePeople.entities[0].name='羅領班';g.officePeople.entities[0].role='設備領班';}
 }
}
