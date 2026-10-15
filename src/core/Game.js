import {DEFAULT_NAME,characterName,entryRank} from '../data/characterProfile.js';
import {applyArtDirection} from '../world/ArtDirection.js';
import {PedestrianTraffic} from '../npc/PedestrianTraffic.js';
import {FirstDayTutorial} from '../tutorial/FirstDayTutorial.js';
import {AutoNavigation} from '../navigation/AutoNavigation.js';
import {characterMaterial} from '../player/CharacterRig.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RANKS,newProgression,progressionText,yearOf} from '../data/careerProgression.js';
import {TitleScreen} from '../ui/TitleScreen.js';
import {Leadership} from '../tasks/Leadership.js';
import {MobileUI} from '../ui/MobileUI.js';
import {MODULES,moduleInfo} from '../data/modules.js';
import {LifestyleSystem} from '../life/LifestyleSystem.js';
import {PRAISE_REASON} from '../data/lifestyleResearch.js';
import {AssistantAutoWork} from '../tasks/AssistantAutoWork.js';
import {ASSISTANT_REPORT} from '../phone/AssistantReport.js';
import {ResearchManager} from '../research/ResearchManager.js';
import {ResearchUI} from '../ui/ResearchUI.js';
import {AssistantHUD} from '../ui/AssistantHUD.js';
import {FAB_Y,CLEAN_ACCESS} from '../data/layout.js';
import {FoodPeople} from '../npc/FoodPeople.js';
import {OfficePeople} from '../npc/OfficePeople.js';
import {equipmentStatus} from '../data/equipmentStatus.js';
import {Ambience} from '../audio/Ambience.js';
import {NearbyPeople} from '../npc/NearbyPeople.js';
import {DailyWork} from '../tasks/DailyWork.js';
import {OfficeWorkUI} from '../ui/OfficeWorkUI.js';
import {upgradeCareer} from './SaveUpgrades.js';
import {SaveManager,SAVE_KEY} from './SaveManager.js';
import {validateSession} from './SessionSnapshot.js';
import {Career} from './Career.js';
import {planDay,WorkloadDirector} from './WorkloadDirector.js';
import {DailyLife} from '../life/DailyLife.js';
import {ShiftSystem} from '../life/ShiftSystem.js';
import {LifeUI} from '../ui/LifeUI.js';
import {installDailyPlaces} from '../world/DailyPlaces.js';
import * as THREE from 'three';
import { ALARMS } from '../data/alarms.js';
import { repairProgress } from '../minigames/registry.js';
import { REPAIR_GAMES } from '../data/repairGames.js';
import { FLOORS,FAB_FLOORS } from '../data/layout.js';
import { BALANCE, QUALITY } from '../data/balance.js';
import { EventBus } from './EventBus.js';
import { readSettings, writeSettings } from './Settings.js';
import { createRandom } from './Random.js';
import { InteractionSystem } from './InteractionSystem.js';
import { World } from '../world/World.js';
import { Player } from '../player/Player.js';
import { PlayerController } from '../player/PlayerController.js';
import { FollowCamera } from '../player/FollowCamera.js';
import { NavigationSystem } from '../navigation/NavigationSystem.js';
import { HUD } from '../ui/HUD.js';
import { LivingFab } from '../fab/LivingFab.js';
import { GameClock } from './GameClock.js';
import { TaskManager } from '../tasks/TaskManager.js';
import { AlarmSystem } from '../equipment/AlarmSystem.js';
import { RepairSystem } from '../equipment/RepairSystem.js';
import { WorkHUD } from '../ui/WorkHUD.js';
import { createContacts } from '../data/phone.js';
import { PhoneSystem } from '../phone/PhoneSystem.js';
import { CallGenerator } from '../phone/CallGenerator.js';
import { createDialogue,applyResponse } from '../phone/CallContext.js';
import {PMManager} from '../tasks/PMManager.js';
import {AssistantEngineer} from '../npc/AssistantEngineer.js';
import {PM_BALANCE,assistantContacts} from '../data/pm.js';
import {PMUI} from '../ui/PMUI.js';
import { PhoneUI } from '../ui/PhoneUI.js';
import {OfficeAssignment,configureOfficeDesk} from './OfficeAssignment.js';
export class Game {
 constructor(){
  this.bus=new EventBus();this.settings=readSettings();this.state='PAUSED';this.elapsed=0;this.gownRemaining=0;this.gownDuration=BALANCE.gownSeconds;this.detailOpen=false;this.uiTimer=0;this.inventory=[];
  const params=new URLSearchParams(location.search);let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error('Storage blocked');},setItem(){throw Error('Storage blocked');}};}const save=new SaveManager(storage,import.meta.env.DEV?SAVE_KEY+':dev:'+(params.get('seed')??'random'):SAVE_KEY),loaded=upgradeCareer(save.load(validateSession));
  this.seed=loaded?.seed??Number(params.get('seed')??crypto.getRandomValues(new Uint32Array(1))[0]);this.dayPlan=loaded?.plan??planDay(this.seed,1,import.meta.env.DEV&&['easy','normal','busy','hell'].includes(params.get('workload'))?params.get('workload'):undefined);this.random=createRandom(this.seed);
  this.progression=loaded?.progression??newProgression();this.dayPlan.rank=this.progression.rank;configureOfficeDesk(this.progression.rank);
  this.moduleSelection=!loaded?.snapshot&&this.dayPlan.day===1;this.nameSelection=this.moduleSelection&&!loaded?.profile;this.profile=loaded?.profile??{name:DEFAULT_NAME};
  this.research=new ResearchManager(this.bus,loaded?.research);this.research.careerMode=true;
  this.canvas=document.querySelector('#world');this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:QUALITY[this.settings.quality].antialias,powerPreference:'high-performance'});this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.setClearColor(0xdbe5df);
  const characterRoom=new RoomEnvironment(),characterPMREM=new THREE.PMREMGenerator(this.renderer);characterMaterial.envMap=characterPMREM.fromScene(characterRoom,.06).texture;characterMaterial.envMapIntensity=.35;characterRoom.dispose();characterPMREM.dispose();
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xdbe5df);this.scene.fog=new THREE.Fog(0xdbe5df,60,145);
  this.hemi=new THREE.HemisphereLight(0xffffff,0xbac8c4,2.05);this.ambient=new THREE.AmbientLight(0xffffff,.4);this.scene.add(this.hemi,this.ambient);const sun=new THREE.DirectionalLight(0xfffaf0,.95);sun.position.set(-20,45,10);this.scene.add(sun);this.warm=new THREE.Color(0xffe8aa);this.neutral=new THREE.Color(0xffffff);
  this.camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,BALANCE.cameraNear,150);
  this.world=new World(this.scene,this.bus);this.officeColleagues=installDailyPlaces(this.world,this.scene);this.player=new Player(this.scene);this.input=new PlayerController(this.canvas,this.bus,this.settings);this.follow=new FollowCamera(this.camera,this.world.collision,this.bus);this.navigation=new NavigationSystem(this.scene,this.world.collision,this.bus);this.interaction=new InteractionSystem(this.world,this.player,this.bus);this.hud=new HUD(this.bus,this.settings);
  this.traffic=new PedestrianTraffic(this.world.collision);this.traffic.add(this.player,this.player.position,{radius:.48});for(const npc of this.officeColleagues)this.traffic.add(npc);
  this.living=new LivingFab(this.scene,this.world,this.random,this.bus,this.settings);this.living.update(0,this.player.position);
  this.clock=new GameClock();this.clock.day=this.dayPlan.day;this.tasks=new TaskManager(this.bus);this.alarms=new AlarmSystem(this.living.equipment,this.tasks,this.clock,createRandom(this.seed^0x5fab03),this.bus,this.dayPlan.module,RANKS[this.progression.rank].equipment);this.director=new WorkloadDirector(this.dayPlan,this.alarms,this.clock);this.alarms.director=this.director;this.repair=new RepairSystem(this.alarms,this.bus);this.repair.research=this.research;this.director.research=this.research;this.workHUD=new WorkHUD(this);
  const pmRandom=createRandom(this.seed^0x5fab06),roster=assistantContacts(this.dayPlan.assistants).map(c=>({...c,onLeave:this.dayPlan.absentAssistants.includes(c.id)}));this.assistants=roster.map((c,i)=>new AssistantEngineer(this.scene,c,this.navigation.finders,this.world.collision,i));this.pm=new PMManager({tasks:this.tasks,alarms:this.alarms,clock:this.clock,bus:this.bus,random:pmRandom,agents:this.assistants,repair:this.repair});
  this.phone=new PhoneSystem({contacts:createContacts(createRandom(this.seed^0x5fab05),this.living.npcs.entities).concat(roster),clock:this.clock,bus:this.bus,dialogue:c=>createDialogue(this,c),apply:(c,o)=>applyResponse(this,c,o),valid:c=>c.contactId==='mentor-0'?this.dayPlan.tutorialVersion===1:c.reason===PRAISE_REASON?c.contactId==='manager-0':c.reason===ASSISTANT_REPORT?this.pm.validCall(c):this.shift?.isTransferred(c.equipmentId)?false:c.contactId.startsWith('assistant-')?this.pm.validCall(c):this.alarms.owned.includes(c.equipmentId)&&(c.reason==='alarm'?this.alarms.get(c.equipmentId)?.status==='DOWN'&&!this.alarms.get(c.equipmentId)?.assistantId:c.reason==='handover'?this.alarms.get(c.equipmentId)?.status==='WAIT_PROCESS':true)});this.calls=new CallGenerator(this.phone,this.alarms,this.clock,createRandom(this.seed^0x5fab55),this.bus,this.progression.rank);this.phoneUI=new PhoneUI(this);this.pm.phone=this.phone;this.pm.incidentChance=this.dayPlan.incidentChance;this.calls.frequencyFactor=this.dayPlan.callFactor;this.pmUI=new PMUI(this);this.pm.generate(this.dayPlan.pmCount);this.shift=new ShiftSystem({clock:this.clock,tasks:this.tasks,alarms:this.alarms,pm:this.pm,bus:this.bus,random:createRandom(this.seed^0x5fab07),phone:this.phone,reportEnabled:false});this.life=new DailyLife({clock:this.clock,bus:this.bus,inventory:this.inventory,position:this.player.position,shift:this.shift});this.life.research=this.research;this.pm.research=this.research;this.calls.research=this.research;for(const a of this.assistants)a.research=this.research;this.lifeUI=new LifeUI(this);this.researchUI=new ResearchUI(this);this.officeWork=new DailyWork({tasks:this.tasks,clock:this.clock,bus:this.bus,shift:this.shift,alarms:this.alarms,seed:this.seed,profile:this.dayPlan.profile});if(this.dayPlan.tutorialVersion===1){this.officeWork.plan=[];this.officeWork.subSchedule=[];}this.life.work=this.officeWork;this.pm.work=this.officeWork;this.pm.activity=()=>this.life.active;this.officeWorkUI=new OfficeWorkUI(this);this.officePeople=new OfficePeople(this);this.foodPeople=new FoodPeople(this);this.people=new NearbyPeople(this);this.ambience=new Ambience(this);this.autoWork=new AssistantAutoWork(this);this.assistantHUD=new AssistantHUD(this);this.lifestyle=new LifestyleSystem(this);this.calls.seed=this.seed;this.leadership=new Leadership(this);
  this.bus.on('RESUME_REQUESTED',()=>this.resume());this.bus.on('PAUSE_REQUESTED',()=>this.pause());this.bus.on('PAUSE_TOGGLE',()=>this.state==='PAUSED'?this.resume():this.pause());
  this.bus.on('QUALITY_CHANGED',q=>{this.settings.quality=q;writeSettings(this.settings);this.resize();});this.bus.on('SENSITIVITY_CHANGED',value=>{this.settings.sensitivity=value;writeSettings(this.settings);});
  this.bus.on('SUBFAB_CHECK_REQUESTED',task=>{this.hud.message(`製造部：請至 2F Sub FAB 檢查 ${task.subjectId}，工單已加入。`);const c=this.phone.contacts.find(c=>c.role==='manufacturing');if(c)this.phone.enqueue(c.id,task.subjectId,'subfab');});
  this.bus.on('PM_CLOSED',t=>this.hud.message(`${this.pm.agent(t.assistantId)?.name??'助理'} 已完成 ${t.equipmentId} PM 並結案。`));this.bus.on('ASSISTANT_FIELD_COMPLETED',t=>this.hud.message(`${this.pm.agent(t.lastAssistantId)?.name??'助理'} 已完成現場檢查${this.tasks.tasks.has(t.id)?this.progression.rank===3?'，領班會接手後續報告。':'，電腦報告請回自己座位完成。':'，任務結案。'}`));
  this.bus.on('AMBIENT_VOLUME_CHANGED',value=>{this.settings.ambientVolume=value;writeSettings(this.settings);this.ambience.unlock();});
  this.bus.on('INTERACTION_SELECTED',item=>this.interact(item));this.bus.on('DETAIL_CLOSED',()=>this.closeDetail());
  this.bus.on('AIRSHOWER_STARTED',()=>{if(this.world.airshower.operator&&this.world.airshower.operator!==this.player)return;this.hud.message('風淋中 · 雙門關閉，請稍候。');});this.bus.on('AIRSHOWER_COMPLETED',()=>{if(!this.world.airshower.operator||this.world.airshower.operator===this.player)this.hud.message('風淋完成，出口門已開啟。');});
  this.bus.on('FLOOR_CHANGED',y=>{this.navigation.last.x=Infinity;this.hud.message((this.player.position.z>=76?FAB_FLOORS:FLOORS).find(f=>f.y===y)?.label);});
  document.querySelector('#close-lift').onclick=()=>this.closeDetail();for(const button of document.querySelectorAll('[data-floor]'))button.onclick=()=>{const to=Number(button.dataset.floor),lift=this.selectedElevator??this.world.elevator;this.closeDetail();lift.start(this.player,to);this.controls();};
  document.querySelector('#buy-food').onclick=()=>{const item=this.world.interactions.find(i=>i.shop?.id===this.detailShop?.id);if(item&&this.life.buy(item.shop,item))this.closeDetail();};
  this.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.pause();document.querySelector('#boot-error').textContent='3D 顯示已中斷，請重新整理頁面。';document.querySelector('#start').disabled=true;});
  window.addEventListener('resize',()=>this.resize());this.resize();this.hud.ready();this.setupModuleChoice();this.officeAssignment=new OfficeAssignment(this);this.career=new Career(this,save,loaded);this.mobileUI=new MobileUI(this);this.tutorial=new FirstDayTutorial(this,loaded?.snapshot?.tutorial);this.autoNavigation=new AutoNavigation(this);this.titleScreen=new TitleScreen(this,loaded);this.updateModuleLabel();this.lifestyle.refresh();this.lifestyle.update(0);this.world.meeting.update(0,this.clock,this.player.position);this.navigation.update(1,this.player.position);this.follow.update(1,this.player,this.input);this.hud.update(0,this);this.workHUD.update();this.assistantHUD.update();this.bus.emit('DAY_STARTED',{day:this.clock.day,plan:this.dayPlan,resumed:!!loaded?.snapshot});
  if(import.meta.env.DEV&&new URLSearchParams(location.search).has('debug'))this.installDebug();
  applyArtDirection(this.scene);this.hemi.intensity=1.75;this.ambient.intensity=.28;
  this.previous=performance.now();this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);
 }
 setupModuleChoice(){
  const select=document.querySelector('#module-select');for(const m of MODULES){const option=document.createElement('option');option.value=m.id;option.textContent=`${m.id} · ${m.name}｜距離難度 ${m.level}/8`;select.append(option);}select.value=this.dayPlan.module;
  const describe=()=>{const m=moduleInfo(select.value),row=String.fromCharCode(65+m.row);document.querySelector('#module-description').textContent=`${row} 排左右兩側${m.id==='ETCH'?'＋B 排':''} · 距風淋出口沿主走道約 ${143+m.row*48-17-76} m。${m.level===1?'最近，適合第一次上班。':m.level>=6?'長距離往返，適合善用助工派工。':'往返路程增加，提早安排工作。'}`;};select.onchange=describe;describe();document.querySelector('#module-choice').hidden=!this.moduleSelection;this.updateModuleLabel();
 }
 updateModuleLabel(){this.officeAssignment?.sync();document.querySelector('.brand small').textContent=`${this.profile.name} · ${RANKS[this.progression.rank].name} · 第 ${yearOf(this.clock.day)} 年`;document.title=`GGTA · 又要去修機了 · ${this.dayPlan.module} 設備工程師`;}
 confirmIdentity(){
  if(!this.nameSelection)return true;
  const input=document.querySelector('#character-name'),name=characterName(input.value);
  if(!name){input.setCustomValidity('請輸入角色名稱。');input.reportValidity();input.focus();return false;}
  input.setCustomValidity('');this.profile={name};const rank=entryRank(name);
  if(rank>this.progression.rank){const before=this.calls.rankInterval;this.progression=newProgression(rank);this.calls.rank=rank;for(const key of ['nextManufacturing','nextProcess'])this.calls[key]=this.clock.seconds+(this.calls[key]-this.clock.seconds)*this.calls.rankInterval/before;this.expandAssistantRoster();}
  this.nameSelection=false;document.querySelector('#character-choice').hidden=true;document.querySelector('#entry-name').textContent=name;document.querySelector('#entry-career').innerHTML=`<b>第 ${yearOf(this.clock.day)} 年 · ${RANKS[this.progression.rank].name}</b><br>${progressionText(this.progression,this.clock.day)}`;this.updateModuleLabel();return true;
 }
 confirmModule(){
  const module=document.querySelector('#module-select').value,old=[...this.alarms.owned];this.dayPlan.module=module;
  if(module!==this.living.equipment.byId.get(old[0]).area||old.length!==RANKS[this.progression.rank].equipment){
   this.alarms.ownedCount=RANKS[this.progression.rank].equipment;
   this.alarms.random=createRandom(this.seed^0x5fab03);this.alarms.assignModule(module);
   const replace=id=>this.alarms.owned[Math.max(0,old.indexOf(id))%this.alarms.owned.length];
   for(const p of [...this.officeWork.plan,...this.officeWork.subSchedule])p.subjectId=replace(p.subjectId);
   this.tasks.tasks.clear();for(const row of this.workHUD.rows.values())row.remove();this.workHUD.rows.clear();this.pm.jobs.clear();this.pm.random=createRandom(this.seed^0x5fab06);this.pm.generate(this.dayPlan.pmCount);
  }
  this.phoneUI.equipmentId=this.alarms.owned[0];document.querySelector('#assigned').textContent=`今日負責：${this.alarms.owned.join(' · ')}`;
  const e=this.living.equipment.byId.get(this.alarms.owned[0]);this.bus.emit('NAVIGATION_SELECTED',{id:e.id,name:e.id,x:e.x,y:FAB_Y,z:e.z-6});
  this.moduleSelection=false;document.querySelector('#module-choice').hidden=true;this.updateModuleLabel();
 }
 resize(){this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,QUALITY[this.settings.quality].pixelRatio));this.renderer.setSize(innerWidth,innerHeight,false);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
 attendHandover(which,item){
  if(this.frozen||this.fastForwarding||!this.shift.canAttend(which)||!this.life.start(`handover-${which}`,item))return false;
  const seconds=this.life.active.remaining,until=this.clock.seconds+seconds;this.fastForwarding=true;this.input.reset();
  try{while(this.clock.seconds<until-1e-6){const dt=Math.min(.25,(until-this.clock.seconds)/this.clock.scale);this.update(dt,dt);}}
  finally{this.fastForwarding=false;this.previous=performance.now();this.input.reset();this.controls();}
  this.world.meeting.update(0,this.clock,this.player.position);this.living.update(0,this.player.position);this.navigation.last.x=Infinity;this.navigation.update(1,this.player.position);this.hud.update(0,this);this.workHUD.update();this.phoneUI.update();this.lifeUI.update();this.career.persist();
  this.hud.message(which==='morning'?`早交班完成，今日派工已加入任務清單 · 已快轉 1 小時（${this.clock.text}）。`:'晚交班完成 · 已到 17:30，可以移交工作並下班。');
  if(which==='evening')this.lifeUI.show('handover',item);
  return true;
 }
 nap(item){
  if(this.frozen||this.fastForwarding)return false;
  if(this.life.active?.type==='rest')this.life.stop();
  if(!this.life.start('nap',item))return false;
  this.lifeUI.hide();const until=this.clock.seconds+this.life.active.remaining;this.fastForwarding=true;this.input.reset();
  try{while(this.clock.seconds<until-1e-6){const dt=Math.min(.25,(until-this.clock.seconds)/this.clock.scale);this.update(dt,dt);}}
  finally{this.fastForwarding=false;this.previous=performance.now();this.input.reset();this.controls();}
  this.world.meeting.update(0,this.clock,this.player.position);this.hud.update(0,this);this.workHUD.update();this.phoneUI.update();this.lifeUI.update();this.career.persist();
  this.hud.message(`午睡結束 · 已過 30 分鐘（${this.clock.text}），請查看新增工作與來電。`);return true;
 }
 get frozen(){return this.state==='PAUSED'||this.state==='SHIFT_ENDED';}
 get movingElevator(){return this.world.elevators.find(e=>e.busy);}
 get elevatorBusy(){return !!this.movingElevator;}
 get playerAirBusy(){return this.world.airshower.busy&&(!this.world.airshower.operator||this.world.airshower.operator===this.player);}
 expandAssistantRoster(){
  const target=RANKS[this.progression.rank].assistants;this.dayPlan.rank=this.progression.rank;
  while(this.assistants.length<target){const i=this.assistants.length,c={...assistantContacts(target)[i],onLeave:false},a=new AssistantEngineer(this.scene,c,this.navigation.finders,this.world.collision,i);a.research=this.research;this.assistants.push(a);this.phone.contacts.push(c);this.phone.byId.set(c.id,c);this.people.addAssistant(a);this.assistantHUD.add(a);}
  this.dayPlan.assistants=this.assistants.length;this.phoneUI.render(true);this.assistantHUD.update();this.lifeUI.render(true);this.hud.message(`編制已更新 · 現在可指派 ${target} 位助工，新同事已在辦公室到位。`);
 }
 controls(){this.input.lookEnabled=!this.frozen&&!this.lifeUI?.open&&!this.assistantHUD?.open&&this.career?.ui.panel.hidden!==false;this.input.speedFactor=(this.life?.stats.movementFactor??1)*this.research.effects.playerSpeed;this.input.enabled=this.state==='PLAYING'&&!this.life?.active&&!this.lifeUI?.open&&!this.assistantHUD?.open&&!this.detailOpen&&this.career?.ui.panel.hidden!==false&&this.gownRemaining<=0&&!this.elevatorBusy&&!this.playerAirBusy;}
 resume(){if(this.state==='SHIFT_ENDED'||this.career?.ui.panel.hidden===false)return;if(!this.confirmIdentity())return;if(this.moduleSelection)this.confirmModule();this.titleScreen?.leave();this.workHUD.unlockAudio();this.phoneUI.ringtone.unlock();this.previous=performance.now();this.state=this.repair.active?'MINIGAME':this.life?.active?.type.startsWith('handover-')?'HANDOVER':'PLAYING';this.hud.setPaused(false);this.input.reset();this.controls();document.activeElement?.blur();this.phoneUI.syncAudio();this.ambience.unlock();}
 pause(){this.autoNavigation?.stop();if(this.state==='SHIFT_ENDED')return;this.mobileUI?.collapse();this.workHUD.repairUI.release();this.state='PAUSED';this.input.enabled=false;this.input.reset();this.hud.setPaused(true);this.phoneUI.syncAudio();this.career?.persist();this.ambience.update();}
 closeDetail(){this.detailOpen=false;this.detailEquipment=null;this.detailSub=false;this.detailShop=null;this.hud.closeDetail();document.querySelector('#lift-panel').hidden=true;document.querySelector('#buy-food').hidden=true;this.input.reset();this.controls();}
 describe(id){if(this.shift?.isTransferred(id))return{title:id,description:`已移交下一班。STATUS: ${equipmentStatus(this.living.equipment.byId.get(id).workStatus??this.living.equipment.byId.get(id).state)}\n下一班負責處理與確認；不計為你的修機或 PM 完成。`};const pm=this.pm?.get(id);if(pm&&pm.status!=='PENDING'&&pm.status!=='CLOSED')return{title:id,description:`STATUS: PM\n${this.pm.status(pm)} · ${Math.floor(pm.progress*100)}%\n助理：${this.pm.agent(pm.assistantId)?.name}\n${pm.incident&&pm.status==='WAIT_INCIDENT'?pm.incident.text:'助理全權處理 PM、異常重查與驗收，完成後自動結案。'}`};const base=this.living.equipment.describe(id,this.living.now),t=this.alarms.get(id),owned=this.alarms.owned.includes(id);if(t)base.description=`${owned?'今日負責設備':'背景設備'} · STATUS: ${t.status=== 'DOWN'?'DOWN':'HOLD / 等待製程'}
處理位置：${t.y===0?'2F Sub FAB · 對應支援設備':'3F FAB · 機台前方'}
ALARM: ${t.alarm.code} · ${t.alarm.name}
${t.alarm.description}

${t.status==='DOWN'?`${REPAIR_GAMES[t.repair.type].name} · 修機進度 ${Math.floor(repairProgress(t.repair)*100)}% · 可離開後繼續。`:'修復完成，但尚未放行。請通知 製程 接手。'}`;else if(this.living.equipment.byId.get(id).workStatus)base.description='製程 已接手，正在確認設備狀態。';else base.description+=(owned?'\n今日由你負責。':'\n此機台由其他工程師負責。');if(pm?.status==='PENDING')base.description+=`\n\nPM 尚未開始：${t?'先排除以上異常並等待製程確認。':this.pm.canAssign(pm)?'可用手機遠端指派空閒助工，不必親自到場。':'等待製程確認完成後，再遠端指派助工執行 PM。'}`;return base;}
 interact(item){
  if(this.state!=='PLAYING'||this.career?.ui.panel.hidden===false||this.life?.active||this.lifeUI?.open||this.detailOpen||this.gownRemaining>0||this.elevatorBusy||this.playerAirBusy)return;
  this.input.reset();this.input.enabled=false;
  if(this.world.lobby.interact(item,this)){this.controls();return;}
  if(['desk','dining','coffee','colleague','handover','shop','tray-return','claw'].includes(item.kind)){this.lifeUI.show(item.kind,item);return;}
  if(item.kind==='gown'){this.gownRemaining=this.gownDuration;this.bus.emit('GOWNING_STARTED');}
  else if(item.kind==='elevator'){this.selectedElevator=this.world.elevators.find(e=>e.id===(item.elevatorId??'office'));for(const b of document.querySelectorAll('[data-floor]')){const floor=this.selectedElevator.floors.find(f=>f.y===Number(b.dataset.floor));b.hidden=!floor;if(floor)b.textContent=floor.label;}this.detailOpen=true;document.querySelector('#lift-panel').hidden=false;for(const b of document.querySelectorAll('[data-floor]'))b.disabled=Math.abs(Number(b.dataset.floor)-this.player.position.y)<.1;}
  else{this.detailOpen=true;this.detailSub=item.kind==='sub-equipment';this.detailEquipment=item.equipmentId??null;this.detailShop=item.shop??null;document.querySelector('#buy-food').hidden=!item.shop;this.hud.showDetail(this.detailEquipment&&(!this.detailSub||this.alarms.get(this.detailEquipment))?this.describe(this.detailEquipment):item);this.workHUD.update();}
 }
 startRepair(id,mode='manual'){if(this.life?.active||this.frozen)return;const task=this.alarms.get(id);const e=this.living.equipment.byId.get(id);if(!e||!task||Math.hypot(this.player.position.x-task.x,this.player.position.z-task.z)>3||Math.abs(this.player.position.y-(task.y??FAB_Y))>.5)return;if(this.repair.start(id,mode)){this.closeDetail();this.state='MINIGAME';this.input.reset();this.controls();}}
 leaveRepair(){this.repair.suspend();document.querySelector('#repair').hidden=true;if(this.state!=='PAUSED')this.state='PLAYING';this.input.reset();this.controls();this.hud.message('修機進度已保留，可以稍後回來。');}
 update(dt,realDt=dt){
  this.elapsed+=dt;this.clock.update(dt);this.officeWork.update();this.life.update();this.shift.update(dt*this.clock.scale,this.life.active);this.repair.efficiency=this.life.stats.repairFactor;this.alarms.update(dt);this.repair.update(dt);this.pm.update();for(const t of this.tasks.tasks.values())if(t.status==='WAIT_PROCESS'&&t.repairedBy==='assistant')this.alarms.notify(t.id);if(this.progression.rank!==3)this.autoWork.update();this.leadership.update(dt*this.clock.scale);if(this.progression.rank!==3&&this.dayPlan.tutorialVersion!==1)this.calls.update();this.tutorial?.update();this.phone.update(realDt);
  if(this.gownRemaining>0){this.gownRemaining=Math.max(0,this.gownRemaining-dt);if(this.gownRemaining===0){this.player.setGowned(true);this.world.setGowned(true);this.hud.message('無塵衣已穿好，請穿過雙門風淋通道。');this.bus.emit('PLAYER_GOWNED');}}
  for(const e of this.world.elevators)e.update(dt,this.player);this.updateAssistantAccess(dt);this.controls();const beforeMoveZ=this.player.position.z,beforeMoveX=this.player.position.x,beforeMoveY=this.player.position.y;this.autoNavigation?.update(dt);this.input.update(dt,this.player,this.world.collision);this.world.airshower.access.constrain(this.player,beforeMoveZ);if(this.player.position.y===CLEAN_ACCESS.y&&!this.player.gowned&&beforeMoveZ<=69.4&&this.player.position.z>69.4)this.player.position.z=69.4;const moved=Math.hypot(this.player.position.x-beforeMoveX,this.player.position.z-beforeMoveZ,this.player.position.y-beforeMoveY);this.record.walking+=moved;if(this.player.position.y===FAB_Y&&this.player.position.z>116)this.record.fabWalking+=moved;this.traffic.refresh();for(const a of this.assistants)a.update(dt,this.player.position,this.world.airshower);
  if(this.player.gowned&&this.player.position.z<CLEAN_ACCESS.leaveZ){this.player.setGowned(false);this.world.setGowned(false);this.hud.message('已離開潔淨區，換回一般工作服。');this.bus.emit('PLAYER_ENTERED_OFFICE');}
  const inFab=this.player.position.y===FAB_Y&&this.player.position.z>116;if(inFab&&!this.inFab)this.bus.emit('PLAYER_ENTERED_FAB');this.inFab=inFab;
  const warmth=inFab?1:0;this.hemi.color.copy(this.neutral).lerp(this.warm,warmth*.8);this.ambient.color.copy(this.neutral).lerp(this.warm,warmth);this.scene.fog.color.setHex(inFab?0xf0e6bf:this.player.position.y===0&&this.player.position.x>=15&&this.player.position.z<76?0x9ed7ef:0xdce9e7);this.scene.background.copy(this.scene.fog.color);
  this.world.lobby.update(dt,this);this.world.deputyOffice.update(dt,this.player.position);this.world.updateView(this.player.position);this.foodPeople.update(dt);this.officePeople.update(dt);this.lifestyle.update(dt);this.living.update(dt,this.player.position,!this.fastForwarding);if(!this.fastForwarding){this.world.meeting.update(dt,this.clock,this.player.position);this.navigation.update(dt,this.player.position);this.interaction.update();this.follow.update(dt,this.player,this.input);}
 }
 updateAssistantAccess(dt){this.world.airshower.access.update(dt,this.player,this.assistants);}
 frame(now){const realDt=Math.max(0,(now-this.previous)/1000),dt=Math.min(BALANCE.maxFrameDelta,realDt);this.previous=now;if(!this.frozen){this.update(dt,realDt);this.career.update(realDt);}this.uiTimer+=dt;
  if(this.uiTimer>.1){this.hud.update(this.frozen?0:this.uiTimer,this);this.workHUD.update();this.phoneUI.update();this.pmUI.update();this.lifeUI.update();this.officeWorkUI.update();this.assistantHUD.update();this.ambience.update();this.people.update();this.tutorial?.render();this.autoNavigation?.render();for(const npc of this.officeColleagues)npc.group.visible=this.player.position.y>3&&this.player.position.z<45;if(this.debugElement)this.debugElement.textContent=`DEV · Seed ${this.seed}
DAY ${this.clock.day} · ${this.dayPlan.profile} · ${this.state} · ${Math.round(1/Math.max(dt,.001))} FPS · ${this.clock.text}
X ${this.player.position.x.toFixed(1)} Y ${this.player.position.y.toFixed(1)} Z ${this.player.position.z.toFixed(1)}
Draw ${this.renderer.info.render.calls} · Bay ${this.living.bays.activeCount}
Tasks ${this.tasks.tasks.size} · ${this.world.airshower.mode}\nOHT ${this.living.oht.vehicles.length+this.living.oht.mainVehicles.length} · Branch ${this.living.oht.trunk.entries}/${this.living.oht.trunk.returns}
Gowned ${this.player.gowned} · ${this.elapsed.toFixed(1)}s`;this.uiTimer=0;}
  if(this.titleScreen?.active)this.titleScreen.render(dt);else this.renderer.render(this.scene,this.camera);requestAnimationFrame(this.frame);
 }
 installDebug(){this.debugDirector=()=>this.director.opportunity();this.debugSave=()=>this.career.persist();this.debugElement=document.querySelector('#debug');this.debugElement.hidden=false;window.__fab=this;window.addEventListener('keydown',e=>{if(e.code==='F3'){e.preventDefault();this.debugElement.hidden=!this.debugElement.hidden;}});this.debugTeleport=(x,z,y=0)=>{if(!this.world.collision.isWalkable(x,z,.32,false,y))throw Error('Blocked destination');this.player.position.set(x,y,z);this.navigation.last.x=Infinity;this.world.elevator.sync(y);this.world.fabElevator.sync(y);if(z>77)this.world.airshower.mode='FAB';else if(z<69)this.world.airshower.mode='ENTRY';};this.debugAlarm=(id,options)=>this.alarms.trigger(id,options);this.debugCall=(role='manufacturing',id=this.alarms.owned[0])=>{const c=this.phone.contacts.find(c=>c.role===role);return this.phone.enqueue(c.id,id,'debug');};this.debugPMIncident=id=>this.pm.forceIncident(id??[...this.pm.jobs.values()].find(t=>t.status==='RUNNING')?.equipmentId);this.debugStats=(satiety,fatigue)=>{this.life.stats.satiety=Math.min(100,Math.max(0,satiety));this.life.stats.fatigue=Math.min(100,Math.max(0,fatigue));};this.debugSetTime=(hours,minutes)=>{this.clock.seconds=hours*3600+minutes*60;};
  const tools=document.createElement('div');tools.className='debug-trigger';const select=document.createElement('select');select.id='debug-repair-type';select.setAttribute('aria-label','DEV repair type');for(const [id,label] of [['','隨機'],...Object.entries(REPAIR_GAMES).map(([id,g])=>[id,g.name])]){const o=document.createElement('option');o.value=id;o.textContent=label;select.append(o);}const button=document.createElement('button');button.textContent='DEV · Alarm';button.onclick=()=>{const type=select.value,alarm=ALARMS.find(a=>a.games.includes(type));if(!this.debugAlarm(undefined,type?{alarmCode:alarm.code,gameType:type}:undefined))this.hud.message('今日負責機台都已有工作，請先完成一台。');};tools.append(select,button);for(const role of ['manufacturing','process']){const call=document.createElement('button');call.textContent=role==='process'?'DEV · 製程 Call':'DEV · MFG Call';call.onclick=()=>this.debugCall(role);tools.append(call);}const incident=document.createElement('button');incident.textContent='DEV · PM Incident';incident.onclick=()=>this.debugPMIncident();tools.append(incident);for(const [label,fn] of [['DEV · 16:30',()=>this.debugSetTime(16,30)],['DEV · 17:30',()=>this.debugSetTime(17,30)],['DEV · Hunger / Fatigue',()=>this.debugStats(10,90)]]){const b=document.createElement('button');b.textContent=label;b.onclick=fn;tools.append(b);}document.body.append(tools);
 }
}
