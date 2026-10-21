use std::io::Write;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use tauri::{AppHandle, Manager};

static SMOKE_FINISHED: AtomicBool = AtomicBool::new(false);

fn finish_smoke(app: &AppHandle, code: i32, message: &str) {
    if SMOKE_FINISHED.swap(true, Ordering::SeqCst) {
        return;
    }
    let mut stdout = std::io::stdout();
    let _ = writeln!(stdout, "{}", message);
    let _ = stdout.flush();
    let _ = std::io::stderr().flush();
    app.exit(code);
    std::process::exit(code);
}

pub fn start(app: AppHandle) {
    let timeout_app = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_secs(45));
        finish_smoke(&timeout_app, 2, "SMOKE-TIMEOUT");
    });

    let worker_app = app.clone();
    std::thread::spawn(move || {
        let mut main_window = None;
        for _ in 0..50 {
            if let Some(win) = worker_app.get_webview_window("main") {
                main_window = Some(win);
                break;
            }
            std::thread::sleep(Duration::from_millis(100));
        }

        let window = match main_window {
            Some(w) => w,
            None => {
                finish_smoke(&worker_app, 1, "SMOKE-ERROR:main window not found");
                return;
            }
        };

        let mut url_ready = false;
        for _ in 0..100 {
            if let Ok(url) = window.url() {
                let u = url.as_str();
                if url.path().ends_with("offline-lite.html") || u.contains("offline-lite.html") {
                    url_ready = true;
                    break;
                }
            }
            std::thread::sleep(Duration::from_millis(100));
        }
        if !url_ready {
            finish_smoke(
                &worker_app,
                1,
                "SMOKE-ERROR:offline-lite.html URL not reached in time",
            );
            return;
        }
        const SEED_SCRIPT: &str = r#"
            try {
                const iso = new Date().toISOString();
                const seed = {
                    settings: {
                        ownerName: "Andika",
                        storeName: "Toko Uji",
                        address: "",
                        phone: "",
                        receiptHeader: "",
                        receiptFooter: "",
                        paper: "58mm",
                        timezone: "Asia/Jakarta",
                        taxEnabled: false,
                        taxPct: 0
                    },
                    categories: [{ id: "c1", name: "Minuman", active: true, created_at: iso }],
                    products: [{
                        id: "p1",
                        name: "Aqua 600ml",
                        sku: "A-001",
                        categoryId: "c1",
                        categoryName: "Minuman",
                        buyPrice: 3500,
                        sellPrice: 4000,
                        stock: 48,
                        unit: "botol",
                        active: true,
                        created_at: iso
                    }],
                    transactions: [],
                    movements: [],
                    seq: 0
                };
                localStorage.setItem('op_offline_db', JSON.stringify(seed));
                location.reload();
            } catch (err) {
                console.error('Smoke seed error:', err);
            }
        "#;

        if let Err(e) = window.eval(SEED_SCRIPT) {
            finish_smoke(
                &worker_app,
                1,
                &format!("SMOKE-ERROR:failed to eval seed script: {}", e),
            );
            return;
        }

        std::thread::sleep(Duration::from_millis(4000));

        const CHECK_SCRIPT: &str = r#"
            (() => {
                function check() {
                    const root = document.querySelector('#root');
                    const text = document.body ? (document.body.innerText || '') : '';
                    return !!root && (
                        text.includes('Ringkasan toko') ||
                        text.includes('Selamat datang') ||
                        text.includes('Dashboard')
                    );
                }
                try {
                    if (check()) {
                        window.__TAURI_INTERNALS__.invoke('smoke_result', { ok: true });
                        return;
                    }
                    let attempts = 0;
                    const interval = setInterval(() => {
                        attempts++;
                        if (check()) {
                            clearInterval(interval);
                            window.__TAURI_INTERNALS__.invoke('smoke_result', { ok: true });
                        } else if (attempts >= 25) {
                            clearInterval(interval);
                            window.__TAURI_INTERNALS__.invoke('smoke_result', { ok: false });
                        }
                    }, 200);
                } catch (err) {
                    window.__TAURI_INTERNALS__.invoke('smoke_result', { ok: false });
                }
            })()
        "#;

        if let Err(e) = window.eval(CHECK_SCRIPT) {
            finish_smoke(
                &worker_app,
                1,
                &format!("SMOKE-ERROR:failed to eval check script: {}", e),
            );
        }
    });
}

#[tauri::command]
pub fn smoke_result(app: AppHandle, ok: bool) {
    let msg = format!("SMOKE-RENDER:{}", ok);
    let code = if ok { 0 } else { 1 };
    finish_smoke(&app, code, &msg);
}
