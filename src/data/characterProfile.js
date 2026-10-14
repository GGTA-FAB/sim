export const DEFAULT_NAME='新進工程師';
export function characterName(value){return typeof value==='string'?value.normalize('NFKC').replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,'').trim().slice(0,20):'';}
export function entryRank(){return 0;}
export function validateProfile(profile){if(profile===undefined)return;if(!profile||typeof profile.name!=='string'||!profile.name||profile.name!==characterName(profile.name))throw Error('Invalid character profile');}
