export const AUTO_NAV_ID='auto-navigation';
export class AutoNavigation {
 constructor(g){this.g=g;this.active=false;this.path=null;this.index=0;this.stuck=0;this.last={x:0,y:0,z:0};
  const button=this.button=document.createElement('button');button.id='auto-navigate';button.hidden=true;button.textContent='自動導航';button.setAttribute('aria-pressed','false');document.querySelector('#route-body').append(button);
  button.onclick=()=>this.active?this.stop('已停止自動導航。'):this.start();
  const stop=document.createElement('button');stop.id='auto-navigation-stop';stop.hidden=true;stop.textContent='導航中 · 點此停止';stop.onclick=()=>this.stop('已停止自動導航。');document.body.append(stop);this.stopButton=stop;
  const replan=()=>{this.path=null;this.stuck=0;if(this.active){g.navigation.timer=0;g.navigation.update(0,g.player.position);}};
  g.bus.on('NAVIGATION_SELECTED',replan);g.bus.on('TRAVEL_MODE_CHANGED',replan);
  for(const e of ['PAUSE_REQUESTED','PAUSE_TOGGLE','INTERACTION_SELECTED','LIFE_STARTED','SHIFT_ENDED'])g.bus.on(e,()=>this.stop());
 }
 start(){const g=this.g;if(!g.research.complete(AUTO_NAV_ID)){g.hud.message('請先在自己的電腦完成「自動導航」研發。');return false;}g.controls();if(!g.input.enabled||g.phoneUI.open)return false;
  this.active=true;this.path=null;this.stuck=0;Object.assign(this.last,g.player.position);g.navigation.last.x=Infinity;g.navigation.timer=0;g.navigation.update(0,g.player.position);g.mobileUI?.collapse();this.render();g.hud.message('沿藍色路線自動步行。WASD／搖桿或停止按鈕可中止。');return true;
 }
 stop(message){const was=this.active;this.active=false;this.g.input.autoMove=null;if(was&&message)this.g.hud.message(message);this.render();}
 update(dt){const g=this.g,i=g.input,p=g.player.position,n=g.navigation;i.autoMove=null;if(!this.active)return;
  if(i.manualMovement||g.frozen||g.life.active||g.lifeUI.open||g.assistantHUD.open||g.detailOpen||g.phoneUI.open||g.state!=='PLAYING'||g.career.ui.panel.hidden===false){this.stop(i.manualMovement?'已切回手動移動。':undefined);return;}
  if(g.elevatorBusy||g.playerAirBusy||g.gownRemaining>0){Object.assign(this.last,p);this.stuck=0;return;}
  if(!g.player.gowned&&p.y===6&&p.z>=65&&p.z<=69.4&&n.target.z>70){g.interact(g.world.interactions.find(t=>t.kind==='gown'));this.stuck=0;return;}
  const moved=Math.hypot(p.x-this.last.x,p.y-this.last.y,p.z-this.last.z);Object.assign(this.last,p);this.stuck=moved<.005?this.stuck+dt:0;
  const inQueue=p.y===6&&p.z>=66&&p.z<=80;
  if(this.stuck>(inQueue?60:4)){this.stop('路線暫時受阻，已停止。請調整位置後重新導航。');return;}
  if(this.path!==n.path){this.path=n.path;this.index=0;}
  if(!this.path.length){this.stop('目前找不到可通行路線，請先調整位置或目的地。');return;}
  while(this.index<this.path.length&&Math.hypot(p.x-this.path[this.index].x,p.z-this.path[this.index].z)<.28)this.index++;
  if(this.index>=this.path.length){
   if(n.transfer&&n.transferKind==='elevator'){const lift=g.world.elevators.find(e=>e.id===n.liftId);if(lift&&Math.hypot(p.x-lift.location.x,p.z-lift.location.z)<1.2)lift.start(g.player,n.transferTo);else this.stop('請先進入電梯再繼續導航。');}
   else if(n.transfer){n.last.x=Infinity;n.timer=0;n.update(0,p);this.path=null;}
   else this.stop('已抵達目的地，請按互動按鈕開始操作。');return;
  }
  const to=this.path[this.index],dx=to.x-p.x,dz=to.z-p.z,d=Math.hypot(dx,dz);i.autoMove={x:dx/d,z:dz/d,distance:d};
 }
 render(){if(!this.button)return;this.button.hidden=!this.g.research.complete(AUTO_NAV_ID);this.button.disabled=this.g.frozen;this.button.textContent=this.active?'停止自動導航':'自動導航 · 沿藍線前往';this.button.setAttribute('aria-pressed',String(this.active));this.stopButton.hidden=!this.active;}
}
