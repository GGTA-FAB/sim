import { BAYS } from '../data/layout.js';
import { FAB_BALANCE as B } from '../data/balance.js';
import { BayManager } from '../world/BayManager.js';
import { FOUPSystem } from './FOUPSystem.js';
import { EquipmentSimulation } from './EquipmentSimulation.js';
import { OHTSystem } from './OHTSystem.js';
import { NPCManager } from '../npc/NPCManager.js';
import { FabView } from './FabView.js';
export class LivingFab {
  constructor(scene,world,random,bus,settings){
    this.now=0;this.accumulator=0;this.nextEquipment=0;this.viewTimer=0;
    this.bays=new BayManager(world.bayGroups,settings);this.foups=new FOUPSystem(BAYS);this.equipment=new EquipmentSimulation(this.foups,random,bus);this.oht=new OHTSystem(BAYS,this.equipment,this.foups);this.npcs=new NPCManager(BAYS,this.equipment,random,world.collision);this.view=new FabView(scene,world,this,this.bays,settings);
  }
  update(dt,position,visual=true){
    this.bays.update(dt,position);this.accumulator+=dt;
    while(this.accumulator>=B.fixedStep){this.accumulator-=B.fixedStep;this.now+=B.fixedStep;if(this.now+1e-6>=this.nextEquipment){this.nextEquipment=this.now+B.equipmentTick;this.equipment.update(this.now);this.oht.dispatch();}this.oht.update(B.fixedStep,this.now);this.npcs.update(this.now,this.bays);}
    this.viewTimer-=dt;if(visual&&this.viewTimer<=0){this.viewTimer=1/40;this.view.update(this.now+this.accumulator,position);}
  }
}
