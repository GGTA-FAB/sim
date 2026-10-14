import {LIFE_LOCATIONS} from '../data/life.js';
import {ASSISTANT_DESKS,assistantContacts} from '../data/pm.js';
export function buildOffice(b,interactions){
 for(const side of [-1,1]){
  b.box(side*10,.018,10,13,.025,18,side<0?0x72c9b0:0x79bfe2);if(side<0)b.box(-17.7,1.05,14,.08,.45,26,0x35a79d);else for(const [z,d]of [[9,18],[27,2]])b.box(17.7,1.05,z,.08,.45,d,0x3b86bb);
  const label=side<0?'製程工程部':'EQUIPMENT ENGINEERING';
  b.sign(label,side*10,3.55,.35,13,.75,'#34585a','#eeeadd');
  b.box(side*3,1.04,10,.14,2.08,17,0x4ba5b3,true);
  b.sign(side<0?'P · 製程 BAY':'E · EQUIPMENT BAY',side*10,2.3,18,10,.55,'#ffffff',side<0?'#2a9993':'#337bb9',Math.PI);
  for(const z of [7,15])for(const dx of [7,13]){const x=side*dx;
   b.box(x,.77,z,3.6,.15,1.55,0xe4bd83,true);for(const leg of [-1.4,1.4])b.box(x+leg,.36,z,.13,.72,1.25,0x6d7a79);
   b.box(x,1.3,z+.3,1,.65,.09,0x354c51);b.box(x,1.3,z+.245,.87,.5,.02,0x8faeb1);b.box(x,.87,z-.3,.85,.04,.3,0x4c6064);
   b.box(x,.5,z-1.4,.85,1,.7,0xec9455,true);b.box(x,.92,z-1.68,.85,.75,.15,0xec9455);
   b.box(x,1.05,z+1.1,4.8,2.1,.12,0x73b995,true);
  }
 }

 // All four AE seats use desks inside Equipment Bay; the entrance aisle stays clear.
 for(const [i,desk] of ASSISTANT_DESKS.entries())b.sign(`${assistantContacts(ASSISTANT_DESKS.length)[i].name} · AE`,desk.seat.x,1.9,desk.labelZ,1.8,.3,'#476b5a','#eee9d8',Math.PI);
 b.sign('MEETING ROOM ↑',14,2.8,26.8,5,.5,'#264c50','#f2f5ef',Math.PI);
 // The rear-left area is reserved for the independent deputy office.
 interactions.push({...LIFE_LOCATIONS.desk,title:'我的座位 · Equipment Bay',action:'查看座位',description:'Equipment Engineer 的固定座位。左側是 製程 Bay，右側是 Equipment Bay。\n右側走道直通 3F 更衣區與生產區；後側電梯與樓梯通往餐飲街。'});
}
