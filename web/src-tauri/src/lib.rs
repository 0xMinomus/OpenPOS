mod save;
mod smoke;
mod window;

pub fn run() {
    let smoke_mode = std::env::args().any(|arg| arg == "--smoke");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            save::save_file,
            window::close_window,
            smoke::smoke_result
        ])
        .setup(move |app| {
            if smoke_mode {
                smoke::start(app.handle().clone());
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running OpenPOS Desktop");
}
