#!/usr/bin/env bash
set -euo pipefail

# Resolve repo root and paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WEB_DIR="$REPO_ROOT/web"

export PATH="$HOME/.cargo/bin:$PATH"

NO_COPY=0
for arg in "$@"; do
  case "$arg" in
    --no-copy)
      NO_COPY=1
      ;;
    -h|--help)
      echo "Usage: $0 [--no-copy]"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

cd "$WEB_DIR"

# Detect host OS
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*)
    IS_WINDOWS=1
    ;;
  *)
    if [[ "${OS:-}" == "Windows_NT" ]]; then
      IS_WINDOWS=1
    else
      IS_WINDOWS=0
    fi
    ;;
esac

echo "Building OpenPOS Lite NSIS installer..."
if [ "$IS_WINDOWS" -eq 1 ]; then
  npx tauri build --bundles nsis
else
  RUNNER="$HOME/.cargo/bin/cargo-xwin"
  if [ ! -x "$RUNNER" ] && command -v cargo-xwin >/dev/null 2>&1; then
    RUNNER="$(command -v cargo-xwin)"
  fi
  npx tauri build --target x86_64-pc-windows-msvc --runner "$RUNNER" --bundles nsis
fi

# Locate generated NSIS installer
CANDIDATE_DIRS=(
  "$WEB_DIR/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis"
  "$WEB_DIR/src-tauri/target/release/bundle/nsis"
)

if [ -n "${CARGO_TARGET_DIR:-}" ]; then
  CANDIDATE_DIRS=(
    "$CARGO_TARGET_DIR/x86_64-pc-windows-msvc/release/bundle/nsis"
    "$CARGO_TARGET_DIR/release/bundle/nsis"
    "${CANDIDATE_DIRS[@]}"
  )
fi

INSTALLER_SRC=""
for dir in "${CANDIDATE_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    MATCH="$(find "$dir" -maxdepth 1 -type f -name "*-setup.exe" | head -n 1)"
    if [ -n "$MATCH" ]; then
      INSTALLER_SRC="$MATCH"
      break
    fi
    MATCH="$(find "$dir" -maxdepth 1 -type f -name "*.exe" | head -n 1)"
    if [ -n "$MATCH" ]; then
      INSTALLER_SRC="$MATCH"
      break
    fi
  fi
done

if [ -z "$INSTALLER_SRC" ] || [ ! -f "$INSTALLER_SRC" ]; then
  echo "Error: No installer executable found in target bundle nsis directory!" >&2
  for dir in "${CANDIDATE_DIRS[@]}"; do
    echo "  - $dir" >&2
  done
  exit 1
fi

FINAL_ARTIFACT="$INSTALLER_SRC"
if [ "$NO_COPY" -eq 0 ]; then
  DEST_DIR="$WEB_DIR/release-out-lite"
  mkdir -p "$DEST_DIR"
  cp -f "$INSTALLER_SRC" "$DEST_DIR/"
  FINAL_ARTIFACT="$DEST_DIR/$(basename "$INSTALLER_SRC")"
fi

FINAL_ARTIFACT_ABS="$(cd "$(dirname "$FINAL_ARTIFACT")" && pwd)/$(basename "$FINAL_ARTIFACT")"
BYTES="$(wc -c < "$FINAL_ARTIFACT_ABS" | tr -d ' ')"
SIZE_MB="$(awk "BEGIN {printf \"%.2f MB\", $BYTES / 1048576}")"

echo "Build complete."
echo "Artifact: $FINAL_ARTIFACT_ABS"
echo "Size: $SIZE_MB"
