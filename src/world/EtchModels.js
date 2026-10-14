// Fictional procedural tools, informed by public modular etch platform photographs.
export const ETCH_STYLES=['C4 · CLUSTER ETCH','D4 · COMPACT ETCH','V2 · DEEP ETCH'];
export function buildEtcher(b,e){
 const {x,z}=e,style=(Number(e.id.split('-')[1])-1)%3;
 b.box(x,.18,z,7,.36,7.6,0x697476,true);
 // Simplified collision envelope retains service aisles, while the silhouette is modular.
 b.collision.add(x,z,7,7.6,4,2);
 b.box(x,style===1?2.25:1.9,z-3.05,7,style===1?4.15:3.45,1.5,0xe7e8df);
 if(style===1){b.box(x,4.41,z-3.05,7.05,.16,1.6,0x849b99);for(const dx of [-3.22,3.22])b.box(x+dx,2.65,z-3.86,.18,3,.05,0x8eabaa);for(const dx of [-2.3,0,2.3])for(const y of [3.83,3.96,4.09])b.box(x+dx,y,z-3.83,1.7,.045,.05,0x718580);b.box(x+1.5,.72,z-4.5,1.5,1.44,1.25,0xb6c5c2,true);b.box(x+1.5,1.48,z-4.5,1.55,.08,1.3,0x738d8c);}
 b.box(x,3.66,z-3.04,7.05,.16,1.6,0xb0b6b1);
 for(const n of [-2.4,0,2.4]){b.box(x+n,1.15,z-3.83,2.28,1.6,.08,0xcbd0c9);b.box(x+n+.91,1.25,z-3.91,.055,.42,.07,0x667271);}
 b.box(x-.7,2.4,z-3.9,2.8,1.15,.11,0x344b4e);
 b.box(x+2.4,2.3,z-3.94,1.2,.9,.14,0x34545b);
 b.box(x+2.4,1.66,z-4.02,1.23,.09,.32,0x6b7778);
 b.box(x+3.13,2.02,z-3.94,.17,.17,.09,0xb34537);
 b.sign(e.id,x-1,3.12,z-3.96,3.6,.53,'#243c42','#f4f0dc',Math.PI);
 b.sign(ETCH_STYLES[style],x+.1,3.53,z-3.96,4.8,.25,'#556360','#e7e8df',Math.PI);
 // EFEM -> twin load locks -> polygonal transfer module -> separate process chambers.
 for(const dx of [-.75,.75])b.box(x+dx,1.2,z-1.76,1.2,1.65,1.15,0x9fa9a6);
 b.cylinder(x,1.48,z+.18,1.22,1.9,0xa7b0ab,8);b.cylinder(x,2.46,z+.18,1.25,.12,0x647572,8);
 const chambers=style===0?[[-2.2,-.2],[2.2,-.2],[-2.2,2.4],[2.2,2.4]]:style===1?[[-2.12,.1],[2.12,.1],[-2.12,2.5],[2.12,2.5]]:[[-2.05,1.5],[2.05,1.5]];
 chambers.forEach(([dx,dz],i)=>{
  b.box(x+dx,.88,z+dz,2.05,1.35,2.05,0xd3d7cf);
  if(style===1){b.box(x+dx,2.3,z+dz,2.05,2.45,2.05,0xe9e9df);b.box(x+dx,3.6,z+dz,1.72,.14,1.72,0x9ba59e);b.box(x+dx,2.3,z+dz-1.04,1.7,1.58,.035,0xb9c3bc);}
  else{b.cylinder(x+dx,style===2?2.3:1.96,z+dz,.94,style===2?2.25:1.05,0xb4bdb7);b.cylinder(x+dx,style===2?3.48:2.55,z+dz,1.02,.16,0x6c7977);b.box(x+dx,style===2?4.02:3.02,z+dz,1.7,style===2?.94:.78,1.72,0xe6e8df);}
  b.sign(`CH ${String.fromCharCode(65+i)}`,x+dx,1.13,z+dz-1.05,1.15,.25,'#4e5d56','#dfdfcc',Math.PI);
  b.box(x+dx,1.65,z+dz-1.06,.27,.19,.04,0xc1a04d);
  for(const dy of [0,.12,.24,.36])b.box(x+dx,style===2?3.81+dy:2.86+dy,z+dz-.875,1.16,.045,.04,0x6a7975);
  b.cylinder(x+dx+(dx<0?-.77:.77),1.6,z+dz+.7,.1,2.35,0x798985,8);
 });
 if(style===2){b.box(x,1.8,z+2.8,1.5,3.1,1.3,0xc2cac1);b.box(x,3.4,z+2.8,1.65,.1,1.4,0x6a7d76);}
 for(const dx of [-2.2,-.35]){b.box(x+dx,.72,z-4.5,1.5,1.44,1.25,0xb6c5c2,true);b.box(x+dx,1.48,z-4.5,1.55,.08,1.3,0x738d8c);b.box(x+dx,1.03,z-5.14,1.16,.56,.04,0xdde0d6);}
 b.box(x+2.5,4.05,z,.13,.6,.13,0x617b7c);
 b.sign('SERVICE / RF & VACUUM',x,1.5,z+3.83,3.6,.38,'#4e5d56','#d9ddd1');
}
