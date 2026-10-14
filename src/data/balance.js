export const OWNED_EQUIPMENT_MIN=6, OWNED_EQUIPMENT_MAX=8;
export const GAME_TIME_SCALE=40; // 1.5 real seconds per game minute.
export const BALANCE = Object.freeze({
  walkSpeed: 7.2, runSpeed: 11.6, playerRadius: 0.32,
  cameraDistance: 5.7, cameraSensitivity: 0.004, cameraNear: 0.08,
  interactionDistance: 2.5, gownSeconds: 1.2, airShowerSeconds: .8,
  navigationInterval: 0.45, navigationCell: 1,
  maxFrameDelta: 0.05, collisionStep: 0.12,
});
export const QUALITY = {
  low: { pixelRatio: 1, antialias: false, bayDistance:100, motionHz:20, npcDistance:75 },
  medium: { pixelRatio: 1.4, antialias: true, bayDistance:150, motionHz:30, npcDistance:110 },
  high: { pixelRatio: 2, antialias: true, bayDistance:220, motionHz:40, npcDistance:155 },
};
export const FAB_BALANCE=Object.freeze({
  fixedStep:.1,equipmentTick:.5,bayUpdate:.5,nearDistance:48,mediumDistance:105,
  ohtPerBay:6,mainOhtCount:32,ohtSpeed:5.2,ohtHeadway:3.8,junctionGap:6,hoistSeconds:1.5,
  railHeight:6.05,carryHeight:4.85,dockHeight:1.98,
  foupPerBay:14,npcPerBay:4,npcSpeed:1.35,npcDecisionInterval:.8,
  idleMin:3,idleMax:9,loadSeconds:3,processMin:24,processMax:48,completeSeconds:3,
});
