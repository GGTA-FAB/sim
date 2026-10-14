import {RANKS,newProgression,reviewYear,enterYear} from '../data/careerProgression.js';
import {captureSession,restoreSession,validateSession} from './SessionSnapshot.js';
import {DailyRecord} from './DailyRecord.js';
import {planDay} from './WorkloadDirector.js';
import {DAY_BALANCE} from '../data/workloads.js';
import {CareerUI} from '../ui/CareerUI.js';
export class Career {
 constructor(game,save,loaded){this.game=game;this.save=save;this.history=loaded?.history??[];this.blocked=!loaded&&!!save.error;this.timer=0;game.record=new DailyRecord(game);if(loaded?.snapshot)restoreSession(game,loaded.snapshot);this.ui=new CareerUI(this);
  game.bus.on('SHIFT_ENDED',()=>{this.recordDay();this.persist();this.ui.showSummary();});
  for(const event of ['RESUME_REQUESTED','ALARM_CREATED','ALARM_REPAIRED','PROCESS_NOTIFIED','PM_ASSIGNED','PM_CLOSED','ASSISTANT_INCIDENT','TASK_TRANSFERRED','PHONE_CALL_ENDED','LIFE_COMPLETED','DAILY_WORK_ASSIGNED','OFFICE_WORK_STEP_COMPLETED','OFFICE_WORK_COMPLETED','LIFE_STOPPED','RESEARCH_COMPLETED','LIFE_STARTED','ALARM_AUTO_ASSIGNED','AUTO_WORK_CHANGED','PHONE_CALL_STARTED','COSMETICS_CHANGED'])game.bus.on(event,()=>{if(this.queued)return;this.queued=true;queueMicrotask(()=>{this.queued=false;this.persist();});});
  window.addEventListener('pagehide',()=>this.persist());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.persist();});
  if(game.state==='SHIFT_ENDED'){document.querySelector('#menu').hidden=true;this.ui.showSummary();}else if(loaded?.snapshot)document.querySelector('#start').textContent=`繼續 DAY ${game.clock.day} · ${game.clock.text} →`;
  this.ui.status(save.error||(loaded?.snapshot?.careerNotice?'已依既有人力承接職階，原有工作與研究進度保留。':loaded?.snapshot?.rosterNotice?'已保留既有助工與資深資格，原有工作與進度保留。':loaded?.snapshot?'已讀取本機存檔。離線期間不推進遊戲時間。':'進入廠區後自動儲存。'));
 }
 recordDay(){
  const g=this.game;let result=this.history.find(s=>s.day===g.clock.day);
  if(!result){result=g.record.summary();this.history.push(result);g.bus.emit('DAY_ENDED',result);}
  const rank=g.progression.rank;reviewYear(g.progression,this.history,result.day);
  if(g.progression.rank!==rank){g.expandAssistantRoster();g.updateModuleLabel();}
 }

 data(){const g=this.game;return {profile:g.profile,day:g.clock.day,seed:g.seed,plan:g.dayPlan,history:this.history,progression:g.progression,research:g.research.snapshot(),snapshot:captureSession(g),savedAt:Date.now()};}
 persist(){if(this.blocked||this.game.moduleSelection)return false;const ok=this.save.save(this.data());this.ui.status(ok?`已儲存 DAY ${this.game.clock.day} · ${this.game.clock.text}`:this.save.error);if(!ok&&!this.warned)this.game.hud.message(this.save.error);this.warned=!ok;return ok;}
 update(realDt){this.timer+=realDt;if(this.timer>=DAY_BALANCE.autoSaveSeconds){this.timer=0;this.persist();}}
 nextDay(){const g=this.game;if(g.state!=='SHIFT_ENDED')return false;if(this.blocked){this.ui.status('原存檔無法讀取，請先匯出備份，再從暫停選單確認重新開始。');return false;}this.recordDay();const day=g.clock.day+1,seed=(g.seed+Math.imul(day,0x9e3779b9))>>>0,progression=structuredClone(g.progression);enterYear(progression,day);progression.management=null;const plan=planDay(seed,day,undefined,g.dayPlan.module,RANKS[progression.rank].assistants);plan.rank=progression.rank;const ok=this.save.save({profile:g.profile,day,seed,plan,history:this.history,progression,research:g.research.snapshot(),snapshot:null,savedAt:Date.now()});if(!ok){this.ui.status(this.save.error);return false;}this.blocked=true;location.reload();return true;}
 async readImport(file){try{if(!file||file.size>10*1024*1024)throw Error();const text=await file.text(),json=JSON.parse(text),data=json.payload?this.save.decode(text):json;if(!Number.isInteger(data.day)||data.day<1||!Number.isFinite(data.seed)||!Array.isArray(data.history)||data.plan?.day!==data.day)throw Error();validateSession(data);this.pendingImport=data;this.ui.confirmImport(data);}catch{this.ui.status('此檔案不是可讀取的遊戲存檔；目前進度未變更。');}}
 import(){if(!this.pendingImport)return;if(!this.save.save(this.pendingImport)){this.ui.status(this.save.error);return;}this.blocked=true;location.reload();}
 newCareer(){const seed=crypto.getRandomValues(new Uint32Array(1))[0];const data={day:1,seed,plan:planDay(seed,1),history:[],progression:newProgression(),snapshot:null,savedAt:Date.now()};if(!this.save.save(data)){this.ui.status(this.save.error);return;}this.blocked=true;location.reload();}
 export(){let content;if(this.blocked){try{content=this.save.storage.getItem(this.save.key)??'null';}catch{content='null';}}else content=JSON.stringify(this.data(),null,2);const url=URL.createObjectURL(new Blob([content],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`GGTA-DAY-${this.game.clock.day}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
