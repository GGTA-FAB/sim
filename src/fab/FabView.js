import {CharacterCrowd} from '../npc/CharacterCrowd.js';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Builder } from '../world/Builder.js';
import { BAYS,FAB_Y,FAB_END } from '../data/layout.js';
import { FAB_BALANCE as B,QUALITY } from '../data/balance.js';
import { EQUIPMENT_STATES } from './EquipmentSimulation.js';
const SIGNAL={IDLE:0x92aaa8,WAIT_FOUP:0xd8b462,LOAD:0x79bccc,PROCESS:0x68bb89,COMPLETE:0xa1dca5,UNLOAD:0xdbb276,DOWN:0xcf5140,WAIT_PROCESS:0xd4ad4a,PROCESS_CHECK:0x69a9c6,PM:0x579fda};
export class FabView {
  constructor(scene,world,simulation,bayManager,settings){
    this.sim=simulation;this.manager=bayManager;this.settings=settings;this.batches=new Map();this.dummy=new THREE.Object3D();this.pose={x:0,z:0,heading:0};this.color=new THREE.Color();this.gait={};this.box=new THREE.BoxGeometry(1,1,1);this.white=new THREE.MeshStandardMaterial({color:0xe5eeea,roughness:.7});this.dark=new THREE.MeshStandardMaterial({color:0x526a70});this.foupMaterial=new THREE.MeshStandardMaterial({color:0xb7ac8b,roughness:.65});this.signalMaterial=new THREE.MeshBasicMaterial({color:0xffffff});this.screenMaterial=new THREE.MeshBasicMaterial({color:0x9ecbb3});
    const labels=document.createElement('canvas');labels.width=512;labels.height=1024;const ctx=labels.getContext('2d');ctx.fillStyle='#304f56';ctx.fillRect(0,0,512,1024);ctx.font='bold 38px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#e7f4e9';[...EQUIPMENT_STATES,'DOWN','HOLD','PM'].forEach((state,i)=>ctx.fillText(state,256,i*64+32));const texture=new THREE.CanvasTexture(labels);texture.colorSpace=THREE.SRGBColorSpace;this.labelMaterial=new THREE.MeshBasicMaterial({map:texture});
    for(const bay of BAYS){
      const parent=world.bayGroups.get(bay.id),group=new THREE.Group();parent.add(group);group.position.y=FAB_Y;const entities=simulation.equipment.byBay.get(bay.id),vehicles=simulation.oht.loops.get(bay.id).vehicles;
      const batch={group,entities,vehicles,stockHatch:this.instances(group,1,this.white),vehicleSignals:this.instances(group,vehicles.length,this.signalMaterial),lights:this.instances(group,entities.length,this.signalMaterial),bars:this.instances(group,entities.length,this.screenMaterial),toolArms:this.instances(group,entities.length,this.white),portDoors:this.instances(group,entities.length,this.dark),carriers:this.instances(group,vehicles.length,this.white),wheels:this.instances(group,vehicles.length,this.dark),cables:this.instances(group,vehicles.length,this.dark),grippers:this.instances(group,vehicles.length,this.dark),foups:this.foupBatch(group,B.foupPerBay),npcs:this.npcBatch(group,B.npcPerBay),next:0};
      const geometries=entities.map(e=>new THREE.PlaneGeometry(1.05,.28).rotateY(Math.PI).translate(e.x+2.4,2.42,e.z-4.031));batch.labels=new THREE.Mesh(mergeGeometries(geometries),this.labelMaterial);geometries.forEach(g=>g.dispose());group.add(batch.labels);this.batches.set(bay.id,batch);
      const builder=new Builder(parent,world.collision,FAB_Y),path=simulation.oht.loops.get(bay.id).path;
      for(const s of path.segments)builder.beam(s.a.x,s.a.z,s.b.x,s.b.z,B.railHeight,.15);
      for(let d=0;d<path.length;d+=10){path.sample(d,this.pose);builder.box(this.pose.x,6.6,this.pose.z,.07,1.1,.07,0x8ea3a2);}
      const branch=simulation.oht.loops.get(bay.id).branch;for(const route of [branch.entry,branch.exit])for(const segment of route.segments)builder.beam(segment.a.x,segment.a.z,segment.b.x,segment.b.z,B.railHeight,.15);builder.finish();
    }
    this.trunk=new THREE.Group();scene.add(this.trunk);this.trunk.position.y=FAB_Y;this.trunkCars=this.instances(this.trunk,B.mainOhtCount,this.white);this.trunkWheels=this.instances(this.trunk,B.mainOhtCount,this.dark);this.trunkGrippers=this.instances(this.trunk,B.mainOhtCount,this.dark);this.trunkSignals=this.instances(this.trunk,B.mainOhtCount,this.signalMaterial);this.trunkFoups=this.foupBatch(this.trunk,B.mainOhtCount);this.railGroup=new THREE.Group();scene.add(this.railGroup);const rail=new Builder(this.railGroup,world.collision,FAB_Y);for(const path of simulation.oht.mainPaths)for(const s of path.segments)rail.beam(s.a.x,s.a.z,s.b.x,s.b.z,B.railHeight,.16);for(let z=122;z<FAB_END-6;z+=12)for(const x of [-4.8,-1.6,1.6,4.8])rail.box(x,6.6,z,.07,1.1,.07,0x8ea3a2);rail.finish();
  }
  instances(parent,count,material){const mesh=new THREE.InstancedMesh(this.box,material,count);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;parent.add(mesh);return mesh;}
  transform(mesh,index,x,y,z,w,h,d,heading=0,swing=0){this.dummy.position.set(x,y,z);this.dummy.rotation.set(swing,heading,0,'YXZ');this.dummy.scale.set(w,h,d);this.dummy.updateMatrix();mesh.setMatrixAt(index,this.dummy.matrix);}
  foupBatch(parent,count){return{body:this.instances(parent,count,this.foupMaterial),lid:this.instances(parent,count,this.dark),window:this.instances(parent,count,this.dark)};}
  foup(batch,index,x,y,z,heading,visible){const s=visible?1:0;this.transform(batch.body,index,x,y,z,.94*s,.82*s,.82*s,heading);this.transform(batch.lid,index,x,y+.46,z,1.03*s,.11*s,.92*s,heading);this.transform(batch.window,index,x+Math.sin(heading)*.423,y,z+Math.cos(heading)*.423,.72*s,.55*s,.03*s,heading);}
  npcBatch(parent,count){return new CharacterCrowd(parent,count);}
  npc(batch,i,npc,now){batch.set(npc,now);}

  dirty(batch){for(const mesh of Object.values(batch))if(mesh?.isInstancedMesh){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}}
  update(now,position){this.railGroup.visible=Math.abs(position.y-FAB_Y)<3;this.trunk.visible=this.railGroup.visible;
    const quality=QUALITY[this.settings.quality],alpha=Math.max(0,Math.min(1,(now-this.sim.now)/B.fixedStep));
    for(const bay of this.manager.bays){if(!bay.visible)continue;const batch=this.batches.get(bay.id);if(now<batch.next)continue;batch.next=now+(bay.tier==='near'?1/quality.motionHz:bay.tier==='medium'?.18:.75);
      const uv=batch.labels.geometry.attributes.uv;
      batch.entities.forEach((e,i)=>{
        this.transform(batch.lights,i,e.x+2.5,4.34,e.z,.24,.25,.24);this.color.setHex(SIGNAL[e.workStatus||e.state]);batch.lights.setColorAt(i,this.color);
        const progress=e.state==='PROCESS'?Math.max(.05,Math.min(1,(now-e.since)/e.processDuration)):e.state==='LOAD'?.5:.04;
        this.transform(batch.bars,i,e.x+2.9-progress*.5,2.12,e.z-4.035,progress,.06,.025);
        const working=!e.workStatus&&(e.state==='PROCESS'||e.state==='LOAD');
        this.transform(batch.toolArms,i,e.x-.7+Math.sin(now*.8+i)*.75,2.45,e.z-4.01,working?.7:0,working?.09:0,working?.035:0);
        const open=e.state==='PROCESS'||e.state==='COMPLETE'?1:e.state==='LOAD'?Math.min(1,(now-e.since)/B.loadSeconds):0;
        this.transform(batch.portDoors,i,e.portX,1.8+open*.7,e.z-4.03,.85,.65,.035);
        const row=e.workStatus?(e.workStatus==='DOWN'?6:e.workStatus==='PM'?8:7):EQUIPMENT_STATES.indexOf(e.state);for(let j=0;j<4;j++)uv.setXY(i*4+j,j%2,(1-(row*64+(j<2?5:59))/1024));
      });uv.needsUpdate=true;
      batch.vehicles.forEach((v,i)=>{v.path.sample(v.prevDistance+v.path.ahead(v.prevDistance,v.distance)*alpha,this.pose);v.visualX=this.pose.x;v.visualZ=this.pose.z;v.visualY=v.prevHoist+(v.hoistY-v.prevHoist)*alpha;this.transform(batch.carriers,i,v.visualX,5.72,v.visualZ,1.3,.54,1.3,this.pose.heading);this.transform(batch.wheels,i,v.visualX,6.02,v.visualZ,.62,.2,.8,this.pose.heading);this.transform(batch.cables,i,v.visualX,(5.45+v.visualY+.53)/2,v.visualZ,.045,Math.max(.05,5.45-v.visualY-.53),.045);this.transform(batch.grippers,i,v.visualX,v.visualY+.53,v.visualZ,1.12,.08,.95,this.pose.heading);this.transform(batch.vehicleSignals,i,v.visualX-Math.sin(this.pose.heading)*.67,5.7,v.visualZ-Math.cos(this.pose.heading)*.67,.32,.12,.035,this.pose.heading);this.color.setHex(v.waiting?0xe8ad53:0x80b99a);batch.vehicleSignals.setColorAt(i,this.color);});
      let hatchOpen=false;for(const v of batch.vehicles)if(v.stop==='stockPickup'||v.stop==='stockDrop'){if(v.phase!=='TRAVEL'||v.path.ahead(v.distance,v.goal)<4)hatchOpen=true;}batch.stockHatchOpen=hatchOpen;this.transform(batch.stockHatch,0,bay.stockX,4.18,bay.stockZ+(hatchOpen?1.85:0),1.78,.12,1.86);
      this.sim.foups.byBay.get(bay.id).forEach((f,i)=>{
        const carrier=f.ownerType==='vehicle'||f.ownerType==='reserved'?this.sim.oht.byId.get(f.ownerId):null;
        if(f.ownerType==='stock')this.foup(batch.foups,i,bay.stockX,B.dockHeight,bay.stockZ,Math.PI,false);
        else if(f.ownerType==='reserved'){const handoff=carrier?.stop==='stockPickup'&&carrier.phase==='LOWER';this.foup(batch.foups,i,bay.stockX,B.dockHeight,bay.stockZ,Math.PI,handoff);}
        else this.foup(batch.foups,i,carrier?.visualX??f.x,carrier?.visualY??f.y,carrier?.visualZ??f.z,f.heading,true);
      });
      const npcVisible=bay.distance<quality.npcDistance;batch.npcs.begin(npcVisible);
      if(npcVisible)this.sim.npcs.byBay.get(bay.id).forEach((n,i)=>this.npc(batch.npcs,i,n,now));
      this.dirty(batch);this.dirty(batch.foups);batch.npcs.end();
    }
    this.trunk.visible=position.z>65&&Math.abs(position.y-FAB_Y)<3;
    this.sim.oht.mainVehicles.forEach((v,i)=>{
      v.path.sample(v.prevDistance+v.path.ahead(v.prevDistance,v.distance)*alpha,this.pose);const visible=Math.hypot(v.x-position.x,v.z-position.z)<quality.bayDistance,s=visible?1:0;
      this.transform(this.trunkCars,i,this.pose.x,5.72,this.pose.z,1.3*s,.54*s,1.3*s,this.pose.heading);this.transform(this.trunkWheels,i,this.pose.x,6.02,this.pose.z,.62*s,.2*s,.8*s,this.pose.heading);this.transform(this.trunkGrippers,i,this.pose.x,B.carryHeight+.53,this.pose.z,1.12*s,.08*s,.95*s,this.pose.heading);
      this.transform(this.trunkSignals,i,this.pose.x-Math.sin(this.pose.heading)*.67,5.7,this.pose.z-Math.cos(this.pose.heading)*.67,.32*s,.12*s,.035*s,this.pose.heading);this.color.setHex(v.waiting?0xe8ad53:0x80b99a);this.trunkSignals.setColorAt(i,this.color);
      this.foup(this.trunkFoups,i,this.pose.x,B.carryHeight,this.pose.z,this.pose.heading,visible&&v.loaded);
    });for(const mesh of [this.trunkCars,this.trunkWheels,this.trunkGrippers,this.trunkSignals]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}this.dirty(this.trunkFoups);
  }
}
