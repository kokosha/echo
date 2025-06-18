use serde::Serialize;
use sqlx::{Sqlite, SqlitePool, migrate::MigrateDatabase, sqlite::SqlitePoolOptions};
use tauri::{Runtime, State};
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow, Clone)]
pub(crate) struct Chat {
    id: i64,
    uuid: String,
    title: String,
    created_at: i64,
}

#[derive(Debug, Serialize, sqlx::FromRow, Clone)]
pub(crate) struct Message {
    id: i64,
    uuid: String,
    chat_id: i64,
    sender_id: Option<String>,
    provider: String,
    role: String,
    content: String,
    created_at: i64,
}

#[tauri::command]
pub(crate) async fn create_chat(
    db_pool: State<'_, SqlitePool>,
    title: String,
) -> Result<Chat, String> {
    let chat_uuid = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();

    let result = sqlx::query("INSERT INTO chats(uuid, title, created_at) VALUES (?, ?, ?)")
        .bind(&chat_uuid)
        .bind(&title)
        .bind(now)
        .execute(&*db_pool)
        .await
        .map_err(|e| e.to_string())?;

    let chat_id = result.last_insert_rowid();

    let new_chat = sqlx::query_as::<_, Chat>("SELECT * FROM chats WHERE id = ?")
        .bind(&chat_id)
        .fetch_one(&*db_pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(new_chat)
}

#[tauri::command]
pub(crate) async fn list_chats(db_pool: State<'_, SqlitePool>) -> Result<Vec<Chat>, String> {
    let chats = sqlx::query_as::<_, Chat>(
        "SELECT id, uuid, title, created_at FROM chats ORDER BY created_at DESC",
    )
    .fetch_all(&*db_pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(chats)
}

#[tauri::command]
pub(crate) async fn delete_chat(
    db_pool: State<'_, SqlitePool>,
    chat_id: i64,
) -> Result<(), String> {
    sqlx::query("DELETE FROM chats WHERE id = ?")
        .bind(&chat_id)
        .execute(&*db_pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub(crate) async fn clear_chat(db_pool: State<'_, SqlitePool>, chat_id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM messages WHERE chat_id = ?")
        .bind(chat_id)
        .execute(&*db_pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub(crate) async fn create_message(
    db_pool: State<'_, SqlitePool>,
    chat_id: i64,
    sender_id: Option<String>,
    provider: String,
    role: String,
    content: String,
) -> Result<Message, String> {
    let message_uuid = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    let result = sqlx::query(
        r#"INSERT INTO messages(uuid, chat_id, sender_id, provider, role, content, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)"#,
    )
    .bind(&message_uuid)
    .bind(chat_id)
    .bind(&sender_id)
    .bind(&provider)
    .bind(&role)
    .bind(&content)
    .bind(now)
    .execute(&*db_pool)
    .await
    .map_err(|e| e.to_string())?;

    let message_id = result.last_insert_rowid();

    let new_message = sqlx::query_as::<_, Message>("SELECT * FROM messages WHERE id = ?")
        .bind(message_id)
        .fetch_one(&*db_pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(new_message)
}

#[tauri::command]
pub(crate) async fn list_messages(
    db_pool: State<'_, SqlitePool>,
    chat_id: i64,
) -> Result<Vec<Message>, String> {
    let messages = sqlx::query_as::<_, Message>(
        r#"SELECT id, uuid, chat_id, sender_id, provider, role, content, created_at
           FROM messages WHERE chat_id = ? ORDER BY created_at ASC"#,
    )
    .bind(chat_id)
    .fetch_all(&*db_pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(messages)
}

pub(crate) async fn db_setup<R: Runtime>(
    _app: &tauri::AppHandle<R>,
) -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let db_url = "sqlite:database.db";

    if !Sqlite::database_exists(db_url).await.unwrap_or(false) {
        Sqlite::create_database(db_url).await?;
    }

    let db_pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(db_url)
        .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            uuid TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );",
    )
    .execute(&db_pool)
    .await?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            uuid TEXT NOT NULL UNIQUE,
            chat_id INTEGER NOT NULL,
            sender_id TEXT,
            provider TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        );",
    )
    .execute(&db_pool)
    .await?;

    Ok(db_pool)
}
