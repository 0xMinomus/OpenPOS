# OpenPOS Lite

OpenPOS Lite is a lightweight offline Windows desktop distribution of OpenPOS powered by Tauri v2 with a Rust backend shell and the shared offline React frontend (`offline-lite.html`). It provides a resource-efficient alternative to the Electron distribution while using identical UI components and offline storage logic.

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

## Build Commands

### Local Linux Cross-Compilation

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

### Continuous Integration (CI)

The GitHub Actions workflow at `.github/workflows/lite-windows.yml` runs on `windows-latest` for pushes and pull requests touching `web/**` or the workflow itself, as well as on manual dispatch (`workflow_dispatch`). It checks out the code, configures Node 22 with npm cache, installs Rust stable with `x86_64-pc-windows-msvc`, runs `npm ci`, builds via `npx tauri build --target x86_64-pc-windows-msvc --bundles nsis`, and uploads the generated NSIS installer as a workflow artifact.

## Artifacts

The generated NSIS installer is copied to:
- `web/release-out-lite/OpenPOS Lite_<version>_x64-setup.exe`

In the Rust target directory, the output is located at:
- `web/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/OpenPOS Lite_<version>_x64-setup.exe` (cross-build or target-specified build)
- `web/src-tauri/target/release/bundle/nsis/OpenPOS Lite_<version>_x64-setup.exe` (native Windows build without explicit target flag)

## Verification and Smoke Test

To verify the build headlessly on Windows:
```cmd
"OpenPOS Lite.exe" --smoke
```
Expected exit code: `0`.

When invoked with `--smoke`, OpenPOS Lite initializes the application, seeds default offline storage in `localStorage`, reloads the view, verifies that core UI roots rendered successfully (e.g. "Ringkasan toko", "Selamat datang", or "Dashboard"), and exits cleanly with code `0`.

## Data Migration from Electron

OpenPOS Lite operates with a separate data origin from the Electron desktop build. To transfer existing data:
1. Open the existing Electron app and navigate to **Pengaturan > Backup & Restore** (or offline backup screen).
2. Export the database as a Backup JSON file.
3. Launch OpenPOS Lite, navigate to **Pengaturan > Backup & Restore**, and choose **Restore / Import**.
4. Select the exported JSON file to restore the offline database (`op_offline_db`).

## Known Limitations

- **WebView2 Dependency**: Requires the Microsoft Edge WebView2 runtime installed on the user's system.
- **WebView2 Engine Version Drift**: The installed WebView2 runtime updates independently of OpenPOS Lite; subtle rendering differences may occur across OS builds.
- **Thermal Printing Validation**: Direct raw printing over USB/serial ESC/POS is not bundled. Standard system print dialog (`window.print()`) is used and must be validated on the physical target thermal printer.
- **CSP Parity**: Content Security Policy is set to `csp: null` in `tauri.conf.json` for parity with the Electron offline environment.
- **Auto-Update**: Built as an unsigned standalone NSIS installer without automatic background updates. Updates are applied by executing new installer releases.
