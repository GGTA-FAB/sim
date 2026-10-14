import { QUALITY } from '../data/balance.js';
export function readSettings(){
  let data={};try{data=JSON.parse(localStorage.getItem('fab-gta:settings:v1'))||{};}catch{}
  return {ambientVolume:Number.isFinite(data.ambientVolume)?Math.max(0,Math.min(1,data.ambientVolume)):.35,quality:QUALITY[data.quality]?data.quality:matchMedia('(pointer:coarse),(max-width:700px)').matches?'low':'medium',sensitivity:Math.min(2,Math.max(.5,Number(data.sensitivity)||1))};
}
export function writeSettings(settings){try{localStorage.setItem('fab-gta:settings:v1',JSON.stringify(settings));}catch{/* Storage denial never prevents play. */}}
