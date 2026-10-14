import {LifestyleScene} from '../world/LifestyleScene.js';
import {ActorCosmetics} from '../player/ActorCosmetics.js';
export class LifestyleSystem {
 constructor(g){this.g=g;this.scene=new LifestyleScene(g);this.claw=this.scene.claw;this.player=new ActorCosmetics(g.player);this.diners=g.foodPeople.entities.map(n=>new ActorCosmetics(n.actor));
  g.bus.on('RESEARCH_COMPLETED',()=>this.refresh());g.bus.on('COSMETICS_CHANGED',()=>this.refresh());g.bus.on('LIFE_STARTED',a=>{if(['rest','research','work-pc','nap','eat'].includes(a.type)&&a.item.id==='desk')g.ambience.chair(g.research.complete('fun-quiet-chair'));});this.refresh();
 }
 refresh(){const g=this.g;this.scene.refresh();this.player.apply(g.research);for(const d of this.diners)d.apply(g.research);g.living.oht.speedFactor=g.research.complete('fun-oht-home')?1.1:1;}
 update(dt){const g=this.g;this.scene.update(dt);this.player.update(dt,{phone:g.phone.active?.phase==='CONNECTED'||g.phone.active?.phase==='DIALING'||g.phoneUI.open,big:!!(g.life.active?.food??g.life.carriedFood)?.bigChicken});if(this.scene.food.visible)for(let i=0;i<this.diners.length;i++)this.diners[i].update(dt,{big:i%3===0});}
}
