# GGTA — Gotta Go Troubleshoot Again

又要去修機了。以虛構晶圓廠 XSMC 為舞台的第三人稱設備工程師生活模擬遊戲。

自由探索辦公室、FAB、Sub FAB、餐飲街與園區；處理警報、PM、電話、助工派工、研發與每日交接。支援桌面與手機橫向操作。

## 開發與建置

需要 Node.js 22.12 或更新版本（建議 Node.js 24）。

```sh
npm ci
npm run dev
npm run build
```

`dist/` 為完整靜態網站，可部署於子路徑，不需要後端、資料庫或外部 API。正式版本的 JavaScript、樣式、鈴聲與授權文字皆由同一網站提供。

## 操作

- 電腦：WASD 移動，Shift 跑步，拖曳滑鼠旋轉視角，E 互動，Esc 暫停。
- 手機：左側搖桿移動，右側拖曳視角，點中央互動按鈕。建議橫向遊玩。
- 第一天有學長教學，可導航回自己的座位，練習電話、派工、吃飯與交接。

## 存檔與隱私

角色名稱、設定與遊戲進度儲存在玩家自己的瀏覽器 localStorage。遊戲沒有帳號系統、分析追蹤或遙測。更換瀏覽器、網址或清除網站資料會影響存檔。

## GitHub Pages

Repository 的 Settings → Pages 使用 Deploy from a branch，選擇 main 分支的 /docs 目錄。

修改原始碼後執行 `npm run build:pages` 更新 docs，將程式與 docs 一起提交並推送，GitHub Pages 就會發布新版。`npm run build` 仍可產生獨立的 dist。

## 素材

見 [ASSET_LICENSES.md](ASSET_LICENSES.md)。廠區、人物、設備、招牌與環境聲主要由程式生成；不含真實公司內部資料。
