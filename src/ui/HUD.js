import {ContextActions} from './ContextActions.js';
import {BALANCE} from '../data/balance.js';
import { FAB_END,DESTINATIONS, ROOMS,CONNECTOR_ROOMS,BAYS,FAB_CORE_ROOMS,CORE_ROOMS,LIFT,STAIR,FAB_STAIR } from '../data/layout.js';
export class HUD {
  constructor(bus,settings){
    this.contextActions=new ContextActions();this.bus=bus;this.map=document.querySelector('#minimap');this.context=this.map.getContext('2d');this.interact=document.querySelector('#interact');this.interactText=this.interact.querySelector('span');this.toast=document.querySelector('#toast');this.toastTime=0;
    this.zone=document.querySelector('#zone');this.targetName=document.querySelector('#target-name');this.distance=document.querySelector('#distance');this.note=document.querySelector('#route-note');this.gown=document.querySelector('#gown-progress');this.progress=this.gown.querySelector('progress');
    const select=document.querySelector('#destination');for(const d of DESTINATIONS){const option=document.createElement('option');option.value=d.id;option.textContent=d.name;select.append(option);}select.addEventListener('change',()=>{bus.emit('NAVIGATION_SELECTED',select.value);select.blur();});
    document.querySelector('#travel-mode').addEventListener('change',e=>{bus.emit('TRAVEL_MODE_CHANGED',e.target.value);e.target.blur();});
    this.map.addEventListener('click',event=>{if(this.mapMode!=='fab')return;const r=this.map.getBoundingClientRect(),scale=(this.map.width-20)/FAB_END,z=((event.clientX-r.left)*this.map.width/r.width-10)/scale,x=((event.clientY-r.top)*this.map.height/r.height-this.map.height/2)/scale;const bay=BAYS.find(b=>Math.abs(x-b.x)<b.w/2&&Math.abs(z-b.z)<b.d/2);if(bay){select.value=`${this.mapFloor===0?'sub-':''}bay-${bay.id}`;bus.emit('NAVIGATION_SELECTED',select.value);}});
    this.collapsed=matchMedia('(pointer:coarse),(max-width:700px)').matches;const toggle=document.querySelector('#route-toggle'),body=document.querySelector('#route-body');const collapse=()=>{body.hidden=this.collapsed;toggle.setAttribute('aria-expanded',String(!this.collapsed));};collapse();toggle.addEventListener('click',()=>{this.collapsed=!this.collapsed;collapse();toggle.blur();});
    document.querySelector('#start').addEventListener('click',()=>bus.emit('RESUME_REQUESTED'));document.querySelector('#pause').addEventListener('click',()=>bus.emit('PAUSE_TOGGLE'));this.interact.addEventListener('click',()=>{bus.emit('INTERACT');this.interact.blur();});
    document.querySelector('#close-detail').addEventListener('click',()=>bus.emit('DETAIL_CLOSED'));
    const volume=document.querySelector('#ambient-volume');volume.value=settings.ambientVolume;volume.addEventListener('input',()=>bus.emit('AMBIENT_VOLUME_CHANGED',Number(volume.value)));
    const quality=document.querySelector('#quality');quality.value=settings.quality;quality.addEventListener('change',()=>bus.emit('QUALITY_CHANGED',quality.value));
    const sensitivity=document.querySelector('#sensitivity');sensitivity.value=settings.sensitivity;sensitivity.addEventListener('input',()=>bus.emit('SENSITIVITY_CHANGED',Number(sensitivity.value)));
  }
  ready(){const start=document.querySelector('#start');start.disabled=false;start.textContent='進入廠區 →';}
  setPaused(value){document.querySelector('#menu').hidden=!value;if(value)document.querySelector('#start').textContent='繼續探索 →';document.querySelector('#pause').setAttribute('aria-label',value?'繼續遊戲':'暫停與設定');}
  message(text){this.toast.textContent=text;this.toast.hidden=false;this.toastTime=5;}
  showDetail(item){document.querySelector('#detail-title').textContent=item.title;document.querySelector('#detail-copy').textContent=item.description;document.querySelector('#detail').hidden=false;document.querySelector('#close-detail').focus();}
  closeDetail(){document.querySelector('#detail').hidden=true;document.activeElement?.blur();}
  update(dt,game){
    if(this.toastTime>0){this.toastTime-=dt;if(this.toastTime<=0)this.toast.hidden=true;}
    const {player,world,navigation,interaction}=game;
    this.zone.textContent=world.zone(player.position);this.targetName.textContent=navigation.target.name;const arrived=Math.abs(player.position.y-(navigation.target.y??0))<.5&&Math.hypot(player.position.x-navigation.target.x,player.position.z-navigation.target.z)<2.4;
    this.distance.textContent=arrived?'已抵達':`${Math.round(navigation.distance)} m`;
    this.note.textContent=navigation.transfer?`先${navigation.transferKind==='stairs'?'沿藍線走樓梯':navigation.liftId==='fab'?'到 FAB 棟電梯':'到辦公棟電梯'} → ${(navigation.transferTo??navigation.target.y??0)/6+2}F，抵達後繼續導航。`:arrived?'已到達目的地。你可以查看或繼續探索。':navigation.target.z>70&&!player.gowned?'經過更衣區時，按 E 或互動按鈕換装。':'沿地面引導線前往，隨時可以更換目的地。';
    const item=interaction.current;this.interact.disabled=!item||game.gownRemaining>0||game.state!=='PLAYING'||game.elevatorBusy||game.playerAirBusy;let action=item?.action;
    if(item?.equipmentId){
      const alarm=game.alarms.get(item.equipmentId),pm=game.pm.get(item.equipmentId),place=item.kind==='sub-equipment'?'subfield':'field';
      const work=game.officeWork.pending().find(t=>t.subjectId===item.equipmentId&&game.officeWork.step(t).place===place);
      if(work)action=`現場檢查 · ${game.officeWork.step(work).label}`;
      else if(pm&&item.kind==='equipment'&&pm.status==='WAIT_CLOSE')action='PM 完成 · 現場驗收';
      else if(pm&&item.kind==='equipment'&&pm.status==='WAIT_INCIDENT')action='PM 異常 · 現場檢查';
      else if(alarm?.status==='DOWN')action=Math.abs(item.y-alarm.y)<.5?'查看 Alarm / 修機':`異常在 ${alarm.y===0?'2F Sub FAB':'3F FAB'} · 查看位置`;
      else if(alarm?.status==='WAIT_PROCESS')action='修復完成 · 通知製程';
      else if(pm?.status==='PENDING'&&item.kind==='equipment')action=game.pm.canAssign(pm)?'PM 待派 · 可遠端聯絡助工':'PM 等待製程確認';
      if(pm?.status==='PENDING'&&alarm?.status==='DOWN'&&(navigation.target.id===pm.id||navigation.target.sourceTaskId===pm.id))action=`PM 未開始 · 先處理 ${alarm.y===0?'2F Sub FAB':'3F FAB'} 異常`; 
    }
    this.interactText.textContent=item?`${item.title} · ${action}`:'靠近物件即可互動';
    this.contextActions.update(game);
    if(!this.contextActions.quick.hidden)this.interactText.textContent=`${item.title} · 其他選項`;
    document.querySelector('#gown-hint').hidden=item?.kind!=='gown'||game.gownRemaining>0;
    const busy=game.gownRemaining>0||game.playerAirBusy||game.elevatorBusy;this.gown.hidden=!busy;this.gown.querySelector('strong').textContent=game.elevatorBusy?'電梯升降中':game.playerAirBusy?'風淋清潔中':'更換無塵衣';this.gown.querySelector('span').textContent=game.elevatorBusy?'依所選電梯前往樓層':game.playerAirBusy?'AIR SHOWER · 雙門互鎖':'GOWNING PROCEDURE';this.progress.value=game.elevatorBusy?1-game.movingElevator.remaining/game.movingElevator.duration:game.playerAirBusy?1-world.airshower.remaining/BALANCE.airShowerSeconds:1-game.gownRemaining/game.gownDuration;
    if(game.detailEquipment&&(!game.detailSub||game.alarms.get(game.detailEquipment)))document.querySelector('#detail-copy').textContent=game.describe(game.detailEquipment).description;
    this.drawMap(player,navigation,game.input.yaw);
    document.querySelector('#minimap-distance').textContent=this.distance.textContent;
    this.map.title=`${navigation.target.name} · ${this.distance.textContent}`;
  }
  drawFloorMap(player,navigation,yaw){
    const c=this.context,w=this.map.width,h=this.map.height,f=Math.round(player.position.y/6)*6,scale=f===6?Math.min(1.7,(h-30)/86):1.7,px=x=>w/2+x*scale,pz=z=>h/2+(z-(f===6?7:-1))*scale;
    c.fillStyle='#e8e4d3';c.fillRect(0,0,w,h);c.lineWidth=1;c.strokeStyle='#a2997b';
    for(const r of (f===-6?[{x:0,z:14,w:64,d:52},CORE_ROOMS.find(r=>r.y===-6)]:[{x:0,z:14,w:f===0?30:36,d:28},CORE_ROOMS.find(r=>r.y===f),...(f===6?[{x:0,z:39,w:36,d:22}]:[])]))c.strokeRect(px(r.x-r.w/2),pz(r.z-r.d/2),r.w*scale,r.d*scale);
    c.font='10px Arial';c.textAlign='center';c.fillStyle='#385e52';c.fillText(f===6?'3F · OFFICE':f===0?'2F · FAB LOBBY':'1F · FOOD STREET',w/2,13);
    if(f===6){c.fillStyle='#d2c5a3';c.fillRect(px(-16),pz(29),32*scale,20*scale);c.fillStyle='#385e52';c.fillText('交班會議室',px(0),pz(40));}if(f===6){c.strokeStyle='#67948b';for(const r of CONNECTOR_ROOMS)c.strokeRect(px(r.x-r.w/2),pz(r.z-r.d/2),r.w*scale,r.d*scale);c.fillText('FAB →',px(22),pz(22));}c.fillStyle='#628778';c.fillRect(px(LIFT.x-2.5),pz(LIFT.z-3),5*scale,6*scale);c.fillText('電梯',px(LIFT.x),pz(LIFT.z-4));c.strokeStyle='#628778';c.lineWidth=2;c.beginPath();c.moveTo(px(STAIR.minX+1.6),pz(STAIR.maxZ));c.lineTo(px(STAIR.minX+1.6),pz(STAIR.minZ-1));c.lineTo(px(STAIR.maxX-1.6),pz(STAIR.minZ-1));c.lineTo(px(STAIR.maxX-1.6),pz(STAIR.maxZ));c.stroke();c.fillText('折返樓梯',px(6.5),pz(-25));
    c.strokeStyle='#087cff';c.lineWidth=3;c.beginPath();navigation.path.forEach((p,i)=>i?c.lineTo(px(p.x),pz(p.z)):c.moveTo(px(p.x),pz(p.z)));c.stroke();
    const t=navigation.routeTarget??navigation.target;this.drawTarget(px(t.x),pz(t.z));this.drawPlayer(px(player.position.x),pz(player.position.z),Math.PI-yaw);
  }
  drawMap(player,navigation,yaw){
    this.mapFloor=Math.round(player.position.y/6)*6;this.mapMode=player.position.z>=60?'fab':'floor';
    document.querySelector('#minimap-floor').textContent=this.mapMode==='fab'?(this.mapFloor===6?'3F · FAB':'2F · Sub FAB'):this.mapFloor===6?'3F · OFFICE':this.mapFloor===-6?'1F · 餐飲街':'2F · 連通道';
    if(this.mapMode==='floor'){this.drawFloorMap(player,navigation,yaw);return;}
    const ctx=this.context,w=this.map.width,h=this.map.height,scale=(w-20)/FAB_END;
    const px=z=>10+z*scale,pz=x=>h/2+x*scale;
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#e8eeea';ctx.fillRect(0,0,w,h);
    ctx.lineWidth=1;for(const r of [...ROOMS,...CONNECTOR_ROOMS,...FAB_CORE_ROOMS].filter(r=>(r.y??0)===this.mapFloor&&r.id!=='office')){ctx.fillStyle=r.id==='fab'?'#dbe6df':'#dae0d4';ctx.strokeStyle='#aebfb4';ctx.fillRect(px(r.z-r.d/2),pz(r.x-r.w/2),r.d*scale,r.w*scale);ctx.strokeRect(px(r.z-r.d/2),pz(r.x-r.w/2),r.d*scale,r.w*scale);}
    ctx.font='8px Arial';ctx.textAlign='center';for(const bay of BAYS){ctx.fillStyle=bay.area==='ETCH'?'#a7cabb':bay.area==='LITHO'?'#d2caad':'#c0d2d3';ctx.fillRect(px(bay.z-bay.d/2),pz(bay.x-bay.w/2),bay.d*scale,bay.w*scale);ctx.strokeStyle='#92aaa1';ctx.strokeRect(px(bay.z-bay.d/2),pz(bay.x-bay.w/2),bay.d*scale,bay.w*scale);ctx.fillStyle='#365b58';ctx.fillText(bay.id,px(bay.z),pz(bay.x));}
    ctx.textAlign='left';ctx.fillStyle='#587770';ctx.fillText(this.mapFloor===6?'3F FAB':'2F SUB FAB',5,h/2+25);ctx.fillText(`${BAYS.length} BAYS · 點選 Bay 導航`,80,20);ctx.fillStyle='#3d8197';ctx.fillRect(px(85),pz(-15),6*scale,6*scale);ctx.fillRect(px(FAB_STAIR.minZ-2),pz(FAB_STAIR.minX),10*scale,7*scale);ctx.fillText('FAB 電梯 / 樓梯',px(78),pz(-25));
    ctx.strokeStyle='#087cff';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<navigation.path.length;i++){const p=navigation.path[i];if(i===0)ctx.moveTo(px(p.z),pz(p.x));else ctx.lineTo(px(p.z),pz(p.x));}ctx.stroke();
    const t=navigation.routeTarget??navigation.target;this.drawTarget(px(t.z),pz(t.x));
    this.drawPlayer(px(player.position.z),pz(player.position.x),yaw+Math.PI/2);
  }
  drawTarget(x,y){const c=this.context;c.save();c.translate(x,y);c.rotate(Math.PI/4);c.fillStyle='#f5c35a';c.strokeStyle='#795014';c.lineWidth=2;c.fillRect(-4,-4,8,8);c.strokeRect(-4,-4,8,8);c.restore();}
  drawPlayer(x,y,angle){const c=this.context;c.save();c.translate(x,y);c.rotate(angle);c.fillStyle='#143f44';c.strokeStyle='#fff';c.lineWidth=1.5;c.beginPath();c.moveTo(0,-8);c.lineTo(6,6);c.lineTo(0,3);c.lineTo(-6,6);c.closePath();c.fill();c.stroke();c.restore();}
}
