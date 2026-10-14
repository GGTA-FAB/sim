import {createRandom} from '../core/Random.js';
// Rolled once per day, independently of workload. Stored in the day plan.
export function assistantLeave(seed,day,capacity=3){
 if(day===1||capacity<=1)return [];
 const random=createRandom(seed^Math.imul(day,0x17a9f3)^0x71eafe),roll=random();
 const count=Math.min(capacity-1,roll<.85?0:roll<.985?1:2),ids=Array.from({length:capacity},(_,i)=>`assistant-${i}`);
 for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
 return ids.slice(0,count).sort();
}
