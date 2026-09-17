pub mod project;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            project::open_workspace,
            project::list_workspace_entries,
            project::read_workspace_text,
            project::git_status,
            project::git_diff,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Daily Cockpit");
}
