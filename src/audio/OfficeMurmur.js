// Soft, unintelligible conversation texture synthesized locally; no recordings or speech API.
// Fixed voiced/formant sources emulate syllables and alternating conversational turns.
const VOWELS=[[600,1100,2400],[350,1800,2600],[450,800,2300],[700,1400,2700]];
export class OfficeMurmur {
 constructor(context,master){
  this.c=context;this.level=0;this.voices=[125,183,151].map((pitch,i)=>{
   const source=context.createOscillator(),amp=context.createGain(),pan=context.createStereoPanner();source.type='sawtooth';source.frequency.value=pitch;amp.gain.value=0;amp.connect(pan);pan.connect(master);
   const filters=VOWELS[0].map((hz,j)=>{const filter=context.createBiquadFilter(),weight=context.createGain();filter.type='bandpass';filter.frequency.value=hz;filter.Q.value=5;weight.gain.value=[.6,.25,.1][j];source.connect(filter);filter.connect(weight);weight.connect(amp);return filter;});source.start();return {source,amp,pan,filters,pitch,index:i};
  });
 }
 update(g,at,quiet){
  const p=g.player.position,inOffice=Math.abs(p.y-6)<2&&p.z<52;let nearest=Infinity,x=-9,z=19;
  if(inOffice){for(const n of g.officePeople.entities){if(n.state!=='DISCUSS'&&!n.chatting)continue;const d=Math.hypot(p.x-n.position.x,p.z-n.position.z);if(d<nearest){nearest=d;x=n.position.x;z=n.position.z;}}
   if(g.world.meeting.group.visible){const d=Math.hypot(p.x,p.z-39);if(d<nearest){nearest=d;x=0;z=39;}}
  }
  const duck=g.phone.active?.phase==='RINGING'||g.phone.active?.phase==='CONNECTED'?.25:1;
  this.level=quiet||!inOffice||!Number.isFinite(nearest)?0:Math.max(0,1-nearest/32)*duck;
  const t=g.officePeople.elapsed,pan=Math.max(-.8,Math.min(.8,((x-p.x)*Math.cos(g.input.yaw)-(z-p.z)*Math.sin(g.input.yaw))/14));
  for(const v of this.voices){const turn=(t+v.index*4.1)%12,syllable=t*(3.1+v.index*.27)+v.index*.8,envelope=Math.max(0,Math.sin(syllable*Math.PI))**.7,talking=turn<4.8&&turn>.25;
   v.amp.gain.setTargetAtTime(this.level*(talking?.10*envelope:0),at,.06);v.pan.pan.setTargetAtTime(pan+(v.index-1)*.1,at,.25);v.source.frequency.setTargetAtTime(v.pitch*(1+.045*Math.sin(t*2.2+v.index)+.025*Math.sin(t*5.1)),at,.07);const vowel=VOWELS[(Math.floor(syllable)+v.index)%VOWELS.length];v.filters.forEach((f,j)=>f.frequency.setTargetAtTime(vowel[j],at,.05));
  }
 }
}
