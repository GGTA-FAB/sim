// v7 geometry is retained only for save migration. IDs are never renamed.
export function legacyEquipment(){
 const original=[['ETCH-01',-13,132],['ETCH-02',13,132],['ETCH-03',-25,132],['ETCH-04',25,132],['ETCH-05',-13,150],['ETCH-06',13,150]],counts={ETCH:6};
 return [['ETCH','ETCH'],['LITHO','CVD'],['PVD','CMP'],['WET','IMPLANT'],['METROLOGY','ETCH'],['LITHO','CVD']].flatMap((areas,row)=>areas.flatMap((area,col)=>[132+row*48,150+row*48].flatMap(z=>[13,25,37,49,61].map(n=>{
 const x=(col?1:-1)*n,id=original.find(e=>e[1]===x&&e[2]===z)?.[0]??`${area}-${String(counts[area]=(counts[area]??0)+1).padStart(2,'0')}`;return{id,area,x,z};
 }))));
}
