# 我們選擇的未來｜The Future We Choose

國立政治大學達賢圖書館 2026 年 11–12 月永續書影展網站。

展名：**我們選擇的未來**  
副標：**在失衡的地球上，重新學習生活**

## GitHub Pages

建議 Repository 名稱：`nccu-future-we-choose`

網站為純靜態 HTML / CSS / JavaScript，可直接使用 GitHub Pages 部署。

GitHub → Repository → Settings → Pages → Build and deployment：

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

部署後網址格式：

`https://<username>.github.io/nccu-future-we-choose/`

## 主要檔案

- `index.html`：展覽主網站
- `book-list.html`：完整書單
- `css/main.css`：主要視覺樣式
- `js/main.js`：互動與滾動行為
- `js/i18n.js`：中文 / English / 日本語介面文字
- `data/books.js`：正式書單資料
- `assets/hero/`：主視覺網頁圖檔
- `assets/books/`：書封
- `assets/dahhsian/`：達賢圖書館實景照片
- `assets/qr/`：Primo / 線上資源 QR Code

## 達賢圖書館照片

網站使用的照片請轉為 WebP 後放在 `assets/dahhsian/`。

目前預定檔名：

- `residents-hero.webp`：第 03 區滿版實景
- `lake.webp`：達賢湖 / 水域生態
- `glass.webp`：玻璃帷幕 / 鳥類窗殺
- `building.webp`：館舍 / 空調與能源
- `lakeside.webp`：湖濱空間

JPG / TIFF 高解析原始母檔請另行保存，不建議推送至 GitHub Repository。

## 書封

書封放在 `assets/books/`，檔名須與 `data/books.js` 中的 `cover` 欄位一致。

同一作品的不同語言與載體版本會合併在同一張作品卡片；各版本可分別提供：

- `館藏連結`
- `🔗 線上可獲得`

## 語言

目前支援：

- 中文：`?lang=zh`
- English：`?lang=en`
- 日本語：`?lang=ja`

語言狀態會保留在瀏覽器中。

## v1.4.0 更新

- 展覽前言的「氣溫 / 冰川 / 物種」改成三欄式 Climate Signals 視覺，不再只有三行文字。
- `assets/dahhsian/` 的五張照片已全部接入主網站；檔名與大小寫必須完全一致。
- 達賢照片網址加入 `?v=140`，降低 GitHub Pages / 瀏覽器沿用舊快取的機率。
- 互動選擇每次點擊都會立即顯示反思文字與延伸探索連結。
- 完成五題後顯示「永續取捨地圖」、回答模式提示與三個後續探索入口；不做分數或人格分類。

若已在自己的 Repository 放入五張達賢照片，更新網站時請保留 `assets/dahhsian/*.webp`，不要用空資料夾覆蓋。
