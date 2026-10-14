// A modest saturation lift keeps the FAB's neutral equipment and warm cleanroom light.
// Applied once to coloured world surfaces; UI, signs, skin and shared character material stay untouched.
export function applyArtDirection(scene){const seen=new Set();scene.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m?.color||m.map||m.vertexColors||seen.has(m))continue;seen.add(m);const hsl={};m.color.getHSL(hsl);if(hsl.s>.08)m.color.setHSL(hsl.h,Math.min(.85,hsl.s*1.16),hsl.l);}});}
