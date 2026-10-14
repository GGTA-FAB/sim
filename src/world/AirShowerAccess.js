import {CLEAN_ACCESS} from '../data/layout.js';
// One shared chamber, one admission at a time. Actor references are rebuilt from
// positions/routes after loading, so older saves with several occupants can drain.
export class AirShowerAccess {
 constructor(air){this.air=air;this.queue=[];this.owner=null;this.lease=0;this.direction=null;}
 near(a){const p=a?.position;return p&&Math.abs(p.y-CLEAN_ACCESS.y)<.5&&Math.abs(p.x)<5&&p.z>=63&&p.z<=83;}
 inside(a){return this.near(a)&&a.position.z>69.5&&a.position.z<76.5;}
 intent(a,player){if(!this.near(a)||!a.gowned)return null;if(a!==player){if(a.arrived||a.chatting)return null;if(a.position.z<=70)return a.route.slice(a.index).some(t=>t.z>76)?'in':null;if(a.position.z>=76)return a.route.slice(a.index).some(t=>t.z<70)?'out':null;for(let i=a.index;i<a.route.length;i++){const t=a.route[i];if(t.z>76)return 'in';if(t.z<70)return 'out';}return null;}return a.position.z<70?'in':a.position.z>76?'out':this.direction??(['FAB','BLOW_OUT','RETURN'].includes(this.air.mode)?'out':'in');}
 update(dt,player,assistants){const air=this.air,actors=[player,...assistants];
  this.queue=this.queue.filter(a=>actors.includes(a)&&this.intent(a,player));
  for(const a of actors)if(this.intent(a,player)&&!this.queue.includes(a)&&a!==air.operator)this.queue.push(a);
  let owner=air.operator;
  const left=owner&&(!this.near(owner)||((this.direction==='in'||air.mode==='EXIT')&&owner.position.z>=77)||((this.direction==='out'||air.mode==='RETURN')&&owner.position.z<=69));
  const cancelled=owner&&!this.inside(owner)&&!this.intent(owner,player);
  if(left||cancelled){air.operator=null;air.remaining=0;owner=null;this.owner=null;this.lease=0;this.direction=null;}
  // An idle person standing at the entrance must not reserve the chamber forever.
  if(owner&&!this.inside(owner)){this.lease+=dt;if(this.lease>2.5&&this.queue.length){this.queue.push(owner);air.operator=null;air.remaining=0;owner=null;this.owner=null;this.lease=0;this.direction=null;}}
  else if(owner)this.lease=0;
  if(!owner){const trapped=actors.find(a=>this.inside(a));owner=trapped??this.queue.shift();if(owner){air.operator=owner;this.queue=this.queue.filter(a=>a!==owner);}}
  if(owner&&this.owner!==owner){this.owner=owner;this.direction=null;this.direction=this.intent(owner,player)??(owner.position.z>=73?'out':'in');const compatible=this.direction==='in'?['ENTRY','BLOW_IN','EXIT']:['FAB','BLOW_OUT','RETURN'];if(!compatible.includes(air.mode)||!this.inside(owner)){air.mode=this.direction==='in'?'ENTRY':'FAB';air.remaining=0;}}
  if(owner&&owner!==player){const desired=this.intent(owner,player);if(desired&&desired!==this.direction){this.direction=desired;air.mode=desired==='in'?'ENTRY':'FAB';air.remaining=0;}}
  air.update(dt,owner??player);
 }
 waitingSpot(actor){if(!actor.gowned||!this.near(actor)||this.inside(actor)||actor===this.air.operator||actor.arrived||!this.intent(actor,null))return null;const inbound=actor.position.z<70;let rank=0;for(const a of this.queue){if(a===actor)break;if((a.position.z<70)===inbound)rank++;}return {x:inbound?1.7:-1.7,y:CLEAN_ACCESS.y,z:inbound?68-Math.min(rank,3)*1.35:78+Math.min(rank,3)*1.35};}
 step(actor,dz,z=actor.position.z){if(!this.near(actor))return dz;if(actor===this.air.operator)return this.air.busy?0:dz;if(z>69.5&&z<76.5)return 0;
  if(z<=69.5&&dz>0)return Math.max(0,Math.min(dz,69-z));
  if(z>=76.5&&dz<0)return Math.min(0,Math.max(dz,77-z));return dz;
 }
 constrain(actor,beforeZ){actor.position.z=beforeZ+this.step(actor,actor.position.z-beforeZ,beforeZ);}
}
