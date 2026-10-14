// The workstation faces the existing Equipment Bay partition at z=8.1.
export const PLAYER_DESK={x:5.6,z:8.75,y:6,rotation:Math.PI/2,legacy:{x:5.6,z:9},seat:{x:5.6,y:6,z:9.95,heading:Math.PI}};
export function deskPoint(x,z){return {x:PLAYER_DESK.x+z-PLAYER_DESK.legacy.z,z:PLAYER_DESK.z-(x-PLAYER_DESK.legacy.x)};}
