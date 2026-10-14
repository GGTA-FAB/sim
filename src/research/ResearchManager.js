import {LIFESTYLE_REQUIRED,WALLPAPERS} from '../data/lifestyleResearch.js';
import {RESEARCH_PROJECTS,RESEARCH_BY_ID,validateResearch,assistantCapacity,cappedResearchEffect} from '../data/research.js';
export class ResearchManager {
 constructor(bus,saved){validateResearch(saved);this.bus=bus;this.cosmetics={wallpaper:'ocean',clawPrizes:0,clawAttempts:0,...saved?.cosmetics};this.autoDispatchEnabled=saved?.autoDispatchEnabled??true;this.progress={...saved?.progress};this.effects={playerSpeed:1,assistantSpeed:1,pmRate:1,alarmReduction:0,callInterval:1};this.syncEffects();}
 definition(id){return Object.hasOwn(RESEARCH_BY_ID,id)?RESEARCH_BY_ID[id]:null;}
 fraction(id){const p=this.definition(id);return p?(this.progress[id]??0)/p.seconds:0;}
 remaining(id){const p=this.definition(id);return p?Math.max(0,p.seconds-(this.progress[id]??0)):0;}
 complete(id){return !!this.definition(id)&&this.remaining(id)===0;}
 get assistantCapacity(){return assistantCapacity(this);}
 get foundationCount(){return RESEARCH_PROJECTS.filter(p=>!p.lifestyle&&this.complete(p.id)).length;}
 get lifestyleUnlocked(){return this.foundationCount>=LIFESTYLE_REQUIRED;}
 available(id){const p=this.definition(id);return !!p&&!(p.staffing&&this.careerMode)&&(!p.lifestyle||this.lifestyleUnlocked)&&(!p.requires||this.complete(p.requires));}
 setWallpaper(value){if(!this.complete('fun-wallpaper')||!Object.hasOwn(WALLPAPERS,value))return false;this.cosmetics.wallpaper=value;this.bus.emit('COSMETICS_CHANGED');return true;}
 allows(type){return this.complete(`auto-${type}`);}
 advance(id,seconds){const p=this.definition(id);if(!p||!this.available(id)||!Number.isFinite(seconds)||seconds<=0||this.complete(id))return 0;const used=Math.min(seconds,this.remaining(id));this.progress[id]=(this.progress[id]??0)+used;if(this.remaining(id)<1e-6)this.progress[id]=p.seconds;if(this.complete(id)){this.syncEffects();this.bus.emit('RESEARCH_COMPLETED',p);}return used;}
 syncEffects(){for(const p of RESEARCH_PROJECTS)if(p.effect)this.effects[p.effect]=this.complete(p.id)?cappedResearchEffect(p.effect,p.value):(p.effect==='alarmReduction'?0:1);}
 snapshot(){return {version:1,autoDispatchEnabled:this.autoDispatchEnabled,cosmetics:{...this.cosmetics},progress:{...this.progress}};}
}
