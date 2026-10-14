import * as T from 'three';
import {Player} from '../player/Player.js';
import {bakeCharacter,characterMaterial} from '../player/CharacterRig.js';
const CYCLE=12;let atlas;
function poses(){if(atlas)return atlas;const a=new Player(new T.Group());a.position.set(0,0,0);a.setGowned(true);atlas=[];
 for(let i=0;i<=CYCLE;i++){a.phase=i/CYCLE*Math.PI*2;a.motion=i===CYCLE?0:1;a.applyPose(0,i===CYCLE?0:1.35);atlas.push(bakeCharacter(a));}
 return atlas;
}
// Shared pose geometry: distant workers retain the same rounded silhouette without
// a skeleton, materials or per-frame vertex allocations for every person in every bay.
export class CharacterCrowd {
 constructor(parent,count){this.group=new T.Group();parent.add(this.group);this.meshes=poses().map(g=>{const m=new T.InstancedMesh(g,characterMaterial,count);m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.frustumCulled=false;m.count=0;this.group.add(m);return m;});this.counts=new Uint16Array(CYCLE+1);this.transform=new T.Object3D();this.styleVersion='B-v2';}
 begin(visible){this.group.visible=visible;this.counts.fill(0);}
 set(n,now){const alpha=T.MathUtils.clamp((now-n.lastUpdate)/n.lastDt,0,1),x=T.MathUtils.lerp(n.prevX,n.x,alpha),z=T.MathUtils.lerp(n.prevZ,n.z,alpha);
  const frame=n.speed?Math.floor(((now*1.35+n.phase*.173) % 1)*CYCLE):CYCLE,mesh=this.meshes[frame],i=this.counts[frame]++;
  this.transform.position.set(x,0,z);this.transform.rotation.set(0,n.heading,0);this.transform.scale.setScalar(1);this.transform.updateMatrix();mesh.setMatrixAt(i,this.transform.matrix);
 }
 end(){for(let i=0;i<this.meshes.length;i++){const m=this.meshes[i];m.count=this.counts[i];m.visible=m.count>0;if(m.count)m.instanceMatrix.needsUpdate=true;}}
}
