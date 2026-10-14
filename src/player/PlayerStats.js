import {LIFE_BALANCE as B} from '../data/life.js';
const clamp=v=>Math.min(100,Math.max(0,v));
export class PlayerStats {
 constructor(){this.reset();}
 reset(){this.satiety=B.satietyStart;this.fatigue=B.fatigueStart;this.lowestSatiety=this.satiety;this.highestFatigue=this.fatigue;}
 update(seconds,recovery=0){this.satiety=clamp(this.satiety-seconds/3600*B.satietyPerHour);this.fatigue=clamp(this.fatigue+seconds/3600*(B.fatiguePerHour-recovery));this.record();}
 eat(seconds){this.satiety=clamp(this.satiety+B.foodSatiety*seconds/B.eatSeconds);this.record();}
 coffee(seconds){this.fatigue=clamp(this.fatigue-B.coffeeRecovery*seconds/B.coffeeSeconds);}
 record(){this.lowestSatiety=Math.min(this.lowestSatiety,this.satiety);this.highestFatigue=Math.max(this.highestFatigue,this.fatigue);}
 get movementFactor(){const hunger=this.satiety<B.lowSatiety?.65+.35*this.satiety/B.lowSatiety:1,fatigue=this.fatigue>B.highFatigue?1-.3*(this.fatigue-B.highFatigue)/(100-B.highFatigue):1;return Math.max(.5,hunger*fatigue);}
 get repairFactor(){return this.satiety<B.lowSatiety?.65+.35*this.satiety/B.lowSatiety:1;}
}
