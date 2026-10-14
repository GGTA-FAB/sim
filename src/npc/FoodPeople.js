import {FoodStaff} from './FoodStaff.js';
import {Player} from '../player/Player.js';
import {createRandom} from '../core/Random.js';
import {DINERS,DINING_SEATS,TRAY_RETURN} from '../data/dining.js';

// A small fixed crowd follows counter -> chair -> tray return. Only destinations run A*.
export class FoodPeople {
 constructor(g){this.g=g;this.staff=new FoodStaff(g);this.random=createRandom(g.seed^0xf00d);this.timer=0;this.entities=DINERS.map((def,i)=>{
  const actor=new Player(g.scene,{variant:i+2,shirt:def.color}),seat=DINING_SEATS[def.seat],shops=g.world.interactions.filter(s=>s.kind==='shop'&&s.shop.id!=='mart'),shop=shops[i%shops.length];
  const n={id:`diner-${i}`,name:def.name,role:def.role,actor,position:actor.position,seat,shop,shopApproach:{x:shop.x+(i>=shops.length?.8:-.8),y:-6,z:shop.z-1.5},state:i<3?'EAT':'ORDER',wait:i<3?18+i*7:1+i,route:[],index:0,heading:seat.seat.heading,chatting:false,speed:0};
  actor.position.set(i<3?seat.seat.x:n.shopApproach.x,-6,i<3?seat.seat.z:shop.z-1.5);actor.group.rotation.y=n.heading;actor.setCarry(i<3?'tray':null);actor.setLifePose(i<3?'eat':null);g.world.collision.traffic?.add(n);return n;
 });
 for(const item of g.world.interactions.filter(i=>i.kind==='dining'))item.available=()=>!this.entities.some(n=>n.seat.id===item.id&&['EAT','TO_SEAT'].includes(n.state));
 }
 go(n,target,state){const route=this.g.navigation.finders.get(-6).find(n.position,target);if(!route.length){n.wait=2;return false;}n.route=route;n.index=0;n.state=state;n.actor.setLifePose(null);return true;}
 update(dt){this.staff.update(dt);const g=this.g,p=g.player.position,near=Math.abs(p.y+6)<2.5&&p.z<50;for(const n of this.entities)n.actor.group.visible=near&&n.position.distanceTo(p)<60;this.timer+=dt;if(this.timer<(near?.05:.5))return;const step=this.timer;this.timer=0;
  for(const n of this.entities){n.speed=0;if(!n.chatting){
   if(['TO_SEAT','TO_RETURN','TO_SHOP'].includes(n.state)){
    let travel=step*1.35,moved=0;while(travel>0&&n.index<n.route.length){const t=n.route[n.index],dx=t.x-n.position.x,dz=t.z-n.position.z,d=Math.hypot(dx,dz);if(d<.03){n.index++;continue;}const advance=Math.min(d,travel),x=n.position.x,z=n.position.z;n.heading=Math.atan2(dx,dz);if(g.world.collision.traffic)g.world.collision.traffic.move(n,n.position,dx/d*advance,dz/d*advance,{target:t});else g.world.collision.move(n.position,dx/d*advance,dz/d*advance);moved+=Math.hypot(n.position.x-x,n.position.z-z);travel-=advance;if(Math.hypot(n.position.x-x,n.position.z-z)<.0001)break;if(Math.hypot(n.position.x-t.x,n.position.z-t.z)<.08)n.index++;}
    n.speed=moved/step;
    if(n.index>=n.route.length){
     if(n.state==='TO_SEAT'){if(g.life.active?.item.id===n.seat.id||g.world.collision.traffic&&!g.world.collision.traffic.free(n,n.seat.seat))continue;n.position.set(n.seat.seat.x,-6,n.seat.seat.z);n.heading=n.seat.seat.heading;n.actor.group.rotation.y=n.heading;n.actor.setLifePose('eat');n.state='EAT';n.wait=24+this.random()*24;}
     else {n.state=n.state==='TO_RETURN'?'RETURN':'ORDER';n.wait=2+this.random()*4;}
    }
   }else{n.wait-=step;if(n.wait<=0){
    if(n.state==='EAT'){if(this.entities.some(o=>o!==n&&['TO_RETURN','RETURN'].includes(o.state))||g.world.collision.traffic&&!g.world.collision.traffic.free(n,n.seat)){n.wait=.5;continue;}n.actor.setLifePose(null);n.actor.setCarry('empty-tray');n.position.set(n.seat.x,-6,n.seat.z);this.go(n,TRAY_RETURN,'TO_RETURN');}
    else if(n.state==='RETURN'){n.actor.setCarry(null);this.go(n,n.shopApproach,'TO_SHOP');}
    else if(n.state==='ORDER'){if(g.life.active?.item.id===n.seat.id){n.wait=2;continue;}n.actor.setCarry('tray');this.go(n,n.seat,'TO_SEAT');}
   }}
  }
  if(n.actor.group.visible)n.actor.animate(step,n.speed,n.heading);
 }
 }
}
