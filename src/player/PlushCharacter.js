import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { gaitPose } from './gait.js';

// B revision 2: authored surface profiles, a real hood opening and continuous skinned garments.
// Geometry is constructed once, independently of the production character renderer.
const sphere = new T.SphereGeometry(1, 32, 24);
const lowSphere = new T.SphereGeometry(1, 12, 10);let gameBuild=false;
const rounded = new RoundedBoxGeometry(1, 1, 1, 4, .22);
const clothData = new Uint8Array(128 * 128 * 4);
for (let y=0;y<128;y++) for(let x=0;x<128;x++) {
 const i=(y*128+x)*4, n=126+12*Math.sin(x*Math.PI/2)+10*Math.cos(y*Math.PI/2)+5*Math.sin(x*27.1+y*53.7);
 clothData[i]=clothData[i+1]=clothData[i+2]=n;clothData[i+3]=255;
}
const weave = new T.DataTexture(clothData,128,128);weave.wrapS=weave.wrapT=T.RepeatWrapping;
weave.repeat.set(5,5);weave.magFilter=T.LinearFilter;weave.minFilter=T.LinearMipmapLinearFilter;weave.generateMipmaps=true;weave.needsUpdate=true;
const mat=(color,cloth=false)=>new T.MeshPhysicalMaterial({color,roughness:cloth?.9:.65,metalness:0,...(cloth?{bumpMap:weave,bumpScale:.0012,sheen:.35,sheenColor:new T.Color('#fff8e9'),sheenRoughness:.9}:{})});
const M={skin:mat('#ebba92'),ear:mat('#ce9679'),shirt:mat('#274e68',true),stitch:mat('#4a7689',true),pants:mat('#3d424a',true),ivory:mat('#eee8db',true),seam:mat('#cfc7b8',true),hair:mat('#29292e'),hairGroove:mat('#343439'),eye:mat('#211e24'),white:mat('#fff9ed'),shoe:mat('#353c43'),sole:mat('#525a60'),mask:mat('#91bed0',true),maskFold:mat('#77a6b9',true),badge:mat('#e1e3dd'),strap:mat('#284353',true)};
M.hair.roughness=.72;M.skin.roughness=.7;M.eye.roughness=.24;
const pow=(n,e)=>Math.sign(n)*Math.pow(Math.abs(n),e);
function group(p,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);p.add(g);return g;}
function mesh(p,g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=false;p.add(o);return o;}
function ell(p,m,x,y,z,sx,sy,sz){return mesh(p,gameBuild?lowSphere:sphere,m,x,y,z,sx,sy,sz);}
function tube(p,pts,m,r=.004,closed=false){const c=new T.CatmullRomCurve3(pts.map(v=>new T.Vector3(...v)),closed);return mesh(p,new T.TubeGeometry(c,Math.max(gameBuild?8:20,pts.length*(gameBuild?2:5)),r,gameBuild?5:8,closed),m);}
function surface(fn,nu=48,nv=40){if(gameBuild){nu=Math.max(12,Math.round(nu*.4));nv=Math.max(10,Math.round(nv*.4));}const p=[],uv=[],idx=[];
 for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){p.push(...fn(i/nu,j/nv));uv.push(i/nu,j/nv);if(i<nu&&j<nv){const n=j*(nu+1)+i;idx.push(n,n+1,n+nu+1,n+1,n+nu+2,n+nu+1);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
// Smooth interpolation of hand-authored cross sections; profile: [height, halfWidth, halfDepth, zCenter].
function profile(rows,t){const a=t*(rows.length-1),i=Math.min(rows.length-2,Math.floor(a)),f=a-i;
 return rows[0].map((_,k)=>{const p0=rows[Math.max(0,i-1)][k]||0,p1=rows[i][k]||0,p2=rows[i+1][k]||0,p3=rows[Math.min(rows.length-1,i+2)][k]||0;return .5*((2*p1)+(-p0+p2)*f+(2*p0-5*p1+4*p2-p3)*f*f+(-p0+3*p1-3*p2+p3)*f*f*f);});
}
function flip(g){const a=g.index.array;for(let i=0;i<a.length;i+=3){const t=a[i+1];a[i+1]=a[i+2];a[i+2]=t;}g.index.needsUpdate=true;g.computeVertexNormals();return g;}
function volume(rows,fold=0,exponent=1){return surface((u,v)=>{const [y,rx,rz,cz]=profile(rows,1-v),a=u*Math.PI*2;
 const ripple=1+fold*Math.sin(v*40+Math.cos(a*3))*Math.sin(v*Math.PI)**2;
 return [pow(Math.cos(a),exponent)*Math.max(.0001,rx)*ripple,y,pow(Math.sin(a),exponent)*Math.max(.0001,rz)*ripple+cz];
 });}
function limb(parent,rows,bendAt,material,fold){
 const g=volume(rows,fold),p=g.attributes.position,si=[],sw=[];
 for(let i=0;i<p.count;i++){const w=T.MathUtils.smoothstep(-p.getY(i),-bendAt-.10,-bendAt+.10);si.push(0,1,0,0);sw.push(1-w,w,0,0);}
 g.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));
 const o=new T.SkinnedMesh(g,material),root=new T.Bone(),bend=new T.Bone();bend.position.y=bendAt;root.add(bend);o.add(root);o.bind(new T.Skeleton([root,bend]));o.castShadow=true;parent.add(o);return {mesh:o,bend};
}
function polygon(p,points,material){const shape=new T.Shape();shape.moveTo(points[0][0],points[0][1]);for(const [x,y]of points.slice(1))shape.lineTo(x,y);shape.closePath();
 return mesh(p,new T.ExtrudeGeometry(shape,{depth:.011,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.008,bevelThickness:.005}),material);
}

export class PlushCharacter {
 constructor({detail='preview'}={}){
  gameBuild=detail==='game';
  this.group=new T.Group();this.group.name='B_Revision_2';this.rig=group(this.group);this.office=group(this.rig);this.clean=group(this.rig);
  this.phase=0;this.time=0;this.motion=0;this.pose={};this.gowned=false;
  // Shirt and coverall are separately sculpted, not just recolored.
  const shirtRows=[[.88,.18,.13,0],[.90,.248,.177,0],[1.02,.258,.190,.005],[1.16,.279,.194,0],[1.32,.303,.180,0],[1.42,.293,.157,-.012],[1.49,.180,.122,0],[1.51,.095,.085,0]];
  mesh(this.office,volume(shirtRows,.006,.86),M.shirt);
  const suitRows=[[.82,.163,.119,0],[.86,.258,.177,0],[1.00,.279,.203,.006],[1.09,.274,.205,.010],[1.24,.318,.214,.001],[1.40,.320,.187,-.006],[1.49,.19,.131,0],[1.54,.115,.10,0]];
  mesh(this.clean,volume(suitRows,.018,.92),M.ivory);
  mesh(this.office,volume([[.79,.09,.09,0],[.84,.244,.154,0],[.92,.259,.175,0],[.965,.247,.170,0]],0,.8),M.pants);
  ell(this.office,M.skin,0,1.515,0,.094,.142,.091);
  // The jaw, cheeks and forehead have different widths; no rounded-box head.
  const faceRows=[[-.292,0,.01,.004],[-.268,.147,.151,.006],[-.217,.234,.209,.002],[-.125,.280,.235,0],[0,.294,.245,0],[.125,.290,.239,-.012],[.235,.245,.208,-.02],[.292,.134,.117,-.025],[.314,0,0,-.025]];
  this.head=group(this.rig,0,1.830,0);mesh(this.head,volume(faceRows,0,.88),M.skin);
  this.ears=group(this.office);
  for(const side of [-1,1]){ell(this.ears,M.skin,side*.295,1.795,-.01,.081,.107,.055);ell(this.ears,M.ear,side*.318,1.804,.030,.029,.049,.006);}
  this.features=group(this.rig,0,1.830,0);
  for(const side of [-1,1]){
   ell(this.features,M.eye,side*.116,.028,.235,.029,.040,.015);
   ell(this.features,M.white,side*.116-.008,.041,.250,.006,.009,.002);
   tube(this.features,[[side*.075,.126,.232],[side*.112,.137,.230],[side*.155,.123,.217]],M.hair,.013);
  }
  ell(this.features,M.skin,0,-.022,.249,.035,.038,.036);
  this.smile=tube(this.features,[[-.054,-.113,.229],[-.028,-.123,.235],[.008,-.125,.236],[.05,-.110,.231]],mat('#87543e'),.005);
  // Swept scalp and quiff are custom curved surfaces following the head, with shallow grooves.
  const scalp=surface((u,v)=>{const phi=u*Math.PI*2,front=Math.max(0,Math.sin(phi)),back=Math.max(0,-Math.sin(phi)),theta=v*(1.55-front*.43+back*.60+.055*Math.cos(phi));
   const groove=1+.008*Math.cos(phi*13+theta*3);return [.332*pow(Math.sin(theta)*Math.cos(phi),.83)*groove,.349*pow(Math.cos(theta),.96),.288*pow(Math.sin(theta)*Math.sin(phi),.86)*groove-.015];});
  mesh(this.office,scalp,M.hair,0,1.834,0);
  // A tapered swept lock rather than several oval beads laid across the forehead.
  const sweep=surface((u,v)=>{const t=u,a=v*Math.PI*2;
   const x=-.282+t*.476,y=1.988+.140*Math.sin(t*Math.PI*.78),z=.184-.072*t;
   const radius=Math.sin(Math.PI*t)**.6;
   return [x,y+Math.cos(a)*.073*radius,z+Math.sin(a)*.108*radius];
  },48,24);flip(sweep);mesh(this.office,sweep,M.hair);
  for(const side of [-1,1]){const lock=ell(this.office,M.hair,side*.267,1.906,-.014,.041,.145,.104);lock.rotation.z=side*.11;}
  for(let i=0;i<3;i++)tube(this.office,[[-.243+i*.025,2.012+i*.012,.237],[-.105+i*.025,2.071+i*.012,.255],[.053+i*.022,2.114+i*.004,.207]],M.hairGroove,.0023);
  // Neck collar and shaped shirt collar tips.
  for(const side of [-1,1]){
   const c=polygon(this.office,[[side*.047,1.508],[side*.125,1.497],[side*.192,1.425],[side*.086,1.386],[side*.018,1.465]],M.shirt);c.position.z=.157;
   tube(this.office,[[side*.122,1.486,.181],[side*.100,1.32,.199],[0,1.174,.214]],M.strap,.009);
  }
  mesh(this.office,rounded,M.stitch,0,1.145,.193,.024,.53,.013);
  for(let i=0;i<4;i++)ell(this.office,mat('#96b0b7'),0,1.0+i*.116,.211,.009,.009,.004);
  for(const side of [-1,1]){
   const x=side*.163;
   mesh(this.office,rounded,M.shirt,x,1.288,.185,.135,.139,.016);
   tube(this.office,[[x-.060,1.348,.200],[x-.060,1.234,.20],[x,1.224,.21],[x+.060,1.234,.20],[x+.060,1.348,.20]],M.stitch,.002);
   mesh(this.office,rounded,M.stitch,x,1.347,.202,.125,.018,.006);
  }
  mesh(this.office,rounded,M.badge,0,1.147,.227,.096,.137,.022);
  mesh(this.office,rounded,mat('#93a1a0'),0,1.178,.241,.033,.044,.004);
  mesh(this.office,rounded,mat('#a9b5b1'),0,1.114,.241,.057,.008,.004);
  mesh(this.office,volume([[.913,.246,.178,0],[.94,.25,.18,0],[.956,.246,.176,0]],0,.8),M.shoe);
  mesh(this.office,rounded,mat('#979ea2'),0,.936,.188,.073,.047,.018);
  // The hood is an open shell: the face remains the same actual face inside it.
  const hood=surface((u,v)=>{const a=u*Math.PI*2,rows=[[.274,.222,.256],[.305,.258,.238],[.336,.339,.124],[.345,.355,-.032],[.286,.306,-.221],[.152,.181,-.324],[.0001,.0001,-.345]];
   const [rx,ry,z]=profile(rows,v);const fold=1+.009*Math.cos(a*8+v*9)*Math.sin(v*Math.PI);
   return [pow(Math.cos(a),.82)*rx*fold,1.845+pow(Math.sin(a),.85)*ry*fold,z];
  });mesh(this.clean,flip(hood),M.ivory);
  const rim=[];for(let i=0;i<64;i++){const a=i/64*Math.PI*2;rim.push([pow(Math.cos(a),.82)*.274,1.845+pow(Math.sin(a),.85)*.222,.256]);}
  tube(this.clean,rim,M.ivory,.009,true);
  // Top/rear hood panel seams follow the sculpted shell, not drawn on a face plate.
  tube(this.clean,[[0,2.062,.249],[0,2.18,.115],[0,2.20,-.032],[0,2.148,-.215],[0,2.005,-.325]],M.seam,.0024);
  for(const side of [-1,1])tube(this.clean,[[side*.249,1.965,.253],[side*.315,1.985,.07],[side*.305,1.957,-.17],[side*.19,1.95,-.30]],M.seam,.0022);
  mesh(this.clean,volume([[1.452,.122,.105,0],[1.5,.144,.13,0],[1.58,.127,.125,0]],0),M.ivory);
  // Curved mask with a nose bridge and softly pleated face, no solid rectangular block.
  const maskPoint=(u,v)=>{const x=(u-.5)*.397,top=1.825+.023*Math.exp(-x*x/.0024),bottom=1.670+.034*(Math.abs(x)/.2)**1.7;
   return [x,T.MathUtils.lerp(bottom,top,v),.281+.058*Math.cos(x/.2*Math.PI/2)+.0025*Math.sin(v*Math.PI*7)];};
  const mg=surface(maskPoint,40,20);mesh(this.clean,mg,M.mask);
  for(const v of [0,.30,.56,.98]){const pts=[];for(let i=0;i<=16;i++){const p=maskPoint(i/16,v);p[2]+=.0015;pts.push(p);}tube(this.clean,pts,v===0||v===.98?M.mask:M.maskFold,v===0||v===.98?.003:.0018);}
  for(const side of [-1,1])tube(this.clean,[[side*.196,1.795,.283],[side*.265,1.836,.242],[side*.276,1.749,.216],[side*.195,1.701,.288]],M.ivory,.005);
  const lensMat=new T.MeshPhysicalMaterial({color:'#f2ffff',roughness:.12,transparent:true,opacity:.09,depthWrite:false,side:T.DoubleSide});
  // One wraparound safety shield with an arched nose cutout.
  const outline=[[-.235,1.960,.273],[-.121,1.971,.294],[0,1.968,.306],[.121,1.971,.294],[.235,1.960,.273],[.232,1.86,.282],[.168,1.840,.300],[.075,1.846,.312],[.034,1.889,.314],[0,1.899,.319],[-.034,1.889,.314],[-.075,1.846,.312],[-.168,1.840,.300],[-.232,1.86,.282]];
  tube(this.clean,outline,mat('#d4d4c7'),.006,true);
  for(const side of [-1,1]){
   mesh(this.clean,surface((u,v)=>[side*(.04+u*.190),1.851+v*.103,.317-.035*u],20,12),lensMat);
   tube(this.clean,[[side*.234,1.938,.277],[side*.30,1.926,.15],[side*.317,1.918,.020]],M.seam,.009);
  }
  // Coverall zip, stitching, lower pockets and upper arm patch.
  tube(this.clean,[[0,1.542,.124],[0,1.431,.184],[0,1.253,.218],[0,1.064,.215],[0,.919,.189]],M.seam,.003);
  mesh(this.clean,rounded,M.seam,0,1.457,.179,.022,.045,.012);
  for(const side of [-1,1]){
   tube(this.clean,[[side*.116,1.057,.207],[side*.177,1.004,.202],[side*.226,.968,.180]],M.seam,.003);
   tube(this.clean,[[side*.105,.965,.20],[side*.171,.920,.19],[side*.234,.924,.154]],M.seam,.002);
  }
  this.arms=[];this.elbows=[];this.legs=[];this.knees=[];this.feet=[];this.armBones=[];this.legBones=[];this.outfitLimbs=[[],[]];this.hands=[];
  for(const side of [-1,1]){
   const shoulder=group(this.rig,side*.286,1.403,-.013);shoulder.rotation.z=side*.10;this.arms.push(shoulder);
   const elbow=group(shoulder,0,-.246,0);this.elbows.push(elbow);
   const armOffice=[[-.468,.080,.081,0],[-.452,.085,.086,0],[-.37,.096,.103,0],[-.29,.101,.106,0],[-.24,.104,.110,0],[-.16,.108,.116,0],[-.06,.119,.122,0],[.035,.104,.106,0],[.090,0,0,0]];
   const armClean=[[-.463,.079,.085,0],[-.442,.088,.092,0],[-.397,.119,.125,.009],[-.31,.123,.132,.004],[-.23,.124,.13,0],[-.16,.127,.131,0],[-.05,.140,.137,0],[.047,.115,.11,0],[.099,0,0,0]];
   const armPair=[limb(shoulder,armOffice,-.246,M.shirt,.008),limb(shoulder,armClean,-.246,M.ivory,.031)];this.armBones.push(armPair.map(v=>v.bend));armPair.forEach((v,i)=>this.outfitLimbs[i].push(v.mesh));
   const cuff=mesh(elbow,volume([[-.224,.082,.086,0],[-.192,.085,.088,0],[-.181,.087,.091,0]],0),M.stitch);this.hands.push({mesh:cuff,office:M.stitch,clean:M.seam});
   const palm=ell(elbow,M.skin,0,-.267,.006,.087,.100,.073);palm.rotation.z=side*.04;this.hands.push({mesh:palm,office:M.skin,clean:M.ivory});
   const thumb=ell(elbow,M.skin,-side*.064,-.240,.051,.038,.060,.038);thumb.rotation.z=-side*.4;this.hands.push({mesh:thumb,office:M.skin,clean:M.ivory});
   for(let i=0;i<3;i++){const line=tube(elbow,[[side*(-.038+i*.034),-.305,.057],[side*(-.038+i*.034),-.281,.072],[side*(-.038+i*.034),-.258,.075]],mat('#cf9f7e'),.0018);this.hands.push({mesh:line,office:line.material,clean:M.seam});}
   const hip=group(this.rig,side*.140,.883,0);this.legs.push(hip);const knee=group(hip,0,-.351,0);this.knees.push(knee);const ankle=group(knee,0,-.356,0);this.feet.push(ankle);
   const legOffice=[[-.708,.112,.116,0],[-.67,.117,.124,0],[-.55,.114,.125,0],[-.42,.113,.121,0],[-.34,.119,.125,0],[-.25,.126,.137,0],[-.12,.136,.149,0],[.015,.138,.145,0],[.070,0,0,0]];
   const legClean=[[-.708,.093,.107,0],[-.676,.107,.119,0],[-.60,.145,.150,.012],[-.49,.144,.153,.008],[-.38,.133,.146,0],[-.30,.141,.151,0],[-.18,.151,.162,0],[-.05,.145,.157,0],[.062,0,0,0]];
   const legPair=[limb(hip,legOffice,-.351,M.pants,.006),limb(hip,legClean,-.351,M.ivory,.024)];this.legBones.push(legPair.map(v=>v.bend));legPair.forEach((v,i)=>this.outfitLimbs[i].push(v.mesh));
   const sole=mesh(ankle,rounded,M.sole,0,-.138,.054,.263,.065,.39);this.hands.push({mesh:sole,office:M.sole,clean:M.seam});
   const shoe=ell(ankle,M.shoe,0,-.086,.062,.133,.091,.191);this.hands.push({mesh:shoe,office:M.shoe,clean:M.ivory});
   const shoeClean=mesh(ankle,volume([[-.113,.119,.148,.044],[-.030,.107,.109,0],[.065,.106,.103,0],[.078,.098,.098,0]],.012),M.ivory);this.outfitLimbs[1].push(shoeClean);
   for(let i=0;i<3;i++){const lace=tube(ankle,[[-.053,-.011-i*.012,.082+i*.024],[0,-.005-i*.012,.092+i*.024],[.053,-.011-i*.012,.082+i*.024]],M.sole,.003);this.outfitLimbs[0].push(lace);}
  }
  this.setGowned(false);gameBuild=false;
 }
 setGowned(v){this.gowned=v;this.office.visible=!v;this.clean.visible=v;this.smile.visible=!v;
  for(let i=0;i<2;i++)for(const m of this.outfitLimbs[i])m.visible=i===(v?1:0);
  for(const h of this.hands)h.mesh.material=v?h.clean:h.office;
 }
 update(dt,mode='idle'){
  this.time+=dt;const speed=mode==='run'?10:mode==='walk'?5:0;this.motion=T.MathUtils.damp(this.motion,speed?1:0,9,dt);
  this.phase+=dt*(mode==='run'?1.85:1.22)*Math.PI*2*this.motion;
  for(let i=0;i<2;i++){gaitPose(this.phase,i,this.motion,speed,this.pose);this.arms[i].rotation.x=this.pose.arm*.88;this.elbows[i].rotation.x=this.pose.elbow;
   this.legs[i].rotation.x=this.pose.hip*.83;this.knees[i].rotation.x=this.pose.knee*.9;this.feet[i].rotation.x=-(this.legs[i].rotation.x+this.knees[i].rotation.x)*.7;
   for(const b of this.armBones[i])b.rotation.x=this.elbows[i].rotation.x;for(const b of this.legBones[i])b.rotation.x=this.knees[i].rotation.x;
  }
  this.rig.position.y=Math.abs(Math.sin(this.phase))*.018*this.motion+Math.sin(this.time*1.6)*.002*(1-this.motion);
  this.rig.rotation.set(mode==='run'?.04*this.motion:0,Math.sin(this.phase)*.026*this.motion,0);
 }
}
