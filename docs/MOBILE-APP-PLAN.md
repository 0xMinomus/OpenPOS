# OpenPOS Mobile — Planning (Android dulu, iOS menyusul)

> Keputusan terkunci 12 Sep 2026: wrapper **Capacitor**, reuse 1:1 bundle
> offline desktop (`dist-offline`), printer **Bluetooth thermal 58mm**,
> sebar via **website (sideload APK)**, UI **responsif HP**, **tanpa scanner**.
> iOS: tidak dikerjakan sekarang, tapi tidak ada keputusan yang menutupnya.

---

## 1. Tech Stack

| Lapisan | Teknologi | Keterangan |
|---|---|---|
| UI + logika + data | Tetap: React 19 + TS + Tailwind + `dist-offline` + `localStorage` | Tanpa ubah; 1:1 dengan desktop |
| Wrapper native | **Capacitor 7/8** (`@capacitor/core`, `cli`, `android`) | Baru |
| Plugin resmi | `app`, `status-bar`, `splash-screen`, `share`, `filesystem` | Baru |
| Printer | Plugin **Bluetooth SPP/BLE** + builder byte **ESC/POS** TypeScript | Baru |
| Bahasa native | Hampir nol Kotlin, hanya config Gradle/manifest | Baru, kecil |
| Build Android | Gradle via Android Studio, **JDK 17**, Android SDK Platform 35/36 + Build-Tools | Baru |
| Distribusi | APK signed, hosting di website (`/unduh`) | Alur sudah ada (sideload) |
| iOS (nanti) | Project Capacitor yang sama + `cap add ios` (butuh Mac + Xcode + Apple Developer $99/thn) | Belum |

Ditolak: React Native/Flutter rewrite (langgar 1:1, mahal), Tauri mobile
(toolchain Rust + plugin minim), PWA saja (tanpa Bluetooth thermal + tanpa instalasi nyata).

## 2. Arsitektur

```
                 ┌─ Electron (Windows, existing)
dist-offline/ ───┤
(bundle web      └─ Capacitor (Android, baru) ── plugin: cetak BT,
 statis +                             back-button, StatusBar/Splash,
 HashRouter +                         Share ganti download
 localStorage)
```

- Satu sumber bundle untuk desktop + mobile. Tiap rilis web → `cap sync` → build APK.
- Tidak ada server, tidak ada sync. Data per perangkat + backup JSON manual.
- `window.offline?.isElectron` aman (optional chain); deteksi Capacitor via
  `isNativePlatform()` untuk mengganti tombol cetak. Web + Electron tidak tersentuh.

## 3. Pekerjaan per area

### 3.1 Cetak Bluetooth thermal (terbesar)

- `window.print()` tidak jalan ke printer thermal. Ganti dengan:
  pilih device sekali (daftar paired → simpan MAC di `localStorage`) →
  tombol "Cetak Bluetooth" kirim byte ESC/POS (tengah, bold, feed, cut).
- Plugin Bluetooth classic SPP (cocok XPrinter 58mm kebanyakan) + izin
  runtime Android 12+ (`BLUETOOTH_CONNECT`).
- Fallback tetap ada: bagikan struk sebagai PDF/gambar.
- Validasi final hanya di printer fisik (emulator tidak bisa tes Bluetooth).

### 3.2 Jembatan platform (kecil)

- Tombol back HP: di root keluar, di dalam navigasi mundur (plugin App + HashRouter cocok).
- Backup JSON / export CSV / PDF struk: pakai Share + Filesystem (link download tidak jalan). Cek ulang `OfflineBackup` saat eksekusi.

### 3.3 Responsif HP (sedang)

- Shell offline sidebar `w-60` fixed → navigasi mobile (bottom nav/hamburger) khusus layar kecil.
- Grid POS, tabel, form, touch target, font input — 8 page offline + shell. Fungsi tidak berubah.

### 3.4 Build & sebar via website (kecil, sekali setup)

- `cap init` (appId permanen, mis. `app.openpos.mobile`) → `cap add android` → `cap sync` tiap rilis web.
- **Keystore dibuat sekali, backup wajib** — hilang = aplikasi tidak bisa diupdate lagi.
- APK release signed → website, section Android di `/unduh` + panduan "izinkan install dari sumber tak dikenal".
- Versi mobile independen (mulai 1.0.0; catat pemetaan konten di release notes).

## 4. Fase eksekusi

| Fase | Isi | Keluar |
|---|---|---|
| 0 (0,5 hari) | Android Studio/JDK, appId, keystore + backup, init Capacitor, APK debug jalan, 8 halaman render | APK debug terinstall |
| 1 (1 hari) | Back-button, StatusBar/Splash, Share/Filesystem, abstraksi cetak | Jembatan platform hijau |
| 2 (2–3 hari) | Pairing Bluetooth + ESC/POS + cetak POS & uji + fallback share; butuh printer fisik | Struk keluar dari printer |
| 3 (2–3 hari) | Responsif HP per halaman + screenshot 360px | Lolos cek HP kecil |
| 4 (0,5 hari) | APK signed → website → docs + MEMORY | Rilis mobile 1.0.0 |

## 5. Syarat (di pihak owner)

1. Install Android Studio (±30–45 mnt, sekali; bawa JDK 17 + SDK + Build-Tools).
2. Printer Bluetooth thermal fisik untuk uji cetak (tanpa ini Fase 2 tidak kelar).
3. HP Android uji (min. Android 8; izinkan install sumber tak dikenal + izin Bluetooth saat diminta).
4. Nama paket permanen sekali (mis. `app.openpos.mobile`).
5. Backup file keystore + password (hilang = update putus permanen).
6. Waktu: tes cetak + instalasi di HP (±1 jam tersebar).

Tidak butuh: akun Play Store, Mac, backend baru, redesign total.

## 6. Risiko

- Varian printer Bluetooth (ESC/POS XPrinter umumnya standar; uji di perangkat penentunya).
- `minSdk` saran 26 (Android 8, HP murah ter-cover).
- Data WebView hilang kalau user hapus data aplikasi — ingatkan backup berkala (fitur sudah ada).
- Status dokumen ini: **planning, belum dieksekusi**.
