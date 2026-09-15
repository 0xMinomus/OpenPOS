# OpenPOS Mobile — Planning (Android dulu, iOS menyusul)

> Keputusan terkunci 12 Sep 2026 + revisi: wrapper **Capacitor**, reuse 1:1 bundle
> offline desktop (`dist-offline`), printer **thermal 58mm umum (BLE utama, SPP fallback)**,
> sebar via **website (sideload APK)**, UI **responsif HP**, **tanpa scanner**.
> iOS: tidak dikerjakan sekarang, tapi tidak ada keputusan yang menutupnya.

---

## 1. Tech Stack

| Lapisan | Teknologi | Keterangan |
|---|---|---|
| UI + logika + data | Tetap: React 19 + TS + Tailwind + `dist-offline` + `localStorage` | Tanpa ubah; 1:1 dengan desktop |
| Wrapper native | **Capacitor 8** (`@capacitor/core`, `cli`, `android` — terpasang 8.5.2) | Baru |
| Plugin resmi | `app`, `status-bar`, `share`, `filesystem` | Baru (**tanpa `splash-screen`** — deprecated di Cap 7, pakai AndroidX Splash bawaan template) |
| Printer BLE | `@capacitor-community/bluetooth-le` (maintained) | Baru — jalur utama |
| Printer SPP | Plugin custom Kotlin minimal (SPP socket RFCOMM) | Baru — fallback, time-boxed |
| Builder struk | Byte **ESC/POS** TypeScript, agnostik transport (BLE/SPP pakai byte yang sama) | Baru |
| Bahasa native | Kotlin hanya untuk plugin SPP fallback; sisanya config Gradle/manifest | Kecil |
| Build Android | Gradle via Android Studio, **JDK 21** (wajib untuk Capacitor 8), SDK Platform 36 + Build-Tools 35, `minSdk 24` | Baru |
| Distribusi | APK signed, hosting di website (`/unduh`, section Android baru) | Alur sideload Windows sudah ada; section Android kerja baru |
| iOS (nanti) | Project Capacitor yang sama + `cap add ios` (butuh Mac + Xcode + Apple Developer $99/thn) | Belum |

Ditolak: React Native/Flutter rewrite (langgar 1:1, mahal), Tauri mobile
(toolchain Rust + plugin minim), PWA saja (tanpa SPP classic, tanpa instalasi
nyata, tanpa Web Bluetooth di iOS — walau BLE via Web Bluetooth jalan di Chrome Android).

## 2. Arsitektur

```
                 ┌─ Electron (Windows, existing)
dist-offline/ ───┤
(bundle web      └─ Capacitor (Android, baru) ── plugin: cetak BT (BLE/SPP),
 statis +                             back-button, StatusBar/Splash bawaan,
 HashRouter +                         Share ganti SEMUA tombol unduh
 localStorage)
```

- Satu sumber bundle untuk desktop + mobile. Tiap rilis web → `cap sync` → build APK.
- Capacitor 8 minta entry `index.html`; bundle offline memakai `offline.html`.
  Perantara ada di script `npm run mobile:sync` (build offline → salin
  `offline.html` → `index.html` → `cap sync android`). Jangan hapus salinan itu manual.
- Tidak ada server, tidak ada sync. Data per perangkat + backup JSON manual.
- `window.offline?.isElectron` aman (optional chain); deteksi Capacitor via
  `isNativePlatform()` untuk mengganti tombol cetak. Web + Electron tidak tersentuh.
- Nama paket permanen: **`com.openpos.mobile`** (selaras `com.openpos.offline`).

## 3. Pekerjaan per area

### 3.1 Cetak thermal 58mm umum — BLE utama, SPP fallback (terbesar)

- `window.print()` tidak jalan ke printer thermal di WebView. Alur: pilih
  device sekali → simpan identitas di `localStorage` → tombol "Cetak Bluetooth"
  kirim byte ESC/POS (tengah, bold, feed, cut).
- **Jalur A — BLE (utama):** scan via `@capacitor-community/bluetooth-le`,
  cocok untuk XPrinter/BT-printer modern yang ada BLE-nya. Tanpa Kotlin.
- **Jalur B — SPP (fallback, time-boxed):** daftar perangkat paired via plugin
  custom Kotlin minimal (RFCOMM socket, simpan MAC). Dipakai hanya bila printer
  user SPP-only. Batas waktu eksplisit; bila jebol, rilis tetap jalan dengan BLE + fallback share.
- Builder ESC/POS ditulis sekali di TypeScript dan dipakai kedua jalur.
- Izin runtime lengkap per level API:
  - API 31+: `BLUETOOTH_CONNECT` + `BLUETOOTH_SCAN` (scan tanpa lokasi pakai `usesPermissionFlags="neverForLocation"`).
  - API ≤30: `ACCESS_FINE_LOCATION` untuk scan BLE (`minSdk 24` menjangkau keduanya — branching manifest + runtime wajib).
- Fallback tetap ada: bagikan struk sebagai PDF/gambar via Share.
- Validasi final hanya di printer fisik (emulator tidak bisa tes Bluetooth).

### 3.2 Jembatan platform (kecil)

- Tombol back HP: di root keluar, di dalam navigasi mundur (plugin App + HashRouter cocok).
- **Semua tombol unduh** (Backup JSON, Export CSV, PDF struk): pakai Share +
  Filesystem — pola `a[download]` blob link mati di WebView. Cakupannya global,
  bukan cuma `OfflineBackup`. Restore via `<input type=file>` tetap jalan di WebView.
- StatusBar: kunci `overlaysWebView:false` + style; target SDK 35 + enforce
  edge-to-edge Android 15 wajib diuji di HP Android 15 (konten jangan ketutup status bar).

### 3.3 Responsif HP (sedang)

- Shell offline sidebar `w-60` fixed → navigasi mobile (bottom nav/hamburger) khusus layar kecil.
- Grid POS, tabel, form, touch target, font input — 8 page offline + shell. Fungsi tidak berubah.
- Tambahan: migrasi data — `getLocalDB()` wajib validasi + migrasi `version`
  schema saat load (hari ini versi cuma dicap di file export). Update sideload
  manual + user bisa loncat versi; tanpa ini data lama bisa rusak diam-diam.

### 3.4 Build & sebar via website (kecil, sekali setup)

- `cap init` (appId permanen `com.openpos.mobile`) → `cap add android` → `cap sync` tiap rilis web.
- **Keystore dibuat sekali, backup wajib** — hilang = aplikasi tidak bisa diupdate lagi.
- APK release signed → website, **section Android baru di `/unduh`** + panduan "izinkan install dari sumber tak dikenal".
- Versi mobile independen (mulai 1.0.0; catat pemetaan konten di release notes).
- Tanpa in-app updater (konsekuensi sideload): user update manual; migrasi schema di §3.3 sebagai pengaman.

## 4. Fase eksekusi

| Fase | Isi | Keluar |
|---|---|---|
| 0 (0,5 hari) | Android Studio/JDK, appId, init Capacitor, APK debug jalan, 8 halaman render | ✅ SELESAI 15 Sep 2026 — APK debug 5,1 MB terinstall di HP fisik, 8/8 halaman render terverifikasi via screenshot (Dashboard, POS, Produk, Stok, Transaksi, Laporan, Pengaturan, Backup). Keystore rilis masih pending |
| 1 (1 hari) | Back-button, StatusBar/Splash bawaan, Share/Filesystem semua tombol unduh, abstraksi cetak + migrasi schema localdb | Jembatan platform hijau |
| 2a (1–2 hari) | Pairing BLE + ESC/POS + cetak POS & uji + fallback share; butuh printer fisik | Struk keluar (printer BLE) |
| 2b (time-box 2 hari) | Plugin SPP custom minimal, hanya bila perlu (printer SPP-only) | Struk keluar (printer SPP) atau diputus dengan alasan |
| 3 (2–3 hari) | Responsif HP per halaman + screenshot 360px + uji Android 15 | Lolos cek HP kecil |
| 4 (0,5 hari) | APK signed → website → docs + MEMORY | Rilis mobile 1.0.0 |

## 5. Syarat (di pihak owner)

1. Install Android Studio (±30–45 mnt, sekali; bawa SDK + Build-Tools). JDK 21 dipasang terpisah (Temurin) — JBR bawaan Studio terlalu baru untuk Gradle.
2. Printer thermal fisik untuk uji cetak — **merek/tipe apa saja**, tanpa ini Fase 2 tidak kelar. (Tidak perlu tipe spesifik; app mendukung BLE umum + SPP fallback.)
3. HP Android uji (min. Android 8; izinkan install sumber tak dikenal + izin Bluetooth saat diminta; satu HP Android 15 bila memungkinkan untuk uji edge-to-edge).
4. Nama paket permanen sekali (`com.openpos.mobile`).
5. Backup file keystore + password (hilang = update putus permanen).
6. Waktu: tes cetak + instalasi di HP (±1 jam tersebar).

Tidak butuh: akun Play Store, Mac, backend baru, redesign total, printer tipe tertentu.

## 6. Risiko

- Varian printer Bluetooth (desain BLE-utama + SPP-fallback menutup mayoritas printer 58mm umum; uji di perangkat penentunya).
- `minSdk` 24 (Android 7, default Capacitor 8, HP murah ter-cover); branching izin pra/pasca API 31.
- Data WebView hilang kalau user hapus data aplikasi — ingatkan backup berkala (fitur sudah ada).
- Update sideload manual + loncat versi — ditutup migrasi schema §3.3.
- Status dokumen ini: **planning revisi, belum dieksekusi**.
