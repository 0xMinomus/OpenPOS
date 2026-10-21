use serde::Serialize;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

#[derive(Serialize)]
pub struct SaveResult {
    pub saved: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
}

#[derive(Debug, PartialEq, Eq)]
pub struct FilterDef {
    pub name: &'static str,
    pub extensions: &'static [&'static str],
}

pub fn get_save_filters(filename: &str) -> Vec<FilterDef> {
    let ext = std::path::Path::new(filename)
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase());

    match ext.as_deref() {
        Some("xlsx") => vec![
            FilterDef {
                name: "Excel (.xlsx)",
                extensions: &["xlsx"],
            },
            FilterDef {
                name: "Semua file",
                extensions: &["*"],
            },
        ],
        Some("csv") => vec![
            FilterDef {
                name: "CSV (.csv)",
                extensions: &["csv"],
            },
            FilterDef {
                name: "Semua file",
                extensions: &["*"],
            },
        ],
        Some("json") => vec![
            FilterDef {
                name: "JSON (.json)",
                extensions: &["json"],
            },
            FilterDef {
                name: "Semua file",
                extensions: &["*"],
            },
        ],
        _ => vec![FilterDef {
            name: "Semua file",
            extensions: &["*"],
        }],
    }
}

pub fn sanitize_filename(header_val: Option<&str>) -> String {
    let raw = match header_val {
        Some(s) if !s.trim().is_empty() => s.trim(),
        _ => return "export".to_string(),
    };

    let decoded = percent_encoding::percent_decode_str(raw).decode_utf8_lossy();
    let trimmed = decoded.trim();
    if trimmed.is_empty() {
        return "export".to_string();
    }

    let normalized = trimmed.replace('\\', "/");
    let path = std::path::Path::new(&normalized);

    match path.file_name().and_then(|f| f.to_str()) {
        Some(name) if !name.is_empty() && name != "." && name != ".." => name.to_string(),
        _ => "export".to_string(),
    }
}

#[tauri::command]
pub async fn save_file(
    app: tauri::AppHandle,
    request: tauri::ipc::Request<'_>,
) -> Result<SaveResult, ()> {
    let bytes = match request.body() {
        tauri::ipc::InvokeBody::Raw(b) => b.clone(),
        tauri::ipc::InvokeBody::Json(serde_json::Value::Array(arr)) => arr
            .iter()
            .filter_map(|v| v.as_u64().map(|n| n as u8))
            .collect(),
        _ => Vec::new(),
    };

    let filename_header = request
        .headers()
        .get("x-filename")
        .and_then(|v| v.to_str().ok());
    let safe_filename = sanitize_filename(filename_header);

    let mut builder = app.dialog().file();
    builder = builder.set_title("Simpan file");

    if let Ok(dir) = app.path().download_dir() {
        builder = builder.set_directory(dir);
    }
    builder = builder.set_file_name(&safe_filename);

    for filter in get_save_filters(&safe_filename) {
        builder = builder.add_filter(filter.name, filter.extensions);
    }

    let (tx, mut rx) = tauri::async_runtime::channel(1);
    builder.save_file(move |path| {
        let _ = tx.blocking_send(path);
    });

    let chosen = rx.recv().await.flatten();
    let Some(file_path) = chosen else {
        return Ok(SaveResult {
            saved: false,
            path: None,
        });
    };

    let Ok(path_buf) = file_path.into_path() else {
        return Ok(SaveResult {
            saved: false,
            path: None,
        });
    };

    if std::fs::write(&path_buf, &bytes).is_ok() {
        Ok(SaveResult {
            saved: true,
            path: Some(path_buf.to_string_lossy().to_string()),
        })
    } else {
        Ok(SaveResult {
            saved: false,
            path: None,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_filename() {
        assert_eq!(sanitize_filename(None), "export");
        assert_eq!(sanitize_filename(Some("")), "export");
        assert_eq!(sanitize_filename(Some("   ")), "export");
        assert_eq!(sanitize_filename(Some(".")), "export");
        assert_eq!(sanitize_filename(Some("..")), "export");
        assert_eq!(sanitize_filename(Some("/")), "export");
        assert_eq!(sanitize_filename(Some("\\")), "export");
        assert_eq!(sanitize_filename(Some("laporan.xlsx")), "laporan.xlsx");
        assert_eq!(
            sanitize_filename(Some("laporan%20penjualan.xlsx")),
            "laporan penjualan.xlsx"
        );
        assert_eq!(
            sanitize_filename(Some("C:\\Users\\admin\\Desktop\\data.csv")),
            "data.csv"
        );
        assert_eq!(sanitize_filename(Some("/var/log/data.csv")), "data.csv");
        assert_eq!(
            sanitize_filename(Some("../../nested/backup.json")),
            "backup.json"
        );
    }

    #[test]
    fn test_get_save_filters() {
        let xlsx_filters = get_save_filters("laporan.xlsx");
        assert_eq!(xlsx_filters.len(), 2);
        assert_eq!(xlsx_filters[0].name, "Excel (.xlsx)");
        assert_eq!(xlsx_filters[0].extensions, &["xlsx"]);
        assert_eq!(xlsx_filters[1].name, "Semua file");
        assert_eq!(xlsx_filters[1].extensions, &["*"]);

        let xlsx_upper = get_save_filters("LAPORAN.XLSX");
        assert_eq!(xlsx_upper[0].name, "Excel (.xlsx)");

        let csv_filters = get_save_filters("transaksi.csv");
        assert_eq!(csv_filters.len(), 2);
        assert_eq!(csv_filters[0].name, "CSV (.csv)");
        assert_eq!(csv_filters[0].extensions, &["csv"]);
        assert_eq!(csv_filters[1].name, "Semua file");
        assert_eq!(csv_filters[1].extensions, &["*"]);

        let json_filters = get_save_filters("backup.json");
        assert_eq!(json_filters.len(), 2);
        assert_eq!(json_filters[0].name, "JSON (.json)");
        assert_eq!(json_filters[0].extensions, &["json"]);
        assert_eq!(json_filters[1].name, "Semua file");
        assert_eq!(json_filters[1].extensions, &["*"]);

        let other_filters = get_save_filters("document.pdf");
        assert_eq!(other_filters.len(), 1);
        assert_eq!(other_filters[0].name, "Semua file");
        assert_eq!(other_filters[0].extensions, &["*"]);

        let none_filters = get_save_filters("export");
        assert_eq!(none_filters.len(), 1);
        assert_eq!(none_filters[0].name, "Semua file");
        assert_eq!(none_filters[0].extensions, &["*"]);
    }
}
