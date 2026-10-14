import {GAME_TIME_SCALE} from '../data/balance.js';
export class GameClock {
  constructor(){this.day=1;this.seconds=8.5*3600;this.scale=GAME_TIME_SCALE;}
  update(dt){this.seconds+=dt*this.scale;}
  get text(){const m=Math.floor(this.seconds/60);return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;}
}
