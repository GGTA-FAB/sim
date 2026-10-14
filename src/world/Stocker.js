// Enclosed stocker with structural columns, opaque service panels and a roof transfer hatch.
// Stored FOUPs stay inside. Only the active transfer is revealed through the hatch.
export function buildStocker(b,bay){
 const x=bay.stockX,z=bay.stockZ,front=bay.side*62.52;
 b.collision.add(x,z,4.9,5.7,4.25,2.125,'stocker');
 b.box(x,.18,z,4.9,.36,5.7,0x6b7f79);
 for(const dx of [-2.32,2.32])for(const dz of [-2.68,2.68])b.box(x+dx,2.15,z+dz,.24,4.3,.24,0x86968c);
 for(const dx of [-2.35,2.35])b.box(x+dx,2.12,z,.14,3.9,5.22,0xd4ddd2);
 for(const dz of [-2.7,2.7])b.box(x,2.12,z+dz,4.52,3.9,.14,0xd4ddd2);
 // Roof panels surround a 1.7 x 1.8 m automatic OHT handoff opening.
 for(const dx of [-1.61,1.61])b.box(x+dx,4.12,z,1.52,.14,5.4,0xc3cfc4);
 for(const dz of [-1.8,1.8])b.box(x,4.12,z+dz,1.7,.14,1.8,0xc3cfc4);
 for(const dx of [-.89,.89])b.box(x+dx,4.23,z,.08,.08,1.92,0x6d877b);
 for(const dz of [-.94,.94])b.box(x,4.23,z+dz,1.85,.08,.08,0x6d877b);
 b.box(front,1.82,z,.08,2.4,3.75,0x6b8078);b.box(front-bay.side*.05,1.82,z,.05,2.25,3.58,0xb4c3b8);
 b.box(front-bay.side*.09,2.12,z,.035,.65,2.55,0x49675e);
 for(const dz of [-1.17,1.17])b.box(front-bay.side*.09,1.15,z+dz,.045,.4,.065,0x5f756c);
 b.box(front-bay.side*.08,3.82,z-2,.08,.16,.24,0x75a88e);
 b.sign(`STK-${bay.id}`,front-bay.side*.08,3.38,z,4.6,.6,'#f3f5e7','#4c6d5f',bay.side<0?Math.PI/2:-Math.PI/2);
 b.sign('ENCLOSED STORAGE / AUTO TRANSFER',front-bay.side*.08,.65,z,4.35,.3,'#4e675c','#d9e0d2',bay.side<0?Math.PI/2:-Math.PI/2);
}
