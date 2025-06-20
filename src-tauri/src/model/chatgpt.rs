use crate::model::{LlMResponse, Message};
use reqwest::Client;
use serde_json::json;

// Define available ChatGPT models
pub const AVAILABLE_MODELS: [&str; 13] = [
    // Flagship chat models
    "chatgpt-4o-latest",
    "gpt-4.1",
    "gpt-4o",
    // Cost-optimized models
    "gpt-4o-mini",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    // Reasoning models (o1, o3, o4 series)
    "o4-mini",
    "o3",
    "o3-mini",
    "o1-pro",
    "o1",
    "o1-preview",
    "o1-mini",
];

/// Determines if the provided model uses `max_completion_tokens` instead of `max_tokens`.
fn uses_max_completion_tokens(model: &str) -> bool {
    model
        .chars()
        .next()
        .unwrap_or_default()
        .eq_ignore_ascii_case(&'o')
}

fn is_valid_input(api_key: &String, messages: &Vec<Message>) -> Result<(), String> {
    // Validate api_key and messages
    if api_key.trim().is_empty() {
        return Err("API key cannot be empty.".to_string());
    }
    if messages.is_empty() {
        return Err("Messages cannot be empty.".to_string());
    }
    for message in messages {
        if message.content.trim().is_empty() {
            return Err(format!(
                "Message content for role '{}' cannot be empty.",
                message.role
            ));
        }
    }
    Ok(())
}

// Tauri command to call the ChatGPT API
#[tauri::command]
pub(crate) async fn call_chatgpt_api(
    api_key: String,
    messages: Vec<Message>,
    model: Option<String>,
) -> Result<LlMResponse, String> {
    is_valid_input(&api_key, &messages)?;

    let client = Client::new();
    let url = "https://api.openai.com/v1/chat/completions";

    // Validate and select model
    let selected_model = model
        .filter(|m| AVAILABLE_MODELS.contains(&m.as_str()))
        .unwrap_or_else(|| "gpt-4o-mini".to_string());

    let max_tokens: u32 = 16384;
    let mut request_body = json!({
        "model": selected_model,
        "messages": messages,
    });

    // Adjust the parameter name based on the model
    if uses_max_completion_tokens(&selected_model) {
        request_body["max_completion_tokens"] = json!(max_tokens);
    } else {
        request_body["max_tokens"] = json!(max_tokens);
    }

    let response = client
        .post(url)
        .bearer_auth(api_key.trim())
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await;

    match response {
        Ok(response) => {
            if response.status().is_success() {
                let json_response: serde_json::Value =
                    response.json().await.map_err(|e| e.to_string())?;
                // Parse ChatGPT response structure
                let content = json_response["choices"][0]["message"]["content"]
                    .as_str()
                    .unwrap_or("No content")
                    .to_string();
                Ok(LlMResponse {
                    provider: "ChatGPT".to_string(),
                    content,
                    error: None,
                })
            } else {
                let status = response.status();
                let text = response
                    .text()
                    .await
                    .unwrap_or_else(|_| "Failed to read response text".to_string());
                Err(format!("ChatGPT API Error ({}): {}", status, text))
            }
        }
        Err(error) => Err(format!("ChatGPT API Request Failed: {}", error)),
    }
}
