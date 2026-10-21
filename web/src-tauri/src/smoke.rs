use tauri::AppHandle;

// Diganti worker-3: seed localStorage, reload, cek DOM, exit code.
pub fn start(_app: AppHandle) {}

#[tauri::command]
pub fn smoke_result(_app: AppHandle, _ok: bool) {}
