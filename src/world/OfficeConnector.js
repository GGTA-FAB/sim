import {Builder} from './Builder.js';
import {CONNECTOR_ROOMS} from '../data/layout.js';
// A same-floor passage around the meeting room connects Office 3F to gowning.
// Keep the doorway-facing stretch (z=18..28) open; enclose the corridor behind it.
export function buildOfficeConnector(scene,collision){
 const b=new Builder(scene,collision,6);
 for(const r of CONNECTOR_ROOMS){b.box(r.x,-.15,r.z,r.w,.3,r.d,0xd5dfdc);b.box(r.x,5.65,r.z,r.w,.3,r.d,0xe9eeea,true);}
 for(const [x,z,w,d] of [[22,18,8,.3],[26,43,.3,30],[18,39,.3,22],[7,50,22,.3],[-4,54,.3,8],[15.5,58,21,.3],[-5,59,.3,2],[5,59,.3,2]])b.box(x,2.75,z,w,5.5,d,0xe4eae4,true);
 for(const z of [24,33,42,51]){b.box(22,5.5,z,1,.06,3,0xfff6da);}
 for(const x of [1,9,17])b.box(x,5.5,54,3,.06,1,0xfff6da);
 b.sign('FAB / 更衣入口 →',17.7,3.3,22,5,.7,'#f7f3d9','#407975',-Math.PI/2);
 b.sign('← 3F FAB / 風淋',22,3.8,57.75,6,.65,'#f7f3d9','#407975',Math.PI);
 b.sign('3F CLEANROOM ↑',0,3.8,59.7,7,.65,'#f7f3d9','#407975',Math.PI);
 b.finish();
}
