import {ASSISTANT_REPORT} from './AssistantReport.js';
import { PHONE_BALANCE as B } from '../data/phone.js';
export class PhoneSystem {
 constructor({contacts,clock,bus,dialogue,apply,valid=()=>true}){Object.assign(this,{contacts,clock,bus,dialogue,apply,valid});this.byId=new Map(contacts.map(c=>[c.id,c]));this.active=null;this.queue=[];this.history=[];this.serial=0;this.gap=0;this.unread=0;}
 enqueue(contactId,equipmentId,reason='status',details={}){
  if(!this.byId.has(contactId)||this.byId.get(contactId).onLeave||this.queue.length>=B.queueLimit||[this.active,...this.queue].some(c=>c?.contactId===contactId&&c.equipmentId===equipmentId))return false;
  const c={contactId,equipmentId,reason,queued:this.clock.seconds,...(reason===ASSISTANT_REPORT?{report:details.report}:{})};if(!this.valid(c))return false;this.queue.push(c);this.bus.emit('PHONE_QUEUE_CHANGED');return true;
 }
 begin(data,direction){this.active={...data,id:++this.serial,direction,phase:direction==='incoming'?'RINGING':'DIALING',remaining:direction==='incoming'?B.ringSeconds:B.dialSeconds,started:this.clock.seconds,talkElapsed:0,selected:null};this.bus.emit('PHONE_CALL_STARTED',this.active);}
 dial(contactId,equipmentId){if(this.active||!this.byId.has(contactId)||(this.byId.get(contactId).retired||this.byId.get(contactId).onLeave))return false;this.begin({contactId,equipmentId,reason:'outgoing'},'outgoing');return true;}
 answer(){const c=this.active;if(c?.phase!=='RINGING')return false;this.connect();return true;}
 connect(){const c=this.active;if(!c)return;c.phase='CONNECTED';c.answered=this.clock.seconds;c.remaining=B.talkSeconds;c.dialogue=this.dialogue(c);this.bus.emit('PHONE_CALL_ANSWERED',c);}
 respond(index){const c=this.active;if(c?.phase!=='CONNECTED'||c.selected!==null||!Number.isInteger(index)||!c.dialogue.options[index])return false;const option=c.dialogue.options[index];c.selected=index;c.reply=this.apply(c,option)??option.reply;c.remaining=Math.max(1,B.replyMinSeconds-c.talkElapsed);this.bus.emit('PHONE_RESPONSE',c);return true;}
 hangup(){if(!this.active)return;const c=this.active;this.finish(c.phase==='RINGING'?'Missed':c.phase==='DIALING'?'Cancelled':c.direction==='incoming'?'Answered':'Outgoing',c.phase==='RINGING'?'declined':'hangup');}
 finish(status,reason){const c=this.active;if(!c)return;const record={...c,status,endReason:reason,ended:this.clock.seconds};this.history.unshift(record);this.history.length=Math.min(B.historyLimit,this.history.length);if(status==='Missed'){this.unread++;this.bus.emit('PHONE_CALL_MISSED',record);}this.active=null;this.gap=B.betweenCallsSeconds;this.bus.emit('PHONE_CALL_ENDED',record);}
 markRead(){this.unread=0;}
 update(dt){
  if(this.active){const c=this.active;c.remaining=Math.max(0,c.remaining-dt);if(c.phase==='CONNECTED')c.talkElapsed+=dt;if(c.remaining<=0){if(c.phase==='RINGING')this.finish('Missed','timeout');else if(c.phase==='DIALING')this.connect();else this.finish(c.direction==='incoming'?'Answered':'Outgoing','complete');}return;}
  this.gap=Math.max(0,this.gap-dt);if(this.gap>0)return;
  while(this.queue.length){const c=this.queue.shift();if((c.reason!==ASSISTANT_REPORT&&this.clock.seconds-c.queued>B.queueExpiryGameSeconds)||!this.valid(c))continue;this.begin(c,'incoming');break;}
 }
}
