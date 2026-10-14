import {bakeCharacter,characterMaterial} from '../player/CharacterRig.js';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Builder} from './Builder.js';
import {Player} from '../player/Player.js';
import {LIFE_BALANCE as B} from '../data/life.js';
export const MEETING_ROOM={id:'meeting-room',name:'3F · 交班會議室',x:0,z:39,w:36,d:22,y:6};
export function meetingPeriod(seconds){if(seconds>=B.morningStart&&seconds<B.morningEnd)return'morning';if(seconds>=B.eveningStart&&seconds<B.eveningEnd)return'evening';return null;}
export class MeetingRoom {
 constructor(scene,collision){
  const b=new Builder(scene,collision,6);b.box(0,-.15,39,36,.3,22,0xc8c6b7);b.box(0,5.65,39,36,.3,22,0xe9eeea,true);
  for(const x of [-18,18])b.box(x,2.75,39,.3,5.5,22,0xe4eae4,true);b.box(0,2.75,50,36,5.5,.3,0xe4eae4,true);
  for(const x of [-3.12,3.12]){b.box(x,1.6,28.1,.13,3.2,.22,0x5c7977,true);b.box(x+Math.sign(x)*1.25,1.6,28.1,2.4,3.2,.10,0xb8cbd0);}
  b.sign('MEETING ROOM / 交班會議室',7.8,2.9,27.7,8,.72,'#f6f4e6','#3e6463',Math.PI);
  b.sign('08:30–09:30  /  16:30–17:30',0,3,49.75,11,.75,'#284c50','#f2f1df',Math.PI);
  b.box(0,1.95,49.7,7,2.7,.08,0x415a5c);b.sign('交班 · 設備 / 製程',0,2.05,49.63,6.5,.62,'#eef2df','#415a5c',Math.PI);
  b.box(0,.76,39,3.7,.16,11.5,0xb5a17d,true);for(const z of [35,43])b.box(0,.35,z,2.2,.7,.65,0x71827b,true);
  for(const x of [-8,0,8])for(const z of [32,39,46])b.box(x,5.46,z,1,.08,2.5,0xfff4d7);
  const group=this.group=new THREE.Group();scene.add(group);this.members=[];const batches=[];
  for(const side of [-1,1])for(let j=0;j<5;j++){
   const x=side*2.8,z=35+j*2; b.box(x,.47,z,.9,.12,.85,0x607d7d,true);b.box(x+side*.40,.91,z,.12,.86,.9,0x607d7d,true);b.cylinder(x,.23,z,.085,.46,0x64736c);
   b.box(side*1.4,.88,z,.62,.05,.42,0xebe8d9);b.cylinder(side*1.7,.98,z+.48,.07,.22,0xece6cf,8);
   if(side===1&&j===0){b.sign('你的座位',1.4,.96,z,.9,.22,'#294f54','#fff0b9',Math.PI);continue;}
   const npc=new Player(group,{variant:j+(side===1?2:0),shirt:j%2?0x82918b:0x526e7f});npc.position.set(x,6,z);npc.group.rotation.y=-side*Math.PI/2;npc.setLifePose('meeting');npc.animate(0,0,0);this.members.push({x,z,heading:npc.group.rotation.y});
   if(side===-1&&j===2){this.speaker=npc;continue;}
   batches.push(bakeCharacter(npc));group.remove(npc.group);
  }
  b.box(0,.47,45.8,1.1,.12,.9,0x465f65,true);b.box(0,1.05,46.2,1.1,1.1,.12,0x465f65,true);b.sign('主管席',0,.96,44.3,1.5,.28,'#fff2d4','#3d535b',Math.PI);const boss=new Player(group,{variant:4,shirt:0x354c60});boss.position.set(0,6,45.8);boss.group.rotation.y=Math.PI;boss.setLifePose('meeting');this.boss=boss;this.members.push({x:0,z:45.8,heading:Math.PI});
  group.add(new THREE.Mesh(mergeGeometries(batches),characterMaterial));for(const g of batches)g.dispose();
  b.finish();this.timer=0;this.elapsed=0;this.active=null;this.group.visible=false;
 }
 update(dt,clock,player){this.active=meetingPeriod(clock.seconds);this.group.visible=!!this.active&&Math.abs(player.y-6)<3&&Math.hypot(player.x,player.z-39)<55;if(!this.group.visible)return;this.timer+=dt;this.elapsed+=dt;if(this.timer<.1)return;this.speaker.animate(this.timer,0,0);this.speaker.arms[1].rotation.x=-.48+Math.sin(this.elapsed*.9)*.12;this.speaker.elbows[1].rotation.x=-1.05+Math.sin(this.elapsed*.6)*.18;this.speaker.head.rotation.y=Math.sin(this.elapsed*.35)*.15;this.speaker.syncSkeleton();this.timer=0;}
}
