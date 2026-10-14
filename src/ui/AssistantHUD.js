import {repairProgress} from '../minigames/registry.js';
import {rampAt} from '../navigation/TravelRouter.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function assistantStatus(g,a){
 if(a.onLeave)return {busy:true,onLeave:true,location:'今日不在廠',detail:'請假 · 明日重新排班',progress:null};
 const busy=!!a.job,ramp=rampAt(a.position,g.world.collision),location=ramp?`${ramp.group==='fab'?'FAB':'辦公棟'}樓梯`:g.world.zone(a.position).replace('Equipment Office Bay','設備辦公區').replace('Engineering Office','辦公室').replace('電梯 / 樓梯大廳','梯廳');
 const job=a.job;let detail=a.returningSeat?'返回座位':a.state==='STANDBY_EQUIPMENT'?'現場待命':a.seated?'座位待命':'待命',progress=null;
 if(job){const kind={pm:'PM',repair:'修機',field:'檢查',standby:'前往待命',return:'回辦公室'}[job.kind]??'工作';detail=`${job.equipmentId??''} ${kind}`.trim();
  if(!a.arrived)detail+=a.state==='GOWNING'?' · 換裝':' · 前往中';
  else if(job.kind==='pm'){const t=g.pm.get(job.equipmentId);progress=t?.progress??0;detail+=` ${Math.floor(progress*100)}%${t?.status==='RECHECK'?' · 重查':''}`;}
  else if(job.kind==='repair'){const t=g.alarms.get(job.equipmentId);progress=t?repairProgress(t.repair):0;detail+=` ${Math.floor(progress*100)}%`;}
  else if(job.kind==='field'){const t=g.tasks.tasks.get(job.taskId),step=t&&g.officeWork.step(t);progress=step?t.stepProgress/step.seconds:0;detail+=` ${Math.floor(progress*100)}%`;}
 }
 return {busy,location,detail,progress};
}
export class AssistantHUD {
 constructor(game){this.game=game;this.rows=new Map();this.open=false;this.selected=null;this.signature='';
  document.body.insertAdjacentHTML('beforeend',`<aside id="assistant-status" aria-label="助工即時狀態"><div class="assistant-heading"><strong>助工動態</strong><small id="assistant-dispatch-hint">點人派工</small><button id="assistant-auto-toggle" hidden aria-pressed="false"></button></div><div id="assistant-status-list"></div></aside><section id="assistant-dispatch" role="dialog" aria-label="助工派工" hidden><button id="assistant-dispatch-close" aria-label="關閉派工">×</button><h2 id="assistant-dispatch-title"></h2><p id="assistant-dispatch-status"></p><label class="assistant-hold"><input id="assistant-hold" type="checkbox">完成後留在現場待命</label><div id="assistant-dispatch-jobs"></div><button id="assistant-call">打電話 / 查看進度</button><button id="assistant-return">請他回座位待命</button></section>`);
  document.querySelector('#assistant-auto-toggle').onclick=()=>{if(game.frozen)return;game.autoWork.toggle();game.hud.message(game.autoWork.enabled?'自動派工已開啟，空閒助工將接手等待中的 Alarm。':'自動派工已暫停，已指派的工作會繼續完成並回報。');this.update();};
  this.panel=document.querySelector('#assistant-dispatch');this.jobs=document.querySelector('#assistant-dispatch-jobs');
  for(const a of game.assistants)this.add(a);
  document.querySelector('#assistant-dispatch-close').onclick=()=>this.hide();
  document.querySelector('#assistant-hold').onchange=e=>{const a=game.pm.agent(this.selected);if(!a||game.frozen)return;a.holdAfterJob=e.target.checked;game.career.persist();};
  document.querySelector('#assistant-call').onclick=()=>this.call();
  document.querySelector('#assistant-return').onclick=()=>{if(game.frozen)return;game.hud.message(game.pm.returnOffice(this.selected));this.signature='';game.career.persist();this.update();};
  this.jobs.onclick=e=>{const b=e.target.closest('[data-assistant-task]');if(b)this.call(b.dataset.assistantTask);};
  game.bus.on('SHIFT_ENDED',()=>this.hide());
 }
 add(a){const row=document.createElement('button');row.className='assistant-status-row';row.dataset.assistant=a.id;row.innerHTML='<span class="assistant-line"><b></b><em></em></span><span class="assistant-location"></span><span class="assistant-job"></span>';row.onclick=()=>this.show(a.id);document.querySelector('#assistant-status-list').append(row);this.rows.set(a.id,row);}
 eligible(){const g=this.game;return [...g.tasks.tasks.values()].filter(t=>t.kind==='pm'?g.pm.canAssign(t):g.pm.canHelp(t)||g.pm.canTakeField(t));}
 show(id){const g=this.game;if(g.frozen)return;if(g.pm.agent(id)?.onLeave){g.hud.message('這位助工今天請假，請找其他到班同事。');return;}if(g.mobileUI?.media.matches)g.phoneUI.hide();this.selected=id;this.open=true;this.panel.hidden=false;this.signature='';g.workHUD.repairUI.release();g.input.reset();g.controls();this.update();}
 hide(){this.open=false;this.panel.hidden=true;this.game.input.reset();this.game.controls();}
 call(taskId=null){const g=this.game,a=g.pm.agent(this.selected);if(g.frozen||!a||a.onLeave)return;const t=taskId?g.tasks.tasks.get(taskId):null;
  if(taskId&&(!t||a.job||!this.eligible().includes(t))){g.hud.message('工作或助工狀態已變更，請重新選擇。');this.signature='';this.update();return;}
  if(g.phone.active){g.hud.message('目前已有來電或通話，請先接聽或結束，再派工。');this.hide();g.phoneUI.show();return;}
  const id=t?.equipmentId??t?.subjectId??a.job?.equipmentId??g.alarms.owned[0];this.hide();g.pmUI.openPhone(id,t?.id??null);g.phoneUI.ringtone.unlock();g.phoneUI.dial(a.id,id);
 }
 update(){const g=this.game,auto=g.autoWork,toggle=document.querySelector('#assistant-auto-toggle');toggle.hidden=!auto.unlocked;toggle.disabled=g.frozen;toggle.setAttribute('aria-pressed',String(auto.enabled));toggle.setAttribute('aria-label',`自動派工${auto.enabled?'開啟':'暫停'}，${auto.waiting} 筆等待；點擊切換`);toggle.textContent=auto.enabled?`自動 ON · 待派 ${auto.waiting}`:'自動 OFF';document.querySelector('#assistant-dispatch-hint').hidden=auto.unlocked;document.body.dataset.autoWorkUnlocked=String(auto.unlocked);for(const a of g.assistants){const row=this.rows.get(a.id),s=assistantStatus(g,a);row.dataset.busy=String(s.busy);row.querySelector('b').textContent=a.name;row.querySelector('em').textContent=s.onLeave?'請假':s.busy?'忙碌':'可派工';row.querySelector('.assistant-location').textContent=s.location;row.querySelector('.assistant-job').textContent=s.detail;row.setAttribute('aria-label',`${a.name} · ${s.location} · ${s.detail} · ${s.onLeave?'請假':s.busy?'忙碌':'可派工'}`);row.disabled=g.frozen||a.onLeave;}
  if(!this.open)return;const a=g.pm.agent(this.selected),s=assistantStatus(g,a);document.querySelector('#assistant-dispatch-title').textContent=`${a.name} · ${s.busy?'正在工作':'可派工'}`;document.querySelector('#assistant-dispatch-status').textContent=`${s.location}｜${s.detail}`;
  document.querySelector('#assistant-hold').checked=!!a.holdAfterJob;document.querySelector('#assistant-hold').disabled=g.frozen;document.querySelector('#assistant-return').disabled=s.busy||g.frozen;
  const tasks=this.eligible(),signature=[a.id,!!a.job,...tasks.map(t=>`${t.id}:${t.status}:${t.stepIndex}`)].join('|');if(signature===this.signature)return;this.signature=signature;
  this.jobs.innerHTML=s.busy?'<p>手上工作完成前不接新派工。可查看進度，或改找其他助工。</p>':tasks.length?'<p>選工作後會撥電話，確認指派才出發。電腦作業由你處理。</p>'+tasks.map(t=>`<button data-assistant-task="${esc(t.id)}"><b>${esc(t.name??t.id)}</b><span>${t.y===0?'2F Sub FAB':'3F FAB'} · ${t.kind==='pm'?'PM':t.kind==='office-work'?esc(g.officeWork.step(t).label):'Alarm 修機'}</span></button>`).join(''):'<p>目前沒有可指派的現場工作。電腦作業需由你完成。</p>';
 }
}
