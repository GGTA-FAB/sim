import * as THREE from 'three';
const cube=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(1,1,1,12),sphere=new THREE.SphereGeometry(1,10,6),materials=new Map();
export function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.75}));return materials.get(color);}
export function shape(parent,geometry,color,x,y,z,sx,sy,sz){const m=new THREE.Mesh(geometry,typeof color==='number'?material(color):color);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
export const block=(p,c,x,y,z,w,h,d)=>shape(p,cube,c,x,y,z,w,h,d);
export const round=(p,c,x,y,z,r,h)=>shape(p,cylinder,c,x,y,z,r,h,r);
export const ball=(p,c,x,y,z,xs,ys=xs,zs=xs)=>shape(p,sphere,c,x,y,z,xs,ys,zs);
export function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
export function label(parent,text,x,y,z,w=2,h=.4,rotation=0,color='#31584d',background='#f5edd5'){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=Math.max(64,Math.round(512*h/w));const ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,512,canvas.height);ctx.fillStyle=color;ctx.font=`600 ${Math.round(canvas.height*.44)}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,canvas.height/2,490);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.y=rotation;parent.add(m);return m;
}
export function chicken(parent,x=0,y=0,z=0,scale=1){const g=group(parent,x,y,z);ball(g,0xb87731,0,0,0,.15,.09,.13);const bone=block(g,0xf4e6c5,.17,0,0,.19,.045,.06);bone.rotation.z=.12;ball(g,0xf4e6c5,.27,.01,0,.048,.045,.05);g.scale.setScalar(scale);return g;}
export function plant(parent,x,y,z){const g=group(parent,x,y,z);round(g,0xc58762,0,0,0,.12,.2);round(g,0x4c7550,0,.2,0,.023,.32);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const leaf=ball(g,0x559758,Math.cos(a)*.1,.23+i*.045,Math.sin(a)*.1,.07,.16,.045);leaf.rotation.z=Math.cos(a)*.5;}return g;}
