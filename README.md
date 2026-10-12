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

## Table of contents

- [About](#about)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment variables](#environment-variables)
  - [Run the web app](#run-the-web-app)
  - [npm scripts](#npm-scripts)
  - [Build the Windows desktop app](#build-the-windows-desktop-app)
  - [Build the Android app](#build-the-android-app)
- [Project structure](#project-structure)
- [Backend API](#backend-api)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## About

OpenPOS is a free, web-based point-of-sale system for Indonesian MSMEs (*UMKM*).
It covers the daily workflow of a small retail store end to end: cashier
checkout, product catalog, stock control, transaction history, sales reports,
and staff management, in Indonesian, with Rupiah formatting throughout.

One codebase in the `web/` workspace ships three products:

| Product | Data | Distribution |
|---|---|---|
| **Cloud web app** | Go + PostgreSQL REST API | Vercel, deploys automatically on every push to `main` |
| **Desktop app (Windows)** | Device-local, works fully offline | NSIS installer from [GitHub Releases](https://github.com/0xMinomus/OpenPOS/releases) |
| **Android app** | Device-local, works fully offline | Sideloaded APK from the [Downloads page](https://open-pos-deploy.vercel.app/unduh) |

The cloud app is the reference implementation: multi-account stores,
role-based access, email OTP, and Google sign-in. The desktop and Android
builds reuse the same UI against a local adapter, so they trade multi-device
sync for working without internet.

## Features

- **Role-aware dashboard**, owners see omzet, 7-day sales chart, payment mix,
  and top products; cashiers see only their own numbers.
- **Cashier POS**, server-side catalog, cart with effective stock, discounts,
  tax, five payment methods, exact-cash shortcut, and thermal receipts
  (58/80 mm).
- **Products & categories**, full CRUD, server-side search, CSV import/export.
- **Inventory**, current stock plus a complete adjustment history with reasons.
- **Transactions**, search, date and payment-method filters, refunds, CSV
  export. Times always come from `created_at`.
- **Reports**, sales, product, profit, stock, and staff tabs across five
  periods, with CSV export.
- **Staff management**, PIN-protected sub-accounts, fast account switching,
  online/offline presence via heartbeat, activity feed, and per-day top
  cashiers.
- **Admin notifications**, low-stock, out-of-stock, and cashier-sale events
  with category tabs and read tracking.
- **Authentication**, email + password with email-OTP second factor, Google
  sign-in, 5-digit admin/cashier passcodes, per-tab sessions with silent token
  refresh, and self-service password reset via email OTP.
- **Store settings**, identity, hours, receipt layout, and tax (inclusive or
  exclusive, configurable rounding, WIB/WITA/WIT time zones).
- **Offline backup** (desktop and Android builds), export and restore of the
  local database.

## Tech stack

| Layer | Technology |
|---|---|
| UI | React 19, TypeScript 6, Tailwind CSS v4, shadcn/ui on Base UI, Recharts, lucide-react, Poppins |
| Web tooling | Vite 8, React Router 8, oxlint |
| Desktop | Electron 44 + electron-builder (NSIS installer) |
| Mobile | Capacitor 8 (Android), same offline bundle, sideloaded APK |
| Backend | Go (Gin + GORM), PostgreSQL, JWT, separate repo: [adrr-dev/openPOS](https://github.com/adrr-dev/openPOS) |
| Hosting | Vercel (frontend auto-deploys on every push to `main`) |

## Getting started

### Prerequisites

| Requirement | Needed for |
|---|---|
| Node.js 22.12+ and npm | Everything: dev server, builds, Capacitor sync |
| Windows x64 | `npm run electron:build` (installer) |
| Android SDK Platform 36 (compile/target SDK 36, min SDK 24) and JDK 21 | `npm run mobile:sync`, Gradle build, `adb install` |

### Environment variables

Create `web/.env.local` (gitignored):

```bash
VITE_API_URL=https://openpos-api.vercel.app/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | Yes | Base URL of the backend REST API. The dev server proxies `/api` to `http://localhost:8080`. |
| `VITE_GOOGLE_CLIENT_ID` | For Google sign-in | OAuth client ID; the frontend origin must also be registered in Google Cloud Console. |

Only `VITE_*` variables reach the client bundle. The offline builds ignore
both variables; they read device-local data instead.

### Run the web app

```bash
git clone https://github.com/0xMinomus/OpenPOS.git
cd OpenPOS/web
npm install
npm run dev      # local dev server (proxies /api to http://localhost:8080)
```

### npm scripts

All commands run inside `web/`:

| Command | Result |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) + cloud bundle in `dist/` |
| `npm run lint` | oxlint |
| `npm run build:offline` | Offline bundle in `dist-offline/` |
| `npm run electron:smoke` | Headless render test of the offline app |
| `npm run electron:build` | Cloud + offline builds, then the Windows installer in `release-out/` |
| `npm run mobile:sync` | Offline build + Capacitor sync for Android |

### Build the Windows desktop app

```bash
cd web
npm run electron:build
```

The installer lands in `web/release-out/`. Publish a release by uploading it to
[GitHub Releases](https://github.com/0xMinomus/OpenPOS/releases); the
[Downloads page](https://open-pos-deploy.vercel.app/unduh) always picks up the
latest release.

### Build the Android app

```bash
cd web
npm run mobile:sync
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Release APKs are signed with a private keystore. Back it up: losing it
permanently breaks update continuity for installed users. Sideloaded APK
updates are manual by design, and the finished APK is published to
`web/public/openpos.apk` so the Downloads page can serve it.

## Project structure

```text
.
├── web/                    # the entire product (Vite workspace, npm root)
│   ├── src/
│   │   ├── pages/          # cloud routes: Masuk, Daftar, Dashboard, Pos, ...
│   │   ├── pages/offline/  # offline screens (HashRouter, local adapter)
│   │   ├── redesign/       # standalone UI preview served at /demo (mock data)
│   │   ├── lib/            # api.ts, local-api.ts, localdb.ts, store.ts, ui.tsx, ...
│   │   ├── components/ui/  # shadcn/ui (Base UI) primitives
│   │   ├── App.tsx         # cloud routes (/masuk, /daftar, /app/*, /unduh, /demo)
│   │   └── offline-main.tsx
│   ├── electron/           # desktop shell (main + preload)
│   ├── android/            # Capacitor Android project (com.openpos.mobile)
│   ├── build/              # installer icon
│   └── public/openpos.apk  # latest sideloadable APK, served from /unduh
├── SECURITY.md             # security policy and reporting scope
└── LICENSE
```

## Backend API

The backend is maintained in a [separate repository](https://github.com/adrr-dev/openPOS)
and consumed purely over REST/JSON. This repo never talks to a database
directly. New endpoint needs are documented as API contracts and handed to the
backend maintainer, so the frontend and the API can ship independently.

## Contributing

Issues and pull requests are welcome.

- Keep business features backed by the real API; no local mock data for
  business flows (the `/demo` preview is the exception, it is a UI sandbox
  only).
- Run `npx tsc -b`, `npm run lint`, and `npm run build` before pushing.
- Follow [Conventional Commits](https://www.conventionalcommits.org/) for
  commit messages, matching the existing history.
- Never commit credentials, tokens, or `.env.local` files.

## Security

See [SECURITY.md](SECURITY.md) for supported versions, how authentication and
sessions work here, and the reporting process. Report suspected vulnerabilities
through [private vulnerability reporting](https://github.com/0xMinomus/OpenPOS/security/advisories/new),
never a public issue.

Note that the offline desktop and Android builds store all data in device-local
storage without a login screen; anyone with physical access to the device can
read that data. That is by design and out of scope for security reports.

## License

MIT (see [LICENSE](LICENSE)). Free forever, for small businesses.
