import {AUTO_REPAIR_SECONDS} from '../data/research.js';
import { MINIGAMES,repairProgress } from '../minigames/registry.js';
// Task owns the serializable puzzle; held pointers are transient and never survive interruption.
export class RepairSystem {
 constructor(alarms,bus){this.alarms=alarms;this.bus=bus;this.active=null;this.held=null;}
 start(id,mode='manual'){const t=this.alarms.get(id);if(t?.status!=='DOWN'||t.assistantId||!['manual','auto'].includes(mode)||(mode==='auto'&&!this.research?.allows(t.repair.type)))return false;this.release();this.mode=mode;this.active=t;this.bus.emit('REPAIR_STARTED',t);return true;}
 suspend(){this.release();if(this.active)this.bus.emit('REPAIR_SUSPENDED',this.active);this.active=null;}
 release(){this.held=null;}
 hold(action){if(this.active&&this.mode!=='auto')this.held=action;}
 input(action){const r=this.active?.repair;if(r&&this.mode!=='auto')MINIGAMES[r.type].input(r.state,action);}
 setValue(value){this.input({action:'value',value});}
 update(dt){const t=this.active;if(!t||t.status!=='DOWN')return;const r=t.repair;if(this.mode==='auto')r.autoProgress=Math.min(1,repairProgress(r)+Math.max(0,dt)*(this.efficiency??1)/AUTO_REPAIR_SECONDS);else MINIGAMES[r.type].update(r.state,Math.max(0,dt)*(this.efficiency??1),this.held);if(repairProgress(r)>=1){this.release();this.active=null;this.alarms.repaired(t);}}
 get progress(){return repairProgress(this.active?.repair);}
}

