use diesel::pg::PgConnection;
use diesel::r2d2::{self, ConnectionManager};
use diesel::prelude::*;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use dotenv::dotenv;
use std::env;
use log::{info, error};

use crate::models::{NewSensorData, SensorData};
use crate::models::sensor_data::dsl::*;

// Define the migrations
pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");

// Type alias for the database connection pool
pub type DbPool = r2d2::Pool<ConnectionManager<PgConnection>>;

// Initialize the database connection pool
pub fn init_pool() -> DbPool {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    r2d2::Pool::builder()
        .build(manager)
        .expect("Failed to create database connection pool")
}

// Run database migrations
pub fn run_migrations(conn: &mut PgConnection) {
    match conn.run_pending_migrations(MIGRATIONS) {
        Ok(_) => info!("Migrations executed successfully"),
        Err(e) => error!("Error running migrations: {:?}", e),
    }
}

// Save sensor data to the database
pub fn save_sensor_data(conn: &mut PgConnection, new_data: NewSensorData) -> QueryResult<SensorData> {
    diesel::insert_into(sensor_data)
        .values(&new_data)
        .get_result(conn)
}

// Get the latest sensor data for a specific sensor type
pub fn get_latest_sensor_data(conn: &mut PgConnection, sensor_type_filter: &str, limit_val: i64) -> QueryResult<Vec<SensorData>> {
    sensor_data
        .filter(sensor_type.eq(sensor_type_filter))
        .order(timestamp.desc())
        .limit(limit_val)
        .load::<SensorData>(conn)
}

// Get sensor data within a time range
pub fn get_sensor_data_by_time_range(
    conn: &mut PgConnection,
    sensor_type_filter: &str,
    start_time: chrono::DateTime<chrono::Utc>,
    end_time: chrono::DateTime<chrono::Utc>,
) -> QueryResult<Vec<SensorData>> {
    sensor_data
        .filter(sensor_type.eq(sensor_type_filter))
        .filter(timestamp.ge(start_time))
        .filter(timestamp.le(end_time))
        .order(timestamp.asc())
        .load::<SensorData>(conn)
}
