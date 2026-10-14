export const MENTOR={id:'mentor-0',name:'林學長',role:'equipment',personality:'calm',extension:'2900'};
export const TUTORIAL_KEYS=['deskDone','briefed','called','phoneDone','pmAssigned','pmDone','alarmCreated','alarmDone','mealDone','trayDone'];
export function tutorialState(saved){return {version:1,ambientCalls:saved?.ambientCalls??0,...Object.fromEntries(TUTORIAL_KEYS.map(k=>[k,!!saved?.[k]])),alarmId:saved?.alarmId??null};}
export function validateTutorial(s){if(s===undefined)return;if(!s||s.version!==1||(s.ambientCalls!==undefined&&(!Number.isInteger(s.ambientCalls)||s.ambientCalls<0||s.ambientCalls>3))||TUTORIAL_KEYS.some(k=>!(k==='deskDone'&&s[k]===undefined)&&typeof s[k]!=='boolean')||(s.alarmId!==null&&typeof s.alarmId!=='string'))throw Error('Invalid tutorial progress');}
export function tutorialStep(s,shift,seconds){
 if(!shift.morning&&!s.briefed)return 'morning';
 if(!s.deskDone)return 'desk';
 if(!s.phoneDone)return 'phone';
 if(!s.pmAssigned)return 'assign';
 if(!s.pmDone)return 'pm';
 if(!s.alarmDone)return 'alarm';
 if(!s.mealDone)return 'meal';
 if(!s.trayDone)return 'tray';
 return shift.evening||seconds>=63000?'done':'evening';
}
export const TUTORIAL_LESSONS={
 morning:['01 · 先認識交接','我是林學長，今天先熟悉環境。08:30–09:30 到 3F 會議室交接，點中央提醒即可前往。交接會快轉一小時，之後才開始練習。','標記會議室'],
 desk:['02 · 找到自己的座位','先認一下自己的位置，免得每天都坐到別人的位子。點下方導航，沿藍線回 3F 辦公室的「我的座位」，靠近後選「使用電腦」或坐下休息。以後電腦工作、研發和外帶用餐都在這裡。','導航回我的座位'],
 phone:['03 · 接一通電話','我會打給你。點右下手機，再按綠色接聽鍵，選一句回覆。紅鍵可掛斷；漏接會留紀錄，不用緊張，可以再練一次。','開啟教學電話'],
 assign:['04 · 把 PM 派給助工','PM 是預防保養。點右上「可派工」的助工，選今天的 PM，撥電話後選「指派 PM」。有按確認，助工才會出發；忙碌中的人不接新工作。','選助工派 PM'],
 pm:['05 · 看懂 PM 進度','助工正在走去機台，抵達後會自行保養、確認並結案。右上可以看他的位置與百分比，不用站著陪整場。可沿藍線去現場看看；穿無塵衣後再過風淋。','標記 PM 機台'],
 alarm:['06 · 練習處理 Alarm','現在只有一筆練習警報。點今日任務可標記位置；你可親自到現場修機，再通知製程，也可請剛完成 PM 的助工全權處理。助工忙時請等他有空。','查看練習 Alarm'],
 meal:['07 · 下樓吃飯','餐廳在辦公棟 1F，搭電梯或走樓梯。到櫃檯點內用，拿餐盤到空位按「用餐」；也可外帶回自己座位吃。世界會繼續運作，飯不用吸著吃。','標記餐飲街'],
 tray:['08 · 把餐盤送回去','吃完內用後，拿空餐盤到回收區按「回收餐盤」。外帶便當不需要還餐盤。吃完就走，下次餐盤會比你先被認出來。','標記回收區'],
 evening:['09 · 交接與下班','基本操作練完了，可以自由探索或到自己電腦研發。16:30–17:30 點交接提醒回會議室，交接到 17:30 後選下班。今天不再追加隨機工作，但製造部與製程偶爾會來電確認機況。','標記會議室'],
 done:['帶班完成 · 辛苦了','今天先學到這裡。17:30 以後可在交接／下班面板結束一天。第二天恢復正常派工與來電，今天學的派工技巧就派上用場了。','查看下班'],
};
