use serde::{Deserialize, Serialize};

use crate::scraper::{self, PageContent};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Settings {
    pub backend_url: String,
    pub local_llm_url: String,
    pub theme: String,
    pub auto_summarize: bool,
    pub language: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            backend_url: "http://localhost:8000".to_string(),
            local_llm_url: "http://localhost:1234".to_string(),
            theme: "system".to_string(),
            auto_summarize: true,
            language: "en".to_string(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SummaryResponse {
    pub summary: String,
    pub key_points: Vec<String>,
    pub sentiment: Option<String>,
    pub topics: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub id: String,
    pub role: String,
    pub content: String,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthStatus {
    pub status: String,
    pub version: String,
    pub llm_status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProductAlternative {
    pub name: String,
    pub price: Option<f64>,
    pub currency: String,
    pub url: String,
    pub image: Option<String>,
    pub rating: Option<f64>,
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ComparisonResponse {
    pub alternatives: Vec<ProductAlternative>,
    pub verdict: String,
}

// Fetch and extract content from a URL
#[tauri::command]
pub async fn fetch_url_content(url: String) -> Result<PageContent, String> {
    scraper::fetch_and_extract(&url)
        .await
        .map_err(|e| e.to_string())
}

// Extract page information from HTML content
#[tauri::command]
pub async fn extract_page_info(html: String, url: String) -> Result<PageContent, String> {
    Ok(scraper::extract_from_html(&html, &url))
}

// Summarize content using the backend API
#[tauri::command]
pub async fn summarize_content(
    content: PageContent,
    backend_url: String,
) -> Result<SummaryResponse, String> {
    let client = reqwest::Client::new();
    
    let response = client
        .post(format!("{}/api/summarize", backend_url))
        .json(&serde_json::json!({
            "content": {
                "url": content.url,
                "title": content.title,
                "description": content.description,
                "text": content.text,
                "page_type": format!("{:?}", content.page_type).to_lowercase(),
            }
        }))
        .send()
        .await
        .map_err(|e| format!("Failed to connect to backend: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Backend returned error: {}", response.status()));
    }

    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let summary_data = data.get("data").ok_or("No data in response")?;

    Ok(SummaryResponse {
        summary: summary_data
            .get("summary")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        key_points: summary_data
            .get("key_points")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_default(),
        sentiment: summary_data
            .get("sentiment")
            .and_then(|v| v.as_str())
            .map(String::from),
        topics: summary_data.get("topics").and_then(|v| v.as_array()).map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        }),
    })
}

// Compare products using the backend API
#[tauri::command]
pub async fn compare_products(
    url: String,
    content: PageContent,
    backend_url: String,
) -> Result<ComparisonResponse, String> {
    let client = reqwest::Client::new();

    let response = client
        .post(format!("{}/api/compare", backend_url))
        .json(&serde_json::json!({
            "url": url,
            "content": {
                "url": content.url,
                "title": content.title,
                "description": content.description,
                "text": content.text,
                "page_type": format!("{:?}", content.page_type).to_lowercase(),
                "product": content.product,
            }
        }))
        .send()
        .await
        .map_err(|e| format!("Failed to connect to backend: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Backend returned error: {}", response.status()));
    }

    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let comparison_data = data.get("data").ok_or("No data in response")?;

    Ok(ComparisonResponse {
        alternatives: comparison_data
            .get("alternatives")
            .and_then(|v| serde_json::from_value(v.clone()).ok())
            .unwrap_or_default(),
        verdict: comparison_data
            .get("verdict")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
    })
}

// Chat with AI using the backend API
#[tauri::command]
pub async fn chat_with_ai(
    messages: Vec<ChatMessage>,
    context: PageContent,
    backend_url: String,
) -> Result<ChatMessage, String> {
    let client = reqwest::Client::new();

    // Format messages with all required fields
    let formatted_messages: Vec<serde_json::Value> = messages
        .iter()
        .map(|m| {
            serde_json::json!({
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "timestamp": m.timestamp
            })
        })
        .collect();

    let response = client
        .post(format!("{}/api/chat", backend_url))
        .json(&serde_json::json!({
            "messages": formatted_messages,
            "context": {
                "url": context.url,
                "title": context.title,
                "description": context.description,
                "text": context.text,
                "page_type": format!("{:?}", context.page_type).to_lowercase(),
            }
        }))
        .send()
        .await
        .map_err(|e| format!("Failed to connect to backend: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Backend returned error: {}", response.status()));
    }

    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let message_data = data
        .get("data")
        .and_then(|d| d.get("message"))
        .ok_or("No message in response")?;

    Ok(ChatMessage {
        id: message_data
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        role: "assistant".to_string(),
        content: message_data
            .get("content")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        timestamp: message_data
            .get("timestamp")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
    })
}

// Check backend health
#[tauri::command]
pub async fn check_backend_health(backend_url: String) -> Result<HealthStatus, String> {
    let client = reqwest::Client::new();

    let response = client
        .get(format!("{}/health", backend_url))
        .send()
        .await
        .map_err(|e| format!("Failed to connect to backend: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Backend returned error: {}", response.status()));
    }

    let data: HealthStatus = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(data)
}

// Get settings
#[tauri::command]
pub fn get_settings() -> Settings {
    Settings::default()
}

// Save settings
#[tauri::command]
pub fn save_settings(settings: Settings) -> Result<Settings, String> {
    // In a real app, you would persist these settings
    Ok(settings)
}
