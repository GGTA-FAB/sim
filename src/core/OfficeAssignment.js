import {PLAYER_DESK} from '../data/playerDesk.js';
import {DEPUTY_DESK} from '../data/deputyOffice.js';
import {LIFE_LOCATIONS} from '../data/life.js';
import {DESTINATIONS} from '../data/layout.js';

export function configureOfficeDesk(rank){
 const executive=rank===3,station=executive?DEPUTY_DESK:PLAYER_DESK,desk=LIFE_LOCATIONS.desk;
 Object.assign(desk,{x:station.seat.x,y:station.y,z:station.seat.z,seat:{...station.seat},title:executive?'我的座位 · 副理獨立 Bay':'我的座位 · Equipment Bay',action:'使用電腦 / 休息 / 用餐'});
 Object.assign(DESTINATIONS.find(d=>d.id==='desk'),{x:desk.x,y:desk.y,z:desk.z,name:executive?'3F · 我的副理辦公區':'3F · 我的座位'});
 return station;
}

export class OfficeAssignment {
 constructor(g){this.g=g;g.traffic.add(g.world.deputyOffice.boss,undefined,{enabled:()=>g.progression.rank!==3});}
 sync(){
  const active=this.g.life.active,oldPosition=active?.item?.id==='desk'?{x:active.item.x,z:active.item.z}:null;
  const g=this.g,station=configureOfficeDesk(g.progression.rank),desk=g.world.interactions.find(i=>i.id==='desk');
  Object.assign(desk,LIFE_LOCATIONS.desk);g.world.deputyOffice.setOwner(g.progression.rank===3,g.profile.name);
  g.lifestyle.scene.deskDecor.position.set(station.x,0,station.z);
  const destination=DESTINATIONS.find(d=>d.id==='desk'),option=document.querySelector('#destination option[value="desk"]');if(option)option.textContent=destination.name;
  for(const t of g.officeWork.pending())if(g.officeWork.step(t).place==='pc')g.officeWork.locate(t);
  for(const t of g.tasks.tasks.values())if(t.kind==='report')Object.assign(t,{x:desk.x,y:desk.y,z:desk.z});
  for(const key of ['target','mealReturnTarget']){const nav=g.navigation[key];if(!nav)continue;if(nav.id==='desk')g.navigation[key]={...destination};else{const task=g.tasks.tasks.get(nav.sourceTaskId??nav.id);if(task?.status==='AT_PC'||task?.kind==='report')Object.assign(nav,{x:desk.x,y:desk.y,z:desk.z});}}
  const a=g.life.active;
  if(a?.item?.id==='desk'){
   const moved=oldPosition&&Math.hypot(oldPosition.x-desk.x,oldPosition.z-desk.z)>.01;
   a.item=desk;
   if(moved){g.player.position.set(desk.seat.x,desk.seat.y,desk.seat.z);g.player.group.rotation.y=desk.seat.heading;g.lifeUI.standing={x:desk.x,y:desk.y,z:desk.z,heading:desk.seat.heading};}
  }
  if(g.lifeUI.item?.id==='desk')g.lifeUI.item=desk;
  // Old saves may place a standing player where the new partitions/furniture are.
  const p=g.player.position;
  if(!a&&p.y===6&&p.x< -6&&p.z>18&&p.z<28&&!g.world.collision.isWalkable(p.x,p.z,.42,false,6))p.set(-5,6,22.2);
  g.navigation.last.x=Infinity;g.navigation.timer=0;g.traffic.refresh();
 }
}
