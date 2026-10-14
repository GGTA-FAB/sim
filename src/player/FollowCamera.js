import * as THREE from 'three';
import { BALANCE } from '../data/balance.js';
export class FollowCamera {
  constructor(camera,collision,bus){this.camera=camera;this.collision=collision;this.distance=BALANCE.cameraDistance;this.actual=this.distance;this.origin=new THREE.Vector3();this.desired=new THREE.Vector3();bus.on('CAMERA_ZOOM',delta=>{this.distance=THREE.MathUtils.clamp(this.distance+delta*.5,2.5,7.5);});}
  update(dt,player,input){
    this.origin.copy(player.position);this.origin.y=player.position.y+1.45;
    const horizontal=Math.cos(input.pitch)*this.distance;
    this.desired.set(this.origin.x-Math.sin(input.yaw)*horizontal,this.origin.y+Math.sin(input.pitch)*this.distance,this.origin.z-Math.cos(input.yaw)*horizontal);
    this.desired.y=Math.max(player.position.y+.3,this.desired.y);
    const fraction=this.collision.cameraFraction(this.origin,this.desired);
    const target=this.origin.distanceTo(this.desired)*fraction;
    this.actual=target<this.actual?target:THREE.MathUtils.lerp(this.actual,target,1-Math.exp(-dt*7));
    this.desired.sub(this.origin).normalize().multiplyScalar(this.actual);this.camera.position.copy(this.origin).add(this.desired);this.camera.lookAt(this.origin);player.group.visible=this.actual>.65;
  }
}
