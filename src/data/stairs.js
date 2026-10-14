// Shared collision, mesh and navigation dimensions for two half-floor flights.
export const stairHeight=(r,z)=>r.base+(z-r.minZ)/(r.maxZ-r.minZ)*r.rise;
export function stairSurfaces(stair,floorBase){const {minX,maxX,minZ,maxZ,group}=stair,mid=(minX+maxX)/2,gap=.6,common={minZ,maxZ,group,stair,floorBase};return [
 {...common,minX,maxX:mid-gap/2,base:floorBase+3,rise:-3,index:0},
 {...common,minX:mid+gap/2,maxX,base:floorBase+3,rise:3,index:1},
 {...common,minX,maxX,minZ:minZ-2,maxZ:minZ,base:floorBase+3,rise:0,index:2}
];}
export function stairRoute(stair,base,up=true){const {minX,maxX,minZ,maxZ}=stair,mid=(minX+maxX)/2,l=(minX+mid-.3)/2,r=(mid+.3+maxX)/2;const route=[{x:l,y:base,z:maxZ+1},{x:l,y:base,z:maxZ},{x:l,y:base+3,z:minZ},{x:l,y:base+3,z:minZ-1},{x:r,y:base+3,z:minZ-1},{x:r,y:base+3,z:minZ},{x:r,y:base+6,z:maxZ},{x:r,y:base+6,z:maxZ+1}];return up?route:route.reverse();}
export function stairRemainder(r,p,up){const route=stairRoute(r.stair,r.floorBase,up);let best=Infinity,segment=0;for(let i=0;i<route.length-1;i++){const a=route[i],b=route[i+1],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy+(p.z-a.z)*dz)/(dx*dx+dy*dy+dz*dz))),d=(p.x-a.x-t*dx)**2+(p.y-a.y-t*dy)**2+(p.z-a.z-t*dz)**2;if(d<best){best=d;segment=i;}}return route.slice(segment+1);}
