// Fixed closed rail paths; sampling does not allocate vectors or run pathfinding.
export class RailPath {
  constructor(points,closed=true){this.closed=closed;this.points=points;this.segments=[];this.length=0;for(let i=0;i<points.length-(closed?0:1);i++){const a=points[i],b=points[(i+1)%points.length],length=Math.hypot(b.x-a.x,b.z-a.z);this.segments.push({a,b,length,start:this.length});this.length+=length;}}
  sample(distance,out){distance=this.closed?((distance%this.length)+this.length)%this.length:Math.max(0,Math.min(this.length,distance));for(const s of this.segments){if(distance<=s.start+s.length){const t=(distance-s.start)/s.length;out.x=s.a.x+(s.b.x-s.a.x)*t;out.z=s.a.z+(s.b.z-s.a.z)*t;out.heading=Math.atan2(s.b.x-s.a.x,s.b.z-s.a.z);return out;}}return out;}
  at(x,z){let best=0,error=Infinity;for(const s of this.segments){const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,t=Math.max(0,Math.min(1,((x-s.a.x)*dx+(z-s.a.z)*dz)/(s.length*s.length))),d=(s.a.x+dx*t-x)**2+(s.a.z+dz*t-z)**2;if(d<error){error=d;best=s.start+t*s.length;}}return best;}
  ahead(from,to){return this.closed?((to-from)%this.length+this.length)%this.length:Math.max(0,to-from);}
}
export function roundedRail(minX,maxX,minZ,maxZ,radius=1.8){
  const r=Math.min(radius,(maxX-minX)/2,(maxZ-minZ)/2),points=[];
  for(const [cx,cz,start] of [[maxX-r,minZ+r,-Math.PI/2],[maxX-r,maxZ-r,0],[minX+r,maxZ-r,Math.PI/2],[minX+r,minZ+r,Math.PI]]){
    for(let n=0;n<=4;n++){const angle=start+n*Math.PI/8;points.push({x:cx+Math.cos(angle)*r,z:cz+Math.sin(angle)*r});}
  }
  return new RailPath(points);
}
