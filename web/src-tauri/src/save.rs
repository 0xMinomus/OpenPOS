use serde::Serialize;

#[derive(Serialize)]
pub struct SaveResult {
    pub saved: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
}

// Diganti worker-2: dialog Simpan + tulis byte.
#[tauri::command]
pub fn save_file(_app: tauri::AppHandle, _request: tauri::ipc::Request<'_>) -> SaveResult {
    SaveResult {
        saved: false,
        path: None,
    }
}
