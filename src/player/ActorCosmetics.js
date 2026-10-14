import {group,block,round,ball,chicken,material} from '../world/DecorPrimitives.js';
export class ActorCosmetics {
 constructor(actor){this.actor=actor;this.flags={};this.time=0;this.wasPhone=false;this.grab=0;this.big=false;
 this.leg=chicken(actor.food,.1,.16,.04,1.15);this.leg.visible=false;this.garnish=group(actor.food);for(const x of [-.12,0,.12])ball(this.garnish,0x71a152,x,.16,-.1,.028,.016,.028);this.garnish.visible=false;
 this.coat=group(actor.rig,0,1.18,.35);block(this.coat,0x6a819c,0,0,0,.45,.13,.34);block(this.coat,0xc0ced7,0,.07,0,.28,.015,.16);this.coat.visible=false;
 this.strap=group(actor.rig);block(this.strap,0x234a65,-.12,1.4,.17,.027,.24,.02);block(this.strap,0x344b57,-.12,1.36,.185,.09,.03,.025);this.strap.visible=false;
 this.pocket=group(actor.rig,.17,1.23,.22);block(this.pocket,0xc4d2ce,0,0,0,.19,.17,.035);for(const x of [-.065,.025])block(this.pocket,0x7e9ba0,x,0,.026,.015,.14,.012);this.pocket.visible=false;
 this.phone=group(actor.elbows[1],0,-.3,.09);block(this.phone,0x1f333c,0,0,0,.12,.22,.04);block(this.phone,0x599cc4,0,.035,.025,.09,.11,.008);this.phone.visible=false;
 this.coffee=round(actor.cup,0x74472d,0,.077,0,.052,.005);this.latte=group(actor.cup,0,.081,0);for(const x of [-.016,.016])ball(this.latte,0xead8bb,x,0,0,.018,.003,.029);this.latte.visible=false;
 }
 apply(research){for(const id of ['main-course','big-chicken','food-flavor','coffee-flavor','nap-pose','badge','gown-pocket'])this.flags[id]=research.complete('fun-'+id);const a=this.actor;a.mainCourse.scale.set(this.flags['main-course']?.26:.18,.07,this.flags['main-course']?.19:.13);a.rice.position.x=this.flags['main-course']?-.18:-.13;this.garnish.visible=this.flags['food-flavor'];this.latte.visible=this.flags['coffee-flavor'];this.coffee.material=material(this.flags['coffee-flavor']?0x74472d:0x383d35);this.strap.visible=this.flags.badge;}
 update(dt,{phone=false,big=false}={}){const a=this.actor;this.time+=dt;this.leg.visible=big&&this.flags['big-chicken'];a.mainCourse.visible=!this.leg.visible;this.coat.visible=a.lifePose==='nap'&&this.flags['nap-pose'];if(this.coat.visible){a.rig.rotation.x=.24;a.arms[0].rotation.x=a.arms[1].rotation.x=-.7;a.elbows[0].rotation.x=a.elbows[1].rotation.x=-1.5;}this.pocket.visible=a.gowned&&this.flags['gown-pocket'];a.badge.rotation.y=this.flags.badge?0:Math.sin(a.phase*.5)*2.5*a.motion;
 if(phone&&!this.wasPhone)this.grab=0;this.wasPhone=phone;this.grab+=dt;this.phone.visible=phone;if(phone&&!a.lifePose){if(!this.flags['gown-pocket']&&this.grab<.55){a.arms[0].rotation.x=-.45;a.elbows[0].rotation.x=-1.6;this.phone.visible=false;}else{a.arms[1].rotation.x=-1.35;a.elbows[1].rotation.x=-1.3;}}a.syncSkeleton();}
}
