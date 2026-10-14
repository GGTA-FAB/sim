import { REPAIR_GAMES } from '../data/repairGames.js';
import { index,total,shuffled } from './helpers.js';
const C=REPAIR_GAMES.leak;
export const LeakCheck={create:r=>({leaks:shuffled(C.count,r).slice(0,2),scans:Array(C.count).fill(0),seals:Array(C.count).fill(0)}),input(){},update(s,dt,h){if(!h||!index(h.index,C.count))return;const i=h.index;if(h.action==='scan'&&s.scans[i]<C.scanSeconds)s.scans[i]=Math.min(C.scanSeconds,s.scans[i]+dt);else if(h.action==='seal'&&s.scans[i]>=C.scanSeconds&&s.leaks.includes(i))s.seals[i]=Math.min(C.sealSeconds,s.seals[i]+dt);},progress:s=>(total(s.scans)+total(s.seals))/(C.count*C.scanSeconds+2*C.sealSeconds)};
