# SECOT Dashboard

A complete dashboard for Security Evaluation of Connected Objects and Things (SECOT).

## Project Structure

- `frontend/` - React + Tailwind CSS frontend application
- `backend/` - Rust + Axum backend application

## Features

- Real-time monitoring of audit data via MQTT/WebSockets
- Control panel for triggering security tests
- Visualization of test results and logs
- REST API for programmatic access to audit functionality

## Prerequisites

- Node.js (v16+)
- Rust (latest stable)
- MQTT Broker (e.g., Mosquitto)

## Setup

### MQTT Broker

1. Install Mosquitto MQTT broker:
   - Windows: Download from https://mosquitto.org/download/
   - Linux: `sudo apt install mosquitto mosquitto-clients`

2. Configure Mosquitto to allow WebSocket connections by adding these lines to `mosquitto.conf`:

```
listener 1883
allow_anonymous true

listener 9001
protocol websockets
allow_anonymous true
```

3. Start the Mosquitto broker:
   - Windows: Start the Mosquitto service
   - Linux: `sudo systemctl start mosquitto`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173

### Backend

```bash
cd backend
cargo run
```

The backend API will be available at http://localhost:8080

## Development

You can use the provided `run-dev.bat` script to start both the frontend and backend simultaneously:

```bash
./run-dev.bat
```

## API Endpoints

- `GET /status` - Get the current status of all audit tests
- `POST /command` - Send a command to the ESP device
- `GET /ws` - WebSocket endpoint for real-time updates

## MQTT Topics

### Subscribe

- `secot/audit/intercepted` - Intercepted messages from the network
- `secot/audit/results` - Test results from security audits
- `secot/audit/logs` - Log messages from the ESP device

### Publish

- `secot/command` - Commands to control the ESP device

## Command Format

```json
{
  "device": "esp32-01",
  "action": "start_dos"
}
```

Available actions:
- `start_dos` - Start denial of service test
- `stop_dos` - Stop denial of service test
- `start_mitm` - Start man-in-the-middle attack
- `stop_mitm` - Stop man-in-the-middle attack
- `trigger_deauth` - Send deauthentication packets
- `scan_network` - Scan for devices on the network
