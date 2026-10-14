import {LIFESTYLE_PROJECTS} from './lifestyleResearch.js';
import {REPAIR_GAMES} from './repairGames.js';
// All durations are game seconds; no progress accrues while away from the PC.
export const AUTO_REPAIR_SECONDS=16;
// Cap the benefit itself: +50% speed, -50% duration/frequency/probability.
export const MAX_RESEARCH_IMPROVEMENT=.5;
export function cappedResearchEffect(effect,value){
 if(effect==='alarmReduction')return Math.min(MAX_RESEARCH_IMPROVEMENT,Math.max(0,value));
 const maximum=['pmRate','callInterval'].includes(effect)?1/(1-MAX_RESEARCH_IMPROVEMENT):1+MAX_RESEARCH_IMPROVEMENT;
 return Math.min(maximum,Math.max(1,value));
}
export const AUTO_WORK={projectId:'assistant-autowork',pollSeconds:15,receiptSeconds:8};
export const STAFF_RESEARCH=[
 {id:'seniority-1',name:'資深工程師資格 I',staffing:true,description:'完成後增加第 2 位助工，可立即派工；資格與人力上限永久保留。',seconds:28800},
 {id:'seniority-2',name:'資深工程師資格 II',staffing:true,requires:'seniority-1',description:'完成資格 I 後可研究，增加第 3 位助工；最多擁有 3 位。',seconds:43200},
];
export function assistantCapacity(saved){let count=1;for(const p of STAFF_RESEARCH){if((saved?.progress?.[p.id]??0)<p.seconds)break;count++;}return count;}
export const RESEARCH_PROJECTS=[
 ...STAFF_RESEARCH,
 {id:AUTO_WORK.projectId,name:'助工自動上工',advanced:true,description:'空閒助工自動接手等待最久的 Alarm，實際前往 FAB／Sub FAB 修復並通知製程；完工來電回報、工單自動結案。全員忙碌時等待，右上可暫停自動派工。',seconds:57600},
 {id:'auto-navigation',name:'自動導航',description:'解鎖導航面板的自動導航按鈕：沿地面藍線步行、換裝、通過風淋及搭電梯／走樓梯。可隨時手動中止；到達後由你操作工作。',seconds:14400},
 {id:'player-motion',name:'工程師動線改善',description:'走路與跑步速度永久 +30%。',seconds:14400,effect:'playerSpeed',value:1.3},
 {id:'assistant-motion',name:'助工巡迴路線優化',description:'所有已解鎖助工移動速度永久 +30%。',seconds:14400,effect:'assistantSpeed',value:1.3},
 {id:'pm-flow',name:'PM 流程標準化',description:'助工 PM 正常作業時間永久縮短 30%；移動與異常處理仍需時間。',seconds:14400,effect:'pmRate',value:1/.7},
 {id:'stability',name:'設備穩定性改善',description:'隨機 Alarm 發生機率永久降低 30%；已發生的 Alarm 仍需處理。',seconds:14400,effect:'alarmReduction',value:.3},
 {id:'status-sync',name:'機況回報同步',description:'製造部重複催修與例行機況詢問頻率降低 40%；首次 Alarm 通知、製程與助工來電照常。',seconds:14400,effect:'callInterval',value:1/.6},
 ...Object.entries(REPAIR_GAMES).map(([type,g])=>({id:`auto-${type}`,name:`${g.name} SOP 自動化`,description:`永久解鎖此類維修的免小遊戲操作：到正確現場執行約 ${AUTO_REPAIR_SECONDS} 秒，再通知製程。`,seconds:21600,type})),
 ...LIFESTYLE_PROJECTS,
];
export const RESEARCH_BY_ID=Object.fromEntries(RESEARCH_PROJECTS.map(p=>[p.id,p]));
export function validateResearch(data){
 if(data===undefined)return;
 if(!data||data.version!==1||!data.progress||typeof data.progress!=='object'||Array.isArray(data.progress))throw Error('Invalid research');
 if(data.autoDispatchEnabled!==undefined&&typeof data.autoDispatchEnabled!=='boolean')throw Error('Invalid auto dispatch preference');
 if(data.cosmetics!==undefined){const c=data.cosmetics;if(!c||!['ocean','mountain','chicken'].includes(c.wallpaper)||!Number.isInteger(c.clawPrizes)||c.clawPrizes<0||c.clawPrizes>9999||!Number.isInteger(c.clawAttempts)||c.clawAttempts<0||c.clawAttempts>1000000)throw Error('Invalid cosmetic preferences');}
 if((data.progress['seniority-2']??0)>0&&data.progress['seniority-1']!==STAFF_RESEARCH[0].seconds)throw Error('Invalid seniority prerequisite');
 for(const [id,seconds] of Object.entries(data.progress))if(!Object.hasOwn(RESEARCH_BY_ID,id)||!Number.isFinite(seconds)||seconds<0||seconds>RESEARCH_BY_ID[id].seconds)throw Error('Invalid research progress');
}
