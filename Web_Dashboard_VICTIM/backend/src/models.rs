use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use crate::schema::sensor_data;

// Model for sensor data
#[derive(Queryable, Serialize, Deserialize, Debug)]
pub struct SensorData {
    pub id: i32,
    pub sensor_type: String,
    pub value: f64,
    pub timestamp: DateTime<Utc>,
}

// Model for inserting new sensor data
#[derive(Insertable, Serialize, Deserialize, Debug)]
#[diesel(table_name = sensor_data)]
pub struct NewSensorData {
    pub sensor_type: String,
    pub value: f64,
    pub timestamp: DateTime<Utc>,
}

// Model for sensor data with MQTT format
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MqttSensorData {
    pub value: f64,
    pub timestamp: String,
}
