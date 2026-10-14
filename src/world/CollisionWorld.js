import {stairHeight} from '../data/stairs.js';
import { BALANCE } from '../data/balance.js';
const AXES = [['x','minX','maxX'],['y','minY','maxY'],['z','minZ','maxZ']];
export class CollisionWorld {
  constructor(rooms){this.rooms=rooms;this.ramps=[];this.boxes=[];this.cells=new Map();this.queryId=0;}
  key(x,z){return(x+1024)*2048+z+1024;}
  add(x,z,w,d,h=5.5,y=h/2,tag='solid'){
    const box={minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,minY:y-h/2,maxY:y+h/2,tag,enabled:true,queryId:0};this.boxes.push(box);
    for(let cx=Math.floor(box.minX/8);cx<=Math.floor(box.maxX/8);cx++)for(let cz=Math.floor(box.minZ/8);cz<=Math.floor(box.maxZ/8);cz++){const key=this.key(cx,cz);if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(box);}return box;
  }
  surfaceY(x,z,y){
    let nearest=null,distance=Infinity;
    for(const r of this.ramps)if(x>=r.minX&&x<=r.maxX&&z>=r.minZ&&z<=r.maxZ){const h=stairHeight(r,z),d=Math.abs(h-y);if(d<distance){nearest=h;distance=d;}}
    if(nearest!==null)return distance<.55?nearest:null;
    const floor=Math.round(y/6)*6;return Math.abs(floor-y)<.15?floor:null;
  }
  isWalkable(x,z,r=BALANCE.playerRadius,ignoreGate=false,y=0){
    const onRamp=this.ramps.some(a=>x>=a.minX&&x<=a.maxX&&z>=a.minZ&&z<=a.maxZ&&Math.abs(stairHeight(a,z)-y)<.08);
    if(!onRamp&&!this.rooms.some(a=>Math.abs((a.y??0)-y)<.5&&x>=a.x-a.w/2&&x<=a.x+a.w/2&&z>=a.z-a.d/2&&z<=a.z+a.d/2))return false;
    if(!onRamp&&this.ramps.some(a=>{const s=a.stair;return s?x>=s.minX&&x<=s.maxX&&z>=s.minZ-2&&z<=s.maxZ:x>=a.minX&&x<=a.maxX&&z>=a.minZ&&z<=a.maxZ;}))return false;
    const queryId=++this.queryId;
    for(let cx=Math.floor((x-r)/8);cx<=Math.floor((x+r)/8);cx++)for(let cz=Math.floor((z-r)/8);cz<=Math.floor((z+r)/8);cz++){
      const cell=this.cells.get(this.key(cx,cz));if(!cell)continue;
      for(const b of cell){if(b.queryId===queryId)continue;b.queryId=queryId;if(!b.enabled||b.tag==='floor'||(ignoreGate&&(b.tag==='gate'||b.tag==='lift-door'||b.tag==='lobby-card'||b.tag==='lobby-exit'))||b.minY>y+1.8||b.maxY<y+.08)continue;const dx=x-Math.max(b.minX,Math.min(x,b.maxX)),dz=z-Math.max(b.minZ,Math.min(z,b.maxZ));if(dx*dx+dz*dz<r*r)return false;}
    }
    return true;
  }
  move(position,dx,dz){
    const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/BALANCE.collisionStep));dx/=n;dz/=n;
    for(let i=0;i<n;i++)for(const [axis,delta] of [['x',dx],['z',dz]]){const x=position.x+(axis==='x'?delta:0),z=position.z+(axis==='z'?delta:0),y=this.surfaceY(x,z,position.y??0);if(y!==null&&this.isWalkable(x,z,BALANCE.playerRadius,false,y)){position[axis]+=delta;position.y=y;}}

  }
  cameraFraction(origin,end,padding=.22){
    let nearest=1;const queryId=++this.queryId;
    for(let cx=Math.floor((Math.min(origin.x,end.x)-padding)/8);cx<=Math.floor((Math.max(origin.x,end.x)+padding)/8);cx++)for(let cz=Math.floor((Math.min(origin.z,end.z)-padding)/8);cz<=Math.floor((Math.max(origin.z,end.z)+padding)/8);cz++){
    const cell=this.cells.get(this.key(cx,cz));if(!cell)continue;
    for(const b of cell){if(b.queryId===queryId)continue;b.queryId=queryId;if(!b.enabled)continue;let lo=0,hi=1;let hit=true;
      for(const [axis,min,max] of AXES){
        const delta=end[axis]-origin[axis],a=b[min]-padding,c=b[max]+padding;
        if(Math.abs(delta)<1e-8){if(origin[axis]<a||origin[axis]>c){hit=false;break;}}
        else{let t1=(a-origin[axis])/delta,t2=(c-origin[axis])/delta;if(t1>t2){const swap=t1;t1=t2;t2=swap;}lo=Math.max(lo,t1);hi=Math.min(hi,t2);if(lo>hi){hit=false;break;}}
      }
      if(hit&&hi>=0&&lo<nearest)nearest=Math.max(0,lo-.015);
    }}
    return nearest;
  }
}
