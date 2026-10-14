import {LIFE_LOCATIONS} from '../data/life.js';
// Explicit meeting shortcut. Physical travel remains unchanged everywhere else.
export function joinHandover(game){
 const which=game.shift.canAttend('morning')?'morning':game.shift.canAttend('evening')?'evening':null;
 if(!which||game.frozen||game.fastForwarding)return false;
 game.assistantHUD?.hide();game.lifeUI.hide();game.closeDetail();game.phoneUI.hide();
 if(game.repair.active)game.leaveRepair();
 game.life.stop();game.gownRemaining=0;
 // A cancelled trip must not pull the player back into a moving cabin next frame.
 for(const lift of game.world.elevators)if(lift.busy&&lift.player===game.player){lift.remaining=0;lift.sync(lift.from);lift.player=null;}
 const air=game.world.airshower;if(!air.operator||air.operator===game.player){air.remaining=0;air.operator=null;air.mode='ENTRY';}
 const target=LIFE_LOCATIONS.handover;game.player.position.set(target.x,target.y,target.z);game.player.setGowned(false);game.world.setGowned(false);game.player.setLifePose(null);game.input.reset();game.input.yaw=0;game.inFab=false;
 game.bus.emit('NAVIGATION_SELECTED',{...target,name:'3F · 交班會議室'});game.follow.update(1,game.player,game.input);
 return game.attendHandover(which,target);
}
