// Public aisle / desk-side stops. Paths use the same floor collision grid as navigation.
export const OFFICE_STOPS = [
 {x:-10,z:10,kind:'desk'}, {x:10,z:10,kind:'desk'},
 {x:-1.2,z:22,kind:'discuss'}, {x:1.2,z:22,kind:'discuss'},
 {x:1,z:24,kind:'hall'}, {x:-6,z:31,kind:'meeting'},
 {x:6,z:31,kind:'meeting'}, {x:8,z:23,kind:'coffee'},
];
export const OFFICE_PEOPLE = [
 {name:'惠君',role:'製程',start:2,color:0x71897e},
 {name:'大林',role:'設備',start:3,color:0x526e7f},
 {name:'阿翔',role:'設備',start:0,color:0x82796a},
 {name:'佳蓉',role:'製程',start:1,color:0x697c91},
 {name:'振榮',role:'製造部',start:4,color:0x647f76},
 {name:'小游',role:'製程',start:6,color:0x797585},
];
export const OFFICE_ACTIVITY = {walkSpeed:1.45,nearUpdate:.05,farUpdate:.5,viewDistance:60,waitMin:6,waitMax:16};
