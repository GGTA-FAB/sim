// Game seconds. Workload never reads player activity, location, satiety or fatigue.
export const WORKLOADS = {
 easy: {label:'輕鬆的一天',weight:10,alarms:[3,5],burst:0,pm:[1,1],incident:.08,callFactor:1.6,overtime:[7200,14400]},
 normal: {label:'一般工作日',weight:40,alarms:[12,17],burst:.18,pm:[2,2],incident:.16,callFactor:1,overtime:[3000,6600]},
 busy: {label:'忙碌的一天',weight:40,alarms:[18,25],burst:.35,pm:[2,3],incident:.22,callFactor:.85,overtime:[1800,3600]},
 hell: {label:'罕見的繁忙日',weight:10,alarms:[24,30],burst:.5,pm:[2,3],incident:.28,callFactor:.75,overtime:[1200,3000]},
};
export const DAY_BALANCE={start:30600,end:63000,alarmGap:180,autoSaveSeconds:15};
