import {AE_REPORT_LINES} from '../data/lifestyleResearch.js';
import {ASSISTANT_REPORT} from './AssistantReport.js';
import {FAB_Y} from '../data/layout.js';
export function assistantDialogue(game,call){
 if(call.reason===ASSISTANT_REPORT&&call.report){const r=call.report,time=`${String(Math.floor(r.completed/3600)).padStart(2,'0')}:${String(Math.floor(r.completed/60)%60).padStart(2,'0')}`,fresh=game.alarms.get(call.equipmentId),again=fresh&&fresh.serial!==r.serial;return{state:'assistant-report',text:`學長，${call.equipmentId} 的 ${r.alarmCode} 已在 ${time} 處理完成，位置是 ${r.area}。我已通知製程接手，這筆工單已結案。${game.research?.complete('fun-ae-wording')?AE_REPORT_LINES[r.serial%AE_REPORT_LINES.length]:''}${again?'目前又有另一筆新 Alarm，請以新工單為準。':''}`,options:[{label:'收到，辛苦了',reply:'收到，我會依目前的派工安排繼續工作。'},{label:'了解，我再看工作紀錄',reply:'這筆完工紀錄已保留。'}]};}
 const pm=game.pm,a=pm.agent(call.contactId),id=a.job?.equipmentId??call.equipmentId,t=pm.get(id),alarm=game.alarms.get(id);let text,options=[];const option=(label,action,reply='',equipmentId=id)=>({label,action:`assistant:${action}`,reply,equipmentId});
 if(call.direction==='outgoing'&&a.job){const current=a.job.equipmentId??'返回辦公室',what=a.job.kind==='pm'?'PM':a.job.kind==='repair'?'修機':a.job.kind==='field'?'現場檢查':'目前派工';return{state:'assistant-busy',text:`學長，我現在沒空，正在處理 ${current} 的${what}，不能再接一台。請找另一位有空的助工幫忙。`,options:[{label:'了解，改找其他助工',action:'assistant:other',equipmentId:call.equipmentId,reply:'收到，你掛斷後在助理名單選另一位；我先完成目前工作。'},{label:'那我先看你目前工作的進度',action:'assistant:progress',equipmentId:id,reply:`${current} · ${a.job.kind==='pm'&&t?pm.status(t):a.state==='TRAVELLING'?'前往中':a.job.kind==='field'?'現場檢查中':'處理中'}，完成後會回報。`}]};}
 if(a.job?.kind==='pm'){
  text=`${id} PM · ${pm.status(t)}，目前 ${Math.floor(t.progress*100)}%。`;
  if(t.status==='WAIT_INCIDENT'){text=t.incident.text;options.push(option(t.incident.instruction,'resolve'));}
  text+=' 我會獨立完成並結案，你不用過來。';
  options.push(option('幫我標記設備位置','navigate'),option('先等一下，我稍後到','wait','收到，我在這裡等你。'));
 }else if(a.job){text=a.job.kind==='repair'?`${id}：${a.state==='REPAIRING'?'已接手修機':'正在前往接手'}，完成後我會回報。`:`${id??'辦公室'}：我正在前往。`;options=[option('標記目前工作位置','navigate'),option('收到，照原安排進行','wait','了解。')];}
 else{ text=`學長，我現在可以協助。${id} 有什麼要處理的？`;
  const field=game.tasks.tasks.get(call.taskId)??game.officeWork?.pending().find(t=>t.subjectId===id&&pm.canTakeField(t));
  if(field&&pm.canTakeField(field))options.push({...option(`接手現場 · ${game.officeWork.step(field).label}`,'assignField'),taskId:field.id});
  if(pm.canAssign(t)&&(!call.taskId||call.taskId===t.id))options.push(option(`指派 ${id} PM`,'assignPM'));
  if(pm.canHelp(alarm)&&(!call.taskId||call.taskId===alarm.id||call.taskId===t?.id))options.push(option(`接手 ${alarm.y===0?'2F Sub FAB':'3F FAB'} Alarm / 修機`,'assignRepair'));if(t?.status==='PENDING'&&alarm)text+=` PM 還沒開始，要先處理 ${alarm.y===0?'2F Sub FAB':'3F FAB'} 異常；我可以先接手修機。`;
  options.push(option('先到這台設備待命','sendAhead'));if(options.length<3)options.push(option('回辦公室待命','returnOffice'));
 }
 return{state:'assistant',text,options:options.slice(0,3)};
}
export function assistantResponse(game,call,option){const pm=game.pm,id=option.equipmentId,a=call.contactId;switch(option.action){case'assistant:other':game.phoneUI.view='assistants';game.phoneUI.equipmentId=id;return option.reply;case'assistant:assignField':return pm.assignField(option.taskId,a);case'assistant:assignPM':return pm.assignPM(id,a);case'assistant:assignRepair':return pm.assignRepair(id,a);case'assistant:sendAhead':return pm.sendAhead(id,a);case'assistant:returnOffice':return pm.returnOffice(a);case'assistant:resolve':return pm.get(id)?.assistantId===a?pm.resolve(id):'目前工作狀態已變更。';case'assistant:navigate':{const e=game.living.equipment.byId.get(id);if(e)game.bus.emit('NAVIGATION_SELECTED',game.alarms.get(id)??{id,name:id,x:e.x,z:e.z-6,y:FAB_Y});return e?'已標記設備位置。':'我正在返回 3F 辦公室。';}default:return option.reply;}}
