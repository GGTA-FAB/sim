export const REPAIR_GAMES={
 screw:{name:'拆卸螺絲',hint:'按住每顆螺絲旋鬆，六顆全部拆下。',seconds:2,count:6},
 connector:{name:'接線檢查',hint:'先選線頭，再選相同編號的插座；按住測試確認每組連接。',seconds:2.5,count:4},
 cleaning:{name:'Chamber 清潔',hint:'按住髒污區清潔，也可以按住後滑動到另一區。',seconds:1,count:12},
 replacement:{name:'更換零件',hint:'拆下故障件，依料號與 Revision 選零件，再安裝與測試。',seconds:4,count:3},
 leak:{name:'Leak Check',hint:'按住各接點掃描。找出洩漏後，按住該點修補；全部接點都要檢查。',scanSeconds:.8,sealSeconds:4,count:6},
 sensor:{name:'感測器校正',hint:'將滑桿調入綠色目標區，每個通道累積穩定 4 秒。',seconds:4,count:3,tolerance:5},
 robot:{name:'Robot 對位',hint:'調整 X / Y，讓十字進入目標框；每個位置維持 4 秒。',seconds:4,count:3,tolerance:4},
};
