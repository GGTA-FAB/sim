import {FAB_END} from '../data/layout.js';
import { FAB_BALANCE as B } from '../data/balance.js';
import { RailPath,roundedRail } from './RailPath.js';
import { TrafficLane } from './TrafficLane.js';
// Two nested one-way loops make four straight lanes: +X lanes outbound, -X inbound.
// Outer lanes have real curved branches into every bay. Inner lanes stay through lanes.
function branchPaths(bay){
  const base=bay.side>0?bay.z-15.5:bay.z+2.5,points=[];
  const add=(x,z)=>points.push({x:bay.side*x,z:base+bay.side*z});
  const arc=(x,z,a,b)=>{for(let i=0;i<=6;i++){const angle=a+(b-a)*i/6;add(x+Math.cos(angle)*1.5,z+Math.sin(angle)*1.5);}};
  arc(6.3,-1.5,Math.PI,Math.PI/2);add(13,0);const entry=new RailPath(points.splice(0),false);
  arc(8.5,8,0,-Math.PI/2);add(6.3,6.5);for(let i=1;i<=6;i++){const angle=-Math.PI/2-Math.PI/2*i/6;add(6.3+Math.cos(angle)*1.5,8+Math.sin(angle)*1.5);}const exit=new RailPath(points,false);
  return{entry,exit};
}
export class TrunkTraffic {
  constructor(loops){
    this.loops=loops;this.paths=[roundedRail(-4.8,4.8,119,FAB_END-5,3),roundedRail(-1.6,1.6,122,FAB_END-8,1.4)];this.lanes=this.paths.map(path=>new TrafficLane(path));this.vehicles=[];this.branches=[];this.entries=0;this.returns=0;
    for(const loop of loops.values()){
      const {entry,exit}=branchPaths(loop.bay),first=entry.points[0],last=exit.points.at(-1);
      const branch={id:loop.bay.id,loop,entry,exit,entryMain:this.paths[0].at(first.x,first.z),exitMain:this.paths[0].at(last.x,last.z),entryBay:loop.path.at(entry.points.at(-1).x,entry.points.at(-1).z),exitBay:loop.path.at(exit.points[0].x,exit.points[0].z),owner:null,entries:0,returns:0};this.branches.push(branch);loop.branch=branch;
    }
    for(let i=0;i<B.mainOhtCount;i++){
      const laneIndex=i%2,lane=this.lanes[laneIndex],path=lane.path,distance=Math.floor(i/2)*path.length/(B.mainOhtCount/2);
      const v={id:`TRUNK-${i+1}`,home:lane,homeIndex:laneIndex,path,distance,prevDistance:distance,x:0,z:0,heading:0,loaded:i%3!==0,route:'MAIN',branch:null,nextBranch:null,visits:0,waiting:null};path.sample(distance,v);lane.add(v);this.vehicles.push(v);if(laneIndex===0)this.chooseBranch(v,Math.floor(i/2)%3);
    }
  }
  chooseBranch(v,skip=0){const candidates=this.branches.filter(b=>v.home.path.ahead(v.distance,b.entryMain)>12).sort((a,b)=>v.home.path.ahead(v.distance,a.entryMain)-v.home.path.ahead(v.distance,b.entryMain));v.nextBranch=candidates[skip%candidates.length];}
  switchPath(v,path,distance,route){v.path=path;v.distance=distance;v.prevDistance=distance;v.route=route;path.sample(distance,v);}
  tryEnter(v){const b=v.nextBranch,main=v.home;if(b.owner||!b.loop.lane.canInsert(b.entryBay,v))return false;
    b.owner=v;v.branch=b;b.entries++;this.entries++;
    b.loop.lane.reserve('entry',v,b.entryBay);main.reserve(`entry-${b.id}`,v,b.entryMain);
    this.switchPath(v,b.entry,0,'ENTER');return true;
  }
  tryExit(v){const b=v.branch;if(!v.home.canInsert(b.exitMain,v))return false;
    v.home.reserve(`exit-${b.id}`,v,b.exitMain);b.loop.lane.reserve('exit',v,b.exitBay);b.loop.lane.remove(v);
    this.switchPath(v,b.exit,0,'EXIT');return true;
  }
  update(dt){
    for(const v of this.vehicles){v.prevDistance=v.distance;v.waiting=null;const desired=B.ohtSpeed*(this.speedFactor??1)*dt;
      if(v.route==='MAIN'){
        const step=v.home.advance(v,desired),remaining=v.nextBranch?v.path.ahead(v.distance,v.nextBranch.entryMain):Infinity;
        if(step<desired-1e-6)v.waiting='VEHICLE_AHEAD';
        if(remaining<=step+1e-6){v.distance=v.nextBranch.entryMain;v.path.sample(v.distance,v);if(!this.tryEnter(v))v.waiting='BAY_MERGE';}
        else{v.distance=(v.distance+step)%v.path.length;v.path.sample(v.distance,v);}
      }else if(v.route==='ENTER'||v.route==='EXIT'){
        v.distance=Math.min(v.path.length,v.distance+desired);v.path.sample(v.distance,v);
        if(v.distance>=v.path.length-1e-6){const b=v.branch;
          if(v.route==='ENTER'){b.loop.lane.add(v);this.switchPath(v,b.loop.path,b.entryBay,'BAY');b.loop.lane.release('entry');v.home.release(`entry-${b.id}`);}
          else{this.switchPath(v,v.home.path,b.exitMain,'MAIN');v.home.release(`exit-${b.id}`);b.loop.lane.release('exit');b.owner=null;b.returns++;this.returns++;v.visits++;v.branch=null;this.chooseBranch(v,v.visits%2);}
        }
      }else if(v.route==='BAY'){
        const b=v.branch,step=b.loop.lane.advance(v,desired),remaining=v.path.ahead(v.distance,b.exitBay);
        if(step<desired-1e-6)v.waiting='VEHICLE_AHEAD';
        if(remaining<=step+1e-6){v.distance=b.exitBay;v.path.sample(v.distance,v);if(!this.tryExit(v))v.waiting='MAIN_MERGE';}
        else{v.distance=(v.distance+step)%v.path.length;v.path.sample(v.distance,v);}
      }
    }
  }
}
