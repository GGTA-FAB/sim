export const clamp=v=>Math.max(0,Math.min(100,Number.isFinite(Number(v))?Number(v):0));
export const index=(i,n)=>Number.isInteger(i)&&i>=0&&i<n;
export const total=a=>a.reduce((s,n)=>s+n,0);
export function shuffled(n,random){const a=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
