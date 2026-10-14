const ringtoneURL=new URL('../assets/phone-ringtone.mp3',import.meta.url).href;
// Local user-provided MP3. One Web Audio source at a time; Pause preserves playback position.
export class Ringtone {
 constructor(){this.id=null;this.paused=true;this.offset=0;this.source=null;this.buffer=null;this.error=null;this.load();}
 load(){this.bytes=fetch(ringtoneURL).then(r=>{if(!r.ok)throw Error('ringtone HTTP '+r.status);return r.arrayBuffer();});this.bytes.catch(e=>{this.error=e.message;});}
 unlock(){try{if(this.error){this.error=null;this.decoding=null;this.load();}this.context??=new(window.AudioContext||window.webkitAudioContext)();this.context.onstatechange=()=>this.sync();this.context.resume().then(()=>this.sync()).catch(e=>{this.error=e.message;});if(!this.decoding){this.decoding=this.bytes.then(bytes=>this.context.decodeAudioData(bytes)).then(buffer=>{this.buffer=buffer;this.error=null;this.sync();}).catch(e=>{this.error=e.message;});}}catch(e){this.error=e.message;}}
 set(id,paused=false){if(id!==this.id){this.stop();this.offset=0;this.id=id;}this.paused=paused;this.sync();}
 stop(){if(!this.source)return;this.offset+=(this.context.currentTime-this.started);this.source.onended=null;this.source.stop();this.source.disconnect();this.gain.disconnect();this.source=null;}
 sync(){if(!this.id||this.paused||this.context?.state!=='running'||!this.buffer){this.stop();return;}if(this.source)return;const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=this.buffer;source.loop=true;gain.gain.value=.65;source.connect(gain);gain.connect(this.context.destination);this.source=source;this.gain=gain;this.started=this.context.currentTime;source.start(0,this.offset%this.buffer.duration);}
 get needsGesture(){return this.id&&!this.paused&&this.context?.state!=='running';}
}
