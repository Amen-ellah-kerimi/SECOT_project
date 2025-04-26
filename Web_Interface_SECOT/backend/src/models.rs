use std::collections::HashMap;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InterceptedMessage {
    pub timestamp: DateTime<Utc>,
    pub source: String,
    pub destination: String,
    pub protocol: String,
    pub data: String,
    pub size: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestResult {
    pub timestamp: DateTime<Utc>,
    pub type_: String,
    pub status: String,
    pub details: String,
    pub packet_rate: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub timestamp: DateTime<Utc>,
    pub level: String,
    pub message: String,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Command {
    pub device: String,
    pub action: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct StatusResponse {
    pub mqtt_connected: bool,
    pub intercepted_messages_count: usize,
    pub test_results: HashMap<String, TestResult>,
    pub latest_logs: Vec<LogEntry>,
}

pub struct AppState {
    pub mqtt_connected: bool,
    pub intercepted_messages: Vec<InterceptedMessage>,
    pub test_results: HashMap<String, TestResult>,
    pub logs: Vec<LogEntry>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            mqtt_connected: false,
            intercepted_messages: Vec::new(),
            test_results: HashMap::new(),
            logs: Vec::new(),
        }
    }

    pub fn add_intercepted_message(&mut self, message: InterceptedMessage) {
        // Keep only the last 100 messages
        if self.intercepted_messages.len() >= 100 {
            self.intercepted_messages.remove(0);
        }
        self.intercepted_messages.push(message);
    }

    pub fn add_test_result(&mut self, result: TestResult) {
        self.test_results.insert(result.type_.clone(), result);
    }

    pub fn add_log(&mut self, log: LogEntry) {
        // Keep only the last 100 logs
        if self.logs.len() >= 100 {
            self.logs.remove(0);
        }
        self.logs.push(log);
    }

    pub fn get_status(&self) -> StatusResponse {
        StatusResponse {
            mqtt_connected: self.mqtt_connected,
            intercepted_messages_count: self.intercepted_messages.len(),
            test_results: self.test_results.clone(),
            latest_logs: self.logs.iter().rev().take(10).cloned().collect(),
        }
    }
}
