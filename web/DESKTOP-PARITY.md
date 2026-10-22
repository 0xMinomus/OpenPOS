# OpenPOS Desktop — Parity & Acceptance Specification

This document defines the 1:1 parity acceptance criteria between the legacy
OpenPOS Electron desktop app (offline, Windows only) and OpenPOS Desktop (the
Tauri 2 offline app for Windows and Linux).

Scripts, paths, and generated binaries keep their historical `lite` names; see
[`DESKTOP.md`](DESKTOP.md) for the naming map.

---

## 1. Route Parity Matrix

OpenPOS Desktop operates under a single client-side `HashRouter` bootstrap seeded with a local administrative session. All eight offline routes and the fallback catch-all must render with identical behavior to the Electron offline package:

| Route | Screen | Component | Critical Actions | Expected 1:1 Behavior |
|---|---|---|---|---|
| `#/` | Dashboard | `Dashboard.tsx` | View store metrics, revenue cards, low stock alerts, sales charts | Renders summary cards (Omzet, Total Transaksi, Rata-rata Keranjang), Recharts revenue breakdown, and low stock table seeded from local storage without network requests. |
| `#/pos` | Kasir POS | `OfflinePos.tsx` | Search product, category filter, cart mutation, cash/QRIS checkout, receipt modal | Instant item addition to cart, subtotal/tax/discount calculations, quick cash nominal buttons, checkout confirmation modal, automatic receipt dialog prompt. |
| `#/produk` | Produk | `OfflineProduk.tsx` | Add/edit/delete product, category manager, CSV/Excel export, CSV/Excel import | CRUD operations persist immediately to `localStorage['op_offline_db']`. Export invokes the native Save dialog (`save_file`). Import parses file and updates product catalog. |
| `#/stok` | Stok & Inventaris | `Stok.tsx` | Stock level monitoring, filter low stock, manual stock adjustments | Displays live inventory count, allows manual stock increment/decrement with reason audit, updates product stock count across POS and Dashboard. |
| `#/transaksi` | Riwayat Transaksi | `OfflineTransaksi.tsx` | View transactions, filter by date/status, transaction detail modal, refund, export | Lists all recorded sales, displays invoice details with item breakdown, executes item refunds with stock return, exports transaction history to CSV/Excel. |
| `#/laporan` | Laporan | `Laporan.tsx` | View revenue, COGS (HPP), profit margin, multi-tab analytics, report exports | Tabbed reports (Ringkasan, Penjualan, Produk, Kategori, Metode Pembayaran), graphical charts, and multi-sheet Excel / CSV exports via native Save dialog. |
| `#/pengaturan` | Pengaturan Toko | `Pengaturan.tsx` | Update store name, owner profile, receipt header/footer, tax rate, timezone | Saves store preferences to offline database. Header and footer changes immediately reflect on printed receipts. Timezone selector adjusts display format. |
| `#/backup` | Backup & Restore | `OfflineBackup.tsx` | Download JSON database backup, upload and restore JSON database | Generates formatted JSON file of complete database via native Save dialog. Restoring JSON file validates schema, replaces local database, and reloads session. |
| `*` | Catch-all | `offline-main.tsx` | Accessing invalid/unknown URL hash | Immediately redirects back to `#/` (Dashboard) via `<Navigate to="/" replace />`. |

---

## 2. Feature Acceptance Checklist

### 2.1 Dashboard & Metrics
- [ ] **Summary Cards:** Total revenue (omzet), total orders, average cart value correctly calculated from stored transactions.
- [ ] **Low Stock Alert:** Products with stock at or below minimum threshold display with visual indicator and direct navigation to Stok.
- [ ] **Sales Charts:** Recharts components render responsive SVG graphs without layout shifting or console errors.

### 2.2 POS & Checkout Workflow
- [ ] **Product Catalog:** Fast search by name/SKU and category chips with zero UI latency.
- [ ] **Cart Operations:** Item quantity increment/decrement, line-item removal, empty cart prompt.
- [ ] **Discount & Tax:** Custom percentage or nominal discounts apply accurately to order total.
- [ ] **Payment Methods:** Tunai (Cash) with instant change calculation, Transfer, and QRIS offline logging.
- [ ] **Checkout Completion:** Order creates unique invoice number (`INV-...`), decrements inventory, appends transaction, and prompts receipt print.

### 2.3 Receipt Printing (58 mm Thermal)
- [ ] **Layout:** Receipt layout formatted specifically for standard 58 mm (and 80 mm) POS thermal roll printers.
- [ ] **Content:** Store name, store address, invoice ID, cashier name, timestamp, itemized list, subtotal, discount, tax, total, payment method, cash paid, change, and receipt footer text.
- [ ] **Print Dialog:** Triggered via `window.print()` iframe or system print dialogue; cuts without paper waste.
- [ ] *(Note: Thermal printer testing is verified manually with physical hardware).*

### 2.4 Product & Category Management
- [ ] **Product CRUD:** Create, update, toggle active status, and delete products with barcode/SKU support.
- [ ] **Category CRUD:** Add, rename, and organize product categories.
- [ ] **Data Export:** Exporting product catalog invokes native Save dialog (`save_file`) and outputs valid `.xlsx` or `.csv`.
- [ ] **Data Import:** Uploading Excel/CSV catalog parses rows, maps headers, validates data types, and imports without page reload.

### 2.5 Stock Management
- [ ] **Inventory Visibility:** Clear distinction between in-stock, low-stock, and out-of-stock items.
- [ ] **Stock Adjustment:** Modal to adjust stock (tambah / kurang) with note/reason.
- [ ] **Stock Sync:** Adjusted inventory immediately reflects in Kasir POS catalog and prevents selling out-of-stock items when stock enforcement is active.

### 2.6 Transactions & History
- [ ] **Filtering:** Filter transactions by date range (Hari Ini, 7 Hari, 30 Hari, Kustom) and payment method.
- [ ] **Transaction Detail:** Full breakdown of purchased items, prices, timestamp, and payment status.
- [ ] **Refund Action:** Refund workflow marks transaction as refunded and returns quantities to product inventory.
- [ ] **Export:** Transaction history exports to CSV/Excel with matching totals.

### 2.7 Reports & Analytics
- [ ] **KPI Calculations:** Revenue, Gross Profit (Laba Kotor), COGS (HPP), and net profit match manual calculation.
- [ ] **Visual Charts:** Daily and hourly revenue distribution diagrams render clearly.
- [ ] **Multi-Tab Export:** Exporting report sheets produces cleanly structured files with Indonesian currency formatting.

### 2.8 Settings (Pengaturan)
- [ ] **Store Identity:** Updates store name, contact number, address, and receipt notes.
- [ ] **Tax & Service:** Configurable tax rate (e.g. PPN 11%) applied dynamically at POS.
- [ ] **Timezone Selection:** Selection between WIB (UTC+7), WITA (UTC+8), and WIT (UTC+9).

### 2.9 Backup & Restore
- [ ] **JSON Export:** Clicking "Unduh Cadangan" triggers native Save dialog with filename `openpos-backup-YYYY-MM-DD.json`.
- [ ] **Integrity Validation:** Corrupted or invalid JSON files are rejected with an inline error message.
- [ ] **JSON Import / Restore:** Valid backup JSON overwrites `localStorage['op_offline_db']` and re-seeds administrative session.

### 2.10 Theme & UI Styling
- [ ] **Dark / Light Mode:** Toggling theme switches `.dark` class on root HTML element.
- [ ] **Design Tokens:** Tailwind CSS v4 design tokens render consistently across high-DPI displays.
- [ ] **Persistence:** Selected theme persists in `localStorage.op_theme` across restarts.

---

## 3. Manual Desktop Acceptance Walkthrough (Windows)

Linux bundles (`deb`, `rpm`, `AppImage`) use the same checklist; for the render
step, substitute the `xvfb-run -a openpos-desktop --smoke` check documented in
[`DESKTOP.md`](DESKTOP.md).

### 3.1 Installation & Startup
1. Run the NSIS installer: `OpenPOS Desktop_0.1.0_x64-setup.exe`.
2. Confirm the installer installs in `currentUser` mode under `%LOCALAPPDATA%\Programs\OpenPOS Desktop\` (does not require UAC administrator privileges). The verification script also accepts legacy `OpenPOS Lite` installs.
3. Confirm desktop and Start Menu shortcuts are created.
4. Launch the app. Confirm initial load time is < 1.5 seconds.

### 3.2 Automated Smoke Test Verification
Run the verification script from PowerShell on the target Windows test machine:
```powershell
.\web\scripts\verify-lite.ps1
```
Verify the following output:
- Installer detected in `release-out-lite` and size is <= 25 MB.
- Executable located and launched with `--smoke`.
- App executes headless DOM validation and returns exit code 0.
- WebView2 data directory confirmed under `%LOCALAPPDATA%\com.openpos.lite` (identifier preserved from the beta builds).
- Verification status displays `PASS`.

### 3.3 Data Migration from Electron to OpenPOS Desktop
OpenPOS Desktop maintains separate storage isolation from the Electron version. Follow this migration procedure to transfer existing store data:
1. Open the legacy **OpenPOS Electron** app.
2. Go to navigation: **Backup** (`#/backup`).
3. Click **Unduh Cadangan** and save `openpos-backup-YYYY-MM-DD.json`.
4. Close OpenPOS Electron.
5. Open **OpenPOS Desktop**.
6. Go to navigation: **Backup** (`#/backup`).
7. Click **Pilih File Cadangan**, select the exported JSON file, and confirm restore.
8. Verify all products, past transactions, inventory counts, and store settings match the Electron instance 1:1.

### 3.4 Hardware Receipt Print Verification
1. Connect a 58 mm USB or Bluetooth POS thermal printer to the Windows workstation.
2. In Windows Settings, set the printer paper size to `58mm * 210mm` (or Roll Paper).
3. In OpenPOS Desktop, go to **Kasir** (`#/pos`).
4. Add 2 products, select **Tunai**, enter exact cash, and click **Selesaikan Transaksi**.
5. When the receipt preview dialog opens, click **Cetak Struk**.
6. Verify physical receipt:
   - Margins fit 58 mm width without clipping.
   - Text is sharp and dark.
   - Total amount and barcode/QR code (if enabled) print clearly.
   - Paper cuts cleanly at the bottom without excessive blank feeding.

### 3.5 Restart & Persistence Check
1. Make a manual stock adjustment on any item in **Stok** (`#/stok`).
2. Close the OpenPOS Desktop window (via window close button or `Alt+F4`).
3. Re-launch the app.
4. Navigate to **Stok** (`#/stok`) and verify the updated stock quantity and history record remain intact.

---

## 4. Known Acceptable Differences

| Aspect | OpenPOS Electron (Legacy) | OpenPOS Desktop (Tauri 2) | Rationale / Mitigation |
|---|---|---|---|
| **Web Runtime Engine** | Bundled Chromium (~130 MB) | System WebView: Microsoft Edge WebView2 on Windows, WebKitGTK on Linux | Drastically reduces installer size and idle memory usage. Windows NSIS output is under 10 MB versus ~85 MB for the Electron installer. |
| **Data Directory** | `%APPDATA%\OpenPOS` | `%LOCALAPPDATA%\com.openpos.lite\EBWebView` (Windows) | Different desktop shell frameworks maintain independent WebView profile partitions. Migration via Backup JSON is 1:1. The `com.openpos.lite` identifier is kept so beta installs keep their data. |
| **Context Menu & Zoom** | Chromium standard context menu enabled | Custom or disabled in production release | Prevents cashiers from inspecting element or accidentally zooming UI via pinch/wheel. |
| **Application Packaging** | Electron-builder NSIS x64 | Tauri NSIS x64 (`currentUser`) plus Linux `deb`/`rpm`/AppImage | Windows supports per-user installation without admin rights; Tauri installer is ~8x smaller. |
| **File Save Bridge** | `window.offline.saveFile` via Electron IPC (`ipcRenderer.invoke`) | `window.offline.saveFile` via Tauri IPC (`invoke('save_file')`) | Transparent frontend abstraction in `store.ts` (`downloadBlob`). Same native file dialog experience. |
| **Window Close Bridge** | `window.offline.close` via Electron IPC | `window.offline.close` via Tauri IPC (`invoke('close_window')`) | Identical frontend contract in `window.offline.close`. |

---

## 5. Sign-off Matrix

| Verification Phase | Target Environment | Tested By | Date | Result | Notes / Signature |
|---|---|---|---|---|---|
| **Static Route & Asset Parity** | Linux Build Host (Node ESM) | Automated (`lite-parity.mjs`) | 2026-10-21 | ________ | 8 routes, relative assets, bridge calls verified. |
| **Automated Headless Smoke** | Windows 11 x64 (WebView2 111+) | Automated (`verify-lite.ps1`) | 2026-10-21 | ________ | `--smoke` flag exits with code 0. |
| **NSIS Installer & Launch** | Windows 10/11 x64 Clean VM | Manual Tester | ____________ | ________ | Per-user installation, shortcuts, launch time < 2s. |
| **Backup JSON Data Migration** | Windows 11 x64 | Manual Tester | ____________ | ________ | Electron backup restored into OpenPOS Desktop without loss. |
| **58 mm Thermal Print Test** | Windows 11 + USB POS Printer | Hardware QA | ____________ | ________ | Physical receipt alignment and print quality verified. |
| **Final Release Acceptance** | Windows 11 x64 Production Build | Lead Engineer | ____________ | ________ | Approved for distribution. |
