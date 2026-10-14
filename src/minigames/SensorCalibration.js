import { REPAIR_GAMES } from '../data/repairGames.js';
import { clamp } from './helpers.js';
const C=REPAIR_GAMES.sensor;
export const SensorCalibration={create:r=>({stage:0,hold:0,value:15,targets:Array.from({length:C.count},()=>25+Math.floor(r()*50))}),input(s,a){if(a.action==='value')s.value=clamp(a.value);},update(s,dt){if(Math.abs(s.value-s.targets[s.stage])>C.tolerance)return;s.hold=Math.min(C.seconds,s.hold+dt);if(s.hold>=C.seconds){s.stage++;s.hold=0;s.value=15;}},progress:s=>(s.stage+s.hold/C.seconds)/C.count};
