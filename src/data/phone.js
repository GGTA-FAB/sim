export const CONTACT_NAMES=['陳志明','林美玲','許大勇','張阿哲','吳淑芬','李國雄'];
export const DEPARTMENTS={manufacturing:'製造部',process:'製程',equipment:'設備',assistant:'助理工程師',manager:'設備主管'};
export const PHONE_BALANCE={ringSeconds:60,dialSeconds:2,talkSeconds:9,replyMinSeconds:5,queueLimit:4,historyLimit:100,betweenCallsSeconds:45,queueExpiryGameSeconds:2400,firstDelayMin:300,firstDelayMax:600,repeatMin:2400,repeatMax:4200,processReminder:1800,processMin:3600,processMax:5400,mfgStatusMin:3600,mfgStatusMax:5400,managerMin:4500,managerMax:7200,managerDownAge:1200};
export const MANAGER_CONTACT={id:'manager-0',name:'廖經理',role:'manager',department:'設備主管',personality:'impatient',extension:'2107'};
export const PERSONALITIES={calm:{label:'沉穩',prefix:'方便確認一下嗎？'},impatient:{label:'急性子',prefix:'產線這邊還在等，'},talkative:{label:'健談',prefix:'我剛跟現場確認了一下，想再問你，'},formal:{label:'正式',prefix:'您好，請協助確認：'},nervous:{label:'謹慎',prefix:'不好意思，我想再確認一次，'}};
export function createContacts(random,npcs=[]){const roles=['manufacturing','manufacturing','manufacturing','process','process','equipment'],used=new Set();return roles.map((role,i)=>{const npc=npcs.find(n=>n.role.id===role&&!used.has(n.id));if(npc)used.add(npc.id);const personality=Object.keys(PERSONALITIES)[Math.floor(random()*5)],name=CONTACT_NAMES[i];if(npc){npc.name=name;npc.personality=personality;}return{id:`contact-${i}`,npcId:npc?.id??null,name,role,department:DEPARTMENTS[role],personality,extension:String(2101+i)};}).concat({...MANAGER_CONTACT});}

// Senior/principal engineers receive about 25% more routine contact attempts.
export const RANK_CALL_INTERVAL=[1,.8,.8,1];
