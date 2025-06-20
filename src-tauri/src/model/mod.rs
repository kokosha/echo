use dotenv::dotenv;
use serde::{Deserialize, Serialize};
use std::io::BufRead;

#[derive(Deserialize, Serialize)]
pub struct LlMResponse {
    pub provider: String,
    pub content: String,
    pub error: Option<String>,
}

#[derive(Deserialize, Serialize)]
pub struct Message {
    pub role: String,
    pub content: String,
}

pub(crate) mod chatgpt;
pub(crate) mod claude;
pub(crate) mod gemini;

#[derive(Debug, Deserialize, Serialize)]
pub struct Tokens {
    claude: String,
    gemini: String,
    chatgpt: String,
}

#[tauri::command]
pub(crate) async fn save_tokens(api_keys_json: Tokens) -> Result<String, String> {
    let env_path = std::path::Path::new(".env");
    if !env_path.exists() {
        std::fs::File::create(env_path).map_err(|e| e.to_string())?;
    }
    let env_content = std::fs::read_to_string(env_path).map_err(|e| e.to_string())?;
    let mut env_map: std::collections::HashMap<String, String> = env_content
        .lines()
        .filter_map(|line| {
            // Skip empty lines
            if line.trim().is_empty() {
                return None;
            }
            let mut parts = line.splitn(2, '=');
            if let (Some(k), Some(v)) = (parts.next(), parts.next()) {
                Some((k.trim().to_uppercase(), v.trim().to_string()))
            } else {
                None
            }
        })
        .collect();

    let tokens: Tokens = api_keys_json;

    let mut updates = std::collections::HashMap::new();
    updates.insert("CLAUDE", tokens.claude);
    updates.insert("GEMINI", tokens.gemini);
    updates.insert("CHATGPT", tokens.chatgpt);

    // Iterate and insert/update the values in env_map
    for (key, new_val) in updates.into_iter() {
        if !new_val.is_empty() {
            env_map.insert(key.to_string(), new_val);
        }
    }

    let final_content = env_map
        .into_iter()
        .map(|(k, v)| format!("{}={}", k, v))
        .collect::<Vec<_>>()
        .join("\n");
    std::fs::write(env_path, final_content).map_err(|e| e.to_string())?;

    Ok("Tokens added/updated successfully.".into())
}

#[tauri::command]
pub(crate) async fn get_tokens() -> Tokens {
    dotenv().ok();
    let chatgpt_token = std::env::var("CHATGPT").unwrap_or_default();
    let claude_token = std::env::var("CLAUDE").unwrap_or_default();
    let gemini_token = std::env::var("GEMINI").unwrap_or_default();

    Tokens {
        chatgpt: chatgpt_token,
        claude: claude_token,
        gemini: gemini_token,
    }
}

#[tauri::command]
pub(crate) async fn clear_tokens() -> Result<String, String> {
    let env_path = std::path::Path::new(".env");
    if !env_path.exists() {
        return Ok("No .env file, nothing to clear.".into());
    }

    // Read all lines, filtering out any of our three keys
    let f = std::fs::File::open(&env_path).map_err(|e| format!("Failed to open .env: {}", e))?;
    let reader = std::io::BufReader::new(f);

    let mut kept_lines = Vec::new();
    for line in reader.lines() {
        let line = line.map_err(|e| format!("Read error: {}", e))?;
        let is_token_line = if let Some((key, _)) = line.split_once('=') {
            matches!(
                key.trim().to_uppercase().as_str(),
                "CHATGPT" | "CLAUDE" | "GEMINI"
            )
        } else {
            false
        };
        if !is_token_line {
            kept_lines.push(line);
        }
    }

    // Write back everything except our three vars
    let out = kept_lines.join("\n");
    std::fs::write(&env_path, out).map_err(|e| format!("Failed to write .env: {}", e))?;

    // Remove the environment variable from the running process env
    unsafe {
        std::env::remove_var("CHATGPT");
        std::env::remove_var("CLAUDE");
        std::env::remove_var("GEMINI");
    }

    Ok("Tokens cleared successfully.".into())
}
