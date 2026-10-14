import * as THREE from 'three';
import {stairSurfaces,stairHeight} from '../data/stairs.js';
const METAL=0xb9cbd0,HANDRAIL=0x638e99;
// Thin metal rails with a continuous collision barrier between the posts.
function rail(b,collision,ax,ay,az,bx,by,bz){
 const length=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(length/.65));
 for(let i=0;i<=n;i++){const t=i/n,x=ax+(bx-ax)*t,y=ay+(by-ay)*t,z=az+(bz-az)*t;b.box(x,y+.55,z,.065,1.1,.065,METAL);}
 for(const height of [.45,1.1]){
  const delta=new THREE.Vector3(bx-ax,by-ay,bz-az);b.rotation.setFromUnitVectors(new THREE.Vector3(0,0,1),delta.clone().normalize());
  b.box((ax+bx)/2,(ay+by)/2+height,(az+bz)/2,.085,.085,delta.length(),HANDRAIL);b.rotation.identity();
 }
 for(let i=0;i<n;i++){const t=(i+.5)/n,x=ax+(bx-ax)*t,y=ay+(by-ay)*t,z=az+(bz-az)*t;collision.add(x,z,Math.abs(bx-ax)/n+.08,Math.abs(bz-az)/n+.08,1.15,y+.575,'stair-rail');}
}
export function buildSwitchbackStair(b,collision,stair,base){
 const surfaces=stairSurfaces(stair,base);collision.ramps.push(...surfaces);
 for(const flight of surfaces.slice(0,2)){
  const count=18,depth=(flight.maxZ-flight.minZ)/count,w=flight.maxX-flight.minX,x=(flight.minX+flight.maxX)/2;
  for(let i=0;i<count;i++){const z=flight.minZ+(i+.5)*depth,top=stairHeight(flight,z)+3/count/2;
   // Closed risers and camera collision prevent seeing through the underside.
   b.box(x,top-.11,z,w,.22,depth+.012,0xc6d2cc,true,'floor');b.box(x,top+.01,z+(flight.rise>0?1:-1)*(depth/2-.025),w,.025,.05,0xe6b843);
  }
  const length=flight.maxZ-flight.minZ;b.rotation.setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.atan2(flight.rise,length));b.box(x,flight.base+flight.rise/2-.18,(flight.minZ+flight.maxZ)/2,w-.04,.16,Math.hypot(length,flight.rise),0xd7e0da);b.rotation.identity();
  for(const edge of [flight.minX,flight.maxX])rail(b,collision,edge,stairHeight(flight,flight.minZ),flight.minZ,edge,stairHeight(flight,flight.maxZ),flight.maxZ);
 }
 const p=surfaces[2],width=p.maxX-p.minX,z=(p.minZ+p.maxZ)/2;b.box((p.minX+p.maxX)/2,base+2.88,z,width,.24,2,0xc6d2cc,true,'floor');
 for(const x of [p.minX,p.maxX])rail(b,collision,x,base+3,p.minZ,x,base+3,p.maxZ);
 rail(b,collision,p.minX,base+3,p.minZ,p.maxX,base+3,p.minZ);
 b.sign('半層平台 · 迴轉續行',(p.minX+p.maxX)/2,base+4.45,p.minZ+.12,width-.3,.38,'#173f4c','#dbe8e5');
}
export function buildStairGuards(b,collision,stair){
 const {minX,maxX,minZ,maxZ,bases}=stair,mid=(minX+maxX)/2;
 const levels=[...new Set(bases.flatMap(y=>[y,y+6]))];
 for(const y of levels){
  for(const x of [minX,maxX])rail(b,collision,x,y,minZ-2,x,y,maxZ);
  rail(b,collision,minX,y,minZ-2,maxX,y,minZ-2);
  // Keep both legitimate entrances clear; close the central void and unused flight.
  rail(b,collision,mid-.3,y,maxZ,mid+.3,y,maxZ);
  if(!bases.includes(y))rail(b,collision,minX,y,maxZ,mid-.3,y,maxZ);
  if(!bases.includes(y-6))rail(b,collision,mid+.3,y,maxZ,maxX,y,maxZ);
 }
 b.box(mid,Math.min(...bases)-.15,(minZ-2+maxZ)/2,maxX-minX,.3,maxZ-minZ+2,0xc6d2cc,true,'floor');
}
