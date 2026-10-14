import * as THREE from 'three';
import {Player} from '../player/Player.js';
import {SHOPS} from '../data/shops.js';

// One permanent clerk per counter; diners remain a separate walking population.
export class FoodStaff {
 constructor(g){this.g=g;this.timer=0;this.time=0;const apronGeometry=new THREE.BoxGeometry(.56,.66,.07),apronMaterial=new THREE.MeshStandardMaterial({color:0xf2e7cb,roughness:.9});
  this.entities=SHOPS.map((shop,i)=>{const actor=new Player(g.scene,{variant:i+1,shirt:shop.color}),heading=shop.id==='mart'?0:Math.PI;
   actor.position.set(shop.x+.6,-6,shop.id==='mart'?-.6:30.6);actor.group.rotation.y=heading;
   const apron=new THREE.Mesh(apronGeometry,apronMaterial);apron.position.set(0,1.12,.29);actor.rig.add(apron);
   actor.group.visible=false;g.world.collision.add(actor.position.x,actor.position.z,.8,.8,2,-5,'food-staff');
   const n={id:'staff-'+shop.id,name:shop.staffName,role:'店員',shop,actor,position:actor.position,heading};g.world.collision.traffic?.add(n);return n;
  });
 }
 update(dt){const g=this.g,p=g.player.position,near=Math.abs(p.y+6)<2.5&&p.z<50;for(const n of this.entities)n.actor.group.visible=near&&n.position.distanceTo(p)<60;
  this.timer+=dt;this.time+=dt;if(!near||this.timer<.12)return;const step=Math.min(this.timer,.2);this.timer=0;
  for(const [i,n] of this.entities.entries()){if(!n.actor.group.visible)continue;const a=n.actor,serving=g.lifeUI.open&&g.lifeUI.page==='shop'&&g.lifeUI.item.shop.id===n.shop.id;
   a.animate(step,0,n.heading);a.head.rotation.y=Math.sin(this.time*.55+i)*.06;
   a.arms[1].rotation.x=serving?-.5+Math.sin(this.time*2)*.1:-.2;a.elbows[1].rotation.x=serving?-.85:-.35;a.syncSkeleton();
  }
 }
}
