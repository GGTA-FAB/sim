import * as THREE from 'three';
import {group,block,ball,label} from '../world/DecorPrimitives.js';
export const CLAW_PLACE={id:'claw',kind:'claw',x:-27.3,y:-6,z:18,title:'娃娃機 · 餐飲街休息角',action:'移動夾爪 / 試夾',name:'1F · 娃娃機'};
export class ClawMachine {
 constructor(game,parent){this.g=game;this.root=group(parent,-29.7,0,18);this.root.rotation.y=Math.PI/2;this.x=0;this.target=0;this.elapsed=0;this.busy=false;this.speed=1;this.result='';
 block(this.root,0x487f96,0,.55,0,2.2,1.1,2.6);block(this.root,0x487f96,0,3.15,0,2.2,.3,2.6);for(const x of [-1,1])for(const z of [-1.15,1.15])block(this.root,0x91a8ab,x,2,z,.1,2.5,.1);block(this.root,0xf0d9a1,0,1.12,0,2.05,.13,2.45);const glass=new THREE.MeshStandardMaterial({color:0xc4e4e5,transparent:true,opacity:.13,depthWrite:false});block(this.root,glass,0,2.1,1.2,1.95,1.8,.03);block(this.root,0x243f49,0,.5,1.32,.9,.32,.06);label(this.root,'休息角 · 原廠夾力',0,3.42,1.26,2.4,.4);this.motor=block(this.root,0x697b83,0,3,0,.55,.2,.45);block(this.root,0xbec8c5,0,2.9,0,1.8,.06,.06);
 this.claw=group(this.root,0,2.65,.3);block(this.claw,0x96a9ab,0,.2,0,.04,.4,.04);for(const side of [-1,1]){const finger=block(this.claw,0xb6c2c3,side*.12,-.04,0,.05,.27,.05);finger.rotation.z=side*.4;}
 this.lamp=block(this.root,0xcd9f45,.72,.58,1.34,.12,.12,.05);this.toys=[];for(const [i,x]of [-.65,0,.65].entries()){const toy=group(this.root,x,1.35,.3);ball(toy,[0xe2ba65,0x779fad,0xb68ca9][i],0,0,0,.19,.24,.15);for(const side of [-1,1])ball(toy,0xe7c998,side*.12,.2,0,.065);this.toys.push(toy);}this.upgrade=label(this.root,'高速馬達 +20%',0,.94,1.34,1.7,.24);this.upgrade.visible=false;
 }
 allowed(){return !this.g.frozen&&this.g.life.near(CLAW_PLACE)&&!this.g.life.active;}
 move(direction){if(!this.allowed()||this.busy)return false;this.target=Math.max(-.8,Math.min(.8,this.target+Math.sign(direction)*.325));this.result='';return true;}
 drop(){if(!this.allowed()||this.busy||Math.abs(this.x-this.target)>.02)return false;this.busy=true;this.elapsed=0;const c=this.g.research.cosmetics;c.clawAttempts=Math.min(1000000,c.clawAttempts+1);this.attempt=c.clawAttempts;this.picked=this.toys.findIndex(t=>Math.abs(this.x-t.position.x)<.16);this.won=this.picked>=0&&this.attempt%3!==0;this.g.bus.emit('COSMETICS_CHANGED');return true;}
 apply(){const upgraded=this.g.research.complete('fun-claw-motor');this.speed=upgraded?1.2:1;this.motor.material= newMaterial(upgraded);this.upgrade.visible=upgraded;this.lamp.material=material(upgraded?0x7bcd91:0xcd9f45);}
 update(dt){const step=this.speed*.7*dt;this.x+=Math.sign(this.target-this.x)*Math.min(step,Math.abs(this.target-this.x));this.claw.position.x=this.x;if(this.busy){this.elapsed+=dt;const t=this.elapsed;this.claw.position.y=2.65-(t<1?t:t<2?1:Math.max(0,3-t))*1.1;if(this.won&&t>2)this.toys[this.picked].position.y=1.35+Math.min(1,t-2)*1.1;if(t>=3){for(const toy of this.toys)toy.position.y=1.35;this.busy=false;this.claw.position.y=2.65;if(this.won){this.g.research.cosmetics.clawPrizes=Math.min(9999,this.g.research.cosmetics.clawPrizes+1);this.g.bus.emit('COSMETICS_CHANGED');}this.result=this.won?'夾到了，玩偶已放在辦公桌。':'夾爪正常運作，玩偶暫時留任。';this.g.hud.message(this.result);}}
 const view=document.querySelector('#claw-view');if(view){view.style.setProperty('--claw-x',`${50+this.x*45}%`);view.style.setProperty('--claw-y',`${15+(2.65-this.claw.position.y)*32}%`);view.setAttribute('aria-label',this.busy?'正在夾取':`夾爪位置 ${this.x.toFixed(2)}`);const out=document.querySelector('#claw-result');if(out)out.textContent=this.result||'對準玩偶後放下夾爪';}
 }
}
// Reuse the shared palette when research is restored or completed.
import {material} from '../world/DecorPrimitives.js';
const newMaterial=upgraded=>material(upgraded?0xe5b952:0x697b83);
