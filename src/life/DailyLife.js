import {LIFE_BALANCE as B,LIFE_LOCATIONS} from '../data/life.js';
import {PlayerStats} from '../player/PlayerStats.js';
export class DailyLife {
 constructor({clock,bus,inventory,position,shift}){Object.assign(this,{clock,bus,inventory,position,shift});this.stats=new PlayerStats();this.active=null;this.last=clock.seconds;this.serial=0;this.lunch=null;this.coffees=0;this.conversations=0;this.emptyTray=false;}
 near(item){return item&&Math.abs(this.position.y-(item.y??0))<.7&&Math.hypot(this.position.x-item.x,this.position.z-item.z)<2.6;}
 get carriedFood(){return this.inventory.find(f=>f.service==='dine-in')??this.inventory[0];}
 get carryKind(){return this.emptyTray?'empty-tray':this.carriedFood?(this.carriedFood.service==='dine-in'?'tray':'bento'):null;}
 buy(shop,item,service='takeaway'){if(!this.near(item)||this.active||!['takeaway','dine-in'].includes(service))return false;if(service==='dine-in'&&(this.emptyTray||this.inventory.some(f=>f.service==='dine-in')))return false;this.inventory.push({id:++this.serial,shop:shop.id,food:shop.food,service,time:this.clock.seconds,remaining:B.eatSeconds,bigChicken:!!this.research?.complete('fun-big-chicken')&&this.serial%3===1});this.bus.emit('FOOD_BOUGHT',{...shop,service});return true;}
 get canReturnTray(){return this.emptyTray||this.inventory.some(f=>f.service==='dine-in');}
 returnTray(item){if(!this.canReturnTray||!this.near(item)||item.kind!=='tray-return'||this.active)return false;const index=this.inventory.findIndex(f=>f.service==='dine-in'),discarded=index>=0;if(discarded)this.inventory.splice(index,1);this.emptyTray=false;this.bus.emit('TRAY_RETURNED',{discarded});return true;}
 start(type,item,extra={}){if(this.active||!this.near(item)||item.available?.()===false)return false;const kinds={research:['desk'],nap:['desk'],rest:['desk','dining'],eat:['desk','dining'],coffee:['coffee','shop'],chat:['colleague'],report:['desk'],'work-pc':['desk'],'work-field':['equipment','sub-equipment'],'handover-morning':['handover'],'handover-evening':['handover']};if(!kinds[type]?.includes(item.kind))return false;if(type==='coffee'&&item.kind==='shop'&&!['cafe','mart'].includes(item.shop?.id))return false;
  if(type==='research'&&(item.id!=='desk'||!this.research?.available(extra.researchId)||this.research.complete(extra.researchId)))return false;
  if(type==='nap'&&item.id!=='desk')return false;
  if(type==='eat'&&(!this.inventory.length||this.emptyTray||(this.carriedFood.service==='dine-in'&&item.kind!=='dining')))return false;if(type==='report'&&!this.shift.reportTask())return false;
  if(type.startsWith('handover-')&&!this.shift.canAttend(type.split('-')[1]))return false;
  const task=type.startsWith('work-')?this.work?.tasks.tasks.get(extra.taskId):null;if(type.startsWith('work-')&&(!this.work?.canStart(task,item,this.position)||type!==(this.work.step(task).place==='pc'?'work-pc':'work-field')))return false;
  const food=type==='eat'?this.carriedFood:null;const duration=type==='research'?this.research.remaining(extra.researchId):task?this.work.step(task).seconds-task.stepProgress:type==='nap'?B.napSeconds:type==='rest'?Infinity:type==='eat'?(food.remaining??B.eatSeconds):type==='coffee'?B.coffeeSeconds:type==='chat'?B.chatSeconds:type==='report'?B.reportSeconds:type==='handover-evening'?B.eveningEnd-this.clock.seconds:B.handoverSeconds;
  this.active={type,item,food,duration,remaining:duration,elapsed:0,...extra};this.bus.emit('LIFE_STARTED',this.active);return true;
 }
 stop(){if(!this.active)return;const a=this.active;this.active=null;this.bus.emit('LIFE_STOPPED',a);}
 update(){const dt=Math.max(0,this.clock.seconds-this.last);this.last=this.clock.seconds;const a=this.active,used=a?Math.min(dt,a.remaining):0;
  this.stats.update(used,a?.type==='nap'?B.napRecoveryPerHour:a?.type==='eat'?B.eatRecoveryPerHour:['rest','report','work-pc','research'].includes(a?.type)?B.restPerHour:0);this.stats.update(dt-used);
  if(!a)return;if(a.type==='research'){if(a.item.id!=='desk'||!this.near(a.item)){this.stop();return;}this.research.advance(a.researchId,used);}if(a.type.startsWith('work-')){const task=this.work.tasks.tasks.get(a.taskId);if(!this.work.canStart(task,a.item,this.position)){this.stop();return;}this.work.advance(a.taskId,used);}a.elapsed+=used;a.remaining=Math.max(0,a.remaining-used);
  if(a.type==='eat'){if(used>0&&this.lunch===null)this.lunch=this.clock.seconds-dt;this.stats.eat(used);a.food.remaining=a.remaining;}
  if(a.type==='coffee')this.stats.coffee(used);
  if(a.remaining<=1e-6){if(a.type==='eat'){this.inventory.splice(this.inventory.indexOf(a.food),1);if(a.food.service==='dine-in')this.emptyTray=true;}if(a.type==='coffee')this.coffees++;if(a.type==='chat')this.conversations++;if(a.type==='report')this.shift.completeReport();if(a.type.startsWith('handover-'))this.shift.attend(a.type.split('-')[1]);this.active=null;this.bus.emit('LIFE_COMPLETED',a);}
 }
 conversation(topic){if(topic==='lunch')return this.clock.seconds>=15*3600?'剛才才把便當吃完。你還沒吃的話，先去買一份，我這邊有狀況會打電話。':'樓下五家店都有開。你有空就先吃，不用等固定時間。';if(topic==='overtime')return this.clock.seconds>=B.eveningStart?'待會把尚未完成的項目寫清楚交給下一班，別只交一句「再觀察」。':'希望今天能準時走。PM 可以交給有空的助理，他會自己結案。';return this.shift.pending().length?`今天還有 ${this.shift.pending().length} 項工作。修好的機台記得通知 製程，忙不過來就找有空的助理接手。`:'目前設備穩定。沒 Alarm 的時候就把紀錄整理一下，也可以坐著休息。';}
}
