// Small static 1 m occupancy grid. A* only runs when a route needs recomputing.
// Gate is traversable for planning; the physical gate still requires gowning.
export class Pathfinder {
  constructor(collision,y=0){
    const rooms=collision.rooms.filter(r=>Math.abs((r.y??0)-y)<.5);
    this.minX=Math.floor(Math.min(...rooms.map(r=>r.x-r.w/2)));this.minZ=Math.floor(Math.min(...rooms.map(r=>r.z-r.d/2)));this.width=Math.ceil(Math.max(...rooms.map(r=>r.x+r.w/2)))-this.minX+1;this.height=Math.ceil(Math.max(...rooms.map(r=>r.z+r.d/2)))-this.minZ+1;this.collision=collision;
    this.walkable=new Uint8Array(this.width*this.height);
    for(let z=0;z<this.height;z++)for(let x=0;x<this.width;x++)this.walkable[z*this.width+x]=collision.isWalkable(x+this.minX,z+this.minZ,.42,true,y)?1:0;
    this.costs=new Float32Array(this.walkable.length);this.parents=new Int32Array(this.walkable.length);this.closed=new Uint8Array(this.walkable.length);this.heapIndices=[];this.heapScores=[];
  }
  index(x,z){return Math.round(z-this.minZ)*this.width+Math.round(x-this.minX);}
  point(index){return {x:index%this.width+this.minX,z:Math.floor(index/this.width)+this.minZ};}
  nearest(position){let best=-1,distance=Infinity;const ix=Math.round(position.x-this.minX),iz=Math.round(position.z-this.minZ);for(let z=Math.max(0,iz-3);z<=Math.min(this.height-1,iz+3);z++)for(let x=Math.max(0,ix-3);x<=Math.min(this.width-1,ix+3);x++){const i=z*this.width+x,d=(x+this.minX-position.x)**2+(z+this.minZ-position.z)**2;if(this.walkable[i]&&d<distance){best=i;distance=d;}}return best;}
  find(from,to){
    const start=this.nearest(from),end=this.nearest(to);if(start<0||end<0)return[];
    const size=this.walkable.length,g=this.costs.fill(Infinity),parent=this.parents.fill(-1),closed=this.closed.fill(0),heap=this.heapIndices,scores=this.heapScores;heap.length=0;scores.length=0;
    const ex=end%this.width,ez=Math.floor(end/this.width);
    const h=i=>(Math.abs(i%this.width-ex)+Math.abs(Math.floor(i/this.width)-ez))*1.001;
    const push=(i,score)=>{let n=heap.length;heap.push(i);scores.push(score);while(n>0){const p=(n-1)>>1;if(scores[p]<=score)break;heap[n]=heap[p];scores[n]=scores[p];n=p;}heap[n]=i;scores[n]=score;};
    const pop=()=>{const first=heap[0],last=heap.pop(),score=scores.pop();if(heap.length){let n=0;while(true){let child=n*2+1;if(child>=heap.length)break;if(child+1<heap.length&&scores[child+1]<scores[child])child++;if(score<=scores[child])break;heap[n]=heap[child];scores[n]=scores[child];n=child;}heap[n]=last;scores[n]=score;}return first;};
    g[start]=0;push(start,h(start));
    while(heap.length){const current=pop();if(closed[current])continue;if(current===end){const path=[];for(let i=end;i>=0;i=parent[i])path.push(this.point(i));path.reverse();const compact=[path[0]];for(let j=1;j<path.length-1;j++){const a=path[j-1],b=path[j],c=path[j+1];if(b.x-a.x!==c.x-b.x||b.z-a.z!==c.z-b.z)compact.push(b);}if(path.length>1)compact.push(path.at(-1));return compact;}closed[current]=1;
      for(const next of [current-1,current+1,current-this.width,current+this.width]){if(next<0||next>=size||!this.walkable[next]||closed[next])continue;if(Math.abs(next-current)===1&&Math.floor(next/this.width)!==Math.floor(current/this.width))continue;const cost=g[current]+1;if(cost<g[next]){g[next]=cost;parent[next]=current;push(next,cost+h(next));}}
    }
    return[];
  }
}
