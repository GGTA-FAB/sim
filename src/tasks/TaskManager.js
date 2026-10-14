export class TaskManager {
  constructor(bus){this.bus=bus;this.tasks=new Map();this.completed=[];}
  add(task){this.tasks.set(task.id,task);this.bus.emit('TASK_ADDED',task);}
  changed(task){this.bus.emit('TASK_UPDATED',task);}
  complete(id){const task=this.tasks.get(id);if(!task)return;this.tasks.delete(id);this.completed.push(task);this.bus.emit('TASK_COMPLETED',task);}
}
