import { BALANCE } from '../data/balance.js';
import { ControlGesture } from './ControlGesture.js';
export class PlayerController {
  constructor(canvas,bus,settings){
    this.keys=new Set();this.stick={x:0,y:0};this.yaw=0;this.pitch=.3;this.running=false;this.enabled=false;this.drag=null;this.settings=settings;this.joystick=document.querySelector('#joystick');this.knob=this.joystick.querySelector('i');
    const clearMovement=()=>{this.keys.clear();this.stick.x=this.stick.y=0;this.stickId=null;this.running=false;document.querySelector('#run').setAttribute('aria-pressed','false');this.knob.style.transform='';};
    this.clearMovement=clearMovement;
    const reset=()=>{this.moveGesture?.cancel();this.lookGesture?.cancel();clearMovement();this.drag=null;};this.reset=reset;
    window.addEventListener('keydown',e=>{
      if(e.target.closest('select,input')&&e.code!=='Escape')return;
      if(e.code==='Escape'&&!e.repeat){bus.emit('PAUSE_TOGGLE');return;}
      if(!this.enabled)return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();this.keys.add(e.code);if(e.code==='KeyE'&&!e.repeat)bus.emit('INTERACT');
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    window.addEventListener('blur',()=>{reset();bus.emit('PAUSE_REQUESTED');});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){reset();bus.emit('PAUSE_REQUESTED');}});
    window.addEventListener('pagehide',reset);
    window.addEventListener('orientationchange',reset);
    this.lookGesture=new ControlGesture(canvas,{
      accept:e=>(this.lookEnabled??this.enabled)&&!(e.pointerType==='touch'&&e.clientX<innerWidth*.4),
      move:(e,first)=>{
        if(!(this.lookEnabled??this.enabled)){this.lookGesture.cancel();return;}
        if(first){this.drag={id:e.pointerId,x:e.clientX,y:e.clientY};return;}
        this.yaw-=(e.clientX-this.drag.x)*BALANCE.cameraSensitivity*settings.sensitivity;
        this.pitch=Math.max(-.12,Math.min(.85,this.pitch+(e.clientY-this.drag.y)*BALANCE.cameraSensitivity*settings.sensitivity));
        this.drag.x=e.clientX;this.drag.y=e.clientY;
      },end:()=>{this.drag=null;}
    });
    canvas.addEventListener('wheel',e=>{e.preventDefault();bus.emit('CAMERA_ZOOM',Math.sign(e.deltaY));},{passive:false});
    this.moveGesture=new ControlGesture(this.joystick,{
      accept:()=>this.enabled,
      move:e=>{if(!this.enabled){this.moveGesture.cancel();return;}this.stickId=e.pointerId;this.updateStick(e);},
      end:()=>{this.stickId=null;this.stick.x=this.stick.y=0;this.knob.style.transform='';}
    });
    document.querySelector('#run').addEventListener('click',e=>{if(!this.enabled)return;this.running=!this.running;e.currentTarget.setAttribute('aria-pressed',String(this.running));e.currentTarget.blur();});
  }
  get enabled(){return this._enabled;}
  set enabled(value){
    if(this._enabled&&!value){this.moveGesture?.cancel();this.clearMovement?.();}
    this._enabled=value;
  }
  updateStick(e){const r=this.joystick.getBoundingClientRect(),dx=e.clientX-r.x-r.width/2,dy=e.clientY-r.y-r.height/2,len=Math.hypot(dx,dy),radius=Math.max(1,(Math.min(r.width,r.height)-this.knob.offsetWidth)/2-8),factor=len<radius*.1?0:Math.min(1,radius/Math.max(1,len));this.stick.x=dx*factor/radius;this.stick.y=-dy*factor/radius;this.knob.style.transform=`translate(${dx*factor}px,${dy*factor}px)`;}
  get manualMovement(){return ['KeyW','KeyA','KeyS','KeyD'].some(k=>this.keys.has(k))||Math.hypot(this.stick.x,this.stick.y)>.05;}
  update(dt,player,collision){
    if(!this.enabled){player.animate(dt,0,0);return;}
    const k=this.keys;if(k.has('ArrowLeft'))this.yaw+=dt*1.6;if(k.has('ArrowRight'))this.yaw-=dt*1.6;if(k.has('ArrowUp'))this.pitch=Math.max(-.12,this.pitch-dt);if(k.has('ArrowDown'))this.pitch=Math.min(.85,this.pitch+dt);
    let x=Number(k.has('KeyD'))-Number(k.has('KeyA'))+this.stick.x,z=Number(k.has('KeyW'))-Number(k.has('KeyS'))+this.stick.y;
    const length=Math.hypot(x,z);if(length>1){x/=length;z/=length;}
    const speed=(k.has('ShiftLeft')||k.has('ShiftRight')||this.running?BALANCE.runSpeed:BALANCE.walkSpeed)*(this.speedFactor??1);
    // Camera faces +Z at yaw 0, so its screen-right direction is -X.
    let dx=(Math.sin(this.yaw)*z-Math.cos(this.yaw)*x)*speed*dt,dz=(Math.cos(this.yaw)*z+Math.sin(this.yaw)*x)*speed*dt;
    if(this.autoMove&&!this.manualMovement){const step=Math.min(BALANCE.walkSpeed*(this.speedFactor??1)*dt,this.autoMove.distance);dx=this.autoMove.x*step;dz=this.autoMove.z*step;}
    const oldX=player.position.x,oldZ=player.position.z;collision.move(player.position,dx,dz);const travelled=Math.hypot(player.position.x-oldX,player.position.z-oldZ);player.animate(dt,travelled/Math.max(dt,.001),Math.atan2(dx,dz));
  }
}
