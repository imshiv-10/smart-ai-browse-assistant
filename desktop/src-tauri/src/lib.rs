use tauri::Manager;

mod commands;
mod scraper;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::fetch_url_content,
            commands::extract_page_info,
            commands::summarize_content,
            commands::compare_products,
            commands::chat_with_ai,
            commands::check_backend_health,
            commands::get_settings,
            commands::save_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
