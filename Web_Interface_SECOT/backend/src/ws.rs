use std::sync::Arc;
use std::time::Duration;
use axum::{
    extract::{State, WebSocketUpgrade},
    response::IntoResponse,
};
use tokio::sync::{Mutex, mpsc};
use tokio::time::interval;
use serde_json::json;
use futures_util::{stream::StreamExt, sink::SinkExt};

use crate::models::AppState;

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<Mutex<AppState>>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(
    socket: axum::extract::ws::WebSocket,
    state: Arc<Mutex<AppState>>,
) {
    let (mut sender, mut receiver) = socket.split();

    // Create a channel for sending status updates
    let (tx, mut rx) = mpsc::channel(100);

    // Spawn a task to send status updates every second
    let state_clone = state.clone();
    let update_task = tokio::spawn(async move {
        let mut interval = interval(Duration::from_secs(1));

        loop {
            interval.tick().await;

            // Get current state
            let current_state = state_clone.lock().await.get_status();

            // Serialize to JSON
            let json = json!({
                "type": "status_update",
                "data": current_state
            });

            // Send update
            if tx.send(json.to_string()).await.is_err() {
                break;
            }
        }
    });

    // Task to forward messages from the channel to the WebSocket
    let forward_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if let Err(e) = sender.send(axum::extract::ws::Message::Text(msg)).await {
                tracing::error!("Error sending WebSocket message: {}", e);
                break;
            }
        }
    });

    // Wait for the receiver to close or any error
    while let Some(result) = receiver.next().await {
        match result {
            Ok(axum::extract::ws::Message::Close(_)) => break,
            Err(e) => {
                tracing::error!("WebSocket error: {}", e);
                break;
            }
            _ => {}
        }
    }

    // Clean up tasks
    update_task.abort();
    forward_task.abort();
}
