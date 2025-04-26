#!/bin/bash

# This script sets up the PostgreSQL database for the IoT Sensor Dashboard

# Database configuration
DB_NAME="iot_dashboard"
DB_USER="postgres"
DB_PASSWORD="postgres"

# Create the database
echo "Creating database $DB_NAME..."
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

# Create the schema
echo "Creating schema..."
psql -U $DB_USER -d $DB_NAME -c "
CREATE TABLE sensor_data (
    id SERIAL PRIMARY KEY,
    sensor_type VARCHAR NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sensor_data_sensor_type ON sensor_data(sensor_type);
CREATE INDEX idx_sensor_data_timestamp ON sensor_data(timestamp);
"

echo "Database setup complete!"
