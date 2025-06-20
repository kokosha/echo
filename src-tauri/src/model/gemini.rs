use crate::model::{LlMResponse, Message};
use reqwest::Client;
use serde::Serialize;

// Define available Gemini models
const AVAILABLE_MODELS: [&str; 4] = [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
];

#[derive(Serialize)]
struct GeminiPart {
    text: String,
}

#[derive(Serialize)]
struct GeminiContent {
    role: String,
    parts: Vec<GeminiPart>,
}

#[derive(Serialize)]
struct GeminiGenerationConfig {
    #[serde(rename = "maxOutputTokens")]
    max_output_tokens: u32,
}

#[derive(Serialize)]
struct GeminiRequest<'a> {
    contents: &'a [GeminiContent],
    #[serde(rename = "generationConfig")]
    generation_config: GeminiGenerationConfig,
}

/// Validates the input for the Gemini API call.
fn is_valid_input(api_key: &str, messages: &Vec<Message>) -> Result<(), String> {
    if api_key.trim().is_empty() {
        return Err("API key cannot be empty.".to_string());
    }
    if messages.is_empty() {
        return Err("Messages cannot be empty.".to_string());
    }
    Ok(())
}

// Tauri command to call the Gemini API
#[tauri::command]
pub(crate) async fn call_gemini_api(
    api_key: String,
    messages: Vec<Message>,
    model: Option<String>,
) -> Result<LlMResponse, String> {
    is_valid_input(&api_key, &messages)?;

    let client = Client::new();

    let selected_model = model
        .filter(|m| AVAILABLE_MODELS.contains(&m.as_str()))
        .unwrap_or_else(|| "gemini-1.5-flash-latest".to_string());

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        selected_model, api_key
    );

    // Convert the generic Message vector into the Gemini-specific format
    let contents: Vec<GeminiContent> = messages
        .into_iter()
        .map(|message| {
            GeminiContent {
                // Gemini uses model for the assistant role
                role: if message.role == "assistant" {
                    "model".to_string()
                } else {
                    message.role
                },
                parts: vec![GeminiPart {
                    text: message.content,
                }],
            }
        })
        .collect();
    let max_output_tokens: u32 = 16384;
    let body = GeminiRequest {
        contents: &contents,
        generation_config: GeminiGenerationConfig { max_output_tokens },
    };

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await;

    match response {
        Ok(response) => {
            if response.status().is_success() {
                let json_response: serde_json::Value =
                    response.json().await.map_err(|e| e.to_string())?;

                // Safely navigate the Gemini response structure
                let content = json_response["candidates"][0]["content"]["parts"][0]["text"]
                    .as_str()
                    .unwrap_or("No content received from Gemini.")
                    .to_string();

                Ok(LlMResponse {
                    provider: "Gemini".to_string(),
                    content,
                    error: None,
                })
            } else {
                let status = response.status();
                let text = response
                    .text()
                    .await
                    .unwrap_or_else(|_| "Failed to read error response.".to_string());
                Err(format!("Gemini API Error ({}): {}", status, text))
            }
        }
        Err(e) => Err(format!("Gemini API Request Failed: {}", e)),
    }
}
