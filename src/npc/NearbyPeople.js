import {DEPUTY_CHAT,DEPUTY_NAME} from '../data/deputyOffice.js';
import {lifestyleLine} from '../data/lifestyleResearch.js';
import {createRandom} from '../core/Random.js';
import {CHAT_TOPICS,CHAT_ROLES,CHAT_OPENERS,personHash} from '../data/conversations.js';
export class NearbyPeople {
 constructor(g){this.g=g;const button=this.button=document.createElement('button');button.id='talk-nearby';button.hidden=true;document.body.append(button);button.onclick=()=>{if(this.near)g.interact(this.near);};this.random=createRandom(g.seed^0x91abc);this.people=new Map();
  const add=this.add=(id,source,position,label,available)=>{const item={id,kind:'colleague',action:'聊幾句',get x(){return position().x;},get y(){return position().y??0;},get z(){return position().z;},get title(){return label();},get name(){return label().split(' · ')[0];},available};g.world.interactions.push(item);this.people.set(id,{source,item});};
  for(const n of g.living.npcs.entities)add('talk-'+n.id,n,()=>n,()=>{const c=g.phone.contacts.find(c=>c.npcId===n.id);return `${c?.name??n.name} · ${n.role.name}`;},()=>Math.abs(g.player.position.y-6)<.7&&g.player.position.z>116);
  for(const n of g.foodPeople.entities)add('talk-'+n.id,n,()=>n.position,()=>`${n.name} · ${n.role}`,()=>n.actor.group.visible);
  for(const n of g.officePeople.entities)add('talk-'+n.id,n,()=>n.position,()=>`${n.name} · ${n.role}`,()=>n.actor.group.visible);
  const deputy=g.world.deputyOffice;add('talk-deputy',deputy.boss,()=>deputy.boss.position,()=>DEPUTY_NAME+' · 副理 / 主管',()=>!deputy.owned&&deputy.boss.group.visible);
  for(const a of g.assistants)this.addAssistant(a);
  for(const [i,m] of g.world.meeting.members.entries())add('talk-meeting-'+i,m,()=>({...m,y:6}),()=>i===9?'廖經理 · 主管':`交班同事 ${i+1}`,()=>g.world.meeting.group.visible);
  for(const event of ['LIFE_STARTED','LIFE_STOPPED','LIFE_COMPLETED'])g.bus.on(event,a=>{if(a.type!=='chat')return;this.syncConversations();});
 }
 addAssistant(a){this.add('talk-'+a.id,a,()=>a.position,()=>`${this.g.phone.byId.get(a.id)?.name??a.name} · 助理工程師`,()=>a.group.visible);}
 // The topic menu and the timed chat share a hold; hiding one must not release the other.
 selectConversation(item){this.menuItem=item;this.syncConversations();}
 syncConversations(){const active=this.g.life.active;for(const [id,{source}] of this.people){const held=id===this.menuItem?.id||active?.type==='chat'&&id===active.item.id;if(held&&!source.chatting){source.speed=0;if('prevX'in source){source.prevX=source.x;source.prevZ=source.z;}}source.chatting=held;}}
 update(){const g=this.g,p=g.player.position;if(this.menuItem&&!g.life.near(this.menuItem))g.lifeUI.hide();this.syncConversations();this.near=null;let distance=2.5;for(const {item} of this.people.values()){if(!item.available()||Math.abs(item.y-p.y)>.7)continue;const d=Math.hypot(item.x-p.x,item.z-p.z);if(d<distance&&g.world.collision.cameraFraction({x:p.x,y:p.y+1.2,z:p.z},{x:item.x,y:item.y+1.2,z:item.z},.02)>.95){distance=d;this.near=item;}}this.button.hidden=!this.near||g.frozen||g.life.active||g.lifeUI.open||g.detailOpen||g.state!=='PLAYING';if(this.near)this.button.textContent=`交談 · ${this.near.name}`;}
 greeting(item){if(item.id==='talk-deputy')return'進來坐。機況可以慢慢說，午餐還沒吃的話先去吃。';if(this.g.tutorial?.enabled&&item.id==='talk-office-walker-0')return this.g.tutorial.advice;return CHAT_OPENERS[personHash(item.id)%CHAT_OPENERS.length];}
 line(item,topic){if(this.g.tutorial?.enabled&&item.id==='talk-office-walker-0'&&topic==='work')return this.g.tutorial.advice;const entry=this.people.get(item.id),source=entry?.source,label=item.title??'',h=personHash(item.id),role=label.includes('助理')?'assistant':label.includes('主管')?'manager':label.includes('製程')?'process':label.includes('製造')?'manufacturing':item.y===-6?'food':'equipment';
  const pool=item.id==='talk-deputy'?(DEPUTY_CHAT[topic]??DEPUTY_CHAT.casual):topic==='work'?[...CHAT_ROLES[role],...CHAT_TOPICS.work]:topic==='casual'?[...CHAT_TOPICS.casual,...CHAT_ROLES[role]]:CHAT_TOPICS[topic]??CHAT_TOPICS.casual;
  const counts=entry?(entry.chatCounts??={}):{};const n=counts[topic]??0;counts[topic]=n+1;let line=pool[(h+n)%pool.length];const flavor=this.g.research&&lifestyleLine(this.g.research,item,topic,h+n);if(flavor&&n%2===0)line=flavor;
  if(topic==='work'&&source?.job?.equipmentId)line=`我正在處理 ${source.job.equipmentId}。${line}`;
  else if(topic==='work'&&source?.targetId){const e=this.g.living.equipment.byId.get(source.targetId);if(e)line=`${e.id} ${e.workStatus==='DOWN'?'正在等工程師確認':e.workStatus==='PM'?'正在保養':'目前持續生產'}。${line}`;}
  return line;
 }
}
