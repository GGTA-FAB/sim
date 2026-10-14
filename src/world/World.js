import {DeputyOffice} from './DeputyOffice.js';
import {Lobby} from './Lobby.js';
import {CAMPUS_ROOMS} from '../data/lobby.js';
import {buildOfficeConnector} from './OfficeConnector.js';
import {buildFabCore} from './FabCore.js';
import {buildSubFab} from './SubFab.js';
import {installPosters} from './Posters.js';
import {MeetingRoom,MEETING_ROOM} from './MeetingRoom.js';
import * as THREE from 'three';
import { FAB_END,FAB_CENTER,FAB_DEPTH,ROOMS,CONNECTOR_ROOMS,BAYS,LOWER_ROOMS,CORE_ROOMS,FAB_CORE_ROOMS,FAB_LIFT,FAB_FLOORS,FAB_Y } from '../data/layout.js';
import { CollisionWorld } from './CollisionWorld.js';
import { Builder } from './Builder.js';
import { buildOffice } from './Office.js';
import { buildFab } from './Fab.js';
import { buildFoodHall } from './FoodHall.js';
import { Elevator } from './Elevator.js';
import { buildVerticalCore } from './VerticalCore.js';
import { AirShower } from './AirShower.js';
export class World {
  constructor(scene,bus){
    this.collision=new CollisionWorld([...ROOMS,...CONNECTOR_ROOMS,...LOWER_ROOMS,...CORE_ROOMS,...FAB_CORE_ROOMS,MEETING_ROOM,...CAMPUS_ROOMS]);this.interactions=[];
    const b=new Builder(scene,this.collision);
    for(let i=0;i<ROOMS.length;i++){
      const r=ROOMS[i],left=r.x-r.w/2,right=r.x+r.w/2,near=r.z-r.d/2,far=r.z+r.d/2;
      b.offsetY=r.y??0;b.box(r.x,-.15,r.z,r.w,.3,r.d,r.color);
      const height=r.height||5.5;
      b.box(r.x,height+.15,r.z,r.w,.25,r.d,0xe9eeea,true);
      for(const x of [left,right]){
        if(r.id==='lobby'&&x===right)continue;
        if(r.id==='office'&&x===right){b.box(x,height/2,9,.3,height,18,0xe4eae4,true);b.box(x,height/2,27,.3,height,2,0xe4eae4,true);b.box(x,4.85,22,.3,1.3,8,0xc1d1c9,true);}else b.box(x,height/2,r.z,.3,height,r.d,0xe4eae4,true);
        if(!(r.id==='office'&&x===right))b.box(x+(x<0?.18:-.18),.18,r.z,.05,.35,r.d,0x8ba09b);
      }
      for(const [edge,opening] of [[near,r.near??0],[far,r.far??0]]){
        if(!opening)b.box(r.x,height/2,edge,r.w,height,.3,0xe4eae4,true);
        else {const wing=(r.w-opening)/2;for(const side of [-1,1])if(wing>0)b.box(side*(opening/2+wing/2),height/2,edge,wing,height,.3,0xe4eae4,true);b.box(0,height-.6,edge,opening,1.2,.32,0xc1d1c9,true);}
      }
      for(let z=near+3;z<far;z+=7){
        for(const x of r.id==='fab'?[0]:r.w>20?[-9,0,9]:[0])b.box(x,height-.02,z,1.05,.06,3.2,0xf9fae9);
        b.box(0,.007,z,r.w,.01,.025,0xb9c9c1);
      }
      for(let x=left+3;x<right;x+=3)b.box(x,.008,r.z,.025,.01,r.d,0xb9c9c1);
    }
    b.offsetY=6;buildOffice(b,this.interactions);b.offsetY=0;

    b.sign('LIFT / STAIRS ↓',0,3.7,.4,9,.7);
    this.bayGroups=buildFab(scene,this.collision,this.interactions);this.subBayGroups=buildSubFab(scene,this.collision,this.interactions);b.offsetY=FAB_Y;
    b.sign(`3F FAB  /  ${BAYS.length} BAYS`,0,4.5,116.3,8,.8,'#eff6ef','#416c65',Math.PI);
    for(const bay of BAYS.filter(b=>b.side<0)){
      const other=BAYS.find(b=>b.row===bay.row&&b.side>0);
      b.sign(`${bay.area} ${bay.id}  ←     →  ${other.id} ${other.area}`,0,4.55,bay.z-22.5,11,.7,'#eff6ef','#557870',Math.PI);
    }
    for(const x of [-6.6,6.6])b.box(x,.022,FAB_CENTER,.1,.025,FAB_DEPTH-2,0x90b3a5);
    b.offsetY=0;
    b.offsetY=6;
    for(const x of [-6.4,6.4])for(const z of [63,65,67]){b.box(x,1.45,z,1.4,2.9,1.8,0xb1c2bb,true);b.box(x+(x<0?.72:-.72),1.5,z,.04,2.65,1.65,0xd5dfd5);}
    // Furniture stays outside the full connector approach, including off-centre touch input.
    b.box(-6,.45,69,2,.9,1,0x839f96,true);b.box(6,.45,69,2,.9,1,0x839f96,true);
    for(const x of [-4.85,4.85])b.box(x,1.95,60,.18,3.9,.22,0x90b3a5);
    b.sign('GOWNING  /  更衣區入口',0,3.85,59.8,7,.65,'#f0f4ea','#557f72',Math.PI);
    for(const x of [-4.5,4.5])b.box(x,.025,66,.08,.025,12,0x90b3a5);
    b.sign('換裝後通行  /  CLEANROOM',0,3.7,69.8,7,.65,'#f0f4ea','#557f72',Math.PI);
    b.sign('CLEAN AREA',0,3.7,70.2,5,.65);
    b.box(0,.013,70,15.5,.02,.25,0xc8b577);
    this.interactions.push({id:'gown',x:0,y:6,z:67.7,title:'更衣區',action:'換上無塵衣・開啟通道',kind:'gown',area:{minX:-7.5,maxX:7.5,minZ:64,maxZ:70.5}});
    b.finish();
    this.lobby=new Lobby(scene,this.collision,this.interactions);this.deputyOffice=new DeputyOffice(scene,this.collision);
    this.meeting=new MeetingRoom(scene,this.collision);buildVerticalCore(scene,this.collision);buildFabCore(scene,this.collision);buildOfficeConnector(scene,this.collision);
    buildFoodHall(scene,this.collision,this.interactions);this.elevator=new Elevator(scene,this.collision,this.interactions,bus);this.fabElevator=new Elevator(scene,this.collision,this.interactions,bus,{id:'fab',location:FAB_LIFT,floors:FAB_FLOORS});this.elevators=[this.elevator,this.fabElevator];this.airshower=new AirShower(scene,this.collision,bus);this.gate=this.airshower.doors[0].collider;installPosters(scene,this.collision);
  }
  setGowned(gowned){this.gate.enabled=!gowned;}
  updateView(position){for(const b of BAYS)this.subBayGroups.get(b.id).visible=Math.abs(position.y)<3&&Math.hypot(position.x-b.x,position.z-b.z)<140;}
  zone(p){if(p.y===0&&p.x>15&&p.z<76)return'2F · 水池花園';if(p.y===6&&p.z>=60&&p.z<76)return'3F · 更衣 / 共用風淋';if(p.z>=76){if(p.z<100)return `FAB ${p.y>3?'3F':'2F'} · 電梯 / 樓梯`;if(p.z<116)return p.y>3?'3F · 潔淨通道':'2F · Sub FAB 入口';const bay=BAYS.find(b=>Math.abs(p.x-b.x)<b.w/2&&Math.abs(p.z-b.z)<b.d/2);return `${p.y>3?'3F · FAB':'2F · Sub FAB'}${bay?` / ${bay.area} ${bay.id}`:''}`;}if(p.y>3&&(p.x>18||p.z>50)&&p.z<60)return'3F · FAB 側邊連通道';if(p.y>3&&p.z>=28)return'3F · 交班會議室';if(p.y< -3)return'1F · Food Street / 餐飲街';if(p.z<0)return p.y>3?'3F · 電梯 / 樓梯大廳':'2F · 電梯 / 樓梯大廳';if(p.y>3&&p.x< -6.2&&p.z>19.2&&p.z<28)return'3F · 副理獨立 Bay';if(p.y>3)return p.x< -3?'3F · 製程 Office Bay':p.x>3?'3F · Equipment Office Bay':'3F · Engineering Office';return p.z<28?'2F · XSMC 接待大廳':'2F · 水池花園';}
}
