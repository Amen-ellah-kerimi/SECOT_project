# IoT Sensor ESP8266 Wiring Diagram

## Components Required

1. NodeMCU ESP8266 board
2. DHT11 Temperature and Humidity Sensor
3. 16x2 I2C LCD Display
4. Active Buzzer
5. Breadboard
6. Jumper wires
7. 10K resistor (for DHT11)

## Wiring Connections

### DHT11 Sensor
- VCC → 3.3V on ESP8266
- DATA → D4 on ESP8266
- GND → GND on ESP8266
- Connect a 10K resistor between VCC and DATA (pull-up resistor)

### I2C LCD Display
- VCC → 5V on ESP8266 (or 3.3V if your LCD supports it)
- GND → GND on ESP8266
- SDA → D2 on ESP8266
- SCL → D1 on ESP8266

### Buzzer
- Positive (+) → D8 on ESP8266
- Negative (-) → GND on ESP8266

## Pin Mapping Reference

| Component | ESP8266 Pin | Description |
|-----------|-------------|-------------|
| DHT11     | D4          | Data pin    |
| LCD SDA   | D2          | I2C Data    |
| LCD SCL   | D1          | I2C Clock   |
| Buzzer    | D8          | PWM Output  |

## Notes

1. If your LCD doesn't work with the I2C address 0x27, try 0x3F instead. You can modify this in the code.
2. Make sure to update the WiFi credentials and MQTT broker IP address in the code before uploading.
3. The buzzer will sound an alarm when temperature exceeds 30°C or humidity exceeds 70%. You can adjust these thresholds in the code.
4. The LCD backlight will blink when an alarm condition is detected.

## Troubleshooting

- If the LCD doesn't display anything, check the I2C address and wiring.
- If the DHT11 readings are incorrect, check the pull-up resistor and wiring.
- If MQTT connection fails, verify your broker IP address and credentials.
- If the buzzer doesn't sound, check the wiring and pin configuration.
