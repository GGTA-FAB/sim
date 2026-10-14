import { REPAIR_GAMES } from '../data/repairGames.js';
import { index,shuffled } from './helpers.js';
const C=REPAIR_GAMES.replacement;
export const PartReplacement={create:r=>({stage:0,hold:0,correct:Math.floor(r()*3),order:shuffled(3,r),selected:null,message:''}),input(s,a){if(a.action==='part'&&s.stage===1&&index(a.index,3)){if(a.index!==s.correct){s.message='料號或 Revision 不符，請再確認標籤。';return;}s.selected=a.index;s.message='料件符合，可以安裝。';}},update(s,dt,h){const action=['remove','install','verify'][s.stage];if(h?.action!==action||s.stage===1&&s.selected!==s.correct)return;s.hold=Math.min(C.seconds,s.hold+dt);if(s.hold>=C.seconds){s.stage++;s.hold=0;s.message='';}},progress:s=>(s.stage+s.hold/C.seconds)/C.count};
