use encoding_rs::SHIFT_JIS;
use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use once_cell::sync::Lazy;
use std::{
    collections::HashMap,
    fs::File,
    io::{Read, Seek, SeekFrom},
    path::PathBuf,
    sync::Mutex,
};
use tauri::{AppHandle, Emitter};

// ──────────────────────────────────────────────
// グローバル状態
// ──────────────────────────────────────────────

struct WatchState {
    watcher:   Option<RecommendedWatcher>,
    /// ファイルパスごとの (最後の読み込み位置, フォーマット)
    positions: HashMap<PathBuf, (u64, String)>,
}

static WATCH_STATE: Lazy<Mutex<WatchState>> = Lazy::new(|| {
    Mutex::new(WatchState {
        watcher:   None,
        positions: HashMap::new(),
    })
});

// ──────────────────────────────────────────────
// エンコーディング変換
// ──────────────────────────────────────────────

/// バイト列をフォーマットに応じてUTF-8文字列に変換する
/// - nanashiki  → UTF-8（そのまま）
/// - kokainiikki → Shift-JIS → UTF-8
fn decode_bytes(bytes: &[u8], format: &str) -> String {
    if format == "kokainiikki" {
        let (text, _, _) = SHIFT_JIS.decode(bytes);
        text.into_owned()
    } else {
        String::from_utf8_lossy(bytes).into_owned()
    }
}

// ──────────────────────────────────────────────
// 差分読み込み
// ──────────────────────────────────────────────

/// ファイルの `from_pos` 以降をバイトで読み込む。新しい末尾位置も返す。
fn read_diff_bytes(path: &PathBuf, from_pos: u64) -> std::io::Result<(Vec<u8>, u64)> {
    let mut file = File::open(path)?;
    file.seek(SeekFrom::Start(from_pos))?;
    let mut buf = Vec::new();
    file.read_to_end(&mut buf)?;
    let new_pos = from_pos + buf.len() as u64;
    Ok((buf, new_pos))
}

// ──────────────────────────────────────────────
// Tauri コマンド
// ──────────────────────────────────────────────

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct WatchTarget {
    pub path:   String,
    pub format: String, // "nanashiki" | "kokainiikki"
}

/// CSVファイルを全件読み込んでイベント送信し、監視を開始する
#[tauri::command]
pub fn start_watch(targets: Vec<WatchTarget>, app: AppHandle) -> Result<(), String> {
    let mut state = WATCH_STATE.lock().unwrap();

    // 既存の監視を停止
    state.watcher = None;
    state.positions.clear();

    let app_clone = app.clone();

    let mut watcher = RecommendedWatcher::new(
        move |res: notify::Result<Event>| {
            let Ok(event) = res else { return };
            if !matches!(event.kind, EventKind::Modify(_) | EventKind::Create(_)) {
                return;
            }
            for path in &event.paths {
                let path_buf = path.clone();
                let app = app_clone.clone();

                // ファイル位置とフォーマットを取得
                let (from_pos, format) = {
                    let s = WATCH_STATE.lock().unwrap();
                    match s.positions.get(&path_buf) {
                        Some((pos, fmt)) => (*pos, fmt.clone()),
                        None => continue,
                    }
                };

                match read_diff_bytes(&path_buf, from_pos) {
                    Ok((bytes, new_pos)) => {
                        if bytes.is_empty() { continue; }
                        {
                            let mut s = WATCH_STATE.lock().unwrap();
                            if let Some(entry) = s.positions.get_mut(&path_buf) {
                                entry.0 = new_pos;
                            }
                        }
                        let text = decode_bytes(&bytes, &format);
                        if text.trim().is_empty() { continue; }
                        let _ = app.emit("csv-diff", serde_json::json!({
                            "path": path_buf.to_string_lossy(),
                            "text": text,
                        }));
                    }
                    Err(e) => log::error!("差分読み込みエラー: {e}"),
                }
            }
        },
        Config::default(),
    )
    .map_err(|e| e.to_string())?;

    for target in &targets {
        let path = PathBuf::from(&target.path);
        if !path.exists() {
            return Err(format!("ファイルが見つかりません: {}", target.path));
        }

        // 初回: ファイル全体を読み込んでイベント送信
        let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
        let file_size = bytes.len() as u64;
        let full_text = decode_bytes(&bytes, &target.format);

        let _ = app.emit("csv-diff", serde_json::json!({
            "path": path.to_string_lossy(),
            "text": full_text,
        }));

        state.positions.insert(path.clone(), (file_size, target.format.clone()));

        watcher
            .watch(&path, RecursiveMode::NonRecursive)
            .map_err(|e| e.to_string())?;
    }

    state.watcher = Some(watcher);
    Ok(())
}

/// 監視を停止する
#[tauri::command]
pub fn stop_watch() {
    let mut state = WATCH_STATE.lock().unwrap();
    state.watcher = None;
    state.positions.clear();
}
