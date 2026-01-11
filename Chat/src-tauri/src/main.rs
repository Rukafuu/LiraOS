#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, AppHandle, Emitter};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState, Code, Modifiers};
use rusqlite::{Connection, Result as SqlResult};
use std::sync::Mutex;
use futures_util::StreamExt;
use reqwest::Client;

// Global SQLite connection
struct AppState {
    db: Mutex<Connection>,
}

// Initialize local database
fn init_db(app_handle: &AppHandle) -> SqlResult<Connection> {
    let app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
    std::fs::create_dir_all(&app_dir).expect("Failed to create app dir");
    
    let db_path = app_dir.join("lira_local.db");
    let conn = Connection::open(db_path)?;
    
    // Create tables
    conn.execute(
        "CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        )",
        [],
    )?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )",
        [],
    )?;
    
    Ok(conn)
}

// Tauri command to save message locally
#[tauri::command]
fn save_message_local(
    state: tauri::State<AppState>,
    session_id: String,
    role: String,
    content: String,
) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;
    
    db.execute(
        "INSERT INTO messages (session_id, role, content, timestamp) VALUES (?1, ?2, ?3, ?4)",
        [&session_id, &role, &content, &timestamp.to_string()],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

// Tauri command to get messages for a session
#[tauri::command]
fn get_messages_local(
    state: tauri::State<AppState>,
    session_id: String,
) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().unwrap();
    let mut stmt = db.prepare(
        "SELECT role, content, timestamp FROM messages WHERE session_id = ?1 ORDER BY timestamp ASC"
    ).map_err(|e| e.to_string())?;
    
    let messages = stmt.query_map([session_id], |row| {
        Ok(serde_json::json!({
            "role": row.get::<_, String>(0)?,
            "content": row.get::<_, String>(1)?,
            "timestamp": row.get::<_, i64>(2)?,
        }))
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;
    
    Ok(messages)
}

// Custom Stream Chat Command
#[tauri::command]
async fn stream_chat_request(
    window: tauri::Window,
    url: String,
    method: String,
    headers: std::collections::HashMap<String, String>,
    body: String,
) -> Result<(), String> {
    let client = Client::new();
    
    let mut request_builder = match method.as_str() {
        "POST" => client.post(&url),
        "GET" => client.get(&url),
        _ => client.post(&url), // default
    };

    for (key, value) in headers {
        request_builder = request_builder.header(key, value);
    }

    if !body.is_empty() {
        request_builder = request_builder.body(body);
    }

    let response = request_builder
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Backend error {}: {}", status, error_text));
    }

    let mut stream = response.bytes_stream();

    while let Some(chunk_result) = stream.next().await {
        match chunk_result {
            Ok(chunk) => {
                let text = String::from_utf8_lossy(&chunk).to_string();
                if let Err(e) = window.emit("chat-stream-chunk", text) {
                    println!("Failed to emit chunk: {}", e);
                }
            }
            Err(e) => {
                return Err(format!("Stream error: {}", e));
            }
        }
    }
    
    let _ = window.emit("chat-stream-complete", ());
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(|app, shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    if shortcut.matches(Modifiers::ALT, Code::KeyL) {
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                }
            })
            .build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"])
        ))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            // Initialize SQLite
            let db = init_db(app.handle()).expect("Failed to initialize database");
            app.manage(AppState {
                db: Mutex::new(db),
            });

            // Register Alt+L shortcut
            #[cfg(desktop)]
            {
                app.handle().global_shortcut().register("Alt+L")?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_message_local,
            get_messages_local,
            stream_chat_request
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
