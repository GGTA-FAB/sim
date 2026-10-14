import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gaitPose } from './gait.js';

// Isolated style study. The live Player and NPC renderers deliberately keep their current models.
// Shared geometries/materials avoid allocating during animation or outfit changes.
const round = new RoundedBoxGeometry(1, 1, 1, 3, .18);
const ball = new THREE.SphereGeometry(1, 16, 12);
const capsule = new THREE.CapsuleGeometry(1, 1, 4, 12);
function softGeometry(thetaLength = Math.PI, exponent = .65) {
  const g = new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 2, 0, thetaLength);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const shape = v => Math.sign(v) * Math.pow(Math.abs(v), exponent) * .5;
    p.setXYZ(i, shape(p.getX(i)), shape(p.getY(i)), shape(p.getZ(i)));
  }
  g.computeVertexNormals(); return g;
}
const soft = softGeometry();
const materials = {};
function material(color, roughness = .85) {
  const key = `${color}:${roughness}`;
  return materials[key] ??= new THREE.MeshStandardMaterial({ color, roughness });
}
const skin = material('#dbb18d'), navy = material('#376580'), pants = material('#34424b');
const ivory = material('#e5e9e3'), seam = material('#bccac5'), hair = material('#26313a');
const boots = material('#34424a'), black = material('#202b32'), blue = material('#9bc6d7');
const glass = new THREE.MeshStandardMaterial({ color: '#d7eef4', transparent: true, opacity: .14, roughness: .18, depthWrite: false });
function part(parent, geometry, mat, x, y, z, w, h, d) {
  const m = new THREE.Mesh(geometry, mat); m.position.set(x, y, z); m.scale.set(w, h, d);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function joint(parent, x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }
function curve(parent, points, mat, radius = .009) {
  const c = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const m = new THREE.Mesh(new THREE.TubeGeometry(c, 12, radius, 6, false), mat); parent.add(m); return m;
}
// Two-bone soft garment: continuous surface across elbow/knee rather than stacked capsules.
function garment(parent, mat, bendY, rings) {
  const positions=[], indices=[], weights=[], bones=[], segments=24;
  for (let j=0;j<rings.length;j++) {
    const [y,rx,rz]=rings[j], weight=THREE.MathUtils.smoothstep(-y,-bendY-.085,-bendY+.085);
    for(let k=0;k<=segments;k++) {
      const a=k/segments*Math.PI*2;positions.push(Math.cos(a)*rx,y,Math.sin(a)*rz);
      bones.push(0,1,0,0);weights.push(1-weight,weight,0,0);
      if(j<rings.length-1&&k<segments){const n=j*(segments+1)+k;indices.push(n,n+1,n+segments+1,n+1,n+segments+2,n+segments+1);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bones,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));g.setIndex(indices);g.computeVertexNormals();
  const mesh=new THREE.SkinnedMesh(g,mat),root=new THREE.Bone(),bend=new THREE.Bone();bend.position.y=bendY;root.add(bend);mesh.add(root);
  mesh.bind(new THREE.Skeleton([root,bend]));mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
  return {mesh,bend};
}

export class SoftCharacter {
  constructor() {
    this.group = new THREE.Group(); this.rig = joint(this.group, 0, 0, 0);
    this.office = joint(this.rig, 0, 0, 0); this.clean = joint(this.rig, 0, 0, 0);
    this.phase = 0; this.time = 0; this.motion = 0; this.pose = {}; this.gowned = false;
    this.body = part(this.rig, soft, navy, 0, 1.185, 0, .60, .65, .385);
    this.hips = part(this.rig, soft, pants, 0, .895, 0, .50, .28, .34);
    part(this.rig, capsule, skin, 0, 1.495, 0, .088, .067, .088);
    // A rounded-square head with separate facial pieces; no baked image textures.
    this.head = joint(this.rig, 0, 1.795, 0);
    part(this.head, soft, skin, 0, 0, 0, .55, .58, .49);
    for (const side of [-1, 1]) part(this.office, ball, skin, side * .263, 1.775, 0, .064, .089, .056);
    this.hood = part(this.clean, soft, ivory, 0, 1.795, -.025, .66, .70, .62);
    // Face opening stands slightly forward of the hood's front surface.
    this.face = part(this.clean, round, skin, 0, 1.825, .283, .475, .423, .054);
    this.faceFeatures = joint(this.rig, 0, 1.795, 0);
    for (const side of [-1, 1]) {
      part(this.faceFeatures, ball, black, side * .105, .025, .233, .023, .034, .012);
      part(this.faceFeatures, ball, material('#f6f4ed'), side * .105 - .006, .034, .244, .006, .008, .003);
      const brow = part(this.faceFeatures, round, hair, side * .103, .105, .248, .083, .020, .018); brow.rotation.z = -side * .05;
    }
    part(this.faceFeatures, ball, skin, 0, -.022, .241, .033, .040, .026);
    this.smile = curve(this.faceFeatures, [[-.044, -.097, .244], [0, -.108, .248], [.044, -.097, .244]], material('#805545'), .005);
    // A partial sphere forms a close-fitting hair cap; swept locks break the helmet silhouette.
    const hairCap = softGeometry(Math.PI * .36);
    part(this.office, hairCap, hair, 0, 1.795, -.012, .587, .644, .531);
    part(this.office, soft, hair, 0, 1.908, -.191, .515, .30, .17);
    for (const side of [-1, 1]) part(this.office, soft, hair, side * .257, 1.893, -.040, .065, .235, .22);
    const fringe = part(this.office, ball, hair, -.042, 2.018, .183, .239, .072, .103); fringe.rotation.z = .20;
    const parting = part(this.office, ball, hair, .185, 2.025, .133, .088, .087, .104); parting.rotation.z = -.30;
    // Office collar, buttons, lanyard and laminated badge.
    for (const side of [-1, 1]) {
      const collar = part(this.office, round, material('#47758b'), side * .082, 1.451, .138, .13, .13, .034); collar.rotation.z = side * .40;
      curve(this.office, [[side * .087, 1.456, .171], [side * .074, 1.316, .184], [0, 1.199, .186]], material('#273f52'), .010);
    }
    part(this.office, round, material('#e5eae6'), 0, 1.169, .199, .103, .139, .018);
    part(this.office, round, material('#87a9ac'), -.024, 1.189, .210, .03, .038, .005);
    part(this.office, round, material('#a7babb'), .014, 1.151, .210, .044, .010, .005);
    part(this.office, round, material('#315b73'), -.153, 1.296, .188, .102, .113, .012);
    for (let i = 0; i < 3; i++) part(this.office, ball, material('#a8bfc6'), .015, 1.07 + .095 * i, .176, .008, .008, .006);
    part(this.office, round, boots, 0, .951, .01, .47, .044, .327);
    part(this.office, round, material('#99a4a4', .45), 0, .951, .179, .065, .044, .012);
    // Gown: mask, goggles frame, central seam, pockets and ankle cuffs.
    this.mask = part(this.clean, round, blue, 0, 1.704, .330, .344, .178, .075);
    for (const y of [1.676, 1.711]) curve(this.clean, [[-.136, y, .363], [0, y - .004, .371], [.136, y, .363]], material('#87b5c8'), .0035);
    for (const side of [-1, 1]) {
      curve(this.clean, [[side * .164, 1.729, .348], [side * .25, 1.775, .300], [side * .265, 1.70, .282]], seam, .006);
      // Thin rounded rectangular frame, lens and side arm, leaving eyes readable.
      const lensShape = new THREE.Shape(); const x = side * .117, y = 1.855, w = .209, h = .141, r = .025;
      lensShape.moveTo(x-w/2+r,y-h/2); lensShape.lineTo(x+w/2-r,y-h/2); lensShape.quadraticCurveTo(x+w/2,y-h/2,x+w/2,y-h/2+r); lensShape.lineTo(x+w/2,y+h/2-r); lensShape.quadraticCurveTo(x+w/2,y+h/2,x+w/2-r,y+h/2); lensShape.lineTo(x-w/2+r,y+h/2); lensShape.quadraticCurveTo(x-w/2,y+h/2,x-w/2,y+h/2-r); lensShape.lineTo(x-w/2,y-h/2+r); lensShape.quadraticCurveTo(x-w/2,y-h/2,x-w/2+r,y-h/2);
      const edge = lensShape.getPoints(32).map(p => new THREE.Vector3(p.x, p.y, .34));
      const line = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge, true), 40, .006, 5, true), material('#c8d8d8', .3)); this.clean.add(line);
      const lens = new THREE.Mesh(new THREE.ShapeGeometry(lensShape), glass); lens.position.z = .338; this.clean.add(lens);
      curve(this.clean, [[side * .218, 1.875, .34], [side * .285, 1.86, .21]], seam, .009);
      part(this.clean, round, ivory, side * .158, 1.035, .177, .159, .132, .018);
    }
    curve(this.clean, [[-.020, 1.852, .343], [0, 1.865, .349], [.020, 1.852, .343]], seam, .006);
    part(this.clean, round, seam, 0, 1.203, .176, .013, .53, .009);
    part(this.clean, round, material('#789791'), -.15, 1.34, .18, .10, .027, .01);
    this.arms = []; this.elbows = []; this.legs = []; this.knees = []; this.feet = [];
    this.sleeves = []; this.forearms = []; this.hands = []; this.thighs = []; this.shins = []; this.shoes = [];this.armBones=[];this.legBones=[];
    for (const side of [-1, 1]) {
      const shoulder = joint(this.rig, side * .310, 1.392, 0); shoulder.rotation.z = side * .07;
      const sleeve=garment(shoulder,navy,-.236,[[.098,0,0],[.082,.063,.063],[.048,.093,.098],[0,.110,.115],[-.10,.107,.112],[-.16,.103,.108],[-.21,.101,.106],[-.236,.100,.105],[-.27,.100,.104],[-.31,.099,.102],[-.39,.096,.100],[-.449,.085,.092],[-.459,.084,.091],[-.466,0,0]]);
      this.sleeves.push(sleeve.mesh);this.armBones.push(sleeve.bend);
      const elbow = joint(shoulder, 0, -.236, 0);
      this.hands.push(part(elbow, soft, skin, 0, -.258, .009, .173, .186, .157));
      this.hands.push(part(elbow, ball, skin, -side * .068, -.236, .055, .033, .052, .039));
      this.arms.push(shoulder); this.elbows.push(elbow);
      const hip = joint(this.rig, side * .142, .854, 0);
      const trouser=garment(hip,pants,-.325,[[.07,0,0],[.05,.107,.110],[0,.137,.146],[-.10,.137,.145],[-.19,.132,.139],[-.25,.127,.134],[-.30,.125,.132],[-.325,.123,.131],[-.36,.121,.130],[-.40,.119,.128],[-.49,.120,.129],[-.59,.116,.125],[-.67,.109,.119],[-.68,.108,.118],[-.69,0,0]]);
      this.thighs.push(trouser.mesh);this.legBones.push(trouser.bend);
      const knee = joint(hip, 0, -.325, 0);
      const ankle = joint(knee, 0, -.348, 0);
      this.shoes.push(part(ankle, soft, boots, 0, -.083, .060, .266, .166, .391));
      this.legs.push(hip); this.knees.push(knee); this.feet.push(ankle);
    }
    this.setGowned(false);
  }
  setGowned(value) {
    this.gowned = value; this.office.visible = !value; this.clean.visible = value;
    this.body.material = value ? ivory : navy; this.hips.material = value ? ivory : pants;
    this.faceFeatures.position.z = value ? .081 : 0; this.smile.visible = !value;
    for (const m of [...this.sleeves, ...this.forearms]) m.material = value ? ivory : navy;
    for (const m of this.hands) m.material = value ? ivory : skin;
    for (const m of [...this.thighs, ...this.shins]) m.material = value ? ivory : pants;
    for (const m of this.shoes) m.material = value ? seam : boots;
  }
  update(dt, mode = 'idle') {
    this.time += dt;
    const speed = mode === 'run' ? 11 : mode === 'walk' ? 5 : 0;
    this.motion = THREE.MathUtils.damp(this.motion, speed ? 1 : 0, 9, dt);
    this.phase += dt * (mode === 'run' ? 2.05 : 1.35) * Math.PI * 2 * this.motion;
    for (let i = 0; i < 2; i++) {
      gaitPose(this.phase, i, this.motion, speed, this.pose);
      this.arms[i].rotation.x = this.pose.arm; this.elbows[i].rotation.x = this.pose.elbow;
      this.legs[i].rotation.x = this.pose.hip; this.knees[i].rotation.x = this.pose.knee; this.feet[i].rotation.x = this.pose.ankle;
      this.armBones[i].rotation.x=this.pose.elbow;this.legBones[i].rotation.x=this.pose.knee;
    }
    this.rig.position.y = Math.abs(Math.sin(this.phase)) * .025 * this.motion + Math.sin(this.time * 1.8) * .003 * (1 - this.motion);
    this.rig.rotation.set(mode === 'run' ? .07 * this.motion : 0, Math.sin(this.phase) * .027 * this.motion, 0);
  }
}

