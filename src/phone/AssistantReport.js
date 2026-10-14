export const ASSISTANT_REPORT='assistant-complete';
export function reportTask(tasks,call){return call.reason===ASSISTANT_REPORT&&call.report?tasks.completed.find(t=>t.autoAssigned&&t.repairedBy==='assistant'&&t.serial===call.report.serial&&t.id===call.equipmentId&&t.assistantId===call.contactId):null;}
export function reportData(task){return {serial:task.serial,completed:task.notified??task.repaired,alarmCode:task.alarm.code,area:task.y===0?'2F Sub FAB':'3F FAB'};}
