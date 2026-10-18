# Repository Guidelines

OpenPOS is a free point-of-sale app for Indonesian MSMEs (*UMKM*). One Vite
workspace, `web/`, ships three targets from the same UI: a cloud SPA (Go +
PostgreSQL REST API in a [separate repo](https://github.com/adrr-dev/openPOS)),
an offline Windows Electron app, and an offline Android Capacitor app.

Language convention matters here: **user-facing copy, route names, and commit
messages are Indonesian; code identifiers, comments in `lib/`, and docs are
English.**

## Architecture & Data Flow

Three entry points, three data sources, one component vocabulary.

| Entry | Router | Data source | Shell |
|---|---|---|---|
| `web/index.html` → `web/src/main.tsx` → `web/src/App.tsx` | `BrowserRouter` | `web/src/lib/api.ts` (REST) | `web/src/pages/AppShell.tsx` for `/app/*` |
| `web/offline.html` → `web/src/offline-main.tsx` | `HashRouter` | `web/src/lib/local-api.ts` → `localdb.ts` | `web/src/pages/offline/OfflineShell.tsx` |
| `/demo` routes | same `BrowserRouter` | `web/src/redesign/mock-api.ts` + `fixtures.ts` | `web/src/redesign/RedesignShell.tsx` |

- **Cloud route tree** (`web/src/App.tsx`): public `/`, `/masuk`, `/daftar`,
  `/pilih-akun`, `/unduh`; sandbox `/demo`; authenticated `/app/*` nested under
  `AppShell` via `<Outlet>`. `AdminOnly` (`App.tsx:29-36`) redirects known
  non-admin sessions, but the backend is the real authorization boundary.
  Legacy `/redesign/*` redirects to `/demo` keeping suffix and query.
- **Offline route tree** (`web/src/offline-main.tsx`): no login, no `/demo`,
  no admin guard. An account in local storage seeds an `admin` session *before*
  first render (a page reading `session.id` at render time crashes otherwise).
- **Request path, cloud:** page → `useCache(key, apiXxx)` → `request<T>()` in
  `lib/api.ts` → REST → page renders `loading` / `err` and calls `reload()` or
  `mutate()` after writes. Never call `fetch` from a page.
- **Request path, offline:** identical page shape, imports swapped to
  `lib/local-api.ts`, which mutates one JSON record in `localStorage`
  (`op_offline_db`, defined in `lib/localdb.ts:85`) and notifies
  `useLocalDB()` subscribers through `commit()`.
- **Auth:** JWT access + refresh tokens live per browser tab in `sessionStorage`
  (`op_access`, `op_refresh`); `op_accounts` caches the account switcher.
  `request<T>()` retries exactly one 401 through a shared refresh promise and
  throws `ApiError(status, message, code)`; a failed refresh clears tokens.
- **Cache:** `lib/cache.ts` is a module-memory GET cache (60 s TTL,
  stale-while-revalidate, fetch still runs on mount). Include the session
  identity in cache keys to avoid cross-account leakage.

## Key Directories

| Path | Purpose |
|---|---|
| `web/src/pages/` | Cloud routes and shared shells (`AppShell`, `Masuk`, `Daftar`, `PilihAkun`, `Dashboard`, `Pos`, `Produk`, `Stok`, `Transaksi`, `Laporan`, `Karyawan`, `Users`, `Pengaturan`, `Unduh`, `Landing`) |
| `web/src/pages/offline/` | Offline screens (`OfflineShell`, `OfflinePos`, `OfflineProduk`, `OfflineTransaksi`, `OfflineBackup`, …) |
| `web/src/redesign/` | `/demo` sandbox only: mock API, fixtures, its own shell, mock notifications |
| `web/src/lib/` | `api.ts`, `local-api.ts`, `localdb.ts`, `store.ts`, `cache.ts`, `ui.tsx`, `receipt.tsx`, `notifications.tsx`, `google.tsx`, `ErrorBoundary.tsx`, `utils.ts` |
| `web/src/components/ui/` | shadcn/ui primitives wrapping `@base-ui/react` |
| `web/src/hooks/`, `web/src/icons/` | `use-mobile.ts`, icon set |
| `web/electron/`, `web/android/`, `web/build/` | Desktop shell, Capacitor Android project, installer icon |
| `web/public/` | Served assets: hero/logo images, favicons, `openpos.apk`, static `prompts/` and `icons/` |
| Root | `README.md`, `SECURITY.md`, `LICENSE` |

## Development Commands

Run everything from `web/` (Node `>=22.12.0`, npm):

```bash
npm install
npm run dev              # Vite dev server, proxies /api → http://localhost:8080
npm run lint             # oxlint
npm run build            # tsc -b + cloud bundle → dist/
npm run build:offline    # offline bundle → dist-offline/
npm run electron:smoke   # headless render check of the offline bundle
npm run electron:build   # cloud + offline build + Windows NSIS installer → release-out/
npm run mobile:sync      # offline build + copy offline.html → index.html + cap sync android
```

Android (after `mobile:sync`):

```bash
cd web/android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

`electron:build` packages with electron-builder and is **Windows-only** as
invoked. Release APKs need `web/android/keystore.properties` (gitignored);
without it `assembleRelease` produces an unsigned APK.

## Code Conventions & Common Patterns

**Adding a page — the five steps that must stay consistent:**
1. Route: `web/src/App.tsx` (cloud, inside the `/app` block for authenticated
   screens) and/or `web/src/offline-main.tsx` (offline). Cross-mode features are
   added in both.
2. Data: an exported `apiXxx()` in `lib/api.ts` using `request<T>()`, plus a
   signature-matching implementation in `lib/local-api.ts` (that file explicitly
   promises parity — do not let the pair drift).
3. Page shape: `PageHeader` + `useDB()` for session + `useCache()` for reads +
   local `useState` drafts + inline errors. See `pages/Produk.tsx:37-100`.
4. Forms/pickers: reuse `lib/ui.tsx` (`Input`, `NumInput`, `Modal`,
   `DatePicker`, `Empty`, `Pager`, `ExportMenu`, `ImportMenu`, `Td`, `Th`) and
   `components/ui/*` for shadcn primitives; `cn()` lives in `lib/utils.ts`.
5. Copy: Indonesian labels and the established Indonesian route names
   (`/masuk`, `/produk`, `/stok`, `/transaksi`, `/laporan`, `/pengaturan`).

**Error handling:** there is **no toast library**. Errors and successes render
inline from page state (`err` / `msg`), dialogs use `Modal`, and cached-read
failures land in `useCache`'s `err`. `ErrorBoundary` wraps both roots.
API retries exist only for the single 401 refresh.

**Styling:** Tailwind v4 imported in `web/src/index.css`, design tokens mapped
through `@theme inline`, dark mode driven by `.dark` on `<html>` plus
`localStorage.op_theme` (`useTheme()`); `.landing-light` pins public pages to
light tokens. Prefer existing tokens over raw colors.

**Formatting:** `fmtRp`, `fmtDate`, `fmtTime`, `fmtInv`, `fmtShort` in
`lib/store.ts`. Times format with the *device* timezone, not the store's
timezone setting — don't describe output as WIB.

**Import/export:** `exportCSV`, `exportExcel`, `parseImportFile`, `downloadBlob`
in `lib/store.ts`; `exceljs` and `xlsx` are lazy-imported. On Electron,
downloads route through `window.offline.saveFile`.

**Naming:** components and pages `PascalCase.tsx`; lib modules lowercase
(`api.ts`, `localdb.ts`); API helpers `apiXxx`; hooks `useXxx`; storage keys
prefixed `op_`; TypeScript types exported from `lib/api.ts` describe the backend
contract (mixed camel/snake case as declared — check before renaming fields).

**TypeScript:** `verbatimModuleSyntax` (use `import type`),
`noUnusedLocals`/`noUnusedParameters`, and `erasableSyntaxOnly` (no enums,
namespaces, or constructor parameter properties) are enabled in
`web/tsconfig.app.json` / `tsconfig.node.json`. Import via the `@/` alias.

**Tailwind/shadcn config:** `web/components.json` pins `style: base-nova`,
`baseColor: neutral`, `iconLibrary: lucide`, CSS variables in `src/index.css`,
aliases `@/components`, `@/components/ui`, `@/lib`, `@/hooks`. New shadcn
components must match these.

## Important Files

| File | Why it matters |
|---|---|
| `web/src/App.tsx` | Cloud + `/demo` route registration, `AdminOnly` guard |
| `web/src/offline-main.tsx` | Offline entry: session bootstrap, hash routes |
| `web/src/lib/api.ts` (655 lines) | REST client, auth, all cloud `apiXxx()` helpers, contract types |
| `web/src/lib/local-api.ts` (372) | Offline adapter, must mirror `api.ts` |
| `web/src/lib/localdb.ts` (318) | Offline persistence, schema defaults, `commit()` / `useLocalDB()` |
| `web/src/lib/store.ts` (262) | Session/theme hooks, currency + date formatters, CSV/XLSX helpers |
| `web/src/lib/cache.ts` | `useCache` (60 s TTL, `reload` / `mutate`) |
| `web/src/lib/ui.tsx` (500) | Shared form, modal, pager, import/export UI |
| `web/src/index.css` | Tailwind v4 tokens, dark mode, `.landing-light` |
| `web/electron/main.cjs` | Window setup + `--smoke` assertion path |
| `web/package.json` | Scripts, electron-builder config, app version |

**Large-file hotspots — edit surgically, never rewrite wholesale:**
`pages/Laporan.tsx` (1169 lines), `pages/Pengaturan.tsx` (1104),
`pages/Users.tsx` (738), `pages/Produk.tsx` (636), `pages/Daftar.tsx` (543).

## Runtime/Tooling Preferences

- Node `>=22.12.0` with npm and the committed `web/package-lock.json`; do not
  switch package managers.
- React 19, TypeScript 6, Vite 8, Tailwind v4, React Router 8, oxlint,
  `@base-ui/react` (shadcn), Recharts, lucide-react, Electron 44,
  electron-builder 26, Capacitor 8.
- Path alias `@/` → `web/src` in both Vite configs and `tsconfig`.
- Offline bundle sets `base: './'` because Electron loads it over `file://`:
  any new asset URL must stay relative and exist in `dist-offline/`. The offline
  build also strips `dist-offline/openpos.apk` so installers don't grow.
- Env vars (client-exposed `VITE_*` only): `VITE_API_URL` (falls back to
  `/api/v1`), `VITE_GOOGLE_CLIENT_ID` (Google sign-in shows a "not configured"
  state when unset); `import.meta.env.BASE_URL` prefixes public logo paths in
  `lib/ui.tsx`. Create `web/.env.local`; it is gitignored.
- Deployment: Vercel runs `npm run build` → `dist/` with an SPA rewrite to
  `/index.html`, hardening headers, and a download rule for `/openpos.apk`
  (`web/vercel.json`).

## Testing & QA

There is **no unit or E2E test framework** and no CI/hooks. The only tests in
the tree are generated Capacitor examples under
`web/android/app/src/test/java/com/getcapacitor/myapp/`. Verification is
lint + typecheck + build + smoke:

```bash
cd web
npx tsc -b            # type check (also part of npm run build)
npm run lint          # oxlint; config web/.oxlintrc.json (react/typescript/oxc,
                      # react/rules-of-hooks = error, react/only-export-components = warn)
npm run build         # cloud bundle must build cleanly
npm run build:offline && npm run electron:smoke   # when touching offline startup/render
```

`electron:smoke` loads `dist-offline/offline.html`, seeds sample local data,
reloads, waits ~4 s, and requires `#root` plus one of "Ringkasan toko",
"Selamat datang", "Dashboard" (`web/electron/main.cjs:53-99`). Exit `0` with
`SMOKE-RENDER:true` = pass; `SMOKE-RENDER:false` → `1`;
`SMOKE-ERROR:<msg>` → `1`; `SMOKE-TIMEOUT` → `2`. It proves a first render
only — interactions and the cloud app still need manual verification in a
browser (the gitignored root screenshot patterns
`dashboard-*.png`, `ipad-*.png`, `screenshot-*.png` show that manual
screenshots are the house habit; keep them at repo root, `web/public/` is
tracked).

`README.md` requires `npx tsc -b`, `npm run lint`, and `npm run build` before
pushing. Keep business features on the real API (no mock data outside
`/demo`), keep the frontend/backend boundary at REST/JSON, and document new
endpoint needs as API contracts for the backend maintainer.

**Commit style:** Conventional Commits with an Indonesian subject, e.g.
`fix(android): 4 cacat rilis 1.0.2 - inset status bar, logo putih`, scopes seen:
`android`, `desktop`, `offline`, `mobile`, `dashboard`, `app`, `produk`,
`transaksi`, `unduh`, `landing`, `auth`, `export`, `readme`.

**Release flow and version sync:** bump `web/package.json` version; Android
keeps its own path — update `versionCode` / `versionName` in
`web/android/app/build.gradle` too (currently out of step). Windows: upload the
installer from `web/release-out/` to GitHub Releases. Android: publish the
signed APK to `web/public/openpos.apk`. The `/unduh` page reads both the GitHub
release assets and that APK.

**Never commit** (all gitignored for a stated reason): `MEMORY.md` and
`TODO.md` (credential and release-keystore hints), `docs/`, `PRODUCT.md`,
`PROJECT.md`, `opencode.json`, `*.bundle`, `.env*` except `.env.example`,
`.playwright-mcp/`, `.code-graph/`, `.mcp-servers/`, `.omp/`, root-level
screenshots, `web/android/keystore.properties` and keystore files. These are
internal working files, not part of the public repo — never link to them from
`README.md` or other tracked files.
