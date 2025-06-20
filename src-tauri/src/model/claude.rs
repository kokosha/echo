use crate::model::{LlMResponse, Message};
use reqwest::Client;
use serde_json::json;

// Define available Claude models
const AVAILABLE_MODELS: [&str; 8] = [
    "claude-opus-4-20250514",
    "claude-sonnet-4-20250514",
    "claude-3-7-sonnet-20250219",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-5-sonnet-20240620",
    "claude-3-haiku-20240307",
    "claude-3-opus-20240229",
];

/// Validates the input for the Claude API call.
fn is_valid_input(api_key: &str, messages: &Vec<Message>) -> Result<(), String> {
    if api_key.trim().is_empty() {
        return Err("API key cannot be empty.".to_string());
    }
    if messages.is_empty() {
        return Err("Messages cannot be empty.".to_string());
    }
    Ok(())
}

// Tauri command to call the Claude API
#[tauri::command]
pub(crate) async fn call_claude_api(
    api_key: String,
    messages: Vec<Message>,
    model: Option<String>,
) -> Result<LlMResponse, String> {
    is_valid_input(&api_key, &messages)?;

    let client = Client::new();
    let url = "https://api.anthropic.com/v1/messages";

    let selected_model = model
        .filter(|m| AVAILABLE_MODELS.contains(&m.as_str()))
        .unwrap_or_else(|| "claude-3-5-haiku-20241022".to_string());

    // Construct the messages array for Claude API
    let max_tokens: u32 = 16384;
    let request_body = json!({
        "model": selected_model,
        "max_tokens": max_tokens,
        "messages": messages
    });

    let res = client
        .post(url)
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await;

    match res {
        Ok(response) => {
            if response.status().is_success() {
                let json_response: serde_json::Value =
                    response.json().await.map_err(|e| e.to_string())?;
                let content = json_response["content"][0]["text"]
                    .as_str()
                    .unwrap_or("No content")
                    .to_string();
                Ok(LlMResponse {
                    provider: "Claude".to_string(),
                    content,
                    error: None,
                })
            } else {
                let status = response.status();
                let text = response
                    .text()
                    .await
                    .unwrap_or_else(|_| "Failed to read response text".to_string());
                Err(format!("Claude API Error ({}): {}", status, text))
            }
        }
        Err(e) => Err(format!("Claude API Request Failed: {}", e)),
    }
}
