import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PlushCharacter } from './PlushCharacter.js';

// Compile the approved character into shared, vertex-colored parts. Ten moving parts,
// two outfits, one material: no duplicate preview scene or high-cost fabric shader per NPC.
export const characterMaterial = new T.MeshStandardMaterial({vertexColors:true,roughness:.83});
const cache=new Map();let source;
const position=new T.Vector3(),normal=new T.Vector3(),normalMatrix=new T.Matrix3();
const skins=[0xebba92,0xd7a57f,0xf0c5a1,0xc79876,0xe3b698,0xcfa489];
const hairs=[0x29292e,0x39302c,0x343a42,0x25232b,0x54463d,0x373337];
function anchor(parent,p){const g=new T.Group();g.position.copy(p);parent.add(g);return g;}
function visible(mesh){for(let n=mesh;n;n=n.parent)if(!n.visible)return false;return true;}
function below(mesh,parent){for(let n=mesh;n;n=n.parent)if(n===parent)return true;return false;}
function tint(material,variant,shirt){const color=material.color.clone(),hex=color.getHex();
 if(hex===0xebba92)color.setHex(skins[variant%skins.length]);
 if(hex===0x29292e||hex===0x343439)color.setHex(hairs[variant%hairs.length]);
 if(shirt!=null&&(hex===0x274e68||hex===0x4a7689)){color.setHex(shirt);if(hex===0x4a7689)color.lerp(new T.Color(0xffffff),.18);}
 return color;
}
// Bake world-space skin deformation before merging, including seated elbows and knees.
export function bakeMesh(mesh,transform=new T.Matrix4(),color=mesh.material.color){
 const src=mesh.geometry,out=new T.BufferGeometry(),p=src.attributes.position,positions=new Float32Array(p.count*3),colors=new Float32Array(p.count*3);
 const matrix=new T.Matrix4().multiplyMatrices(transform,mesh.matrixWorld);
 for(let i=0;i<p.count;i++){position.fromBufferAttribute(p,i);if(mesh.isSkinnedMesh)mesh.applyBoneTransform(i,position);position.applyMatrix4(matrix);position.toArray(positions,i*3);color.toArray(colors,i*3);}
 out.setAttribute('position',new T.BufferAttribute(positions,3));out.setAttribute('color',new T.BufferAttribute(colors,3));if(src.index)out.setIndex(src.index.clone());else out.setIndex(Array.from({length:p.count},(_,i)=>i));
 if(src.attributes.normal&&!mesh.isSkinnedMesh){const ns=new Float32Array(p.count*3);normalMatrix.getNormalMatrix(matrix);for(let i=0;i<p.count;i++){normal.fromBufferAttribute(src.attributes.normal,i).applyNormalMatrix(normalMatrix);normal.toArray(ns,i*3);}out.setAttribute('normal',new T.BufferAttribute(ns,3));}else out.computeVertexNormals();
 return out;
}
function merge(parts){if(!parts.length)return null;const g=mergeGeometries(parts);for(const p of parts)p.dispose();g.computeBoundingSphere();return g;}
function template(variant,shirt){const key=`${variant%6}:${shirt??'default'}`;if(cache.has(key))return cache.get(key);
 source??=new PlushCharacter({detail:'game'});const model=source,headY=1.830,sets=[];
 for(const gowned of [false,true]){
  model.setGowned(gowned);model.update(0,'idle');for(const e of model.elbows)e.rotation.x=0;for(const k of model.knees)k.rotation.x=0;for(const pairs of [...model.armBones,...model.legBones])for(const b of pairs)b.rotation.x=0;
  model.group.updateMatrixWorld(true);model.group.traverse(m=>{if(m.isSkinnedMesh)m.skeleton.update();});
  const parts={body:[],head:[],badge:[],hands:[[],[]],feet:[[],[]]},skinned={arms:[],legs:[]};
  model.group.traverse(m=>{if(!m.isMesh||!visible(m)||m.material.transparent)return;
   const col=tint(m.material,variant,shirt);
   if(m.isSkinnedMesh){const type=model.arms.findIndex(a=>below(m,a)),i=type>=0?type:model.legs.findIndex(a=>below(m,a));const g=m.geometry.clone(),colors=new Float32Array(g.attributes.position.count*3);for(let j=0;j<colors.length;j+=3)col.toArray(colors,j);g.setAttribute('color',new T.BufferAttribute(colors,3));g.deleteAttribute('uv');skinned[type>=0?'arms':'legs'][i]=g;return;}
   let target,transform=new T.Matrix4();const hand=model.elbows.findIndex(a=>below(m,a)),foot=model.feet.findIndex(a=>below(m,a));
   if(hand>=0){target=parts.hands[hand];transform.copy(model.elbows[hand].matrixWorld).invert();}
   else if(foot>=0){target=parts.feet[foot];transform.copy(model.feet[foot].matrixWorld).invert();}
   else{
    m.geometry.computeBoundingBox();const b=m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
    if(b.min.y>1.6||b.max.y>2.05){target=parts.head;transform.makeTranslation(0,-headY,0);}
    else if(!gowned&&b.min.z>.212&&b.min.y>1.06&&b.max.y<1.23&&b.min.x>-.06&&b.max.x<.06){target=parts.badge;transform.makeTranslation(0,-1.147,-.227);}
    else target=parts.body;
   }
   target.push(bakeMesh(m,transform,col));
  });
  sets.push({body:merge(parts.body),head:merge(parts.head),badge:merge(parts.badge),hands:parts.hands.map(merge),feet:parts.feet.map(merge),...skinned});
 }
 const data={sets,arms:model.arms.map(a=>a.position.clone()),elbows:model.elbows.map(a=>a.position.clone()),legs:model.legs.map(a=>a.position.clone()),knees:model.knees.map(a=>a.position.clone()),feet:model.feet.map(a=>a.position.clone())};cache.set(key,data);return data;
}
function part(parent,geo){if(!geo)return null;const m=new T.Mesh(geo,characterMaterial);m.castShadow=true;parent.add(m);return m;}
function skin(parent,geo,offset){const m=new T.SkinnedMesh(geo,characterMaterial),root=new T.Bone(),bend=new T.Bone();bend.position.copy(offset);root.add(bend);m.add(root);m.bind(new T.Skeleton([root,bend]));m.castShadow=true;parent.add(m);return {mesh:m,bone:bend};}
export function createCharacterRig(parent,{variant=0,shirt}={}){
 const data=template(variant,shirt),rig=new T.Group();parent.add(rig);rig.scale.setScalar(.90);
 const head=anchor(rig,new T.Vector3(0,1.830,0)),badge=anchor(rig,new T.Vector3(0,1.147,.227));
 const r={rig,head,badge,arms:[],elbows:[],legs:[],knees:[],feet:[],armBones:[[],[]],legBones:[[],[]],outfits:[[],[]],styleVersion:'B-v2'};
 for(let i=0;i<2;i++){r.arms[i]=anchor(rig,data.arms[i]);r.arms[i].rotation.z=(i?1:-1)*.10;r.elbows[i]=anchor(r.arms[i],data.elbows[i]);r.legs[i]=anchor(rig,data.legs[i]);r.knees[i]=anchor(r.legs[i],data.knees[i]);r.feet[i]=anchor(r.knees[i],data.feet[i]);}
 data.sets.forEach((s,j)=>{const list=r.outfits[j];list.push(part(rig,s.body),part(head,s.head),part(badge,s.badge));
  for(let i=0;i<2;i++){const arm=skin(r.arms[i],s.arms[i],data.elbows[i]),leg=skin(r.legs[i],s.legs[i],data.knees[i]);r.armBones[i].push(arm.bone);r.legBones[i].push(leg.bone);list.push(arm.mesh,leg.mesh,part(r.elbows[i],s.hands[i]),part(r.feet[i],s.feet[i]));}
 });return r;
}
export function syncCharacterBones(actor){for(let i=0;i<2;i++){for(const b of actor.armBones[i])b.rotation.copy(actor.elbows[i].rotation);for(const b of actor.legBones[i])b.rotation.copy(actor.knees[i].rotation);}}
export function bakeCharacter(actor){actor.syncSkeleton?.();actor.group.updateMatrixWorld(true);actor.group.traverse(m=>{if(m.isSkinnedMesh)m.skeleton.update();});const parts=[];
 actor.group.traverseVisible(m=>{if(!m.isMesh||m.material.transparent)return;const g=bakeMesh(m);if(m.geometry.attributes.color)g.setAttribute('color',m.geometry.attributes.color.clone());parts.push(g);});return merge(parts);
}
