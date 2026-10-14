import { REPAIR_GAMES } from '../data/repairGames.js';
import { clamp } from './helpers.js';
const C=REPAIR_GAMES.robot;
export const RobotAlignment={create:r=>({stage:0,hold:0,x:10,y:10,targets:Array.from({length:C.count},()=>({x:25+Math.floor(r()*50),y:25+Math.floor(r()*50)}))}),input(s,a){if(a.action==='x'||a.action==='y')s[a.action]=clamp(a.value);},update(s,dt){const t=s.targets[s.stage];if(!t||Math.abs(s.x-t.x)>C.tolerance||Math.abs(s.y-t.y)>C.tolerance)return;s.hold=Math.min(C.seconds,s.hold+dt);if(s.hold>=C.seconds){s.stage++;s.hold=0;s.x=s.y=10;}},progress:s=>(s.stage+s.hold/C.seconds)/C.count};
