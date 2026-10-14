import { ScrewRemoval } from './ScrewRemoval.js';
import { ConnectorGame } from './ConnectorGame.js';
import { ChamberCleaning } from './ChamberCleaning.js';
import { PartReplacement } from './PartReplacement.js';
import { LeakCheck } from './LeakCheck.js';
import { SensorCalibration } from './SensorCalibration.js';
import { RobotAlignment } from './RobotAlignment.js';
export const MINIGAMES={screw:ScrewRemoval,connector:ConnectorGame,cleaning:ChamberCleaning,replacement:PartReplacement,leak:LeakCheck,sensor:SensorCalibration,robot:RobotAlignment};
export function createRepair(type,random){if(!MINIGAMES[type])throw Error('Unknown repair type');return{type,state:MINIGAMES[type].create(random)};}
export const repairProgress=repair=>repair?Math.min(1,Math.max(repair.autoProgress??0,repair.assistantProgress??0,MINIGAMES[repair.type].progress(repair.state))):0;
