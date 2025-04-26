# SECOT - Security & IoT Project

## Project Overview

SECOT is a comprehensive security and IoT project that demonstrates both security vulnerabilities and IoT functionality using ESP8266 microcontrollers. The project consists of two main components:

1. **SECOT ESP Security Tool**: A security testing device that can perform various network attacks and security tests
2. **IoT Sensor System**: A temperature and humidity monitoring system with LCD display and alarm functionality

Both components communicate with a central web interface through MQTT, allowing for remote monitoring and control.

![Project Overview Screenshot]
<!-- Add your project overview screenshot here -->

## Components

### 1. SECOT ESP Security Tool

The security tool is designed to demonstrate common network vulnerabilities and attack vectors:

- WiFi network scanning
- Deauthentication attacks
- DoS (Denial of Service) attacks
- MITM (Man in the Middle) attacks
- ARP spoofing
- MQTT packet interception and modification

![SECOT ESP Security Tool]
<!-- Add your SECOT ESP device screenshot here -->

### 2. IoT Sensor System

The IoT sensor system monitors environmental conditions and provides both local and remote feedback:

- Temperature and humidity monitoring with DHT11 sensor
- Real-time display on 16x2 LCD screen
- Buzzer alarm for threshold alerts
- MQTT communication with the dashboard

![IoT Sensor System]
<!-- Add your IoT Sensor device screenshot here -->

### 3. Web Interfaces

The project includes two web interfaces:

- **SECOT Dashboard**: For security monitoring and control
- **IoT Sensor Dashboard**: For visualizing sensor data

![SECOT Dashboard]
<!-- Add your SECOT dashboard screenshot here -->

![IoT Dashboard]
<!-- Add your IoT dashboard screenshot here -->

## Hardware Requirements

### SECOT ESP Security Tool
- NodeMCU ESP8266 board
- USB cable for power and programming

### IoT Sensor System
- NodeMCU ESP8266 board
- DHT11 temperature and humidity sensor
- 16x2 I2C LCD display
- Active buzzer
- 10K ohm resistor (pull-up for DHT11)
- Breadboard and jumper wires

## Software Requirements

- Arduino IDE (or PlatformIO)
- Required libraries:
  - ESP8266WiFi
  - PubSubClient
  - ArduinoJson
  - DHT sensor library
  - LiquidCrystal_I2C
  - Wire
- Mosquitto MQTT broker
- Web browsers for the dashboards

## Setup Instructions

See the README files in each component's directory for detailed setup instructions:

- [SECOT ESP Security Tool Setup](./SECOT_ESP_MQTT/README.md)
- [IoT Sensor System Setup](./IoT_Sensor_ESP8266/README.md)

### MQTT Broker Setup

1. Install Mosquitto MQTT broker on your computer
2. Configure Mosquitto to accept external connections
3. Note your computer's IP address (used in both ESP devices)

![MQTT Broker Setup]
<!-- Add your MQTT broker setup screenshot here -->

### Web Dashboards Setup

1. Navigate to the respective web interface directories
2. Install dependencies with `npm install`
3. Start the development servers with `npm run dev`
4. Access the dashboards in your web browser

## Security Vulnerabilities Demonstrated

The SECOT ESP Security Tool demonstrates several common security vulnerabilities:

1. **Weak Authentication**: Hardcoded MQTT credentials
2. **Buffer Overflow**: Fixed-size buffer for MQTT messages
3. **Command Injection**: Unsanitized command execution
4. **ARP Spoofing**: Network traffic redirection
5. **MQTT Packet Manipulation**: Intercepting and modifying IoT data

![Security Demonstration]
<!-- Add your security demonstration screenshot here -->

## IoT Functionality Demonstrated

The IoT Sensor System demonstrates several IoT concepts:

1. **Sensor Integration**: Reading environmental data
2. **Local Feedback**: LCD display and buzzer alerts
3. **Remote Monitoring**: MQTT communication with dashboard
4. **Threshold Alerts**: Triggering alarms when values exceed thresholds
5. **Data Visualization**: Real-time graphs on the dashboard

![IoT Functionality]
<!-- Add your IoT functionality demonstration screenshot here -->

## Project Structure

This repository contains the following components:

- **[SECOT_ESP_MQTT](./SECOT_ESP_MQTT/)**: Security testing tool firmware and documentation
- **[IoT_Sensor_ESP8266](./IoT_Sensor_ESP8266/)**: IoT sensor firmware and documentation
- **Web_Interface_SECOT**: Security dashboard (React frontend, Rust backend)
- **Web_Dashboard_VICTIM**: IoT dashboard (React frontend, Rust backend)

## MQTT Topics

### Security Tool Topics
- `secot/command` - Commands to the security tool
- `secot/audit/logs` - Log messages
- `secot/audit/results` - Test results
- `secot/audit/intercepted` - Intercepted network traffic

### IoT Sensor Topics
- `sensors/temperature` - Temperature readings
- `sensors/humidity` - Humidity readings
- `sensors/status` - Device status information

## Future Improvements

- Add more sensors (light, motion, etc.)
- Implement secure MQTT with TLS
- Add user authentication to web dashboards
- Create mobile app for remote monitoring
- Implement machine learning for anomaly detection

## Troubleshooting

### Common Issues with DHT11 Sensor
- **"Failed to read from DHT sensor"**: Ensure the 10K pull-up resistor is connected between data and VCC
- **Inconsistent readings**: Add delay before reading the sensor
- **No display on LCD**: Check I2C address (try 0x3F if 0x27 doesn't work)

### MQTT Connection Issues
- Verify the MQTT broker IP address in the code
- Ensure the MQTT broker is configured to accept external connections
- Check that the required ports are open in your firewall

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- ESP8266 community for their excellent libraries
- Mosquitto MQTT broker team
- Arduino and PlatformIO development teams
- All open-source contributors to the libraries used in this project
