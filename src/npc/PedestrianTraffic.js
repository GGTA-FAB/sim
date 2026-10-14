// Shared local avoidance for all walking populations. Static collision remains authoritative.
// Spatial buckets and reusable scratch positions avoid all-pairs checks and per-step geometry.
const DIRECTIONS=[[1,0],[.707,.707],[0,1],[-.707,.707],[-1,0],[.707,-.707],[0,-1],[-.707,-.707]];
export class PedestrianTraffic {
 constructor(collision){this.collision=collision;collision.traffic=this;this.entries=new Map();this.cells=new Map();this.scratch={x:0,y:0,z:0};this.ready=false;}
 key(p){return (Math.floor(p.x/3)+1024)*2048+Math.floor(p.z/3)+1024;}
 add(actor,position=actor.position??actor,{radius=.55,enabled=()=>!actor.onLeave}={}){const entry={actor,position,radius,enabled,key:null,side:1,stalled:0,best:Infinity,goalX:NaN,goalZ:NaN};this.entries.set(actor,entry);this.sync(entry);return entry;}
 sync(e){const key=e.enabled()?this.key(e.position):null;if(key===e.key)return;if(e.key!==null){const old=this.cells.get(e.key),i=old?.indexOf(e);if(i>=0)old.splice(i,1);}e.key=key;if(key!==null){if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(e);}}
 refresh(){for(const e of this.entries.values())this.sync(e);this.ready=true;}
 clear(actor,from,to,radius=.55){
  const cx=Math.floor(to.x/3),cz=Math.floor(to.z/3),vx=to.x-from.x,vz=to.z-from.z,length=vx*vx+vz*vz;
  for(let x=cx-1;x<=cx+1;x++)for(let z=cz-1;z<=cz+1;z++){
   const cell=this.cells.get((x+1024)*2048+z+1024);if(!cell)continue;
   for(const e of cell){if(e.actor===actor||!e.enabled()||Math.abs(e.position.y-to.y)>.8)continue;const p=e.position,gap=radius+e.radius,old=(from.x-p.x)**2+(from.z-p.z)**2,end=(to.x-p.x)**2+(to.z-p.z)**2;
    // A migrated overlapping save may separate naturally, but never move further inside.
    if(old<gap*gap-.0001){if(end<=old+.000001)return false;continue;}
    const t=length?Math.max(0,Math.min(1,((p.x-from.x)*vx+(p.z-from.z)*vz)/length)):0;
    if((from.x+vx*t-p.x)**2+(from.z+vz*t-p.z)**2<gap*gap)return false;
   }
  }return true;
 }
 free(actor,p){return this.clear(actor,p,p,this.entries.get(actor)?.radius??.55);}
 move(actor,position,dx,dz,{sidestep=true,target=null,constraint=null}={}){
  if(!this.ready)this.refresh();const distance=Math.hypot(dx,dz);if(distance<1e-8)return 0;
  const entry=this.entries.get(actor);
  if(entry&&target){const remaining=Math.hypot(target.x-position.x,target.z-position.z);if(entry.goalX!==target.x||entry.goalZ!==target.z){entry.goalX=target.x;entry.goalZ=target.z;entry.best=remaining;entry.stalled=0;entry.side=1;}else if(remaining<entry.best-.1){entry.best=remaining;entry.stalled=0;}else{entry.stalled+=distance;if(entry.stalled>3){entry.side*=-1;entry.stalled=0;entry.best=remaining;}}}
  const startX=position.x,startZ=position.z,n=Math.max(1,Math.ceil(distance/.16)),sx=dx/n,sz=dz/n,r=this.entries.get(actor)?.radius??.55;
  for(let i=0;i<n;i++){
   let accepted=false;
   // Keep right when meeting another person. If a wall occupies that side, try left.
   const ahead=Math.min(1.2,target?Math.hypot(target.x-position.x,target.z-position.z):1.2),look=this.scratch;look.x=position.x+dx/distance*ahead;look.y=position.y;look.z=position.z+dz/distance*ahead;
   const anticipate=sidestep&&!this.clear(actor,position,look,r);
   for(let choice=0;choice<(sidestep?DIRECTIONS.length:1);choice++){
    const [f,lateral]=DIRECTIONS[anticipate&&choice<2?1-choice:choice],side=lateral*(entry?.side??1);
    const p=this.scratch;p.x=position.x;p.y=position.y;p.z=position.z;this.collision.move(p,sx*f+sz*side,sz*f-sx*side);constraint?.(p,position);
    if(Math.hypot(p.x-position.x,p.z-position.z)<.00001||!this.clear(actor,position,p,r))continue;
    position.x=p.x;position.y=p.y;position.z=p.z;accepted=true;const e=this.entries.get(actor);if(e)this.sync(e);break;
   }
   if(!accepted)break;
  }
  return Math.hypot(position.x-startX,position.z-startZ);
 }
}
