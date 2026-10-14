// Distance is the difficulty: no hidden alarm/call multiplier by department.
export const MODULES=[
 {id:'ETCH',name:'蝕刻',row:0,level:1},
 {id:'CVD',name:'化學氣相沉積',row:2,level:2},
 {id:'PVD',name:'物理氣相沉積',row:3,level:3},
 {id:'CMP',name:'化學機械研磨',row:4,level:4},
 {id:'WET',name:'濕式清洗',row:5,level:5},
 {id:'IMPLANT',name:'離子佈植',row:6,level:6},
 {id:'METROLOGY',name:'量測',row:7,level:7},
 {id:'LITHO',name:'微影',row:8,level:8},
];
// Two pairs of front Etch bays keep all 30 legacy Etch identities and their jobs.
export const MODULE_ROWS=['ETCH','ETCH',...MODULES.slice(1).map(m=>m.id)];
export const validModule=id=>MODULES.some(m=>m.id===id);
export const moduleInfo=id=>MODULES.find(m=>m.id===id)??MODULES[0];
