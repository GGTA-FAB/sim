import { BALANCE } from '../data/balance.js';
export class InteractionSystem {
  constructor(world,player,bus){this.world=world;this.player=player;this.bus=bus;this.current=null;this.eye={x:0,y:0,z:0};this.aim={x:0,y:0,z:0};bus.on('INTERACT',()=>{if(this.current)bus.emit('INTERACTION_SELECTED',this.current);});}
  update(){
    let best=null,distance=BALANCE.interactionDistance,priority=-1;
    const {x,z}=this.player.position;
    for(const item of this.world.interactions){
      if(item.available&&!item.available())continue;
      if(Math.abs((this.player.position.y??0)-(item.y??0))>.7)continue;
      if(item.kind==='gown'&&this.player.gowned)continue;
      const area=item.area;
      const d=area?(x>=area.minX&&x<=area.maxX&&z>=area.minZ&&z<=area.maxZ?0:Infinity):Math.hypot(item.x-x,item.z-z);
      const rank=item.kind==='colleague'?0:1;
      if(d<BALANCE.interactionDistance&&(rank>priority||rank===priority&&d<distance)){Object.assign(this.eye,{x,y:this.player.position.y+1.2,z});Object.assign(this.aim,{x:item.x,y:(item.y??0)+1.2,z:item.z});if(this.world.collision?.cameraFraction(this.eye,this.aim,.02)<.95)continue;best=item;distance=d;priority=rank;}
    }
    this.current=best;
  }
}
