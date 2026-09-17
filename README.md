<p align="center">
  <img src="web/public/openpos-hero.jpg" alt="OpenPOS" width="720" />
</p>

<h3 align="center">Free point-of-sale for Indonesian small businesses.</h3>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/react-19-blue.svg" alt="React 19" />
  <img src="https://img.shields.io/badge/vite-8-purple.svg" alt="Vite" />
  <img src="https://img.shields.io/badge/typescript-5-blue.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/platform-web_%7C_desktop_%7C_android-black.svg" alt="Platforms" />
</p>

<p align="center">
  <a href="https://open-pos-deploy.vercel.app"><strong>Live demo</strong></a>
  ·
  <a href="https://open-pos-deploy.vercel.app/unduh">Download (Windows &amp; Android)</a>
  ·
  <a href="https://github.com/adrr-dev/openPOS">Backend API</a>
</p>

---

## About

OpenPOS is a free, web-based point-of-sale system built for Indonesian MSMEs (*UMKM*).
It covers the full daily workflow of a small retail store: cashier checkout, product
catalog, stock control, transaction history, sales reports, and staff management,
in Indonesian, with Rupiah formatting throughout.

One codebase ships to three platforms from the `web/` workspace:

| Product | Description |
|---|---|
| **Cloud web app** | React SPA backed by a Go + PostgreSQL REST API. Multi-account stores, role-based access, email OTP and Google login. |
| **Desktop app (Windows)** | Fully offline Electron build. Same UI, local data on the device. Distributed via GitHub Releases. |
| **Android app** | Capacitor wrapper around the offline bundle, installed by sideloading an APK. |

## Features

- **Role-aware dashboard**, owners see omzet, 7-day sales chart, payment mix, and top
  products; cashiers see only their own numbers.
- **Cashier POS**, server-side catalog, cart with effective stock, discounts, tax,
  five payment methods, exact-cash shortcut, and thermal receipts (58/80 mm).
- **Products & categories**, full CRUD, server-side search, CSV import/export.
- **Inventory**, current stock plus a complete adjustment history with reasons.
- **Transactions**, search, date and payment-method filters, refunds, CSV export.
  Times always come from `created_at`.
- **Reports**, sales, product, profit, stock, and staff tabs across five periods,
  with CSV export.
- **Staff management**, PIN-protected sub-accounts, fast account switching,
  online/offline presence via heartbeat, activity feed, and per-day top cashiers.
- **Admin notifications**, low-stock, out-of-stock, and cashier-sale events with
  category tabs and read tracking.
- **Authentication**, email + password with email-OTP second factor, Google
  sign-in, 5-digit admin/cashier passcodes, per-tab sessions with silent token
  refresh, and self-service password reset via email OTP.
- **Store settings**, identity, hours, receipt layout, and tax (inclusive or
  exclusive, configurable rounding, WIB/WITA/WIT time zones).

## Tech stack

| Layer | Technology |
|---|---|
| UI | React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Base UI), Recharts, lucide-react, Poppins |
| Web tooling | Vite, React Router, oxlint |
| Desktop | Electron + electron-builder (NSIS installer) |
| Mobile | Capacitor 8 (Android; same offline bundle, sideloaded APK) |
| Backend | Go (Gin + GORM), PostgreSQL (Supabase), JWT, separate repo: [adrr-dev/openPOS](https://github.com/adrr-dev/openPOS) |
| Hosting | Vercel (frontend auto-deploys on every push to `main`) |

## Getting started

### Prerequisites

- Node.js 22.12+ and npm
- (Desktop builds) Windows
- (Android builds) Android Studio with SDK Platform 36, Build-Tools 35, and JDK 21

### Run the web app

```bash
git clone https://github.com/0xMinomus/OpenPOS.git
cd OpenPOS/web
npm install
```

Create `web/.env.local` (gitignored):

```bash
VITE_API_URL=https://openpos-api.vercel.app/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

Only `VITE_*` variables are exposed to the client. The Google client ID also
requires the frontend origin to be registered in Google Cloud Console.

```bash
npm run dev      # local dev server (proxies /api to http://localhost:8080)
npm run lint     # oxlint
npm run build    # type-check (tsc -b) + production bundle in dist/
```

### Scripts

| Command (run in `web/`) | Result |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Cloud bundle (`dist/`) |
| `npm run lint` | oxlint |
| `npm run build:offline` | Offline bundle (`dist-offline/`) |
| `npm run electron:smoke` | Headless render test of the offline app |
| `npm run electron:build` | Web + offline builds + Windows installer (`release-out/`) |
| `npm run mobile:sync` | Offline build + Capacitor sync for Android |

### Desktop (Windows, offline)

```bash
cd web
npm run electron:build
```

The installer lands in `web/release-out/`. New releases are published by
uploading the installer to
[GitHub Releases](https://github.com/0xMinomus/OpenPOS/releases); the
Download page always picks up the latest release automatically.

### Android (offline, sideloaded APK)

```bash
cd web
npm run mobile:sync
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Release APKs require a private keystore, back it up; losing it permanently
breaks update continuity for installed users. See
[`docs/MOBILE-APP-PLAN.md`](docs/MOBILE-APP-PLAN.md) for the full mobile plan
(responsive pass, Bluetooth thermal printing, release checklist).

## Project structure

```text
.
├── web/                    # the entire product (Vite workspace)
│   ├── src/
│   │   ├── pages/          # cloud routes: Masuk, Daftar, Dashboard, Pos, ...
│   │   ├── pages/offline/  # 1:1 offline copies (local adapter, no /app prefix)
│   │   ├── lib/            # api.ts, local-api.ts, store, ui, notifications, ...
│   │   ├── offline-main.tsx
│   │   └── App.tsx         # cloud routes (/masuk, /daftar, /app/*)
│   ├── electron/           # desktop shell
│   ├── android/            # Capacitor Android project (appId com.openpos.mobile)
│   └── public/openpos.apk  # latest sideloadable APK, served from /unduh
├── docs/                   # API contracts for the backend team, plans, reports
└── PRODUCT.md              # product definition
```

The backend is maintained separately and consumed purely as REST/JSON, this
repo never talks to a database directly. New endpoint needs are specified as
API contracts in `docs/` and handed to the backend team.

## Contributing

Issues and pull requests are welcome. Please keep business features backed by
the real API (no local mock data for business flows), run `npx tsc -b` and
`npm run build` before pushing, and never commit credentials, tokens, or
`.env.local` files.

## License

MIT (see [LICENSE](LICENSE)). Free forever, for small businesses.
