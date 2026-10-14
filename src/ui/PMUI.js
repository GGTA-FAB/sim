export class PMUI {
 constructor(game){this.game=game;const button=document.createElement('button');button.id='pm-confirm';button.className='primary';button.hidden=true;document.querySelector('.detail-actions').append(button);this.confirm=button;button.onclick=()=>{if(game.state==='PAUSED')return;game.hud.message(game.pm.confirm(game.detailEquipment,game.player.position));this.update();};
  for(const [parent,id,text] of [['.detail-actions','assistant-detail','聯絡助理 · PM / 修機'],['#repair-actions','assistant-repair','請助理接手剩餘修機']]){const b=document.createElement('button');b.id=id;b.textContent=text;b.onclick=()=>this.openPhone(game.repair.active?.id??game.detailEquipment);document.querySelector(parent).append(b);}
  game.bus.on('ASSISTANT_REPAIR_TAKEOVER',t=>{game.leaveRepair();game.hud.message(`${t.id} · 助理已抵達並接手，可以離開。`);});
  game.bus.on('PM_ASSIGNED',t=>game.hud.message(`${t.equipmentId} PM · 助理出發，設備保留維護。`));
  game.bus.on('ASSISTANT_INCIDENT',t=>game.hud.message(`${t.equipmentId} PM · 助理發現問題，正在自行排除與重查。`));
 }
 openPhone(id,taskId=null){const g=this.game;if(g.state==='PAUSED')return;if(id)g.phoneUI.equipmentId=id;g.phoneUI.taskId=taskId;g.phoneUI.view='assistants';g.phoneUI.show();if(!g.assistants.some(a=>g.pm.available(a)))g.hud.message('NO ASSISTANT AVAILABLE · 到班助理都在工作，可致電確認進度；請假者今日無法派工。');}
 update(){const g=this.game,t=g.pm.get(g.detailEquipment),labels={WAIT_START:'現場確認 · 開始 PM',WAIT_CHECK:'確認重要步驟 · 繼續 PM',WAIT_INCIDENT:'現場處理異常 · 重新確認',WAIT_CLOSE:'現場驗收 · Close PM'};this.confirm.hidden=g.detailSub||!t||!labels[t.status];this.confirm.textContent=t?labels[t.status]??'':'';this.confirm.disabled=g.state==='PAUSED'||!t||!g.pm.near(t,g.player.position);
  document.querySelector('#assistant-detail').hidden=!g.alarms.owned.includes(g.detailEquipment);const alarm=g.alarms.get(g.detailEquipment);if(alarm?.assistantId)document.querySelector('#start-repair').hidden=true;
 }
}
