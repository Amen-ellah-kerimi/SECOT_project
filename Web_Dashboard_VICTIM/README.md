# IoT Sensor Dashboard

A real-time monitoring platform designed to visualize and display sensor data collected from IoT devices. The dashboard provides a clear and interactive interface for users to view data such as temperature, humidity, and other relevant sensor readings, collected from IoT devices publishing to an MQTT broker.

## Project Structure

- **Frontend**: React application with Tailwind CSS for styling and Recharts for data visualization
- **Backend**: Rust API using Actix Web that connects to MQTT broker and serves data via WebSockets
- **Tools**: Utility scripts for testing and simulation

## Features

- Real-time sensor data visualization
- Dynamic charts for temperature and humidity
- Support for both direct MQTT connection and WebSocket connection via backend
- Responsive design that works on desktop and mobile devices

## Prerequisites

- Node.js (v14+)
- Rust (latest stable)
- MQTT Broker (e.g., Mosquitto)
- Python 3.6+ (for simulation tools)

## Setup Instructions

### MQTT Broker

1. Install Mosquitto MQTT broker:
   - Windows: Download from https://mosquitto.org/download/
   - Linux: `sudo apt install mosquitto mosquitto-clients`
   - macOS: `brew install mosquitto`

2. Start the MQTT broker:
   ```
   mosquitto -v
   ```

### Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. The frontend will be available at http://localhost:5173

### Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Build and run the Rust backend:
   ```
   cargo run
   ```

3. The backend will start at http://localhost:8080

### Simulation Tool

To simulate IoT devices sending data to the MQTT broker:

1. Install the required Python package:
   ```
   pip install paho-mqtt
   ```

2. Run the MQTT publisher script:
   ```
   python tools/mqtt_publisher.py
   ```

## Usage

1. Open the dashboard in your browser at http://localhost:5173
2. By default, the dashboard will use simulated data
3. Click the "Using Simulation" button to switch to MQTT mode (requires MQTT broker)
4. The dashboard will display real-time temperature and humidity data

## Architecture

- The frontend connects directly to the MQTT broker via WebSockets when in MQTT mode
- The frontend also connects to the Rust backend via WebSockets for additional data processing
- The Rust backend subscribes to the MQTT broker and forwards messages to connected clients

## License

MIT
