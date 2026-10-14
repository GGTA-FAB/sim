// One pointer per control. Touch identifiers are separate from pointer IDs.
export class ControlGesture {
  constructor(element,{accept,move,end}){
    this.element=element;this.end=end;this.pointerId=null;this.touchId=null;
    element.addEventListener('pointerdown',e=>{
      if(this.pointerId!==null||e.button>0||!accept(e))return;
      e.preventDefault();this.pointerId=e.pointerId;this.pointerType=e.pointerType;
      try{element.setPointerCapture(e.pointerId);}catch{this.cancel();return;}
      move(e,true);
    });
    element.addEventListener('pointermove',e=>{
      if(e.pointerId!==this.pointerId)return;
      if(e.pointerType!=='touch'&&e.buttons===0){this.cancel();return;}
      move(e,false);
    });
    const finish=e=>{if(e.pointerId===this.pointerId)this.cancel();};
    // Capture phase also sees releases outside the control or stopped by a UI.
    for(const type of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(type,finish,true);
    element.addEventListener('touchstart',e=>{
      if(this.pointerType!=='touch'||this.pointerId===null||this.touchId!==null)return;
      const touch=Array.from(e.changedTouches).find(t=>element.contains(t.target));
      if(touch)this.touchId=touch.identifier;
    },{passive:true});
    const reconcile=e=>{
      if(this.pointerType!=='touch'||this.pointerId===null)return;
      if(e.touches.length===0||(this.touchId!==null&&!Array.from(e.touches).some(t=>t.identifier===this.touchId)))this.cancel();
    };
    // Independent fallback if the browser interrupts Pointer Events during a gesture.
    for(const type of ['touchend','touchcancel'])window.addEventListener(type,reconcile,{capture:true,passive:true});
    for(const type of ['contextmenu','dragstart','selectstart'])element.addEventListener(type,e=>{e.preventDefault();this.cancel();});
  }
  cancel(){
    const id=this.pointerId;this.pointerId=null;this.touchId=null;this.pointerType=null;
    this.end();
    // Clear ownership first: release may itself fire lostpointercapture.
    if(id!==null){try{if(this.element.hasPointerCapture(id))this.element.releasePointerCapture(id);}catch{/* Browser already cancelled the pointer. */}}
  }
}
