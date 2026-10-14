export const LOBBY={gateZ:1.2,exit:{x:15,z:14},pool:{x:40,z:14,radius:5.8},endOfWork:17.5*3600};
export const CAMPUS_ROOMS=[{id:'campus-entry',x:22,z:14,w:16,d:5,y:0},{id:'campus-garden',x:40,z:14,w:22,d:22,y:0}];
// Fixed fictional site time offsets, relative to the game's Taipei clock (UTC+8).
export const LOBBY_CLOCKS=[{name:'TAIPEI',offset:0,zone:'UTC+8'},{name:'TOKYO',offset:1,zone:'UTC+9'},{name:'LONDON',offset:-8,zone:'UTC+0'},{name:'NEW YORK',offset:-13,zone:'UTC−5'}];

// Campus-local coordinates: after the campus rotation this road runs along world Z,
// beyond the garden at world X=76, clear of the office and its stairwell.
export const CAMPUS_ROAD={z:90,length:100,width:8,shoulder:2,laneOffset:1.6,speed:3,inset:4};
