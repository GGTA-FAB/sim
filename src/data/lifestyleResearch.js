export const LIFESTYLE_REQUIRED=3;
export const WALLPAPERS={ocean:'海景',mountain:'山景',chicken:'雞腿飯'};
export const LIFESTYLE_PROJECTS=[
 ['oht-home','天車趕下班計畫',90,'3F FAB · 中央走道','天車移動快 10%，仍保持排隊與避讓；走道新增趕下班試行標示。'],
 ['claw-motor','娃娃機馬達改善',60,'1F · 餐飲街休息角','娃娃機夾爪橫移快 20%，更新馬達外殼與指示燈；夾力維持原廠設定。'],
 ['food-flavor','餐廳風味改善',60,'1F · 五家餐廳櫃檯','新增香草與配色擺盤、更新試吃認證；同事終於覺得今天不錯，飽足效果相同。'],
 ['main-course','便當主菜可視化',45,'餐盤／便當與餐廳展示餐','主菜變大一點，白飯挪出位置，打開便當就看得見成果。'],
 ['big-chicken','雞腿覆蓋率提升',90,'餐盤／便當與定食櫃檯','偶爾買到大雞腿，換成有骨頭的雞腿模型，櫃檯同步展示。'],
 ['coffee-flavor','咖啡去焦味工程',60,'3F · 咖啡機','咖啡機換色、杯內呈現咖啡與拉花，同事不再把它叫機油；恢復效果相同。'],
 ['less-ice','飲料冰量最佳化',30,'1F · 飲料展示台','透明杯的冰塊從六塊減為兩塊，茶飲看起來比較划算。'],
 ['microwave','微波均勻性改善',60,'1F · 超商旁微波台','微波爐換上新面板，展示餐的冰冷中心消失，熱盤會緩慢轉動。'],
 ['quiet-chair','辦公椅靜音改造',45,'3F · 自己的座位','椅子加上軟墊與新輪套，坐下由吱吱聲改成輕柔滑動聲。'],
 ['nap-pose','午睡姿勢標準化',45,'3F · 自己的座位','桌上出現摺好的外套，午睡時抱著外套、伏身休息。'],
 ['mousepad','滑鼠墊尺寸擴充',30,'3F · 自己的桌面','換成超大藍色滑鼠墊，研發效率維持原值。'],
 ['wallpaper','螢幕桌布更新',30,'3F · 自己的 PC','可選海景、山景或雞腿飯桌布；PC 畫面與場景螢幕同步更新。'],
 ['desk-plant','桌面綠化計畫',45,'3F · 自己的桌面','多一盆綠色植物，同事偶爾認真提醒你澆水。'],
 ['lift-tone','電梯提示音升級',30,'辦公棟／FAB 棟 · 電梯','電梯門旁增加金色音符牌，抵達時改用柔和三音提示；速度不變。'],
 ['badge','識別證防翻面研究',30,'主角胸前','加上固定夾與掛繩，走路時識別證保持正面。'],
 ['gown-pocket','無塵衣口袋整理',45,'主角無塵衣與接電話動作','口袋增加分類縫線，接電話直接從正確口袋拿出手機。'],
 ['lunch-board','午餐情報共享平台',60,'1F · 餐廳情報板','新增五店推薦看板，同事對今天最好吃的店有各自的看法。'],
 ['posters','走廊標語持續改善',60,'辦公室／餐廳／FAB 走廊','張貼多張新的正式標語，例如「請勿將再觀察列為永久對策」。'],
 ['ae-wording','助工完工用語改善',45,'助工座位與完工來電','助工桌上增加回報紀錄夾，解鎖多種一本正經的完工說法。'],
 ['boss-praise','主管稱讚流程建置',90,'3F · 辦公室回饋牆／手機','掛上主管肯定試行框；少數工作日下午，主管會專程來電稱讚。'],
].map(([id,name,minutes,location,description])=>({id:'fun-'+id,name,seconds:minutes*60,location,description,lifestyle:true}));
export const FUN_POSTERS=['請勿將再觀察列為永久對策','午餐延後不代表午餐完成','問題已知，不代表問題已解','本區禁止用眼神修機','開會前請確認這是一個會議','準時下班也是一種排程能力'];
export const AE_REPORT_LINES=['這次它有配合，復機流程已完成。','接頭全部確認過，這次沒有多出來的。','目前運作正常，我也有再看一次。','已把再觀察改成已處理。','零件料號與機台編號都有核對。','這台目前很安靜，我們先尊重它。'];
export const PRAISE_REASON='manager-praise';
export function praiseDay(seed){return ((Math.imul(seed^0x6bd104,1664525)+1013904223)>>>0)%100<15;}
export function lifestyleLine(research,item,topic,n=0){
 if(topic==='lunch'&&research.complete('fun-lunch-board'))return ['我推薦定食。隔壁推薦麵，情報平台目前還沒達成共識。','咖哩今天不錯，推薦人就是我，利益關係是我剛吃完。','輕食很清爽。你如果很餓，可以再買一份不輕的。','咖啡店的三明治不錯，這是食物推薦，不是加班邀請。','麵店今天值得一試。情報僅供參考，口味由本人負責。'][n%5];
 if(topic==='lunch'&&research.complete('fun-food-flavor'))return ['今天居然不錯，我已經把這件事寫進正面回饋。','餐廳換了擺盤。我確認過，吃完還是會飽。'][n%2];
 if(topic==='casual'){const lines=[];if(research.complete('fun-desk-plant'))lines.push('你的盆栽該澆水了。它沒辦法打電話催你，所以我代為通知。');if(research.complete('fun-coffee-flavor'))lines.push('新咖啡確實不像機油了，這個改善我支持結案。');if(research.complete('fun-microwave'))lines.push('便當中間終於是熱的，微波驗證我可以簽名。');if(lines.length)return lines[n%lines.length];}return null;
}
