// Fictional workplace puns; cosmetic randomness must not advance the simulation seed.
export const CHARACTER_NAMES=Object.freeze([
 '郝想下班','林時加班','吳限加班','何時下班','曾經準時',
 '蔡鳥工程師','鄭在修機','莫名奇修','修到天亮','江湖救機',
 '陳默接單','龔單滿天飛','張力很大','吳料可修','羅絲鬆了',
 '范還沒吃','柯以放飯嗎','蘇醒靠咖啡','石在想睡','賴床未遂',
 '賈裝很忙','游手好閒','艾修不修','丁一下就好','許願不當機',
 '葉班仁','沈夜值班','戴班學長','杜絕漏氣','高壓警報',
]);
export function pickCharacterName(current,random=Math.random){
 const choices=CHARACTER_NAMES.filter(name=>name!==current);
 return choices[Math.floor(random()*choices.length)];
}
