import {stairRemainder} from '../data/stairs.js';
import {rampAt,walkingRoute} from '../navigation/TravelRouter.js';
import {FAB_Y,CLEAN_ACCESS} from '../data/layout.js';
import * as THREE from 'three';
import {Player} from '../player/Player.js';
import {PM_BALANCE as B,ASSISTANT_DESKS} from '../data/pm.js';
// Small fixed roster; route planning happens on assignment or a throttled recovery. No per-frame A*.
export class AssistantEngineer extends Player {
 constructor(scene,contact,finders,collision,index){super(scene,{variant:index+1,shirt:[0x557e89,0x6d809b,0x718b6b,0x8f8173][index%4]});this.id=contact.id;this.onLeave=!!contact.onLeave;this.name=contact.name;this.finders=finders;this.collision=collision;this.home=ASSISTANT_DESKS[index%ASSISTANT_DESKS.length];this.seated=false;this.returningSeat=false;this.holdAfterJob=false;this.homeRetry=0;this.state='STANDBY';this.job=null;this.route=[];this.index=0;this.arrived=true;this.gownWait=0;this.viewTimer=0;this.routeWatch=null;
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const c=canvas.getContext('2d');c.fillStyle='#294e53';c.fillRect(0,0,256,64);c.fillStyle='#fff0b4';c.font='bold 23px sans-serif';c.textAlign='center';c.fillText(`${this.name} · AE`,128,40);const texture=new THREE.CanvasTexture(canvas);this.label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));this.label.scale.set(2.1,.52,1);this.label.position.y=2.3;this.group.add(this.label);this.sitAtDesk();this.group.visible=!this.onLeave;collision.traffic?.add(this);
 }
 sitAtDesk(){const s=this.home.seat;this.position.set(s.x,s.y,s.z);this.group.rotation.y=s.heading;this.setLifePose('work-pc');this.seated=true;this.returningSeat=false;this.arrived=true;this.route=[];this.index=0;this.state='STANDBY';}
 returnToSeat(){if(this.chatting)return false;if(this.seated)return true;const p=this.home.approach;if(Math.abs(this.position.y-p.y)<.1&&Math.hypot(this.position.x-p.x,this.position.z-p.z)<1.2){this.sitAtDesk();return true;}if(!this.go(p))return false;this.returningSeat=true;this.state='RETURN_OFFICE';return true;}
 stopForPlayer(){
  // Finish only the narrow crossing already occupied, then wait locally for a new job.
  const p=this.position,ramp=rampAt(p,this.collision),remaining=this.route.slice(this.index);let exit=[];
  if(Math.abs(p.y-CLEAN_ACCESS.y)<.5&&Math.abs(p.x)<5&&p.z>69&&p.z<77){const outward=remaining.find(t=>t.z<69||t.z>77);exit=[{x:0,y:CLEAN_ACCESS.y,z:(outward?.z??79)>73?79:67}];}
  else if(ramp){const floor=remaining.find(t=>t.y===ramp.floorBase||t.y===ramp.floorBase+6);exit=stairRemainder(ramp,p,(floor?.y??p.y)>=ramp.floorBase+3);}
  this.returningSeat=false;this.route=exit;this.index=0;this.arrived=!exit.length;this.gownWait=0;this.state='STANDBY_EQUIPMENT';this.setLifePose(this.seated?'work-pc':null);
 }
 restoreDesk(){if(this.seated&&!this.job)this.sitAtDesk();else{this.seated=false;this.setLifePose(null);}}
 go(target){if(this.onLeave||this.chatting)return false;const from=this.seated?this.home.approach:this.position,route=[];let start={x:from.x,y:from.y,z:from.z};const add=to=>{const path=walkingRoute(start,to,this.finders,this.collision);if(!path.length)return false;route.push(...path);start=to;return true;};
  // A loaded or reassigned actor inside the chamber must finish its crossing before routing elsewhere.
  if(start.y===CLEAN_ACCESS.y&&Math.abs(start.x)<5&&start.z>69.5&&start.z<76.5){const inbound=target.z>=76;route.push({x:0,y:CLEAN_ACCESS.y,z:inbound?73.2:73},{x:0,y:CLEAN_ACCESS.y,z:inbound?79:67});start={x:0,y:CLEAN_ACCESS.y,z:inbound?79:67};}
  if(start.z>76&&target.z<70){if(!add({x:0,y:CLEAN_ACCESS.y,z:79}))return false;route.push({x:0,y:CLEAN_ACCESS.y,z:73},{x:0,y:CLEAN_ACCESS.y,z:67});start={x:0,y:CLEAN_ACCESS.y,z:67};}
  if(start.z<70&&target.z>76){if(!add({x:0,y:CLEAN_ACCESS.y,z:67}))return false;route.at(-1).gown=true;route.push({x:0,y:CLEAN_ACCESS.y,z:73.2},{x:0,y:CLEAN_ACCESS.y,z:79});start={x:0,y:CLEAN_ACCESS.y,z:79};}
  if(!add(target))return false;if(this.seated&&this.collision.traffic&&!this.collision.traffic.free(this,from))return false;if(this.seated){this.position.set(from.x,from.y,from.z);this.setLifePose(null);this.seated=false;}this.returningSeat=false;this.route=route;this.index=0;this.arrived=false;this.gownWait=0;this.routeWatch=null;return true;
 }
 update(dt,player,air){if(this.onLeave){this.group.visible=false;return;}this.homeRetry-=dt;if(!this.chatting&&!this.job&&!this.seated&&this.state==='STANDBY'&&this.homeRetry<=0){this.returnToSeat();this.homeRetry=2;}let moving=0,heading=this.group.rotation.y;
  if(!this.arrived&&!this.chatting){const waiting=air.access.waitingSpot(this),target=waiting??this.route[this.index];if(!target){this.arrived=true;}else{const dx=target.x-this.position.x,dz=target.z-this.position.z,d=Math.hypot(dx,dz);
   const passRadius=this.index<this.route.length-1&&Math.abs(target.y-this.position.y)<.1&&!(target.z>69&&target.z<77)? (target.gown?.75:.2):.12;
   const atWork=!waiting&&this.index===this.route.length-1&&['repair','pm','field'].includes(this.job?.kind)&&d<B.workArrivalRadius&&Math.abs(target.y-this.position.y)<.1&&this.collision.cameraFraction({x:this.position.x,y:this.position.y+1,z:this.position.z},{x:target.x,y:target.y+1,z:target.z},.05)>.98;
   if(atWork||d<(waiting ? .15 : passRadius)){if(waiting){}else if(target.gown&&!this.gowned){this.gownWait+=dt;this.state='GOWNING';if(this.gownWait>=B.gownSeconds){this.setGowned(true);this.state='TRAVELLING';this.index++;}}else this.index++;}
   else if(!(air.busy&&air.operator===this)){heading=Math.atan2(dx,dz);const distance=Math.min(d,B.walkSpeed*(this.research?.effects.assistantSpeed??1)*dt),x=this.position.x,z=this.position.z;if(this.collision.traffic)this.collision.traffic.move(this,this.position,dx/d*distance,air.access.step(this,dz/d*distance),{sidestep:!air.access.inside(this)||air.operator===this,target,constraint:(p,from)=>{p.z=from.z+air.access.step(this,p.z-from.z,from.z);}});else this.collision.move(this.position,dx/d*distance,air.access.step(this,dz/d*distance));air.access.constrain(this,z);moving=Math.hypot(this.position.x-x,this.position.z-z)/Math.max(.001,dt);}
  }
   if(!waiting&&target&&!this.arrived&&!air.busy&&this.state!=='GOWNING'){const distance=Math.hypot(target.x-this.position.x,target.z-this.position.z);let watch=this.routeWatch;if(!watch||watch.target!==target)this.routeWatch=watch={target,best:distance,seconds:0};if(distance<watch.best-.15){watch.best=distance;watch.seconds=0;}else watch.seconds+=dt;if(watch.seconds>=B.repathSeconds){const destination=this.route.at(-1),state=this.state,returning=this.returningSeat;watch.seconds=0;watch.best=distance;if(destination&&this.go(destination)){this.state=state;this.returningSeat=returning;}}}else this.routeWatch=null;
  }
  if(!this.chatting&&this.returningSeat&&this.arrived&&!this.job)this.sitAtDesk();
  if(this.gowned&&this.position.z<63)this.setGowned(false);
  const near=Math.hypot(player.x-this.position.x,player.z-this.position.z)<B.viewDistance&&Math.abs(player.y-this.position.y)<7;this.group.visible=near;this.label.visible=near&&Math.hypot(player.x-this.position.x,player.z-this.position.z)>3;this.viewTimer+=dt;if(near&&this.viewTimer>=.05){this.animate(this.viewTimer,moving,heading);if(['WORK_PM','REPAIRING','WORK_FIELD'].includes(this.state)){this.arms[0].rotation.x=-.65+Math.sin(this.phase+performance.now()*.003)*.12;this.arms[1].rotation.x=-.65;}this.viewTimer=0;}
 }
}

