export const GAME_NAME='GGTA';
export const GAME_FULL_NAME='Gotta Go Troubleshoot Again';
export const GAME_SUBTITLE='又要去修機了';

// Presentation-only randomness: never consume the simulation's seeded RNG.
export const TITLE_SLOGANS=[
 '世界不等你，製造也不會。',
 '你可以自由活動，但手機也可以自由響。',
 '本日工作已完成。這是三秒前的資訊。',
 '開放世界，封閉式無塵衣。',
 '天啊，怎麼又 Alarm！',
 '才穿好無塵衣，就出事了。',
 '修著修著，頭髮就白了。',
];
export const pickTitleSlogan=()=>TITLE_SLOGANS[Math.floor(Math.random()*TITLE_SLOGANS.length)];
