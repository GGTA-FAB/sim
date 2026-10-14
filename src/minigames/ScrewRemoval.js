import { REPAIR_GAMES } from '../data/repairGames.js';
import { index,total } from './helpers.js';
const C=REPAIR_GAMES.screw;
export const ScrewRemoval={create:()=>({turns:Array(C.count).fill(0)}),input(){},update(s,dt,h){if(h?.action==='screw'&&index(h.index,C.count))s.turns[h.index]=Math.min(C.seconds,s.turns[h.index]+dt);},progress:s=>total(s.turns)/(C.count*C.seconds)};
