export const ASSISTANT_COUNT=3;
export const PM_BALANCE={minCount:1,maxCount:3,minAssistants:1,maxAssistants:3,durationMin:1800,durationMax:3000,checkAt:.45,incidentAt:.7,incidentChance:.16,recheckSeconds:90,callRepeat:2400,repairSeconds:240,walkSpeed:4.8,repathSeconds:4,workArrivalRadius:1.4,gownSeconds:1.2,viewDistance:65};
export const PM_STATES={PENDING:'待指派',TRAVELLING:'助理前往中',WAIT_START:'等待開工確認',RUNNING:'施工中',WAIT_CHECK:'等待重要步驟確認',WAIT_INCIDENT:'異常 · 等待工程師',RECHECK:'助理自行排除／重查中',WAIT_CLOSE:'完成 · 等待現場結案',CLOSED:'已結案'};
export const ASSISTANT_EVENTS=[
 {id:'revision',text:'學長，零件袋上的 Revision 跟工單不一樣。我還沒裝，可以幫我確認嗎？',instruction:'先核對工單，改用正確 Revision',reply:'收到，已找到正確版本。我會重新核對再裝。'},
 {id:'connector',text:'學長，測試沒有回應。我檢查到一個 Connector 還沒接，可以請你確認一下嗎？',instruction:'重新核對接頭，接妥後再測試',reply:'收到，我會核對編號並重新測試。'},
 {id:'jig',text:'學長，我拿的 Jig 放不上去。料號看起來差一碼，我先停下來了。',instruction:'換正確 Jig，再確認安裝位置',reply:'了解，我去工具櫃重新核對，確認後繼續。'}
];
export const SIMPLE_ALARMS=['SNS-201','LPT-208','PMP-120','COOL-317','PM-411'];
export const assistantContacts=count=>Array.from({length:count},(_,i)=>({id:`assistant-${i}`,name:['阿豪','小胖','老曾','小岳'][i],role:'assistant',department:'助理工程師',personality:['calm','formal','nervous','calm'][i],extension:String(2201+i)}));

// Existing Equipment Bay desks: chair pose and collision-free aisle approach.
export const ASSISTANT_DESKS=[
 {seat:{x:13,y:6,z:5.6,heading:0},approach:{x:13,y:6,z:4.2},labelZ:6.95},
 {seat:{x:13,y:6,z:13.6,heading:0},approach:{x:13,y:6,z:12.2},labelZ:14.95},
 {seat:{x:7,y:6,z:13.6,heading:0},approach:{x:7,y:6,z:12.2},labelZ:14.95},
 {seat:{x:7,y:6,z:5.6,heading:0},approach:{x:7,y:6,z:4.2},labelZ:6.95},
];
