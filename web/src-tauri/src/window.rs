#[tauri::command]
pub fn close_window(window: tauri::WebviewWindow) {
    let _ = window.close();
}
