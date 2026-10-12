# 社區水韌性模擬器｜獨立部署候選包

建立日期：2026-10-13。V2.9.6 整理部署里程碑，功能與畫面版本維持 V2.9.5。

本資料夾可獨立複製、壓縮、放到新 GitHub repository 或換電腦啟動。沒有上層、歷史版本、共用支援或 prepare 依賴。不要部署到既有 V2.2 stable service。

## 本機啟動

安裝 Node.js 24.16.x（package 限制 Node 24），在本資料夾執行：

```sh
npm install
npm start
```

開啟 http://127.0.0.1:4203 。若該埠已使用，設定 PORT 為其他埠。無 npm runtime dependencies；QR library 與 icon font 已本地保存。

PowerShell 自訂埠範例：

```powershell
$env:PORT='4208'
npm start
```

## 環境變數

| 名稱 | 用途／預設 |
| --- | --- |
| PORT | 預設 4203；Render 自動提供，程式使用該值 |
| HOST | 一般本機預設 127.0.0.1；production 預設 0.0.0.0 |
| NODE_ENV | Render 設 production |
| NODE_VERSION | Render 設 24.16.0 |

DEV_PRESETS=false、DEBUG_POLLUTION_COVERAGE=false 已固定在正式 HTML。沒有環境變數可意外開啟；開發測試請使用原 v292，不要重新 prepare 此 release。

/single 備援亦隱藏舊測試情境控制與流向顯示，流向勾選預設關閉；備援模型未修改。

## 新 Render Staging 部署

目前尚未部署：release 已完成，等待手動 Render 部署。

最短建議流程：

1. 建立**新的 GitHub repository**，把此資料夾的內容上傳到 repository 根目錄（含 .gitignore、package.json、package-lock.json、render.yaml）。不要上傳原專案、測試圖片或歷史資料；不要更新 V2.2 的 repository。
2. Render Dashboard → New → Blueprint，連接這個新 repository，Blueprint Path 使用根目錄 render.yaml。
3. 確認只建立 water-resilience-v295-staging，方案 Free，再部署。若該名稱已有服務，先改為另一個未使用的新名稱；不要套用到既有服務。
4. Live 後使用 Render 實際提供的 HTTPS 網址，不要預先假定 staging 網域。先開啟 /health，應回傳 ok:true、version:2.9.5。

若用 New → Web Service 手動建立：Runtime Node、Build Command `npm install`、Start Command `npm start`、Health Check `/health`、Free；環境變數同 render.yaml。新 repository 根目錄部署時 Root Directory 留空。

若只把 release-v295 子資料夾上傳至另一個新 repository，Web Service Root Directory 填 `release-v295`；本包 render.yaml 以「包內容位於 repository 根目錄」為基準，Blueprint 請優先採用前述根目錄方式。

參考：[Render Blueprint 設定](https://render.com/docs/blueprint-spec)、[健康檢查](https://render.com/docs/health-checks)。

## 正式功能

V2.9.5 新版視覺、設施辨識與污染視覺修正、教師／學員入口、10 組多人、既有 SSE、四套天氣、洪水／乾旱／污染／供水、城市功能、Round Analysis、Result／Edit／Next Round、1×～4×、Pause／Resume、教師唯讀查看學員畫面、QR 加入連結／複製／放大、手動加入與 /single 備援均保留。

QR 使用目前 `window.location.origin` 產生 `/?room=課堂碼&join=1`，不寫死網址。掃碼只帶入資訊，學員仍需選組別／填名稱並主動加入。QR 使用本地 Nayuki qrcodegen（MIT，授權全文保留於 JS），不呼叫外部 QR API 或 CDN。

## 驗證與部署後檢查

已在本 release 啟動伺服器驗證 npm install／npm start、/health、全部靜態資產與 /single；另將包複製到原專案外成功啟動，確認無上層依賴。

release 引擎／伺服器 11 項回歸測試通過；QR 獨立解碼、複製、放大／關閉、URL 刷新、無效碼、手動加入、390px 手機表單通過。10 個獨立學員瀏覽器 session、教師權限、既有 SSE、唯讀預覽、進行中／Pause／Result／四段城市觀察／Edit／Next Round、1024×768 通過。

正式 HTML 與原 V2.9.5 比對只差 DEV_PRESETS 關閉；核心模型、分析、teacher-view、QR 與其他嵌入程式不變。天氣與視覺資產位元比對相同。

外網、實體手機／平板與不同實體裝置尚未驗證。部署後必做：教師建立課堂→確認 QR 為實際 HTTPS origin→手機掃描帶碼→至少兩個不同裝置加入不同組→Start／Pause／Resume／End→教師唯讀查看→結果與本輪城市觀察→Edit／Next Round→刷新／手動加入→1024×768。

## 已知限制

房間只在單一伺服器記憶體；重新部署、重啟或休眠後房間消失，須重新建立。沒有資料庫或新的 reconnect 系統。

Render Free 有休眠、冷啟動與用量限制，可能重啟；詳見 [官方 Free 說明](https://render.com/docs/free)。此包是 staging 候選，不保證長期保存課堂。

127.0.0.1 QR 只能在該電腦測試，其他手機掃碼不會連到教師電腦。同 Wi-Fi 測試須明確設定 HOST=0.0.0.0，再以已確認的 LAN IP 開頁；是否可連線仍取決於網路與防火牆。正式跨裝置請用部署後 HTTPS 網址。

主要遊戲裝置仍為平板／筆電；手機加入表單可用，不代表完整遊戲已完成手機版適配。

原 v292、舊資料、共用支援與 V2.2 stable 備援均保留；本次沒有登入或修改 V2.2 Render service。
