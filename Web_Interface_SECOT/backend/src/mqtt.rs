use chrono::Utc;
use rumqttc::{AsyncClient, MqttOptions, QoS};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;

use crate::models::{AppState, Command, InterceptedMessage, LogEntry, TestResult};

pub struct MqttClient {
    state: Arc<Mutex<AppState>>,
    client: Option<AsyncClient>,
}

impl MqttClient {
    pub fn new(state: Arc<Mutex<AppState>>) -> Self {
        Self {
            state,
            client: None,
        }
    }

    pub async fn start(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        // Configure MQTT connection options
        // Change this IP address to your ESP card's IP address when you get it
        // If your ESP card is running an MQTT broker, use its IP
        // If you're using an external MQTT broker, use that IP instead
        let mut mqtt_options = MqttOptions::new("secot-backend", "127.0.0.1", 1883);
        mqtt_options.set_keep_alive(Duration::from_secs(5));

        // Create MQTT client
        let (client, mut eventloop) = AsyncClient::new(mqtt_options.clone(), 10);
        self.client = Some(client.clone());

        // Update connection status
        {
            let mut state = self.state.lock().await;
            state.mqtt_connected = true;
        }

        // Subscribe to topics
        client
            .subscribe("secot/audit/intercepted", QoS::AtLeastOnce)
            .await?;
        client
            .subscribe("secot/audit/results", QoS::AtLeastOnce)
            .await?;
        client
            .subscribe("secot/audit/logs", QoS::AtLeastOnce)
            .await?;

        // Process incoming messages
        loop {
            match eventloop.poll().await {
                Ok(event) => {
                    if let rumqttc::Event::Incoming(rumqttc::Packet::Publish(publish)) = event {
                        let topic = publish.topic.clone();
                        let payload = String::from_utf8_lossy(&publish.payload).to_string();

                        match topic.as_str() {
                            "secot/audit/intercepted" => {
                                if let Ok(message) =
                                    serde_json::from_str::<InterceptedMessage>(&payload)
                                {
                                    let mut state = self.state.lock().await;
                                    state.add_intercepted_message(message);
                                } else {
                                    tracing::error!(
                                        "Failed to parse intercepted message: {}",
                                        payload
                                    );
                                }
                            }
                            "secot/audit/results" => {
                                if let Ok(result) = serde_json::from_str::<TestResult>(&payload) {
                                    let mut state = self.state.lock().await;
                                    state.add_test_result(result);
                                } else {
                                    tracing::error!("Failed to parse test result: {}", payload);
                                }
                            }
                            "secot/audit/logs" => {
                                if let Ok(log) = serde_json::from_str::<LogEntry>(&payload) {
                                    let mut state = self.state.lock().await;
                                    state.add_log(log);
                                } else {
                                    tracing::error!("Failed to parse log entry: {}", payload);
                                }
                            }
                            _ => {
                                tracing::debug!("Received message on unknown topic: {}", topic);
                            }
                        }
                    }
                }
                Err(e) => {
                    tracing::error!("MQTT connection error: {}", e);

                    // Update connection status
                    {
                        let mut state = self.state.lock().await;
                        state.mqtt_connected = false;
                    }

                    // Try to reconnect after a delay
                    tokio::time::sleep(Duration::from_secs(5)).await;

                    // Recreate client
                    let (new_client, new_eventloop) = AsyncClient::new(mqtt_options.clone(), 10);
                    self.client = Some(new_client.clone());
                    eventloop = new_eventloop;

                    // Resubscribe to topics
                    if let Err(e) = new_client
                        .subscribe("secot/audit/intercepted", QoS::AtLeastOnce)
                        .await
                    {
                        tracing::error!("Failed to resubscribe to intercepted topic: {}", e);
                    }
                    if let Err(e) = new_client
                        .subscribe("secot/audit/results", QoS::AtLeastOnce)
                        .await
                    {
                        tracing::error!("Failed to resubscribe to results topic: {}", e);
                    }
                    if let Err(e) = new_client
                        .subscribe("secot/audit/logs", QoS::AtLeastOnce)
                        .await
                    {
                        tracing::error!("Failed to resubscribe to logs topic: {}", e);
                    }

                    // Update connection status
                    {
                        let mut state = self.state.lock().await;
                        state.mqtt_connected = true;
                    }
                }
            }
        }
    }

    pub async fn publish_command(
        &self,
        command: Command,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(client) = &self.client {
            let payload = serde_json::to_string(&command)?;
            client
                .publish("secot/command", QoS::AtLeastOnce, false, payload)
                .await?;

            // Log the command
            let mut state = self.state.lock().await;
            state.add_log(LogEntry {
                timestamp: Utc::now(),
                level: "INFO".to_string(),
                message: format!(
                    "Command sent: {} for device {}",
                    command.action, command.device
                ),
                source: "backend".to_string(),
            });

            Ok(())
        } else {
            Err("MQTT client not initialized".into())
        }
    }
}
