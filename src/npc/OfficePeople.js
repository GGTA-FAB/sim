import {Player} from '../player/Player.js';
import {createRandom} from '../core/Random.js';
import {OFFICE_STOPS,OFFICE_PEOPLE,OFFICE_ACTIVITY as B} from '../data/office.js';

// Six reusable rigs, floor-local paths, throttled movement/animation and infrequent decisions.
// Cosmetic activity has its own RNG and never changes the workload or saved task simulation.
export class OfficePeople {
 constructor(g){
  this.g=g;this.random=createRandom(g.seed^0x0ff1ce);this.timer=0;this.elapsed=0;
  this.entities=OFFICE_PEOPLE.map((def,i)=>{
   const actor=new Player(g.scene,{variant:i+1,shirt:def.color}),stop=OFFICE_STOPS[def.start];actor.position.set(stop.x,6,stop.z);actor.group.rotation.y=i===0?Math.PI/2:i===1?-Math.PI/2:0;
   const n={id:`office-walker-${i}`,name:def.name,role:def.role,actor,position:actor.position,stop:def.start,state:stop.kind==='discuss'?'DISCUSS':'IDLE',wait:i<2?12:1+i*.4,route:[],index:0,speed:0,heading:actor.group.rotation.y,chatting:false};g.world.collision.traffic?.add(n);return n;
  });
 }
 plan(n){const free=OFFICE_STOPS.map((_,i)=>i).filter(i=>i!==n.stop&&!this.entities.some(other=>other!==n&&other.stop===i));if(!free.length){n.wait=2;return;}const next=free[Math.floor(this.random()*free.length)],route=this.g.navigation.finders.get(6).find(n.position,OFFICE_STOPS[next]);if(!route.length){n.wait=2;return;}n.stop=next;n.route=route;n.index=0;n.state='WALK';}

 update(dt){
  const p=this.g.player.position,near=Math.abs(p.y-6)<2.5&&p.z<70;for(const n of this.entities)n.actor.group.visible=near&&n.position.distanceTo(p)<B.viewDistance;
  this.timer+=dt;this.elapsed+=dt;if(this.timer<(near?B.nearUpdate:B.farUpdate))return;const step=this.timer;this.timer=0;
  for(const n of this.entities){n.speed=0;
   if(!n.chatting){
    if(n.state!=='WALK'){n.wait-=step;if(n.wait<=0)this.plan(n);}
    if(n.state==='WALK'){
     let travel=B.walkSpeed*step,moved=0;
     while(travel>0&&n.index<n.route.length){const t=n.route[n.index],dx=t.x-n.position.x,dz=t.z-n.position.z,d=Math.hypot(dx,dz);if(d<.03){n.index++;continue;}const advance=Math.min(d,travel),x=n.position.x,z=n.position.z;n.heading=Math.atan2(dx,dz);const collision=this.g.world.collision;if(collision.traffic)collision.traffic.move(n,n.position,dx/d*advance,dz/d*advance,{target:t});else collision.move(n.position,dx/d*advance,dz/d*advance);const actual=Math.hypot(n.position.x-x,n.position.z-z);moved+=actual;travel-=advance;if(actual<.0001)break;if(Math.hypot(n.position.x-t.x,n.position.z-t.z)<.08)n.index++;}
     n.speed=moved/step;if(n.index>=n.route.length){n.state=OFFICE_STOPS[n.stop].kind==='discuss'?'DISCUSS':'IDLE';n.wait=B.waitMin+this.random()*(B.waitMax-B.waitMin);n.heading=n.stop===2?Math.PI/2:n.stop===3?-Math.PI/2:n.heading;}
    }
   }
   if(n.actor.group.visible){n.actor.animate(step,n.speed,n.heading);if(n.state==='DISCUSS'||n.chatting){n.actor.group.rotation.y=n.heading;n.actor.arms[1].rotation.x=-.35+Math.sin(this.elapsed*1.7+n.stop)*.12;n.actor.elbows[1].rotation.x=-.7;n.actor.head.rotation.y=Math.sin(this.elapsed*.6)*.08;}else n.actor.head.rotation.y=0;n.actor.syncSkeleton();}
  }
 }
}
