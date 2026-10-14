import {PLAYER_DESK} from './playerDesk.js';
import {MODULE_ROWS} from './modules.js';
// Metres. +Z leads from Office to FAB. Stable equipment identities survive layout migrations.
export const FAB_Y=6;
export const SUBFAB_Y=0;
export const FAB_END=128+MODULE_ROWS.length*48;
export const FAB_DEPTH=FAB_END-116;
export const FAB_CENTER=(FAB_END+116)/2;
export const CLEAN_ACCESS={y:6,entry:70,exit:76,gownZ:67.7,leaveZ:63};
export const FAB_LIFT={x:-12,z:88};
export const FAB_STAIR={minX:4,maxX:11,minZ:84,maxZ:92,rise:6,bases:[0],group:'fab'};
export const FAB_FLOORS=[{y:0,label:'FAB 2F · Sub FAB'},{y:6,label:'FAB 3F · Cleanroom'}];
export const FAB_CORE_ROOMS=[0,6].map(y=>({id:`fab-core-${y}`,name:`FAB ${y===6?'3F':'2F'} · 電梯 / 樓梯`,x:-1.5,z:88,w:30,d:24,y}));
export const CONNECTOR_ROOMS=[{id:'office-side',x:22,z:36,w:8,d:36,y:6},{id:'connector-turn',x:11,z:54,w:30,d:8,y:6},{id:'gown-link',x:0,z:59,w:10,d:2,y:6}];
export const ROOMS = [
 {id:'office',name:'3F · Engineering Office',y:6,x:0,z:14,w:36,d:28,color:0xe9ece1,near:8,far:6},
 {id:'lobby',name:'2F · 辦公棟大廳',y:0,x:0,z:14,w:30,d:28,color:0xd4dace,near:8,far:0},
 {id:'gowning',name:'3F · 共用更衣 / 風淋',y:6,x:0,z:68,w:16,d:16,color:0xc6d9d4,near:10,far:10},
 {id:'sub-entry',name:'2F · Sub FAB 入口',y:0,x:0,z:108,w:16,d:16,color:0xb9c3c8,near:10,far:10},
 {id:'subfab',name:'2F · Sub FAB',y:0,x:0,z:FAB_CENTER,w:144,d:FAB_DEPTH,height:5.6,color:0xaab7bb,near:10,far:0},
 {id:'clean-entry',name:'3F · 潔淨通道',y:6,x:0,z:108,w:16,d:16,color:0xc6d9d4,near:10,far:10},
 {id:'fab',name:'3F · FAB Main Spine',y:6,x:0,z:FAB_CENTER,w:144,d:FAB_DEPTH,height:7.2,color:0xd9e4e2,near:10,far:0},
];
const ORIGINAL_ETCH = [
  {id:'ETCH-01',x:-13,z:132}, {id:'ETCH-02',x:13,z:132},
  {id:'ETCH-03',x:-25,z:132}, {id:'ETCH-04',x:25,z:132},
  {id:'ETCH-05',x:-13,z:150}, {id:'ETCH-06',x:13,z:150},
];
const AREAS=MODULE_ROWS.map(area=>[area,area]);
const BASE_BAYS=AREAS.flatMap((areas,row)=>areas.map((area,column)=>({
  id:`${String.fromCharCode(65+row)}${column+1}`,area,row,side:column?1:-1,x:column?38:-38,z:143+row*48,w:60,d:42,stockX:column?65:-65,stockZ:141+row*48,
  color:area==='ETCH'?0x4d8073:area==='LITHO'?0x968764:0x607f8d,
})));
// Paired module rows retain every existing equipment ID; all Etch tools are at the front.
export const LAYOUT_VERSION=8;
const relocatedBay=id=>id;
export const BAYS=BASE_BAYS.map(b=>{const source=BASE_BAYS.find(s=>s.id===relocatedBay(b.id));return {...b,area:source.area,color:source.color};});
const counts={ETCH:6};
export const EQUIPMENT=BASE_BAYS.flatMap(bay=>[bay.z-11,bay.z+7].flatMap(z=>[13,25,37,49,61].map(offset=>{
  const x=bay.side*offset,original=bay.area==='ETCH'&&ORIGINAL_ETCH.find(e=>e.x===x&&e.z===z);
  const id=original?.id??`${bay.area}-${String(counts[bay.area]=(counts[bay.area]??0)+1).padStart(2,'0')}`;
  return{id,x,z,bayId:bay.id,area:bay.area,portX:x-.35,portZ:z-4.5};
}))).map(e=>{const source=BASE_BAYS.find(b=>b.id===e.bayId),target=BASE_BAYS.find(b=>b.id===relocatedBay(e.bayId)),dz=target.z-source.z;return {...e,y:FAB_Y,z:e.z+dz,portZ:e.portZ+dz,bayId:target.id};});
export const DESTINATIONS = [
  ...EQUIPMENT.filter(e=>/^ETCH-0[1-6]$/.test(e.id)).sort((a,b)=>a.id.localeCompare(b.id)).map(e=>({id:e.id,name:e.id,x:e.x,y:FAB_Y,z:e.z-6})),
  ...BAYS.map(b=>({id:`bay-${b.id}`,name:`${b.id} · ${b.area} Bay`,x:b.side*19,y:FAB_Y,z:b.z-17})),
  {id:'desk',name:'3F · 我的座位',x:PLAYER_DESK.seat.x,z:PLAYER_DESK.seat.z,y:PLAYER_DESK.y},
  {id:'lobby',name:'2F · XSMC 接待大廳（刷卡）',x:0,y:0,z:12},
  {id:'garden',name:'2F · 水池花園',x:31,y:0,z:14},
  {id:'restaurant',name:'1F · 餐飲商店街',x:0,z:7,y:-6},
  {id:'mart',name:'1F · DAY MART 超商',x:25,z:3.5,y:-6},
  {id:'elevator',name:'後側電梯 · 1F / 2F / 3F',x:-9,z:-21,y:6},
  {id:'stairs',name:'3F · 後側樓梯',x:8.4,z:-13,y:6},
  {id:'deputy-bay',name:'3F · 副理辦公區',x:-8,y:6,z:22.8},
  {id:'process-office',name:'3F · 製程 Office Bay',x:-7,z:19,y:6},
  {id:'handover',name:'3F · 交班會議室',x:0,z:31.5,y:6},
  {id:'coffee',name:'3F · 咖啡機',x:11,z:24,y:6},
  {id:'dining',name:'1F · 用餐座位',x:-9.5,z:22.5,y:-6},
  {id:'gowning',name:'3F · 共用更衣 / 風淋',x:0,y:6,z:67},
  {id:'subfab',name:'2F · Sub FAB',x:0,y:0,z:125},
  {id:'fab-elevator',name:'FAB 棟電梯 · 2F / 3F',...FAB_LIFT,y:0},
  ...BAYS.map(b=>({id:`sub-bay-${b.id}`,name:`2F · Sub ${b.id}`,x:b.side*19,y:0,z:b.z-17})),
];
export const LOWER_ROOMS=[{id:'foodhall',name:'1F · 餐飲商店街',x:0,z:14,w:64,d:52,y:-6}];
export const CORE_ROOMS=[-6,0,6].map(y=>({id:`core-${y}`,name:'垂直交通大廳',x:0,z:y===-6?-19:-13,w:24,d:y===-6?14:26,y}));
export const FLOORS=[{y:-6,label:'1F · 餐飲商店街'},{y:0,label:'2F · 辦公棟大廳'},{y:6,label:'3F · 工程辦公室'}];
export const LIFT={x:-9,z:-21};
export const STAIR={minX:3,maxX:10,minZ:-22,maxZ:-14,rise:6,bases:[-6,0],group:'office'};
export const SPAWN = {x:0,z:9,y:6};
