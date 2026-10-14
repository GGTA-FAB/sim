import {stairHeight,stairRoute,stairRemainder} from '../data/stairs.js';
import {LIFT,STAIR,FAB_LIFT,FAB_STAIR} from '../data/layout.js';
export const region=p=>p.y< -3?'food':p.y>3?'level3':p.z>=76?'subfab':'level2';
const Y={food:-6,level2:0,level3:6,subfab:0};
const edges=[{a:'food',b:'level2',lift:LIFT,stair:STAIR,base:-6,id:'office'},{a:'level2',b:'level3',lift:LIFT,stair:STAIR,base:0,id:'office'},{a:'level3',b:'subfab',lift:FAB_LIFT,stair:FAB_STAIR,base:0,id:'fab'}];
export function transfers(from,to){const start=region(from),end=region(to);if(start===end)return[];const queue=[[start,[]]],seen=new Set([start]);while(queue.length){const [at,path]=queue.shift();for(const e of edges){const next=e.a===at?e.b:e.b===at?e.a:null;if(!next||seen.has(next))continue;const steps=[...path,{...e,from:Y[at],to:Y[next]}];if(next===end)return steps;seen.add(next);queue.push([next,steps]);}}return[];}
export function rampAt(position,collision){return collision.ramps.find(r=>position.x>=r.minX&&position.x<=r.maxX&&position.z>=r.minZ&&position.z<=r.maxZ&&Math.abs(position.y-stairHeight(r,position.z))<.12);}
function rampRoute(r,position,target){const dest=region(target),up=r.group==='fab'?dest!=='subfab':r.floorBase===-6?dest!=='food':dest==='level3'||dest==='subfab';return stairRemainder(r,position,up);}
export function travelLeg(position,target,finders,collision,mode){
 const ramp=rampAt(position,collision);if(ramp){const remaining=rampRoute(ramp,position,target),exit=remaining.at(-1);return {path:[{...position},...remaining],transfer:true,transferKind:'stairs',routeTarget:exit,transferTo:exit.y};}
 const step=transfers(position,target)[0],floor=Math.round(position.y/6)*6;
 if(!step)return {path:finders.get(floor).find(position,target).map(p=>({...p,y:floor})),routeTarget:target,transfer:false,transferKind:null};
 if(mode==='elevator'){const t={...step.lift,y:floor};return {path:finders.get(floor).find(position,t).map(p=>({...p,y:floor})),routeTarget:t,transfer:true,transferKind:'elevator',transferTo:step.to,liftId:step.id};}
 const up=step.to>step.from,points=stairRoute(step.stair,step.base,up),entry=points[0],exit=points.at(-1);
 const path=finders.get(floor).find(position,entry).map(p=>({...p,y:floor}));if(path.length)path.push(...points);
 return{path,routeTarget:exit,transfer:true,transferKind:'stairs',transferTo:step.to,stairLeg:{from:step.from,to:step.to}};
}
// NPCs use stairs throughout and receive the full route. Gate/gown steps are added by their adapter.
export function walkingRoute(position,target,finders,collision){let start={x:position.x,y:position.y,z:position.z};const route=[],ramp=rampAt(start,collision);if(ramp){const remaining=rampRoute(ramp,start,target);route.push(...remaining);start=remaining.at(-1);}
 const steps=transfers(start,target);for(const step of steps){const leg=travelLeg(start,{x:step.id==='fab'?0:0,y:step.to,z:step.id==='fab'?107:step.to===6?9:step.to===-6?7:14},finders,collision,'stairs');if(!leg.path.length)return[];route.push(...leg.path);start=leg.routeTarget;}
 const final=finders.get(Math.round(start.y/6)*6).find(start,target);if(!final.length)return[];route.push(...final.map(p=>({...p,y:Math.round(start.y/6)*6})));return route;
}
