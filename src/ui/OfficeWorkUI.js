import {OFFICE_WORK} from '../data/officeWork.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class OfficeWorkUI {
 constructor(game){this.game=game;this.signature='';
  const section=document.createElement('section');section.id='field-work';const actions=document.querySelector('.detail-actions'),work=document.createElement('div');work.className='detail-work';actions.before(work);work.append(section,actions);this.field=section;
  const click=e=>{const b=e.target.closest('[data-office-start]');if(b)this.start(b.dataset.officeStart);const n=e.target.closest('[data-office-nav]');if(n){const t=game.tasks.tasks.get(n.dataset.officeNav);if(t){game.bus.emit('NAVIGATION_SELECTED',t);game.lifeUI.hide();}}};
  section.addEventListener('click',click);game.lifeUI.content.addEventListener('click',click);
  game.bus.on('DAILY_WORK_ASSIGNED',tasks=>{game.hud.message(`早會派工已同步：${tasks.map(t=>OFFICE_WORK[t.workType].name).join('、')}。可從任務清單導航。`);game.lifeUI.render(true);});
  for(const event of ['OFFICE_WORK_STEP_COMPLETED','OFFICE_WORK_COMPLETED'])game.bus.on(event,t=>{
   if(game.navigation.target.id===t.id){game.navigation.last.x=Infinity;if(event==='OFFICE_WORK_STEP_COMPLETED')game.bus.emit('NAVIGATION_SELECTED',t);}
   game.hud.message(event==='OFFICE_WORK_COMPLETED'?`${t.name} 已結案。`:`${t.name}：${game.progression.rank===3?'領班安排接續作業':game.officeWork.step(t).place==='pc'?'請回自己的電腦':'請前往機台'}繼續。`);
  });
  game.bus.on('LIFE_COMPLETED',a=>{if(a.type==='work-pc'&&!game.frozen){const desk=game.world.interactions.find(i=>i.id==='desk');if(game.life.start('rest',desk))game.lifeUI.show('pc',desk);}});
 }
 preview(){const g=this.game;return `<h3>早會派工</h3><p>${g.shift.workAssigned?'今日派工已同步。':'參加早會後派工；缺席時 09:30 自動同步至任務清單。'}</p><ul>${g.officeWork.plan.map(p=>`<li>${esc(OFFICE_WORK[p.type].name)} · ${esc(p.subjectId)}</li>`).join('')}</ul>`;}
 cards(tasks,place){const g=this.game;return tasks.map(t=>{const def=g.officeWork.definition(t),step=g.officeWork.step(t),done=t.notes??[],progress=Math.floor(t.stepProgress/step.seconds*100);return `<article class="office-work-card"><h4>${esc(t.name)}</h4><p>${esc(def.brief)}</p><p>步驟 ${t.stepIndex+1} / ${def.steps.length} · ${esc(step.label)} · ${progress}%</p><p>${step.place==='pc'?'自己的電腦':step.place==='subfield'?'2F Sub FAB':'3F 機台現場'} · 剩 ${Math.ceil((step.seconds-t.stepProgress)/60)} 遊戲分鐘</p>${done.length?`<details><summary>已取得紀錄（${done.length}）</summary>${done.map(n=>`<p><strong>${esc(n.label)}</strong><br>${esc(n.text)}</p>`).join('')}</details>`:''}${t.assistantId?`<p>已由 ${esc(g.pm.agent(t.assistantId)?.name??'助理')} 接手現場，完成後會回報。</p>`:step.place===place?`<button data-office-start="${esc(t.id)}">${t.stepProgress?'繼續':'開始'} · ${esc(step.label)}</button>`:`<button data-office-nav="${esc(t.id)}">導航至${step.place==='pc'?'自己的座位':esc(t.subjectId)}</button>`}</article>`;}).join('');}
 pc(){const g=this.game,completed=g.tasks.completed.filter(t=>t.kind==='office-work');return `<h3>每日派工 / 查案工作台</h3><p>請在自己的座位操作。進度可中斷保存，電話與 FAB 持續運作。</p><div class="pc-work-cards">${this.cards(g.officeWork.pending(),'pc')||'<p>目前沒有待處理派工。</p>'}</div>${completed.length?`<details><summary>今日已完成（${completed.length}）</summary>${completed.map(t=>`<p>${esc(t.name)} · 已提交</p>`).join('')}</details>`:''}`;}
 start(id){const g=this.game;if(g.frozen||g.repair.active)return;const t=g.tasks.tasks.get(id),step=t&&g.officeWork.step(t);if(!step)return;
  const item=step.place==='pc'?g.lifeUI.item:g.world.interactions.find(i=>i.equipmentId===g.detailEquipment&&i.kind===(step.place==='subfield'?'sub-equipment':'equipment'));
  if(step.place==='pc'&&(!g.lifeUI.open||g.lifeUI.page!=='pc'||g.life.active?.type!=='rest'))return;
  if(g.life.active&&g.life.active.type!=='rest')return;
  if(!g.officeWork.canStart(t,item,g.player.position)){g.hud.message('請到指定機台，或坐到自己的電腦操作。');return;}
  g.life.stop();if(g.life.start(step.place==='pc'?'work-pc':'work-field',item,{taskId:t.id})){g.closeDetail();g.lifeUI.hide();}
 }
 update(){const g=this.game,tasks=g.officeWork.pending().filter(t=>t.subjectId===g.detailEquipment&&g.officeWork.step(t).place===(g.detailSub?'subfield':'field'));this.field.hidden=!g.detailOpen||!tasks.length;const signature=tasks.map(t=>`${t.id}:${t.stepIndex}:${Math.floor(t.stepProgress)}`).join('|');if(this.signature!==signature){this.signature=signature;this.field.innerHTML=this.cards(tasks,g.detailSub?'subfield':'field');}}
}
