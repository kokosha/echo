// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod chat;
mod model;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Get a handle to the app to use in the async block.
            let handle = app.handle().clone();

            // The 'setup' hook is synchronous, so we use 'block_on' from Tauri
            // async runtime to execute the async database setup and wait for it to finish.
            let db_pool =
                tauri::async_runtime::block_on(async move { chat::db_setup(&handle).await })
                    .expect("Failed to setup database");

            // Add the database pool to Tauri managed state here, inside the setup hook.
            app.manage(db_pool);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            model::chatgpt::call_chatgpt_api,
            model::claude::call_claude_api,
            model::gemini::call_gemini_api,
            model::save_tokens,
            model::get_tokens,
            model::clear_tokens,
            chat::create_chat,
            chat::delete_chat,
            chat::clear_chat,
            chat::list_chats,
            chat::create_message,
            chat::list_messages,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
