export class EventBus {
  constructor(){this.listeners=new Map();}
  on(type,listener){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(listener);return()=>this.listeners.get(type)?.delete(listener);}
  emit(type,data){this.listeners.get(type)?.forEach(listener=>listener(data));}
}
