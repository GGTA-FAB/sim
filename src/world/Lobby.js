import * as T from 'three';
import {Builder} from './Builder.js';
import {Player} from '../player/Player.js';
import {paintLogo} from '../branding/xsmc.js';
import {LOBBY,LOBBY_CLOCKS,CAMPUS_ROAD} from '../data/lobby.js';
const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.65,...extra});
function box(parent,x,y,z,w,h,d,mat){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m;}
function ring(parent,x,z,inner,outer,y,color){const m=new T.Mesh(new T.RingGeometry(inner,outer,96),material(color));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);parent.add(m);return m;}
export function logoPanel(parent,x,y,z,w,h,rotation=0){const c=document.createElement('canvas');c.width=1200;c.height=300;const ctx=c.getContext('2d');ctx.fillStyle='#faf6e9';ctx.fillRect(0,0,c.width,c.height);paintLogo(ctx,c.width,c.height);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex}));m.position.set(x,y,z);m.rotation.y=rotation;parent.add(m);return m;}
export class Lobby {
 constructor(scene,collision,interactions){
  this.collision=collision;this.group=new T.Group();scene.add(this.group);const b=new Builder(this.group,collision);this.time=0;this.cardRemaining=0;this.cardOpen=0;this.doorRemaining=0;this.doorOpen=0;this.lastMinute=-1;
  // Warm stone, teal inlays, timber ceiling and a wall of garden-facing glazing.
  b.box(0,-.12,14,30,.24,28,0xf0dfbb);for(let z=2;z<28;z+=2)for(let x=-14;x<15;x+=2)b.box(x,.015,z,1.96,.018,1.96,(x+z)%4===0?0xf5ead2:0xe5dbc4);
  b.box(0,.029,14,4,.015,25,0x198e99);for(const x of [-2.1,2.1])b.box(x,.04,14,.07,.02,25,0xe4ac55);
  b.box(-14.8,2.65,14,.2,5.3,28,0x095b67);
  for(let z=2;z<28;z+=2)b.box(0,5.32,z,29,.12,.13,0xac7744);
  // Reception is perpendicular to the entrance, leaving the centre aisle clear.
  b.box(-11.2,.6,14,3,1.2,13,0x087e89,true);b.box(-11.1,1.25,14,3.5,.14,13.5,0xf7e8c9,true);b.box(-9.65,.22,14,.05,.15,13,0xe6ad56);
  for(let z=8;z<=20;z+=.5)b.box(-9.66,.7,z,.06,.75,.045,0x55b3ad);
  b.box(-12,1.57,12,.16,.6,1.1,0x163c52);b.box(-11.87,1.57,12,.02,.46,.91,0x58c9c0);b.box(-11.4,1.35,12,.5,.05,.85,0x204c61);
  b.sign('WELCOME / 接待服務',-9.62,.77,14,5,.42,'#fff7db','#087e89',Math.PI/2);
  b.sign('林小姐 · RECEPTION',-9.6,1.45,11,2.2,.3,'#214b56','#f8e9c5',Math.PI/2);
  logoPanel(this.group,-14.65,4.45,14,10,2.5,Math.PI/2);
  this.clockHands=[];for(const [i,c]of LOBBY_CLOCKS.entries())this.makeClock(b,c,8.7+i*3.5);
  this.receptionist=new Player(this.group,{variant:3,shirt:0x168d99});this.receptionist.position.set(-13.5,0,15.5);this.receptionist.group.rotation.y=Math.PI/2;
  const bun=new T.Mesh(new T.SphereGeometry(.16,12,8),material(0x352838));bun.position.set(0,.09,-.3);this.receptionist.head.add(bun);
  const scarf=new T.Mesh(new T.TorusGeometry(.14,.035,6,18),material(0xf1785d));scarf.rotation.x=Math.PI/2;scarf.position.y=1.5;this.receptionist.rig.add(scarf);
  collision.add(-13.5,15.5,.7,.7,1.9,.95,'receptionist');
  interactions.push({id:'reception',kind:'lobby-reception',x:-8.1,y:0,z:14,title:'林小姐 · 接待櫃檯',action:'打聲招呼'});
  // Lounge seats and planted islands stay outside the direct exit route.
  for(const z of [6,23]){b.box(10,.38,z,5.5,.7,1.6,0xd8674b,true);b.box(10,.93,z+.7,5.5,.75,.24,0xd8674b);b.cylinder(10,.48,z-2,.9,.12,0xe8b65a);b.cylinder(10,.23,z-2,.14,.46,0x154f60);}
  for(const [x,z]of [[6,3],[12,26],[-6,24]])this.plant(b,x,z);
  for(const x of [-12,-8,-4,4,8,12]){b.box(14.9,2.65,14-x,.16,5.3,.11,0x164a5a);}
  // Glass uses a transparent material; colliders prevent walking through windows.
  for(const side of [-1,1]){box(this.group,15,2.65,14-side*9,.08,5.3,12,material(0x7dbac2,{transparent:true,opacity:.12,depthWrite:false}));collision.add(15,14-side*9,.18,12,5.3,2.65,'lobby-window');}
  // Remove placeholder coloured pane geometry: only mullions and clear glass face the garden.
  b.box(15,5.25,14,.22,.15,28,0x164a5a);b.sign('GARDEN COURT · 水池花園',14.75,4.35,14,5.6,.42,'#fff6d7','#0b717d',-Math.PI/2);
  this.makeCardGate(b,interactions);this.makeExit(interactions);
  this.makeCampus();b.finish();
 }
 plant(b,x,z){b.cylinder(x,.38,z,.55,.76,0xf1dbb6);b.cylinder(x,1.05,z,.08,1.4,0x795339);for(const [dx,dy,dz]of [[0,1.65,0],[.3,1.35,.1],[-.25,1.45,-.12]]){const leaf=new T.Mesh(new T.IcosahedronGeometry(.6,1),material(0x288c59));leaf.position.set(x+dx,dy,z+dz);leaf.scale.set(.7,1,.8);this.group.add(leaf);}this.collision.add(x,z,1,1,1.7,.85,'planter');}
 makeClock(b,c,z){const g=new T.Group();g.position.set(-14.48,2.9,z);g.rotation.y=Math.PI/2;this.group.add(g);const face=new T.Mesh(new T.CircleGeometry(.57,40),new T.MeshBasicMaterial({color:0xfff8e5}));g.add(face);const bezel=new T.Mesh(new T.RingGeometry(.57,.62,40),material(0xeab65a));g.add(bezel);for(let i=0;i<12;i++){const a=i*Math.PI/6,m=box(g,Math.sin(a)*.47,Math.cos(a)*.47,.012,.028,.09,.014,material(0x143f55));m.rotation.z=-a;}
 const hour=new T.Group(),minute=new T.Group();g.add(hour,minute);box(hour,0,.14,.028,.055,.28,.018,material(0x16475a));box(minute,0,.2,.045,.026,.4,.018,material(0xd77842));this.clockHands.push({hour,minute,offset:c.offset});b.sign(c.name,-14.46,2.07,z,2.5,.3,'#fff4d5','#095b67',Math.PI/2);b.sign(c.zone,-14.46,1.74,z,2.2,.23,'#b3dfd8','#095b67',Math.PI/2);}
 makeCardGate(b,interactions){const z=LOBBY.gateZ;for(const side of [-1,1]){b.box(side*1.65,.65,z,.7,1.3,2.6,0xdee3de,true);b.box(side*1.65,1.33,z,.78,.09,2.65,0x173f52);b.box(side*3,.65,z,2,1.3,.15,0x36a6ad,true);b.box(side*1.65,1.4,z-1,.36,.08,.45,0x20c5ad);}
 this.cardWings=[];for(const side of [-1,1]){const pivot=new T.Group();pivot.position.set(side*1.32,.65,z);this.group.add(pivot);const blade=box(pivot,-side*.66,.32,0,1.32,.8,.07,material(0xf39d58,{transparent:true,opacity:.85}));this.cardWings.push({pivot,side});}
 this.cardCollider=this.collision.add(0,z,2.65,.18,1.5,.75,'lobby-card');
 for(const side of [-1,1])interactions.push({id:`lobby-card-${side}`,kind:'lobby-card',x:0,y:0,z:z+side*2,title:'員工剪刀門',action:'刷卡通行',available:()=>this.cardRemaining<=0});
 b.sign('刷卡進入 LOBBY',0,2.55,z-.22,3.7,.4,'#f7f1d6','#086a79',Math.PI);b.sign('EMPLOYEE ACCESS',0,2.55,z+.22,3.7,.4,'#f7f1d6','#086a79');}
 makeExit(interactions){this.facade=new T.Group();this.facade.position.set(-13,0,14);this.facade.rotation.y=Math.PI/2;this.group.add(this.facade);this.exitPanels=[];for(const side of [-1,1]){const group=new T.Group();group.position.set(side*1.48,2.3,28);this.facade.add(group);box(group,0,0,0,2.92,4.5,.07,material(0x70c5d1,{transparent:true,opacity:.18,depthWrite:false}));for(const x of [-1.44,1.44])box(group,x,0,0,.07,4.5,.12,material(0x194c5b));box(group,0,0,-.12,1.9,.07,.08,material(0xd6a754));this.exitPanels.push({group,side});}
 this.exitCollider=this.collision.add(15,14,.2,6,4.5,2.25,'lobby-exit');for(const side of [-1,1])interactions.push({id:`lobby-exit-${side}`,kind:'lobby-exit',x:15+side*1.5,y:0,z:14,title:'大廳花園門',action:side<0?'推門到戶外':'返回大廳',available:()=>this.doorRemaining<=0});}
 makeCampus(){
  const campus=new T.Group();campus.position.set(-14,0,14);campus.rotation.y=Math.PI/2;this.group.add(campus);this.campus=campus;
  const collision={add:(x,z,w,d,h,y,tag)=>this.collision.add(z-14,14-x,d,w,h,y,tag)},b=new Builder(campus,collision);

  b.box(0,-.22,67,100,.3,78,0x51a15e);b.box(0,-.045,34,6,.1,12,0xe3d5b8);b.cylinder(0,-.02,54,11,.08,0xe4d5b3,96);ring(campus,0,54,11.5,18,.02,0x45545f);ring(campus,0,54,14.6,14.72,.027,0xf5d486);ring(campus,0,54,17.7,17.83,.028,0xc6d3c5);ring(campus,0,54,10.85,11.5,.06,0xe7ddc5);
  // Curb encloses the walkable island; only the marked crossing has an opening.
  for(let i=0;i<64;i++){const a=i/64*Math.PI*2,x=Math.sin(a)*11.3,z=54+Math.cos(a)*11.3;if(z<54&&Math.abs(x)<2.6)continue;collision.add(x,z,1.12,1.12,.42,.21,'garden-curb');}
  for(let z=36.7;z<43;z+=.8)b.box(0,.055,z,4,.025,.42,0xf7f0dd);
  b.cylinder(0,.28,54,6.3,.55,0xf3ddae,80);b.cylinder(0,.58,54,5.95,.08,0x13aeca,80);ring(campus,0,54,5.95,6.3,.62,0xf3ddae);this.water=ring(campus,0,54,.1,5.9,.634,0x42d3df);b.cylinder(0,.8,54,1.4,.55,0x176c89,32);b.cylinder(0,1.3,54,.7,.5,0xdcb57b,24);
  collision.add(0,54,10.6,8.2,1,.5,'pool');collision.add(0,54,8.2,11.1,1,.5,'pool');
  this.jets=[];const waterMat=material(0xb1eff7,{transparent:true,opacity:.76});for(let i=0;i<8;i++){const a=i*Math.PI/4,curve=new T.QuadraticBezierCurve3(new T.Vector3(Math.sin(a)*.8,1.48,54+Math.cos(a)*.8),new T.Vector3(Math.sin(a)*2,3,54+Math.cos(a)*2),new T.Vector3(Math.sin(a)*3.6,.65,54+Math.cos(a)*3.6)),jet=new T.Mesh(new T.TubeGeometry(curve,16,.045,5,false),waterMat);campus.add(jet);this.jets.push(jet);}

  for(const [x,z]of [[-8,49],[8,49],[-8,60],[8,60]]){b.box(x,.5,z,2.8,.15,.8,0xc98846,true);b.box(x,.28,z,.2,.55,.6,0x244c52);}
  for(const [x,z]of [[-22,35],[22,35],[-22,55],[22,55],[-16,73],[16,73]]){b.cylinder(x,1.7,z,.22,3.4,0x80613d);const crown=new T.Mesh(new T.IcosahedronGeometry(2.2,1),material(0x26824e));crown.position.set(x,4.1,z);campus.add(crown);b.box(x,.05,z,5,.12,5,0x277b50);}
  // A public road and skyline beyond the fenced campus are scenery only.
  const road=new T.Group();road.name='campus-public-road';road.position.z=CAMPUS_ROAD.z;campus.add(road);this.publicRoad=road;
  const rb=new Builder(road,collision),half=CAMPUS_ROAD.length/2;
  rb.box(0,.03,0,CAMPUS_ROAD.length,.08,CAMPUS_ROAD.width,0x475861);
  for(let x=-half+2;x<half;x+=5)rb.box(x,.08,0,2.5,.03,.12,0xffe6a4);
  for(const side of [-1,1])rb.box(0,.03,side*(CAMPUS_ROAD.width+CAMPUS_ROAD.shoulder)/2,CAMPUS_ROAD.length,.08,CAMPUS_ROAD.shoulder,0xd3d9c9);
  rb.finish();
  for(let z=28;z<79;z+=3){b.box(23,.8,z,.08,1.6,.08,0x1b5b63);b.box(-23,.8,z,.08,1.6,.08,0x1b5b63);}for(const x of [-23,23])for(const y of [.55,1.3])b.box(x,y,53,.06,.06,50,0x1b5b63);
  for(const [x,z,h]of [[43,36,11],[48,58,16],[-36,45,9],[-40,68,13]]){b.box(x,h/2,z,12,h,14,0xd4e0d9);for(let y=2;y<h;y+=2.7){for(const side of [-1,1]){b.box(x+side*6.05,y,z,.06,1.2,12,0x318eaa);b.box(x,y,z+side*7.05,10,1.2,.06,0x318eaa);}}}
  this.cars=[];for(const [i,color]of [0xe5714d,0x277ea2,0xe7dcae].entries()){const car=new T.Group();campus.add(car);box(car,0,.55,0,1.65,.65,3.5,material(color));box(car,0,1.02,-.15,1.45,.6,1.9,material(0x244c61));box(car,0,1.35,-.15,1.5,.07,1.9,material(color));for(const x of [-.8,.8])for(const z of [-1.05,1.05]){const wheel=new T.Mesh(new T.CylinderGeometry(.32,.32,.17,12),material(0x203744));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.33,z);car.add(wheel);}for(const x of [-.5,.5])box(car,x,.64,1.78,.35,.15,.04,material(0xffebac));this.cars.push({car,phase:i*2.5,road:i===2});}
  this.updateTraffic(0,null);
  b.sign('XSMC GARDEN · 園區道路請勿進入',0,1.3,43.7,4,.4,'#fff7df','#117e88',Math.PI);  b.finish();
 }
 interact(item,g){if(item.kind==='lobby-card'){this.cardRemaining=5;g.hud.message('刷卡成功 · 剪刀門開啟，請通行。');return true;}
  if(item.kind==='lobby-exit'){this.doorRemaining=6;g.hud.message(g.player.position.x<15?'花園開放，隨時可以到水池旁散步。請留在園區步道內。':'歡迎回來。');return true;}
  if(item.kind==='lobby-reception'){g.hud.message(g.clock.seconds<LOBBY.endOfWork?'林小姐：水池隨時都能去。可以休息一下，但手機還是會響喔。':'林小姐：辛苦了！水池那邊可以散步，馬路就別替機台出去跑了。');return true;}return false;}
 restore(position){
  if(Math.abs(position.y)>.5)return;
  if(Math.abs(position.x)<2.2&&Math.abs(position.z-LOBBY.gateZ)<1.5){this.cardRemaining=5;this.cardOpen=1;this.cardCollider.enabled=false;}
  if(Math.abs(position.z-14)<3.5&&Math.abs(position.x-15)<1.5){this.doorRemaining=6;this.doorOpen=1;this.exitCollider.enabled=false;}
 }
 update(dt,g){const p=g.player.position;this.group.visible=Math.abs(p.y)<3&&p.z<95;if(!this.group.visible)return;this.time+=dt;
  const nearGate=Math.abs(p.x)<2.2&&Math.abs(p.z-LOBBY.gateZ)<2;if(this.cardRemaining>0){this.cardRemaining=Math.max(0,this.cardRemaining-dt);if(nearGate)this.cardRemaining=Math.max(1,this.cardRemaining);}
  this.cardOpen=T.MathUtils.damp(this.cardOpen,this.cardRemaining>0?1:0,9,dt);this.cardCollider.enabled=this.cardOpen<.93;for(const {pivot,side}of this.cardWings)pivot.rotation.z=side*this.cardOpen*1.5;
  if(this.doorRemaining>0){this.doorRemaining=Math.max(0,this.doorRemaining-dt);if(Math.abs(p.z-14)<3.5&&Math.abs(p.x-15)<2)this.doorRemaining=Math.max(1,this.doorRemaining);}
  this.doorOpen=T.MathUtils.damp(this.doorOpen,this.doorRemaining>0?1:0,8,dt);this.exitCollider.enabled=this.doorOpen<.94;for(const {group,side}of this.exitPanels)group.position.x=side*(1.48+this.doorOpen*2.85);
  const minute=Math.floor(g.clock.seconds/60);if(minute!==this.lastMinute){this.lastMinute=minute;for(const c of this.clockHands){c.minute.rotation.z=-(minute%60)/60*Math.PI*2;c.hour.rotation.z=-((minute/60+c.offset)%12)/12*Math.PI*2;}}
  this.receptionist.animate(dt,0,Math.PI/2);this.receptionist.head.rotation.y=Math.sin(this.time*.45)*.09;this.receptionist.arms[1].rotation.x=-.3;this.receptionist.elbows[1].rotation.x=-.8;this.receptionist.syncSkeleton();
  for(const [i,jet]of this.jets.entries())jet.scale.y=1+Math.sin(this.time*2+i)*.1;
  this.updateTraffic(dt,p);
 }
 updateTraffic(dt,p){
  const half=CAMPUS_ROAD.length/2-CAMPUS_ROAD.inset;
  for(const v of this.cars){if(v.road){v.car.position.set(-half+(this.time*CAMPUS_ROAD.speed+v.phase*10)%(half*2),0,CAMPUS_ROAD.z-CAMPUS_ROAD.laneOffset);v.car.rotation.y=Math.PI/2;}else{const a=v.phase+this.time*.1;const crossing=p&&Math.abs(p.z-14)<3&&p.x>21&&p.x<30;if(crossing&&Math.cos(a)<-.8){v.phase-=dt*.1;continue;}v.car.position.set(Math.sin(a)*15.4,0,54+Math.cos(a)*15.4);v.car.rotation.y=a+Math.PI/2;}}
 }
}
