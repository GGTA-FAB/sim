// Touch layout changes presentation only; opening a drawer never pauses the FAB.
export class MobileUI {
 constructor(game){
  this.game=game;this.media=matchMedia('(pointer:coarse),(max-width:700px)');this.map=document.querySelector('#minimap-panel');
  const button=document.createElement('button');button.id='map-size';button.textContent='＋';button.setAttribute('aria-label','放大小地圖');button.setAttribute('aria-expanded','false');this.map.querySelector('.minimap-heading').append(button);
  button.onclick=()=>{const expanded=this.map.classList.toggle('map-expanded');button.textContent=expanded?'×':'＋';button.setAttribute('aria-expanded',String(expanded));button.setAttribute('aria-label',expanded?'收起小地圖':'放大小地圖');game.input.reset();};
  this.closeMap=()=>{this.map.classList.remove('map-expanded');button.textContent='＋';button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','放大小地圖');};
  for(const name of ['task','route'])document.querySelector(`#${name}-toggle`).addEventListener('click',()=>{
   if(!this.media.matches)return;const open=!document.querySelector(`#${name}-body`).hidden;
   this.closeDrawer(name==='task'?'route':'task');document.body.dataset.hudOpen=String(open);game.input.reset();
   if(open){this.closeMap();game.phoneUI.hide();}
  });
  game.bus.on('NAVIGATION_SELECTED',()=>{if(this.media.matches){this.collapse();this.closeMap();}});
  game.bus.on('PAUSE_REQUESTED',()=>this.collapse());
  const resize=()=>{game.input.reset();game.workHUD.repairUI.release();if(this.media.matches)this.collapse();};
  this.media.addEventListener('change',resize);window.addEventListener('resize',resize);resize();
 }
 closeDrawer(name){document.querySelector(`#${name}-body`).hidden=true;document.querySelector(`#${name}-toggle`).setAttribute('aria-expanded','false');if(name==='route')this.game.hud.collapsed=true;}
 collapse(){if(!this.media.matches)return;this.closeDrawer('task');this.closeDrawer('route');document.body.dataset.hudOpen='false';}
}
