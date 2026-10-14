// Reused by the articulated player/assistants and instanced background people.
// +Z is forward; negative hip rotation advances a leg, positive knee flexes it back.
export function gaitPose(phase,side,weight,speed,out){
 const wave=Math.sin(phase+side*Math.PI),run=Math.min(1,Math.max(0,(speed-7.2)/4.4));
 out.hip=-wave*(.40+.22*run)*weight;
 out.knee=(.06+Math.max(0,wave)*(.52+.38*run))*weight;
 out.ankle=-(out.hip+out.knee)*.72;
 out.arm=wave*(.26+.14*run)*weight;
 out.elbow=-.15-(.12+.65*run)*weight;
 return out;
}
