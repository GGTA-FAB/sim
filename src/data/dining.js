export const DINING_SEATS=[];
for(const x of [-23,-13,13,23])for(const z of [21,12])for(const dx of [-1.25,1.25])for(const dz of [-1.55,1.55]){
 const index=DINING_SEATS.length,legacy=x===-13&&z===21&&dx===1.25&&dz===1.55;
 DINING_SEATS.push({id:legacy?'dining':`dining-seat-${index}`,kind:'dining',x:legacy?-9.5:x+dx,y:-6,z:legacy?22.5:z+Math.sign(dz)*2.65,title:`餐廳座位 ${index+1}`,action:'坐下 / 用餐',seat:{x:x+dx,y:-6,z:z+dz,heading:dz>0?Math.PI:0}});
}
export const TRAY_RETURN={id:'tray-return',kind:'tray-return',x:-27.3,y:-6,z:3,title:'餐盤回收區',name:'1F · 餐盤回收區',action:'回收餐盤 / 剩食'};
export const DINERS=[
 {name:'阿信',role:'設備',seat:0,shop:'curry',color:0x687f89},
 {name:'佩珊',role:'製程',seat:6,shop:'curry',color:0x879277},
 {name:'文雄',role:'製造部',seat:12,shop:'curry',color:0x8d7d6e},
 {name:'小施',role:'設備',seat:18,shop:'curry',color:0x64857f},
 {name:'雅雯',role:'製程',seat:24,shop:'curry',color:0x7b7d91},
 {name:'老洪',role:'廠務',seat:30,shop:'curry',color:0x788781},
];
