import { REPAIR_GAMES } from '../data/repairGames.js';
import { index,total } from './helpers.js';
const C=REPAIR_GAMES.cleaning;
export const ChamberCleaning={create:()=>({clean:Array(C.count).fill(0)}),input(){},update(s,dt,h){if(h?.action==='clean'&&index(h.index,C.count))s.clean[h.index]=Math.min(C.seconds,s.clean[h.index]+dt);},progress:s=>total(s.clean)/(C.count*C.seconds)};
