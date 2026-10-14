import {Builder} from './Builder.js';
export function installPosters(scene,collision){
 const b=new Builder(scene,collision,6);
 for(const [z,title,body] of [[5,'交班寫清楚','下一班也可能是明天的你'],[21,'工作提醒','修好了，記得通知製程']]){b.box(-17.72,2.3,z,.08,1.8,4.2,0x416961);b.sign(title,-17.65,2.8,z,3.7,.52,'#fff3ca','#416961',Math.PI/2);b.sign(body,-17.64,2.12,z,3.7,.43,'#34584e','#eee6c9',Math.PI/2);}
 b.offsetY=0;
 for(const [z,title,body] of [[34,'安全第一','快下班不等於可以跳步驟'],[63,'無塵室須知','頭髮請留在帽子裡，靈感可以帶進去']]){b.offsetY=6;const x=z===34?25.78:7.77;b.box(x,2.5,z,.08,1.9,4,0x8c805d);b.sign(title,x-.08,3.05,z,3.7,.55,'#fff4cc','#6b7560',-Math.PI/2);b.sign(body,x-.09,2.3,z,3.7,.45,'#425a50','#eee6c9',-Math.PI/2);}
 b.offsetY=6;for(const z of [164,260,356]){b.sign('機台不會讀心，交班請留紀錄',-38,2.5,z-.14,10,.8,'#3e665f','#ede4c8',Math.PI);b.box(-50,2.2,z-.12,1.3,2.5,.12,0x487368);b.sign('安全 / 5S',-50,2.3,z-.2,1.15,.55,'#fff6de','#487368',Math.PI);}
 b.offsetY=-6;b.sign('午餐不是異常，請記得處理',-31.7,2.8,12,7,.9,'#654f35','#eee0bd',Math.PI/2);b.sign('先吃飯，再跟機台講道理',31.7,2.8,12,7,.9,'#654f35','#eee0bd',-Math.PI/2);b.finish();
}
