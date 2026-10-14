import { FAB_BALANCE as B } from '../data/balance.js';
export class FOUPSystem {
  constructor(bays){this.items=[];this.byBay=new Map();for(const bay of bays){const list=[];for(let i=0;i<B.foupPerBay;i++){const f={id:this.items.length,bayId:bay.id,ownerType:'stock',ownerId:bay.id,x:bay.stockX,y:B.dockHeight,z:bay.stockZ,heading:0};this.items.push(f);list.push(f);}this.byBay.set(bay.id,list);}}
  reserve(bayId,ownerType,ownerId){const f=this.byBay.get(bayId).find(f=>f.ownerType==='stock');if(!f)return null;this.transfer(f.id,ownerType,ownerId);return f.id;}
  transfer(id,type,ownerId){const f=this.items[id];if(!f)throw Error('Unknown FOUP');f.ownerType=type;f.ownerId=ownerId;}
}
