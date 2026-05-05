mod proxy;

use tauri::{AppHandle, Manager, State};
use std::sync::Mutex;

pub struct ProxyConfigState(pub Mutex<proxy::ProxyConfig>);

// ──────────────────────────────────────────────
// Tauri コマンド
// ──────────────────────────────────────────────

#[tauri::command]
async fn start_proxy(
    config: proxy::ProxyConfig,
    app: AppHandle,
    state: State<'_, ProxyConfigState>,
) -> Result<(), String> {
    if proxy::is_running() {
        proxy::stop();
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    }

    let data_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;
    let ca = proxy::ensure_ca(&data_dir)?;

    {
        let mut s = state.0.lock().unwrap();
        *s = config.clone();
    }

    proxy::start(config, ca, app).await
}

#[tauri::command]
fn stop_proxy() {
    proxy::stop();
}

#[tauri::command]
fn get_proxy_status(state: State<'_, ProxyConfigState>) -> serde_json::Value {
    let running = proxy::is_running();
    let config = state.0.lock().unwrap().clone();
    serde_json::json!({
        "running": running,
        "port": config.port,
        "upstream_host": config.upstream_host,
        "upstream_port": config.upstream_port,
    })
}

#[tauri::command]
fn install_ca_cert(app: AppHandle) -> Result<(), String> {
    let data_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;
    proxy::install_ca_cert(&data_dir)
}

// ──────────────────────────────────────────────
// エントリポイント
// ──────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(ProxyConfigState(Mutex::new(proxy::ProxyConfig::default())))
        .invoke_handler(tauri::generate_handler![
            start_proxy,
            stop_proxy,
            get_proxy_status,
            install_ca_cert,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
