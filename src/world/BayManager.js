import { BAYS,FAB_Y } from '../data/layout.js';
import { FAB_BALANCE,QUALITY } from '../data/balance.js';
export class BayManager {
  constructor(groups,settings){this.groups=groups;this.settings=settings;this.timer=0;this.bays=BAYS.map(def=>({...def,tier:'far',distance:Infinity,visible:false}));this.byId=new Map(this.bays.map(b=>[b.id,b]));}
  update(dt,position){
    this.timer-=dt;if(this.timer>0)return;this.timer=FAB_BALANCE.bayUpdate;
    const quality=QUALITY[this.settings.quality];
    for(const bay of this.bays){
      const dx=Math.max(0,Math.abs(position.x-bay.x)-bay.w/2),dz=Math.max(0,Math.abs(position.z-bay.z)-bay.d/2);
      bay.distance=Math.hypot(dx,dz);bay.tier=bay.distance<FAB_BALANCE.nearDistance?'near':bay.distance<FAB_BALANCE.mediumDistance?'medium':'far';
      bay.visible=Math.abs(position.y-FAB_Y)<3&&bay.distance<quality.bayDistance;this.groups.get(bay.id).visible=bay.visible;
    }
  }
  get activeCount(){return this.bays.filter(b=>b.visible).length;}
}
