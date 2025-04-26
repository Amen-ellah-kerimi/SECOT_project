mod mqtt;
mod api;
mod models;
mod ws;

use std::sync::Arc;
use axum::{
    routing::{get, post},
    Router,
};
use tokio::sync::Mutex;

use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::mqtt::MqttClient;
use crate::models::AppState;
use crate::ws::ws_handler;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Create shared state
    let app_state = Arc::new(Mutex::new(AppState::new()));

    // Initialize MQTT client
    let mut mqtt_client = MqttClient::new(app_state.clone());
    let mqtt_handle = tokio::spawn(async move {
        if let Err(e) = mqtt_client.start().await {
            tracing::error!("MQTT client error: {}", e);
        }
    });

    // Build our application with routes
    let app = Router::new()
        .route("/status", get(api::get_status))
        .route("/command", post(api::send_command))
        .route("/ws", get(ws_handler))
        .with_state(app_state);

    // Run the server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8081").await.unwrap();
    tracing::info!("Listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();

    // Wait for MQTT client to finish
    mqtt_handle.await.unwrap();
}
