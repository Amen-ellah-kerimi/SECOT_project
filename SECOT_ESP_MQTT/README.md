# SECOT ESP Security Tool with MQTT

This project implements a security testing tool for ESP8266 that communicates with a backend web interface via MQTT. The tool can perform various network attacks and security tests, and it includes deliberately vulnerable code for educational purposes.

## Features

- MQTT communication with backend
- Network scanning
- Deauthentication attacks
- DoS attacks
- MITM attacks
- ARP spoofing
- MQTT packet interception and modification
- Deliberately vulnerable code for educational purposes

## Hardware Requirements

- ESP8266 NodeMCU or compatible board
- USB cable for programming and power

## Software Requirements

- Arduino IDE
- Required libraries (install via Arduino Library Manager):
  - ESP8266WiFi (comes with ESP8266 board package)
  - PubSubClient by Nick O'Leary
  - ArduinoJson by Benoit Blanchon
  - DNSServer (comes with ESP8266 board package)

## Setup Instructions

1. Install the Arduino IDE and required libraries
2. Open the `SECOT_ESP_MQTT.ino` file in Arduino IDE
3. Update the MQTT broker IP address in the code:
   ```cpp
   const char* mqtt_server = "192.168.1.16";  // Change to your MQTT broker IP
   ```
4. Select the correct board (NodeMCU 1.0) and port in Arduino IDE
5. Upload the code to your ESP8266

## MQTT Topics

The ESP8266 subscribes to:
- `secot/command` - Receives commands from the backend

The ESP8266 publishes to:
- `secot/audit/logs` - Log messages
- `secot/audit/results` - Test results
- `secot/audit/intercepted` - Intercepted network traffic

## Command Format

Commands are sent as JSON messages to the `secot/command` topic:

```json
{
  "action": "scan_network",
  "device": ""
}
```

```json
{
  "action": "deauth",
  "device": "AA:BB:CC:DD:EE:FF"
}
```

```json
{
  "action": "dos",
  "device": "AA:BB:CC:DD:EE:FF"
}
```

```json
{
  "action": "mitm",
  "device": "AA:BB:CC:DD:EE:FF"
}
```

```json
{
  "action": "arp_spoof_start",
  "device": "",
  "target_ip": "192.168.1.5",
  "gateway_ip": "192.168.1.1"
}
```

```json
{
  "action": "mqtt_intercept_start",
  "device": ""
}
```

```json
{
  "action": "inject_mqtt",
  "device": "",
  "topic": "sensors/temperature",
  "payload": "{\"value\": 99.9, \"timestamp\": \"12:00:00\"}"
}
```

## Implemented Vulnerabilities (For Educational Purposes)

This code contains several deliberately implemented vulnerabilities for educational purposes:

1. **Weak Authentication**
   - No authentication for MQTT communication
   - No encryption for MQTT communication

2. **Buffer Overflow**
   - Fixed-size buffer for MQTT messages
   - Potential buffer overflow if message exceeds buffer size

3. **Command Injection**
   - Unsanitized command execution
   - Special "system:" command prefix allows arbitrary command execution

4. **Memory Leak**
   - Periodic allocation of memory without freeing it
   - Can lead to device crash after extended operation

## Exploiting the Vulnerabilities

### Exploiting Weak Authentication
- Sniff MQTT traffic to capture commands
- Send unauthorized commands to the device

### Exploiting Buffer Overflow
- Send oversized MQTT messages to crash the device
- Craft special payloads to execute arbitrary code

### Exploiting Command Injection
- Send a command with the "system:" prefix
- Example: `{"action":"system:reboot","device":""}`

### Exploiting Memory Leak
- Keep the device running for extended periods
- Monitor for degraded performance or crashes

## Screenshots

![SECOT ESP Hardware Setup]
<!-- Add your hardware setup screenshot here -->

![SECOT Dashboard Integration]
<!-- Add your dashboard integration screenshot here -->

![Security Attack Demonstration]
<!-- Add your attack demonstration screenshot here -->

## Disclaimer

This code is for educational purposes only. The vulnerabilities are deliberately implemented to demonstrate security concepts. Do not use this code in production environments or for malicious purposes.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
