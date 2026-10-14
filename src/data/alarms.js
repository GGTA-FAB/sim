export const ALARMS=[
 {code:'PMP-120',service:'subfab',name:'DRY PUMP CONTROLLER LINK',description:'2F 干式幫浦控制器連線異常，請到對應支援櫃確認訊號接線。',games:['connector','replacement']},
 {code:'RF-315',name:'RF MATCH TIMEOUT',description:'匹配單元回授逾時，核對訊號接頭與回授模組。',games:['connector','replacement']},
 {code:'ESC-221',name:'CHUCK SENSOR OFFSET',description:'吸盤監控零點偏移，需要重新校正監控訊號。',games:['sensor']},
 {code:'EXH-108',service:'subfab',name:'EXHAUST FLOW LOW',description:'排氣流量回授偏低，檢查管線密封與狀態訊號。',games:['leak','sensor']},
 {code:'GAS-209',name:'VALVE FEEDBACK MISMATCH',description:'閥位回授與命令不一致，核對接線或更換回授元件。',games:['connector','replacement']},
 {code:'COOL-317',service:'subfab',name:'COOLING LOOP WARNING',description:'冷卻迴路回授不穩定，檢查感測器與外部密封。',games:['sensor','leak']},
 {code:'PM-411',name:'SERVICE COVER INTERLOCK',description:'保養蓋板確認訊號未成立，核對蓋板固定與連接狀態。',games:['screw','connector']},
 {code:'SNS-201',name:'SENSOR SIGNAL DRIFT',description:'監控訊號偏移，檢查感測器或訊號線路。',games:['sensor','connector']},
 {code:'VAC-104',service:'subfab',name:'VACUUM PRESSURE HIGH',description:'壓力超出允許範圍，檢查洩漏或更換異常密封件。',games:['leak','replacement']},
 {code:'TMP-302',name:'TEMPERATURE INTERLOCK',description:'溫度回授觸發 interlock，校正感測器或更換回授模組。',games:['sensor','replacement']},
 {code:'ROB-112',name:'ROBOT POSITION ERROR',description:'搬送定位回授異常，重新對位或確認訊號接線。',games:['robot','connector']},
 {code:'CHM-406',name:'CHAMBER SERVICE REQUIRED',description:'腔體維護檢查異常，清潔指定區域或拆卸檢查蓋板。',games:['cleaning','screw']},
 {code:'LPT-208',name:'LOAD PORT COMM ERROR',description:'Load Port 通訊異常，確認接線或更換通訊模組。',games:['connector','replacement']},
];
export const ALARM_BALANCE={firstMin:180,firstMax:320,intervalMin:600,intervalMax:3600,shortGapChance:.12,shortGapMin:60,shortGapMax:150,processTakeoverSeconds:8};
