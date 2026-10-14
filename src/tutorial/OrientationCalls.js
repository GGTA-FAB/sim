// Three light calls over day one, with seeded jitter and no catch-up burst.
export function orientationSlots(seed){return [10.5,12.5,14.5].map((hour,i)=>hour*3600+((Math.abs(seed)+i*347)%1200));}
export function updateOrientationCalls(g,s){
 if(g.fastForwarding||!s.phoneDone||g.clock.seconds>=16*3600)return;
 const slots=orientationSlots(g.seed),now=g.clock.seconds;
 while(s.ambientCalls<slots.length&&now>slots[s.ambientCalls]+2400)s.ambientCalls++;
 if(s.ambientCalls>=slots.length||now<slots[s.ambientCalls]||g.phone.active||g.phone.queue.length||g.phone.gap>0)return;
 const last=g.phone.history[0];if(last&&now-last.ended<2400)return;
 const role=s.ambientCalls===1?'process':'manufacturing',contacts=g.phone.contacts.filter(c=>c.role===role),person=contacts[s.ambientCalls%contacts.length];
 const ids=g.alarms.owned.filter(id=>!g.shift.isTransferred(id));
 if(person&&ids.length&&g.phone.enqueue(person.id,ids[s.ambientCalls%ids.length],'tutorial-status'))s.ambientCalls++;
}
