import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
// Static primitives are merged by material once, not submitted as hundreds of meshes.
export class Builder {
  constructor(scene,collision,offsetY=0){this.offsetY=offsetY;this.scene=scene;this.collision=collision;this.batches=new Map();this.signs=[];this.boxGeometry=new THREE.BoxGeometry(1,1,1);this.matrix=new THREE.Matrix4();this.position=new THREE.Vector3();this.scale=new THREE.Vector3();this.rotation=new THREE.Quaternion();}
  box(x,y,z,w,h,d,color=0xe6eae5,solid=false,tag='solid'){
    y+=this.offsetY;const key=String(color);if(!this.batches.has(key))this.batches.set(key,[]);
    this.position.set(x,y,z);this.scale.set(w,h,d);this.matrix.compose(this.position,this.rotation,this.scale);
    this.batches.get(key).push(this.boxGeometry.clone().applyMatrix4(this.matrix));
    if(solid)this.collision.add(x,z,w,d,h,y,tag);
  }
  cylinder(x,y,z,r,h,color=0xb8c1bb,sides=16){
    const key=String(color);if(!this.batches.has(key))this.batches.set(key,[]);
    const geometry=new THREE.CylinderGeometry(r,r,h,sides).translate(x,y+this.offsetY,z);this.batches.get(key).push(geometry);
  }
  sign(text,x,y,z,w=4,h=.65,color='#264c50',background='#f2f5ef',rotation=0){
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=Math.round(768*h/w);
    const ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle=color;ctx.font=`600 ${Math.round(canvas.height*.48)}px Arial, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,canvas.height/2,730);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,side:THREE.FrontSide}));mesh.position.set(x,y+this.offsetY,z);mesh.rotation.y=rotation;this.scene.add(mesh);this.signs.push(mesh);return mesh;
  }
  beam(ax,az,bx,bz,y,width=.13,color=0x809798){
    const key=String(color);if(!this.batches.has(key))this.batches.set(key,[]);
    this.position.set((ax+bx)/2,y+this.offsetY,(az+bz)/2);this.scale.set(width,.12,Math.hypot(bx-ax,bz-az));
    this.rotation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,Math.atan2(bx-ax,bz-az));this.matrix.compose(this.position,this.rotation,this.scale);
    this.batches.get(key).push(this.boxGeometry.clone().applyMatrix4(this.matrix));this.rotation.identity();
  }
  finish(){
    for(const [color,geometries] of this.batches){const merged=mergeGeometries(geometries);const mesh=new THREE.Mesh(merged,new THREE.MeshStandardMaterial({color:Number(color),roughness:.78}));this.scene.add(mesh);geometries.forEach(g=>g.dispose());}
    // One local atlas/draw call per bay for equipment IDs and wayfinding signs.
    if(this.signs.length){
      const atlas=document.createElement('canvas');atlas.width=2048;atlas.height=2**Math.ceil(Math.log2(Math.ceil(this.signs.length/4)*128));const ctx=atlas.getContext('2d');ctx.fillStyle='#eef3ec';ctx.fillRect(0,0,atlas.width,atlas.height);const geometries=[];
      this.signs.forEach((mesh,i)=>{const x=(i%4)*512,y=Math.floor(i/4)*128;ctx.drawImage(mesh.material.map.image,x,y,512,128);mesh.updateMatrix();const geometry=mesh.geometry.clone();const uv=geometry.attributes.uv;for(let n=0;n<uv.count;n++)uv.setXY(n,(x+uv.getX(n)*510+1)/atlas.width,1-(y+(1-uv.getY(n))*126+1)/atlas.height);const back=geometry.clone().rotateY(Math.PI);geometry.applyMatrix4(mesh.matrix);back.applyMatrix4(mesh.matrix);geometries.push(geometry,back);this.scene.remove(mesh);mesh.geometry.dispose();mesh.material.map.dispose();mesh.material.dispose();});
      const texture=new THREE.CanvasTexture(atlas);texture.colorSpace=THREE.SRGBColorSpace;const geometry=mergeGeometries(geometries);this.scene.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture,side:THREE.FrontSide})));geometries.forEach(g=>g.dispose());this.signs.length=0;
    }
    this.batches.clear();this.boxGeometry.dispose();
  }
}
