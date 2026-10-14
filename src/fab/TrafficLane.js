import { FAB_BALANCE as B } from '../data/balance.js';
// All vehicles on the same physical rail obey the same rule, including visitors.
// Short-lived reservations protect the shared track while a vehicle takes a turnout.
export class TrafficLane {
  constructor(path){this.path=path;this.vehicles=[];this.reservations=new Map();}
  advance(vehicle,desired){
    let distance=desired;
    for(const other of this.vehicles){if(other===vehicle||other.path!==this.path)continue;distance=Math.min(distance,Math.max(0,this.path.ahead(vehicle.distance,other.distance)-B.ohtHeadway));}
    for(const reservation of this.reservations.values()){if(reservation.owner===vehicle)continue;distance=Math.min(distance,Math.max(0,this.path.ahead(vehicle.distance,reservation.distance)-reservation.clearance));}
    return distance;
  }
  canInsert(distance,owner,clearance=B.junctionGap){
    for(const other of this.vehicles){if(other===owner||other.path!==this.path)continue;if(this.path.ahead(distance,other.distance)<clearance||this.path.ahead(other.distance,distance)<clearance)return false;}
    for(const reservation of this.reservations.values()){if(reservation.owner===owner)continue;if(this.path.ahead(distance,reservation.distance)<clearance||this.path.ahead(reservation.distance,distance)<clearance)return false;}
    return true;
  }
  reserve(key,owner,distance,clearance=B.junctionGap){this.reservations.set(key,{owner,distance,clearance});}
  release(key){this.reservations.delete(key);}
  add(vehicle){this.vehicles.push(vehicle);}
  remove(vehicle){const index=this.vehicles.indexOf(vehicle);if(index>=0)this.vehicles.splice(index,1);}
}
