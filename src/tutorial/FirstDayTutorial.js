import {updateOrientationCalls} from './OrientationCalls.js';
import {MENTOR,tutorialState,tutorialStep,TUTORIAL_LESSONS} from '../data/tutorial.js';
import {DESTINATIONS} from '../data/layout.js';
import {ALARMS} from '../data/alarms.js';
export class FirstDayTutorial {
 constructor(g,saved){this.g=g;this.enabled=g.dayPlan.tutorialVersion===1&&g.clock.day===1;this.state=tutorialState(saved);if(!this.enabled)return;
  if(!g.phone.byId.has(MENTOR.id)){g.phone.contacts.push({...MENTOR});g.phone.byId.set(MENTOR.id,g.phone.contacts.at(-1));}
  const mentor=g.officePeople.entities[0];mentor.name=MENTOR.name;mentor.role='帶班工程師';
  const on=(name,fn)=>g.bus.on(name,data=>{fn(data);this.render();});
  on('LIFE_STARTED',a=>{if(a.item?.id==='desk'&&g.life.near(a.item)&&['rest','research','work-pc','report','eat','nap'].includes(a.type)&&!this.state.deskDone){this.state.deskDone=true;g.hud.message('學長：對，這就是你的座位！電腦工作、研發和休息都回這裡。');}});
  on('PHONE_RESPONSE',c=>{if(c.contactId===MENTOR.id)this.state.phoneDone=true;});
  on('PM_ASSIGNED',()=>this.state.pmAssigned=true);on('PM_CLOSED',()=>this.state.pmDone=true);
  on('PROCESS_NOTIFIED',t=>{if(t.id===this.state.alarmId)this.state.alarmDone=true;});
  on('LIFE_COMPLETED',a=>{if(a.type==='eat'){this.state.mealDone=true;this.state.trayDone=a.food?.service!=='dine-in';}});
  on('TRAY_RETURNED',()=>this.state.trayDone=true);
  document.body.insertAdjacentHTML('beforeend','<aside id="tutorial" aria-label="第一天學長帶班"><button id="tutorial-toggle" aria-expanded="false"><b>林學長 · 第一天帶班</b><span id="tutorial-goal"></span></button><div id="tutorial-body" hidden><p id="tutorial-copy"></p><button id="tutorial-action"></button><small>可自由行動 · 進度自動保存 · 教學不暫停世界</small></div></aside>');
  this.panel=document.querySelector('#tutorial');this.body=document.querySelector('#tutorial-body');
  document.querySelector('#tutorial-toggle').onclick=()=>{this.body.hidden=!this.body.hidden;document.querySelector('#tutorial-toggle').setAttribute('aria-expanded',String(!this.body.hidden));};
  document.querySelector('#tutorial-action').onclick=()=>{if(g.frozen)return;this.action();this.body.hidden=true;document.querySelector('#tutorial-toggle').setAttribute('aria-expanded','false');g.career.persist();};
  this.render();
 }
 snapshot(){return this.enabled?{...this.state}:undefined;}
 get advice(){return TUTORIAL_LESSONS[this.step][1];}
 get step(){return tutorialStep(this.state,this.g.shift,this.g.clock.seconds);}
 pm(){return [...this.g.pm.jobs.values()][0];}
 call(){const g=this.g;if(!g.phone.active){if(!g.phone.queue.some(c=>c.contactId===MENTOR.id))g.phone.enqueue(MENTOR.id,g.alarms.owned[0],'orientation');g.phone.gap=0;}g.phoneUI.show();}
 navigate(target){if(target)this.g.bus.emit('NAVIGATION_SELECTED',{...target,name:target.name??target.title});}
 action(){const g=this.g,step=this.step;
  if(step==='desk')return this.navigate(g.world.interactions.find(i=>i.id==='desk'));
  if(step==='phone')return this.call();
  if(step==='assign')return g.assistantHUD.show(g.assistants[0].id);
  if(step==='pm')return this.navigate(this.pm());
  if(step==='alarm'){const t=g.alarms.get(this.state.alarmId);if(t)this.navigate(t);return;}
  if(step==='meal')return this.navigate(DESTINATIONS.find(d=>d.id==='restaurant'));
  if(step==='tray')return this.navigate(g.world.interactions.find(i=>i.kind==='tray-return'));
  if(step==='morning'&&g.clock.seconds>=34200){this.state.briefed=true;g.hud.message('學長補交接：今日一台 PM，助工可自行結案。接著練習電話與派工；漏掉的早交接仍記在日誌。');this.render();return;}
  if(step==='done'&&g.shift.near(g.player.position))return g.lifeUI.show('handover',g.world.interactions.find(i=>i.kind==='handover'));
  this.navigate(DESTINATIONS.find(d=>d.id==='handover'));
 }
 update(){if(!this.enabled)return;const g=this.g,s=this.state;updateOrientationCalls(g,s);
  if((g.shift.morning||s.briefed)&&!s.called&&!g.fastForwarding){s.called=true;g.phone.enqueue(MENTOR.id,g.alarms.owned[0],'orientation');}
  if(s.pmDone&&s.phoneDone&&!s.alarmCreated&&!g.fastForwarding){const alarm=ALARMS.find(a=>a.service!=='subfab');const t=g.alarms.trigger(undefined,{alarmCode:alarm.code});if(t){s.alarmId=t.id;s.alarmCreated=true;g.hud.message('學長：練習警報已加入任務，只處理這一筆就好。');}}
 }
 render(){if(!this.enabled)return;const g=this.g;this.panel.hidden=g.frozen||g.lifeUI.open||g.assistantHUD.open||g.detailOpen||g.phoneUI.open||g.career?.ui.panel.hidden===false||g.state!=='PLAYING';const step=this.step,[title,copy,label]=TUTORIAL_LESSONS[step];document.querySelector('#tutorial-goal').textContent=title;document.querySelector('#tutorial-copy').textContent=copy;document.querySelector('#tutorial-action').textContent=step==='morning'&&g.clock.seconds>=34200?'請學長補交接':label;
 }
}
