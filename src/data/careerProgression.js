export const RANKS=[
 {name:'工程師',assistants:1,equipment:6,description:'親自查案與修機，安排一位助工。'},
 {name:'資深工程師',assistants:2,equipment:9,description:'帶兩位助工，協調更多設備與保養。'},
 {name:'主任工程師',assistants:3,equipment:12,description:'帶三位助工，統籌整個設備小組。'},
 {name:'副理',assistants:4,equipment:16,description:'領班安排日常工作，你負責重要決策與交接會議。'},
];
export const CAREER_INTRO='每七個工作日會打一次考績。第一週是適應期，不評等；完成第七天直接晉升資深工程師。之後拿 O 或累積兩次 S+ 可再升一階。';
export const yearOf=day=>Math.floor((day-1)/7)+1;
export function newProgression(rank=0){return {version:2,rank,sPlusCredits:0,pending:null,reviews:[],lastPromotion:null,management:null};}
export function evaluateYear(history,week){
 const days=history.filter(d=>d.day>=(week-1)*7+1&&d.day<=week*7);
 if(new Set(days.map(d=>d.day)).size!==7)return null;
 let total=0,done=0,meetings=0;
 for(const d of days){total+=d.workTotal??((d.completed??0)+(d.transferred??0));done+=d.workDone??d.completed??0;meetings+=Number(!d.missedMorning)+Number(!d.missedEvening);}
 const completion=total?Math.min(1,done/total):1,attendance=meetings/14,score=Math.round(completion*80+attendance*20);
 const grade=score>=90?'O':score>=80?'S+':score>=65?'S':score>=50?'S-':'I';
 return {week,grade,score,completion:Math.round(completion*100),attendance:Math.round(attendance*100),total,done};
}
function promote(p,day,review,reason){
 p.rank++;p.sPlusCredits=0;p.pending=null;p.lastPromotion={day,rank:p.rank,reason};
 if(review)review.promotedTo=p.rank;
}
// Version 1 careers keep their earned rank; outstanding promotions no longer wait.
export function upgradeProgression(p,day,history=[]){
 const originalRank=p.rank;
 if(p.version===1){
 const oldPromotionDay=p.lastPromotion?.day??0,pending=p.pending;
 p.version=2;p.sPlusCredits=0;p.pending=null;
 if(pending&&p.rank<3){promote(p,day,p.reviews.find(r=>r.week===pending.earnedWeek),'O');}
 for(const r of [...p.reviews].sort((a,b)=>a.week-b.week)){
  if((pending?r.week<=pending.earnedWeek:r.week*7<oldPromotionDay)||p.rank===3)continue;
  if(r.grade==='S+')p.sPlusCredits++;
  if(p.sPlusCredits===2||pending&&r.grade==='O')promote(p,day,r,r.grade);
 }
 }
 // Existing engineers who already completed their first week also graduate.
 if(p.rank===0&&(p.reviews.some(r=>r.week===1)||evaluateYear(history,1))){
  const r={week:1,kind:'onboarding',sPlusCredits:0};p.reviews=p.reviews.filter(r=>r.week!==1);p.reviews.push(r);promote(p,day,r,'onboarding');
 }
 return p.rank!==originalRank;
}
export function reviewYear(p,history,day){
 if(day%7)return null;const week=yearOf(day);
 if(p.reviews.some(r=>r.week===week))return null;
 const review=evaluateYear(history,week);if(!review)return null;
 if(week===1&&p.rank===0){const r={week:1,kind:'onboarding',sPlusCredits:0};p.reviews.push(r);promote(p,day,r,'onboarding');return r;}
 upgradeProgression(p,day);p.reviews.push(review);
 if(p.rank<3){
  if(review.grade==='S+')p.sPlusCredits++;
  if(review.grade==='O'||p.sPlusCredits>=2)promote(p,day,review,review.grade);
 }
 review.sPlusCredits=p.sPlusCredits;
 return review;
}
export function enterYear(p,day){return upgradeProgression(p,day);}
export function progressionText(p,day){
 if(p.lastPromotion?.day===day||p.lastPromotion?.day===day-1)return `正式擢升${RANKS[p.rank].name}，升遷已生效。`;
 return RANKS[p.rank].description;
}
export function validateProgression(p){if(p===undefined)return;if(!p||![1,2].includes(p.version)||!Number.isInteger(p.rank)||p.rank<0||p.rank>3||!Array.isArray(p.reviews))throw Error('Invalid career progression');if(p.version===2&&(!Number.isInteger(p.sPlusCredits)||p.sPlusCredits<0||p.sPlusCredits>1||p.pending))throw Error('Invalid promotion credits');if(p.reviews.some(r=>!Number.isInteger(r.week)||r.week<1||(r.kind==='onboarding'?(r.week!==1||r.promotedTo!==1||r.grade!==undefined||r.score!==undefined):(!['I','S-','S','S+','O'].includes(r.grade)||!Number.isFinite(r.score)||r.score<0||r.score>100))||(r.promotedTo!==undefined&&(!Number.isInteger(r.promotedTo)||r.promotedTo<1||r.promotedTo>3))||(r.sPlusCredits!==undefined&&![0,1].includes(r.sPlusCredits)))||new Set(p.reviews.map(r=>r.week)).size!==p.reviews.length)throw Error('Invalid annual review');if(p.pending&&(!Number.isInteger(p.pending.earnedWeek)||p.pending.earnedWeek<1||p.pending.from!==p.rank||p.pending.to!==p.rank+1||p.pending.to>3||p.pending.effectiveWeek!==p.pending.earnedWeek+2))throw Error('Invalid promotion');if(p.management&&(!Number.isInteger(p.management.day)||!['balanced','repair','pm'].includes(p.management.policy)||!Array.isArray(p.management.choices)||p.management.choices.length>2||new Set(p.management.choices.map(c=>c.id)).size!==p.management.choices.length||p.management.choices.some(x=>!Number.isInteger(x.id)||x.id<0||x.id>1||!['repair','pm','balanced'].includes(x.policy))))throw Error('Invalid leadership state');}
