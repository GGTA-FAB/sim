import { FAB_BALANCE as B } from '../data/balance.js';
import { roundedRail } from './RailPath.js';
import { TrafficLane } from './TrafficLane.js';
import { TrunkTraffic } from './TrunkTraffic.js';
export class OHTSystem {
  constructor(bays,equipment,foups){
    this.equipment=equipment;this.foups=foups;this.deliveries=0;this.pickups=0;this.vehicles=[];this.loops=new Map();
    for(const bay of bays){
      const path=roundedRail(bay.side<0?-65:10,bay.side<0?-10:65,bay.z-15.5,bay.z+2.5);
      const loop={bay,path,stock:path.at(bay.stockX,bay.stockZ),vehicles:[],lane:new TrafficLane(path)};
      for(let i=0;i<B.ohtPerBay;i++){const v={id:`OHT-${bay.id}-${i+1}`,bayId:bay.id,path,distance:i*path.length/B.ohtPerBay,prevDistance:i*path.length/B.ohtPerBay,prevHoist:B.carryHeight,phase:'CRUISE',stop:null,goal:0,t:0,hoistY:B.carryHeight,foupId:null,job:null,x:0,z:0,heading:0};path.sample(v.distance,v);loop.vehicles.push(v);loop.lane.add(v);this.vehicles.push(v);}
      this.loops.set(bay.id,loop);
    }
    this.byId=new Map(this.vehicles.map(v=>[v.id,v]));this.trunk=new TrunkTraffic(this.loops);this.mainVehicles=this.trunk.vehicles;this.mainPaths=this.trunk.paths;
  }
  dispatch(){
    for(const [bayId,loop] of this.loops){const equipment=this.equipment.byBay.get(bayId);
      for(const v of loop.vehicles){if(v.phase!=='CRUISE')continue;
        let pickup=null,delivery=null;
        for(const candidate of equipment){if(candidate.assigned||candidate.workStatus)continue;if(candidate.state==='UNLOAD'&&(!pickup||candidate.since<pickup.since))pickup=candidate;if(candidate.state==='WAIT_FOUP'&&(!delivery||candidate.since<delivery.since))delivery=candidate;}
        const e=pickup??delivery;if(!e)break;
        if(e.state==='WAIT_FOUP'){
          const id=this.foups.reserve(bayId,'reserved',v.id);if(id===null)continue;
          v.job={equipment:e,kind:'delivery',foupId:id};this.travel(v,'stockPickup',loop.stock);
        }else{v.job={equipment:e,kind:'pickup',foupId:e.foupId};this.travel(v,'equipmentPickup',v.path.at(e.portX,e.portZ));}
        e.assigned=v.id;
      }
    }
  }
  travel(v,stop,goal){v.phase='TRAVEL';v.stop=stop;v.goal=goal;v.hoistY=B.carryHeight;}
  transfer(v,now){const e=v.job.equipment,id=v.job.foupId;
    if(v.stop==='stockPickup'){v.foupId=id;this.foups.transfer(id,'vehicle',v.id);}
    if(v.stop==='equipmentDrop'){this.equipment.delivered(e,id,now);v.foupId=null;this.deliveries++;}
    if(v.stop==='equipmentPickup'){v.foupId=id;this.foups.transfer(id,'vehicle',v.id);this.equipment.pickedUp(e,now);this.pickups++;}
    if(v.stop==='stockDrop'){this.foups.transfer(id,'stock',v.bayId);v.foupId=null;}
  }
  raised(v){const e=v.job.equipment;
    if(v.stop==='stockPickup')this.travel(v,'equipmentDrop',v.path.at(e.portX,e.portZ));
    else if(v.stop==='equipmentPickup')this.travel(v,'stockDrop',this.loops.get(v.bayId).stock);
    else{if(e.assigned===v.id)e.assigned=null;v.job=null;v.stop=null;v.phase='CRUISE';}
  }
  update(dt,now){
    for(const loop of this.loops.values())for(const v of loop.vehicles){
      v.prevDistance=v.distance;v.prevHoist=v.hoistY;
      if(v.phase==='CRUISE'||v.phase==='TRAVEL'){
        const advance=loop.lane.advance(v,B.ohtSpeed*(this.speedFactor??1)*dt);v.waiting=advance<B.ohtSpeed*(this.speedFactor??1)*dt-1e-6?'VEHICLE_AHEAD':null;
        const remaining=v.phase==='TRAVEL'?v.path.ahead(v.distance,v.goal):Infinity;
        if(remaining<advance+.00001){v.distance=v.goal;v.phase='LOWER';v.t=0;}else v.distance=(v.distance+advance)%v.path.length;
        v.path.sample(v.distance,v);
      }else{
        v.waiting=null;v.t+=dt;
        if(v.phase==='LOWER'){v.hoistY=B.carryHeight+(B.dockHeight-B.carryHeight)*Math.min(1,v.t/B.hoistSeconds);if(v.t>=B.hoistSeconds){this.transfer(v,now);v.phase='HOLD';v.t=0;}}
        else if(v.phase==='HOLD'){if(v.t>=.4){v.phase='RAISE';v.t=0;}}
        else if(v.phase==='RAISE'){v.hoistY=B.dockHeight+(B.carryHeight-B.dockHeight)*Math.min(1,v.t/B.hoistSeconds);if(v.t>=B.hoistSeconds)this.raised(v);}
      }
      if(v.foupId!==null){const f=this.foups.items[v.foupId];f.x=v.x;f.y=v.hoistY;f.z=v.z;f.heading=v.heading;}
    }
    this.trunk.speedFactor=this.speedFactor??1;this.trunk.update(dt);
  }
}
