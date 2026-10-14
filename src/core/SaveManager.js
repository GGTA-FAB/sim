export const SAVE_VERSION=1;
export const SAVE_KEY='fab-simulator:career:v1';
const checksum=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return (h>>>0).toString(16);};
export class SaveManager {
 constructor(storage,key=SAVE_KEY){this.storage=storage;this.key=key;this.error='';this.recovered=false;}
 decode(raw){const e=JSON.parse(raw);if(e.version!==SAVE_VERSION)throw Error('存檔版本不相容');if(typeof e.payload!=='string'||checksum(e.payload)!==e.checksum)throw Error('存檔完整性檢查失敗');const d=JSON.parse(e.payload);if(!Number.isInteger(d.day)||d.day<1||!Number.isFinite(d.seed)||!Array.isArray(d.history)||!d.plan||d.plan.day!==d.day)throw Error('存檔資料不完整');return d;}
 load(validate=()=>{}){this.validate=validate;let found=false;for(const suffix of ['',':backup']){try{const raw=this.storage.getItem(this.key+suffix);if(!raw)continue;found=true;const d=this.decode(raw);validate(d);this.recovered=!!suffix;this.error=suffix?'已從上一份備份恢復。':'';return d;}catch{found=true;}}if(found)this.error='存檔無法讀取，原資料已保留。可匯出備份；開始新遊戲前請確認。';return null;}
 save(data){try{const payload=JSON.stringify(data),raw=JSON.stringify({version:SAVE_VERSION,checksum:checksum(payload),payload});const old=this.storage.getItem(this.key);if(old){try{const decoded=this.decode(old);this.validate?.(decoded);this.storage.setItem(this.key+':backup',old);}catch{}}
  this.storage.setItem(this.key,raw);this.error='';return true;
 }catch{this.error='無法儲存：瀏覽器儲存空間不足或已封鎖。請匯出存檔並保留此頁。';return false;}}
}
