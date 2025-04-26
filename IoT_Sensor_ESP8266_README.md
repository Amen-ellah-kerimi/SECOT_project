# IoT Sensor ESP8266

This project implements an IoT sensor device using an ESP8266 NodeMCU that reads temperature and humidity data from a DHT11 sensor, displays it on an LCD screen, sounds an alarm with a buzzer when thresholds are exceeded, and publishes the data to an MQTT broker for visualization in the IoT Dashboard.

## Features

- Real-time temperature and humidity monitoring with DHT11 sensor
- 16x2 I2C LCD display for local readings
- Buzzer alarm for high temperature/humidity alerts
- MQTT communication with IoT Dashboard
- WiFi connectivity for remote monitoring
- JSON-formatted data for easy integration

## Hardware Requirements

- NodeMCU ESP8266 board
- DHT11 Temperature and Humidity Sensor
- 16x2 I2C LCD Display
- Active Buzzer
- Breadboard and jumper wires
- 10K resistor (for DHT11)

## Software Requirements

- Arduino IDE
- Required libraries (install via Arduino Library Manager):
  - ESP8266WiFi (comes with ESP8266 board package)
  - PubSubClient by Nick O'Leary
  - ArduinoJson by Benoit Blanchon
  - DHT sensor library by Adafruit
  - Wire (built-in)
  - LiquidCrystal_I2C by Frank de Brabander

## Setup Instructions

1. Install the Arduino IDE and required libraries
2. Connect the hardware according to the wiring diagram in `IoT_Sensor_ESP8266_Wiring.md`
3. Open the `IoT_Sensor_ESP8266.ino` file in Arduino IDE
4. Update the following configuration in the code:
   ```cpp
   // WiFi Configuration - Already configured with your networks
   const char *wifiList[][2] = {
     { "gnet2021", "71237274" },
     { "TOPNET_3BD8", "n8rajeb8yy" }
   };

   // MQTT Configuration
   const char* mqtt_server = "192.168.1.100";  // Change to your MQTT broker IP
   ```
5. Select the correct board (NodeMCU 1.0) and port in Arduino IDE
6. Upload the code to your ESP8266

## MQTT Topics

The device publishes to the following MQTT topics:

- `sensors/temperature` - Temperature readings in JSON format
- `sensors/humidity` - Humidity readings in JSON format
- `sensors/status` - Device status information

## Data Format

Temperature data format:
```json
{
  "value": 25.5,
  "timestamp": 123456789,
  "unit": "C"
}
```

Humidity data format:
```json
{
  "value": 45.2,
  "timestamp": 123456789,
  "unit": "%"
}
```

Status data format:
```json
{
  "status": "online",
  "ip": "192.168.1.105",
  "rssi": -65
}
```

## Alarm Thresholds

The device will sound an alarm and blink the LCD backlight when:
- Temperature exceeds 30°C
- Humidity exceeds 70%

You can adjust these thresholds in the code:
```cpp
const float TEMP_HIGH_THRESHOLD = 30.0;  // Celsius
const float HUMIDITY_HIGH_THRESHOLD = 70.0;  // Percentage
```

## Troubleshooting

- **LCD not displaying**: Check I2C address (try 0x3F if 0x27 doesn't work)
- **DHT11 reading errors**: Check wiring and pull-up resistor
- **MQTT connection issues**: Verify broker IP and credentials
- **WiFi connection problems**: Check SSID and password

## Integration with IoT Dashboard

This sensor is designed to work with the IoT Dashboard web interface. The data published to the MQTT broker will be automatically displayed in the dashboard if it's configured to subscribe to the same topics.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
