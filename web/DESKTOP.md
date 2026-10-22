# OpenPOS Desktop

OpenPOS Desktop is the main offline desktop application for OpenPOS, running
on Windows and Linux. It is powered by Tauri v2 with a Rust backend shell and
the shared offline React frontend (`offline-lite.html`), and it ships a Windows
NSIS installer plus Linux `.deb`, `.rpm`, and AppImage packages. It is the
resource-efficient successor to the legacy Electron desktop build kept in
`web/electron/`, while using identical UI components and offline storage logic.

## Naming: product vs internal

The product name is **OpenPOS Desktop**. Several internal names still carry the
historical "Lite" label and are intentionally unchanged, so the commands and
paths in this document match the repository:

| Internal name | Where it appears |
|---|---|
| `build:lite` | npm script that builds the desktop frontend bundle |
| `dist-lite/` | Tauri `frontendDist` output directory |
| `offline-lite.html`, `src/lite-main.tsx` | desktop entry point |
| `web/scripts/lite-build.sh`, `lite-parity.mjs`, `verify-lite.ps1` | build and verification scripts |
| `release-out-lite/` | local copy of the generated Windows installer |
| `com.openpos.lite` | Tauri identifier |

New builds use the product name for artifacts:
`OpenPOS Desktop_<version>_x64-setup.exe` (NSIS),
`OpenPOS Desktop_<version>_amd64.deb`,
`OpenPOS Desktop-<version>-1.x86_64.rpm`,
`OpenPOS Desktop_<version>_amd64.AppImage`, and the `openpos-desktop` binary.
GitHub replaces spaces in uploaded asset names with dots, so releases may show
`OpenPOS.Desktop_...`. Older releases still use `OpenPOS Lite`/`OpenPOS-Lite`
filenames.

The Tauri identifier `com.openpos.lite` is deliberately preserved: it determines
the WebView2 data directory (`%LOCALAPPDATA%\com.openpos.lite`), so changing it
would orphan the local database of existing beta installs. Do not rename it
without a migration plan.

## Prerequisites

- **Node.js**: `>= 22.12.0` with `npm`
- **Rust**: stable toolchain (`rustup`)
- **Windows (native build)**:
  - Microsoft C++ Build Tools (MSVC)
  - Microsoft Edge WebView2 runtime (preinstalled on modern Windows 10/11)
- **Linux (cross-compilation for Windows)**:
  - `clang`, `llvm`, `lld`
  - Windows Rust target: `rustup target add x86_64-pc-windows-msvc`
  - `cargo-xwin` (`cargo install cargo-xwin`)
  - NSIS (`makensis`)
- **Linux (native build)**:
  - WebKitGTK 4.1, GTK3, libsoup3, librsvg2, patchelf, `rpm` (for `.rpm` bundles)
  - Debian/Ubuntu: `sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev patchelf rpm`
  - Fedora: `sudo dnf install webkit2gtk4.1-devel gtk3-devel libappindicator-gtk3-devel librsvg2-devel patchelf rpm-build`

## Build Commands

### Local Linux Cross-Compilation (Windows installer)

Run the automated build script from the repository root:
```bash
bash web/scripts/lite-build.sh
```

Or build manually from `web/`:
```bash
cd web
export PATH="$HOME/.cargo/bin:$PATH"
npx tauri build --target x86_64-pc-windows-msvc --runner "$HOME/.cargo/bin/cargo-xwin" --bundles nsis
```

### Local Windows (Native Build)

From Git Bash / MSYS / Cygwin:
```bash
bash web/scripts/lite-build.sh
```

Or directly using the Tauri CLI in `web/`:
```bash
cd web
npx tauri build --bundles nsis
```

The script supports `--no-copy` to keep the installer in the target build directory without copying to `web/release-out-lite/`.

### Local Linux (Native Build)

Build all three Linux bundles from `web/`:

```bash
cd web
npx tauri build --target x86_64-unknown-linux-gnu --bundles deb,rpm,appimage
```

Building on Ubuntu 22.04 keeps the `.deb`/AppImage compatible with glibc 2.34 (Ubuntu 22.04+, Debian 12+, Fedora 35+). The `.rpm` inherits the build host's glibc, so Fedora builds target Fedora 40+.

### Continuous Integration (CI)

Two GitHub Actions workflows cover OpenPOS Desktop:

- `.github/workflows/lite-windows.yml` runs on `windows-latest` and uploads the NSIS installer.
- `.github/workflows/lite-linux.yml` runs on `ubuntu-22.04`, installs WebKitGTK/GTK build dependencies, and uploads `.deb`, `.rpm`, and AppImage bundles.

Both run for pushes and pull requests touching `web/**` or their own workflow file, plus manual dispatch (`workflow_dispatch`). Workflow file names keep the internal `lite` prefix; their display names and uploaded artifact names use `OpenPOS Desktop`.

## Artifacts

The filenames below follow the current Tauri `productName` (`OpenPOS Desktop`).

The generated NSIS installer is copied to:
- `web/release-out-lite/OpenPOS Desktop_<version>_x64-setup.exe`

In the Rust target directory, the output is located at:
- `web/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/OpenPOS Desktop_<version>_x64-setup.exe` (cross-build or target-specified build)
- `web/src-tauri/target/release/bundle/nsis/OpenPOS Desktop_<version>_x64-setup.exe` (native Windows build without explicit target flag)

Linux bundles land in `web/src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/`:

| Bundle | Path |
|---|---|
| Debian/Ubuntu | `deb/OpenPOS Desktop_<version>_amd64.deb` |
| Fedora/RHEL | `rpm/OpenPOS Desktop-<version>-1.x86_64.rpm` |
| Portable | `appimage/OpenPOS Desktop_<version>_amd64.AppImage` |

## Verification and Smoke Test

To verify the build headlessly on Windows, run the installed binary:
```cmd
"OpenPOS Desktop.exe" --smoke
```
Expected exit code: `0`.

When invoked with `--smoke`, OpenPOS Desktop initializes the application, seeds default offline storage in `localStorage`, reloads the view, verifies that core UI roots rendered successfully (e.g. "Ringkasan toko", "Selamat datang", or "Dashboard"), and exits cleanly with code `0`.

On Linux, the smoke test needs an X server. Use the installed binary or the AppImage:

```bash
xvfb-run -a openpos-desktop --smoke
# or
xvfb-run -a "./OpenPOS Desktop_0.1.0_amd64.AppImage" --smoke
```

Both print `SMOKE-RENDER:true` and exit `0` when the UI rendered.

Static parity checks live in `web/scripts/lite-parity.mjs`; the acceptance
walkthrough is in [`DESKTOP-PARITY.md`](DESKTOP-PARITY.md).

## Data Migration from the legacy Electron build

OpenPOS Desktop operates with a separate data origin from the legacy Electron
desktop build. To transfer existing data:
1. Open the existing Electron app and navigate to **Pengaturan > Backup & Restore** (or offline backup screen).
2. Export the database as a Backup JSON file.
3. Launch OpenPOS Desktop, navigate to **Pengaturan > Backup & Restore**, and choose **Restore / Import**.
4. Select the exported JSON file to restore the offline database (`op_offline_db`).

## Linux Builds

Linux bundles are supported through Tauri: AppImage, `.deb`, and `.rpm`.

```bash
cd web
npx tauri build --target x86_64-unknown-linux-gnu --bundles deb,rpm,appimage
```

`src-tauri/tauri.linux.conf.json` sets the Linux binary name to `openpos-desktop` (no space). Windows uses `OpenPOS Desktop.exe` from `tauri.conf.json`.

Host prerequisites: WebKitGTK 4.1, GTK3, libsoup3, and the usual Tauri build dependencies. AppImage bundles WebKitGTK/GTK libraries but still uses the host glibc.

Build-host compatibility matters:

- AppImage/DEB built on **Ubuntu 22.04** use glibc 2.34 symbols. Broadest option: Ubuntu 22.04+, Debian 12+, Fedora 35+.
- RPM built on **Fedora 44** uses glibc 2.39 symbols. Rebuild on the target Fedora release for older systems.
- No Linux artifact can support literally every distribution: WebKitGTK 4.1 and a compatible glibc are still required.

### Install on Linux

Release assets for Linux:

| Package | Target |
|---|---|
| `OpenPOS Desktop_<version>_amd64.deb` | Debian 12+, Ubuntu 22.04+ (glibc 2.34+) |
| `OpenPOS Desktop-<version>-1.x86_64.rpm` | Fedora 40+ (built on Fedora 44, glibc 2.39+) |
| `OpenPOS Desktop_<version>_amd64.AppImage` | Portable, no install; host glibc required |

Older beta releases still publish `OpenPOS-Lite_...` filenames; the commands
below are the same, only the filename differs.

Debian/Ubuntu — `apt` resolves WebKitGTK/GTK dependencies:

```bash
sudo apt install "./OpenPOS Desktop_0.1.0_amd64.deb"
```

Fedora — `dnf` resolves dependencies:

```bash
sudo dnf install "./OpenPOS Desktop-0.1.0-1.x86_64.rpm"
```

AppImage — run directly:

```bash
chmod +x "OpenPOS Desktop_0.1.0_amd64.AppImage"
"./OpenPOS Desktop_0.1.0_amd64.AppImage"
```

The `.deb`/`.rpm` install the binary at `/usr/bin/openpos-desktop` with a desktop entry and icon, so the app appears in the application menu. Verify the install:

```bash
xvfb-run -a openpos-desktop --smoke
```

If `linuxdeploy` fails inside an AppImage-based environment (e.g. Orca), run the AppImage bundle step under a clean environment:

```bash
env -i HOME="$HOME" LANG=C.UTF-8 \
  PATH="$HOME/.cargo/bin:/usr/bin:/bin" \
  CARGO_HOME="$HOME/.cargo" RUSTUP_HOME="$HOME/.rustup" \
  CARGO_TARGET_DIR="$PWD/src-tauri/target" \
  XDG_CACHE_HOME="$HOME/.cache" \
  npx tauri build --target x86_64-unknown-linux-gnu --bundles appimage
```

## Known Limitations

### Windows

- **WebView2 Dependency**: Requires the Microsoft Edge WebView2 runtime installed on the user's system.
- **WebView2 Engine Version Drift**: The installed WebView2 runtime updates independently of OpenPOS Desktop; subtle rendering differences may occur across OS builds.
- **Auto-Update**: Built as an unsigned standalone NSIS installer without automatic background updates. Updates are applied by executing new installer releases.

### Linux

- **WebKitGTK dependency**: `.deb` and `.rpm` declare `libwebkit2gtk-4.1-0` and `libgtk-3-0`; the AppImage bundles GTK/WebKitGTK libraries but still uses the host glibc.
- **glibc floor**: the `.deb` is built on Ubuntu 22.04 (glibc 2.34+); the `.rpm` is built on Fedora 44 (glibc 2.39+, Fedora 40+). Rebuild on an older base to support older distributions.
- **No auto-update**: Linux packages are unsigned; upgrade by installing the newer `.deb`/`.rpm` or replacing the AppImage.

### All platforms

- **Thermal Printing Validation**: Direct raw printing over USB/serial ESC/POS is not bundled. Standard system print dialog (`window.print()`) is used and must be validated on the physical target thermal printer.
- **CSP Parity**: Content Security Policy is set to `csp: null` in `tauri.conf.json` for parity with the legacy Electron offline environment.
