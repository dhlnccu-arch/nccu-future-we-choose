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
- `js/main.js`：互動、滾動、Kiosk 行為
- `js/i18n.js`：中文 / English / 日本語介面文字
- `data/books.js`：正式書單資料
- `assets/hero/`：主視覺與低成本背景圖
- `assets/books/`：書封
- `assets/dahhsian/`：達賢圖書館實景照片
- `assets/qr/`：Primo / 線上資源 QR Code

## 達賢圖書館照片

正式照片已接入 `assets/dahhsian/`：

- `residents-hero.webp`：第 03 區滿版實景
- `lake.webp`：達賢湖 / 水域生態
- `glass.webp`：玻璃帷幕 / 鳥類窗殺
- `building.webp`：館舍 / 空調與能源
- `lakeside.webp`：湖濱空間

另有 `*-960.webp` 手機版本，由 `srcset` 自動選擇。JPG / TIFF 高解析原始母檔請另行保存，不建議推送至 GitHub Repository。

## 書封

書封放在 `assets/books/`，檔名須與 `data/books.js` 中的 `cover` 欄位一致。

同一作品的不同語言與載體版本合併在同一張作品卡片；各版本可分別提供：

- `館藏連結`
- `🔗 線上可獲得`

## 語言

目前支援：

- 中文：`?lang=zh`
- English：`?lang=en`
- 日本語：`?lang=ja`

公開網站會依「網址參數 → 上次選擇 → 瀏覽器語言 → 中文」決定初始語言。

## 展場 Kiosk 模式

展場 75 吋觸控螢幕建議使用：

`index.html?kiosk=1&lang=zh`

GitHub Pages 範例：

`https://<username>.github.io/nccu-future-we-choose/?kiosk=1&lang=zh`

Kiosk 模式在 120 秒無操作後會回復：中文、首頁、第一個達賢節點、收合策展理念、清空互動選擇並關閉選單。一般公開桌機 / 手機瀏覽不會自動重置。

## v1.5.1 精修

- 正式放入五張達賢實景照，並新增 960px 行動版 `srcset`。
- 修正淺色章節固定 Header 對比度。
- Hero 預載，降低首屏等待；裝飾性海圖另輸出低成本 `hero-overlay.webp`，移除大型 `filter + mix-blend-mode`。
- 達賢照片加入 `loading="lazy"`、`decoding="async"` 與固定尺寸，降低版面跳動。
- `localStorage` 改為安全讀寫；地區語碼可辨識 `en-US`、`ja-JP`、`zh-HK` 等。
- HTML fallback 文案與 `i18n.js` 同步；ARIA、圖片 alt、meta description 會隨語言切換。
- 修正五題完成後重新選答案仍自動跳到結果區的問題。
- 選項與達賢卡片加入 `aria-pressed`；選單加入焦點移入 / 返回與 focus trap。
- 圖片載入失敗同時處理「錯過 error 事件」的情況。
- Scroll 視差改用 `requestAnimationFrame`，捲離 Hero 後不做多餘運算。
- IntersectionObserver 在顯示後停止觀察；不支援時有 fallback。
- Hover 行為針對觸控裝置收斂，語言按鈕觸控範圍提升至至少 44px。
- Future 區底部調深，改善文字對比度；`prefers-reduced-motion` 覆蓋更多動畫。
- Kiosk 與一般公開網站行為分開，避免一般桌機讀者閒置 120 秒被強制送回首頁。
- 書單頁同步改善語言判斷、Kiosk 參數延續、觸控按鈕與儲存容錯。
