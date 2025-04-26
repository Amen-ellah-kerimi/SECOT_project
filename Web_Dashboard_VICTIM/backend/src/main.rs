use actix::prelude::*;
use actix_cors::Cors;
use actix_web::{web, App, Error, HttpRequest, HttpResponse, HttpServer, Responder};
use actix_web_actors::ws;
use chrono::Utc;
use diesel::r2d2::{self, ConnectionManager};
use diesel::PgConnection;
use dotenv::dotenv;
use log::{error, info};
use rumqttc::{AsyncClient, Event, Incoming, MqttOptions, QoS};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::env;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::sync::mpsc;

mod db;
mod models;
mod schema;

use db::{init_pool, run_migrations, save_sensor_data, get_latest_sensor_data};
use models::{MqttSensorData, NewSensorData};

// Constants
const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

// WebSocket session state
struct WsSession {
    id: usize,
    hb: Instant,
    tx: mpsc::UnboundedSender<String>,
}

impl Actor for WsSession {
    type Context = ws::WebsocketContext<Self>;

    // Start the heartbeat process on session start
    fn started(&mut self, ctx: &mut Self::Context) {
        self.hb(ctx);
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for WsSession {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Ping(msg)) => {
                self.hb = Instant::now();
                ctx.pong(&msg);
            }
            Ok(ws::Message::Pong(_)) => {
                self.hb = Instant::now();
            }
            Ok(ws::Message::Text(text)) => {
                info!("Received message: {}", text);
                // Echo the message back for now
                ctx.text(text);
            }
            Ok(ws::Message::Binary(bin)) => ctx.binary(bin),
            Ok(ws::Message::Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            }
            _ => ctx.stop(),
        }
    }
}

impl WsSession {
    fn new(tx: mpsc::UnboundedSender<String>) -> Self {
        Self {
            id: 0,
            hb: Instant::now(),
            tx,
        }
    }

    // Heartbeat to check for client connection status
    fn hb(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
                info!("Websocket Client heartbeat failed, disconnecting!");
                ctx.stop();
                return;
            }
            ctx.ping(b"");
        });
    }
}

// WebSocket route handler
async fn ws_route(req: HttpRequest, stream: web::Payload, tx: web::Data<mpsc::UnboundedSender<String>>) -> Result<HttpResponse, Error> {
    let resp = ws::start(WsSession::new(tx.get_ref().clone()), &req, stream);
    resp
}

// Health check endpoint
async fn health_check() -> impl Responder {
    HttpResponse::Ok().body("Healthy")
}

// Get latest sensor data endpoint
async fn get_sensor_data(
    db_pool: web::Data<db::DbPool>,
    path: web::Path<String>,
) -> Result<HttpResponse, Error> {
    let sensor_type = path.into_inner();
    let conn = &mut db_pool.get().expect("Failed to get DB connection from pool");
    
    match get_latest_sensor_data(conn, &sensor_type, 20) {
        Ok(data) => Ok(HttpResponse::Ok().json(data)),
        Err(e) => {
            error!("Database error: {:?}", e);
            Ok(HttpResponse::InternalServerError().json(json!({
                "error": "Failed to fetch sensor data"
            })))
        }
    }
}

// MQTT client setup and message handling
async fn setup_mqtt(
    tx: mpsc::UnboundedSender<String>,
    db_pool: db::DbPool,
) -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    
    // Get MQTT configuration from environment variables
    let mqtt_broker = env::var("MQTT_BROKER").unwrap_or_else(|_| "192.168.56.1".to_string());
    let mqtt_port = env::var("MQTT_PORT").unwrap_or_else(|_| "1883".to_string()).parse::<u16>().unwrap_or(1883);
    let mqtt_client_id = env::var("MQTT_CLIENT_ID").unwrap_or_else(|_| "rust-mqtt-client".to_string());
    
    // MQTT connection options
    let mut mqttoptions = MqttOptions::new(mqtt_client_id, mqtt_broker, mqtt_port);
    mqttoptions.set_keep_alive(Duration::from_secs(5));

    // Create MQTT client
    let (client, mut eventloop) = AsyncClient::new(mqttoptions, 10);

    // Subscribe to topics
    client.subscribe("sensors/temperature", QoS::AtMostOnce).await?;
    client.subscribe("sensors/humidity", QoS::AtMostOnce).await?;

    // Process MQTT events
    tokio::spawn(async move {
        loop {
            match eventloop.poll().await {
                Ok(Event::Incoming(Incoming::Publish(publish))) => {
                    let topic = publish.topic.clone();
                    let payload = String::from_utf8_lossy(&publish.payload).to_string();
                    info!("Received message on topic {}: {}", topic, payload);

                    // Parse the sensor type from the topic
                    let sensor_type = topic.split('/').nth(1).unwrap_or("unknown").to_string();
                    
                    // Parse the payload
                    match serde_json::from_str::<MqttSensorData>(&payload) {
                        Ok(sensor_data) => {
                            // Save to database
                            let conn = &mut db_pool.get().expect("Failed to get DB connection from pool");
                            let new_data = NewSensorData {
                                sensor_type: sensor_type.clone(),
                                value: sensor_data.value,
                                timestamp: Utc::now(),
                            };
                            
                            match save_sensor_data(conn, new_data) {
                                Ok(_) => info!("Saved sensor data to database"),
                                Err(e) => error!("Failed to save sensor data: {:?}", e),
                            }
                        },
                        Err(e) => error!("Failed to parse sensor data: {:?}", e),
                    }

                    // Forward message to WebSocket clients
                    if let Err(e) = tx.send(format!("{{\"topic\":\"{}\",\"payload\":{}}}", topic, payload)) {
                        error!("Error sending to WebSocket: {}", e);
                    }
                }
                Ok(_) => {}
                Err(e) => {
                    error!("MQTT Error: {:?}", e);
                    break;
                }
            }
        }
    });

    Ok(())
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables
    dotenv().ok();
    
    // Initialize logger
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    // Initialize database connection pool
    let pool = init_pool();
    
    // Run migrations
    {
        let conn = &mut pool.get().expect("Failed to get DB connection from pool");
        run_migrations(conn);
    }

    // Create channel for communication between MQTT and WebSocket
    let (tx, mut rx) = mpsc::unbounded_channel::<String>();
    let tx_data = web::Data::new(tx.clone());

    // Setup MQTT client
    match setup_mqtt(tx.clone(), pool.clone()).await {
        Ok(_) => info!("MQTT client setup successful"),
        Err(e) => error!("Failed to setup MQTT client: {:?}", e),
    }

    // Get server configuration from environment variables
    let server_host = env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let server_port = env::var("SERVER_PORT").unwrap_or_else(|_| "8081".to_string()).parse::<u16>().unwrap_or(8081);
    let server_addr = format!("{}:{}", server_host, server_port);
    
    // Start HTTP server
    info!("Starting HTTP server at http://{}", server_addr);
    HttpServer::new(move || {
        // Configure CORS
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .wrap(cors)
            .app_data(tx_data.clone())
            .app_data(web::Data::new(pool.clone()))
            .route("/ws", web::get().to(ws_route))
            .route("/health", web::get().to(health_check))
            .route("/api/sensor/{sensor_type}", web::get().to(get_sensor_data))
    })
    .bind(server_addr)?
    .run()
    .await
}
