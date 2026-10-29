# Contributing to OpenPOS

Thanks for taking the time to contribute. OpenPOS is a free point-of-sale app
for Indonesian MSMEs; small, focused changes are easier to review and safer to
ship than broad rewrites.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

- Open an issue for anything larger than a typo or a one-line fix. Describe the
  problem, the expected behavior, and the affected route or module.
- Security issues go through [private vulnerability reporting](https://github.com/0xMinomus/OpenPOS/security/advisories/new),
  never a public issue. See [SECURITY.md](SECURITY.md).
- Never commit credentials, tokens, `.env.local`, `MEMORY.md`, `TODO.md`, or
  local working notes.

## Repository layout

- `web/` — Vite + React + TypeScript workspace. Cloud SPA, offline bundles, and
  the Tauri desktop shell all live here.
- `web/src/pages/` — cloud routes and shared shells.
- `web/src/pages/offline/` — offline screens.
- `web/src/redesign/` — `/demo` sandbox only; mock data is allowed there only.
- `web/src/lib/` — API client, local API/database, formatters, shared UI.
- `web/src-tauri/` — OpenPOS Desktop shell (Tauri 2 + Rust).
- `web/electron/` — legacy Electron shell; not the desktop release.
- `web/android/` — Capacitor Android project.

Read [AGENTS.md](AGENTS.md) for the full architecture and conventions.

## Setup

Requirements: Node.js `>=22.12.0`, npm, and the committed
`web/package-lock.json`. Rust stable is only needed for the desktop shell.

```bash
cd web
npm install
npm run dev        # Vite dev server, proxies /api to http://localhost:8080
```

Useful checks:

```bash
npx tsc -b            # type check
npm run lint          # oxlint
npm run build         # cloud bundle
npm run build:offline # Electron/Android offline bundle
npm run build:lite    # OpenPOS Desktop frontend bundle
npm run electron:smoke
node scripts/lite-parity.mjs   # desktop parity checks
```

Desktop packaging is documented in [web/DESKTOP.md](web/DESKTOP.md).

## Code conventions

- User-facing copy, route names, and commit subjects are Indonesian. Code
  identifiers, comments in `lib/`, and documentation are English.
- Reuse the existing UI vocabulary: `lib/ui.tsx` (`Input`, `NumInput`, `Modal`,
  `DatePicker`, `Empty`, `Pager`, `ExportMenu`, `ImportMenu`, `Td`, `Th`) and
  `components/ui/*` shadcn primitives. Use design tokens, not raw colors.
- Pages follow one shape: `PageHeader` + `useDB()` for session + `useCache()` for
  reads + local state + inline `err` / `msg`. There is no toast library.
- Never call `fetch` from a page. Add an `apiXxx()` helper in `lib/api.ts` and a
  matching implementation in `lib/local-api.ts`; those two files must not drift.
- Keep business features on the real API. No mock data outside `/demo`.
- Add new frontend/backend endpoint needs as explicit API contracts for the
  backend maintainer instead of inventing a response shape.
- Do not add dependencies for something the standard library or an installed
  package already does.

## Commit and pull request flow

1. Fork or branch from `main`. Use a descriptive branch name.
2. Keep one concern per pull request. Include screenshots or a short recording
   for UI changes.
3. Run `npx tsc -b`, `npm run lint`, and `npm run build` before pushing. For
   desktop changes also run `npm run build:lite` and
   `node scripts/lite-parity.mjs`.
4. Use [Conventional Commits](https://www.conventionalcommits.org/) with an
   Indonesian subject, for example:

   ```text
   fix(transaksi): cegah diskon melebihi subtotal
   feat(unduh): tambah paket Linux
   docs(readme): perbarui badge dan tautan
   ```

5. In the pull request, explain the problem, the change, how it was verified,
   and any platform or backend that was not tested.
6. Do not force-push over review feedback unless asked; do not merge your own
   unreviewed pull request.

The repository has no unit or E2E test suite yet. Describe the manual steps you
ran (route, browser, device, build) so the reviewer can reproduce them.

## Release notes

- Web deploys from `main` through Vercel.
- OpenPOS Desktop is built by GitHub Actions and published from
  `web/release-out-lite/`; see [web/DESKTOP.md](web/DESKTOP.md).
- Android APK is published to `web/public/openpos.apk`; release builds need the
  local, gitignored keystore configuration.

## Questions

Open an issue for anything unclear. If a convention is missing, propose it in
the issue rather than silently introducing a second pattern.
