// Paginate only the short landscape handset; desktop and portrait keep their list.
export class TaskBoard {
 constructor(game){this.game=game;this.filter='all';this.page=0;this.media=matchMedia('(max-height:520px) and (orientation:landscape)');this.touch=matchMedia('(pointer:coarse),(max-width:700px)');
  const body=document.querySelector('#task-body');body.insertAdjacentHTML('afterbegin','<div class="task-board-bar"><strong>今日工作</strong><div class="task-filters"><button data-task-filter="all" aria-pressed="true">全部</button><button data-task-filter="mine" aria-pressed="false">待我處理</button><button data-task-filter="delegated" aria-pressed="false">助工處理</button></div><button id="task-board-close" aria-label="關閉任務">×</button></div>');
  body.insertAdjacentHTML('beforeend','<div class="task-pages"><button id="task-prev" aria-label="上一頁任務">←</button><span id="task-page" role="status"></span><button id="task-next" aria-label="下一頁任務">→</button></div><p id="task-filter-empty" hidden>此分類目前沒有工作。</p>');
  body.addEventListener('click',e=>{const f=e.target.closest('[data-task-filter]');if(f){this.filter=f.dataset.taskFilter;this.page=0;this.update();}});
  document.querySelector('#task-prev').onclick=()=>{this.page--;this.update();};document.querySelector('#task-next').onclick=()=>{this.page++;this.update();};document.querySelector('#task-board-close').onclick=()=>game.mobileUI.collapse();
 }
 update(){const active=this.media.matches&&this.touch.matches,rows=[...document.querySelector('#task-list').children];if(!active){for(const row of rows)row.hidden=false;document.querySelector('#task-filter-empty').hidden=true;return;}
  const matches=rows.filter(r=>this.filter==='all'||(r.dataset.delegated==='true'||r.dataset.status==='COMPLETE')===(this.filter==='delegated'));
  const size=innerWidth>=720&&innerHeight>=360?4:2,pages=Math.max(1,Math.ceil(matches.length/size));this.page=Math.max(0,Math.min(this.page,pages-1));const visible=new Set(matches.slice(this.page*size,(this.page+1)*size));for(const row of rows)row.hidden=!visible.has(row);
  document.querySelector('#task-page').textContent=`${matches.length} 件 · ${this.page+1} / ${pages} 頁`;document.querySelector('#task-prev').disabled=this.page===0;document.querySelector('#task-next').disabled=this.page===pages-1;document.querySelector('#task-filter-empty').hidden=matches.length>0;
  for(const b of document.querySelectorAll('[data-task-filter]'))b.setAttribute('aria-pressed',String(b.dataset.taskFilter===this.filter));
 }
}
