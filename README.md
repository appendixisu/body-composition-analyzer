# 體組成數據與肌肉流失分析儀 (Body Composition Analyzer)

一個純前端、全平台響應式（手機與桌面雙端優化）、完全保障隱私 (**100% 本地 IndexedDB 儲存**) 的體重與體組成數據分析 Web 應用程式。

本專案特別針對 **歐姆龍 (Omron Connect)** App 匯出的 CSV 檔案 (`BodyComposition_*.csv`) 進行欄位對接與深度分析，並採用模組化解析器架構，支援可擴充的通用體重數據格式。

---

## ✨ 核心特色與功能亮點

- 🔒 **100% 本地數據隱私 (Local-First Storage)**：所有生理數據全數儲存在瀏覽器本地端的 IndexedDB 中，無伺服器後端，個人隱私數據絕不上傳至任何遠端伺服器。
- 📊 **減重品質與肌肉過度流失分析 (Fat vs Muscle Loss Ratio)**：
  - 精準計算減去的公斤數中「減脂佔比 (%)」與「減肌/掉肌佔比 (%)」。
  - 提供 **優質健康減脂** / **平穩減重** / **肌肉流失過多警示** 標章與個人化飲食/重量訓練建議，有效防止肌少症與基礎代謝率下滑。
  - 支援快選 **全期間累積**、**近 30 日** 與 **近 7 日** 進行對比。
- 📉 **每週平均趨勢圖表 (抗 BIA 波動雜訊)**：
  - 自動按週 (週一至週日) 聚合平均體重、體脂肪率與骨骼肌率。
  - 有效過濾飲水量、進食時間與腸道滯留引起的生物電阻 (BIA) 高頻雜訊。
  - 支援 7 日移動平均線 (7-day SMA) 開關切換。
- 🦾 **歐姆龍部位細分圖解 (Segmental Body Analysis)**：
  - 視覺化展示 **雙臂 (Arms)**、**身軀 (Trunk)** 與 **雙腳 (Legs)** 的骨骼肌率及皮下脂肪率。
- 🧩 **模組化解析器系統 (Strategy Pattern)**：
  - 內建 `OmronCsvParser`（針對歐姆龍格式）與 `GenericCsvParser`（對應通用 CSV 欄位）。
  - 支援 CSV 檔案拖曳上傳、欄位自動識別與寫入。
- 📱 **全平台響應式 UX 設計**：
  - **手機端 (Mobile)**：配備底部導覽列 (Bottom Nav Bar)、大字體卡片與觸控優化圖表。
  - **桌面端 (Desktop)**：多欄式數據儀表板、彈性圖表與歷史數據管理。
- ☁️ **Cloudflare Pages / Workers 部署就緒**：
  - 升級至 **Vite 6**，內建 Cloudflare 專用 [`wrangler.json`](./wrangler.json) 靜態資產與 SPA 前端路由設定。

---

## 📋 支援的歐姆龍 CSV 數據欄位

本應用程式原生支援歐姆龍 App 輸出的以下所有標頭欄位：

| 欄位名稱 | 單位 / 格式 | 說明 |
| :--- | :--- | :--- |
| **測量日期** | `YYYY/MM/DD HH:mm` | 測量時間戳記 |
| **時區** | `Asia/Taipei` | 時區資訊 |
| **體重(kg)** | `kg` | 總體重 |
| **體脂肪(%)** / **體脂肪量(kg)** | `%` / `kg` | 全身體脂率與脂肪重量 |
| **內臟脂肪程度** | `Level (1-30)` | 內臟脂肪風險等級 |
| **基礎代謝(kcal)** | `kcal` | 每日基礎代謝熱量 |
| **骨骼肌(%)** / **骨骼肌重量(kg)** | `%` / `kg` | 全身骨骼肌率與肌肉重量 |
| **骨骼肌率（雙臂 / 身軀 / 雙腳）(%)** | `%` | 上肢、核心與下肢肌肉分佈 |
| **皮下脂肪率（雙臂 / 身軀 / 雙腳）(%)** | `%` | 上肢、核心與下肢皮下脂肪分佈 |
| **BMI** | `kg/m²` | 體質指數 |
| **身體年齡(歲)** | `Years` | 體組成推算之生理年齡 |
| **型號** | `HBF-702T` 等 | 測量裝置型號 |

---

## 🛠️ 技術棧 (Tech Stack)

- **前端框架**：React 18 + Vite 6 + TypeScript
- ** UI 樣式與圖標**：Tailwind CSS + Lucide React
- **資料可視化圖表**：Recharts
- **本地資料庫**：Dexie.js (IndexedDB 封裝)
- **CSV 解析**：PapaParse

---

## 🚀 本地開發與運行 (Getting Started)

1. **複製儲存庫**：
   ```bash
   git clone https://github.com/appendixisu/body-composition-analyzer.git
   cd body-composition-analyzer
   ```

2. **安裝依賴套件**：
   ```bash
   npm install
   ```

3. **啟動開發伺服器**：
   ```bash
   npm run dev
   ```
   瀏覽器開啟 `http://localhost:5173/` 即可進行測試。

4. **生產環境構建與打包**：
   ```bash
   npm run build
   ```
   打包產物將生成至 `dist/` 目錄。

---

## ☁️ 部署至 Cloudflare

本專案已完全優化 Cloudflare 部署流程（內建 `wrangler.json`）：

1. 將本專案 Push 至您的 GitHub 儲存庫。
2. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/) 選擇 **Workers 與 Pages**。
3. 連結您的 GitHub 儲存庫，Cloudflare 將自動檢測並執行：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
4. 點擊 **Deploy** 即可一鍵部署上線！

---

## 📄 授權條款 (License)

MIT License © 2026 appendixisu
