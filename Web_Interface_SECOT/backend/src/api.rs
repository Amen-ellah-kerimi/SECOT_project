use std::sync::Arc;
use axum::{
    extract::{State, Json},
    http::StatusCode,
    response::IntoResponse,
};
use tokio::sync::Mutex;
use serde_json::json;

use crate::models::{AppState, Command};
use crate::mqtt::MqttClient;

pub async fn get_status(
    State(state): State<Arc<Mutex<AppState>>>,
) -> impl IntoResponse {
    let state = state.lock().await;
    let status = state.get_status();

    (StatusCode::OK, Json(status))
}

pub async fn send_command(
    State(state): State<Arc<Mutex<AppState>>>,
    Json(command): Json<Command>,
) -> impl IntoResponse {
    // Validate command
    if command.device.is_empty() || command.action.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "Device and action are required"
            })),
        );
    }

    // Create MQTT client
    let mqtt_client = MqttClient::new(state);

    // Publish command
    match mqtt_client.publish_command(command).await {
        Ok(_) => (
            StatusCode::OK,
            Json(json!({
                "status": "success",
                "message": "Command sent successfully"
            })),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "error": format!("Failed to send command: {}", e)
            })),
        ),
    }
}
