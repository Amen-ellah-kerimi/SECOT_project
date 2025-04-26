/* ========================================================================== */
/*  IoT Sensor ESP8266 with DHT11, LCD and Buzzer                            */
/*  Features:                                                                 */
/*    - Reads temperature and humidity from DHT11 sensor                      */
/*    - Displays readings on I2C LCD screen                                   */
/*    - Sounds buzzer alarm when thresholds are exceeded                      */
/*    - Publishes data to MQTT broker for IoT Dashboard                       */
/* ========================================================================== */

//! =======================================================  !//
//!               LIBRARY IMPORTS CONFIGURATION              !//
//! =======================================================  !//
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

//! =======================================================  !//
//!               HARDWARE CONFIGURATION                      !//
//! =======================================================  !//
// DHT11 Sensor Configuration
#define DHTPIN D4       // DHT11 data pin
#define DHTTYPE DHT11   // DHT sensor type
DHT dht(DHTPIN, DHTTYPE);

// LCD Configuration (I2C)
// Set the LCD address to 0x27 for a 16 chars and 2 line display
// If 0x27 doesn't work, try 0x3F
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Buzzer Configuration
#define BUZZER_PIN D8

//! =======================================================  !//
//!               NETWORK CONFIGURATION                      !//
//! =======================================================  !//
// WiFi Configuration
const char *wifiList[][2] = {
  { "gnet2021", "71237274" },
  { "TOPNET_3BD8", "n8rajeb8yy" }
};

// MQTT Configuration
const char* mqtt_server = "192.168.1.16";  // Your computer's WiFi IP address
const int mqtt_port = 1883;
const char* mqtt_client_id = "ESP8266_Sensor";
const char* mqtt_username = ""; // Leave empty if not needed
const char* mqtt_password = ""; // Leave empty if not needed

// MQTT Topics
const char* topic_temperature = "sensors/temperature";
const char* topic_humidity = "sensors/humidity";
const char* topic_status = "sensors/status";

//! =======================================================  !//
//!               SENSOR CONFIGURATION                       !//
//! =======================================================  !//
// Alarm Thresholds
const float TEMP_HIGH_THRESHOLD = 30.0;  // Celsius
const float HUMIDITY_HIGH_THRESHOLD = 70.0;  // Percentage

//! =======================================================  !//
//!               GLOBAL VARIABLES                           !//
//! =======================================================  !//
WiFiClient espClient;
PubSubClient mqtt(espClient);
unsigned long lastReadingTime = 0;
const long readingInterval = 3000;  // Read sensor every 3 seconds
float temperature = 0;
float humidity = 0;
bool alarmActive = false;

//! =======================================================  !//
//!               SETUP FUNCTION                              !//
//! =======================================================  !//
void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  Serial.println("\n=== IoT Sensor ESP8266 Initialization ===");

  // Initialize buzzer pin
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Initialize LCD
  Wire.begin(D2, D1);  // SDA, SCL pins for ESP8266
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("IoT Sensor");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");

  // Initialize DHT sensor
  pinMode(DHTPIN, INPUT_PULLUP);  // Enable internal pull-up resistor
  dht.begin();
  delay(2000);  // Give the sensor time to stabilize

  // Connect to WiFi
  setupWiFi();

  // Initialize MQTT
  mqtt.setServer(mqtt_server, mqtt_port);

  // Sound startup tone
  startupTone();

  // Display ready message
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("IoT Sensor Ready");
  delay(1000);
}

//! =======================================================  !//
//!               NETWORK FUNCTIONS                           !//
//! =======================================================  !//
void setupWiFi() {
  delay(10);
  Serial.println("Scanning for Wi-Fi networks...");

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Scanning WiFi");
  lcd.setCursor(0, 1);
  lcd.print("Networks...");

  int numNetworks = WiFi.scanNetworks();
  bool connected = false;

  if (numNetworks > 0) {
    for (int i = 0; i < numNetworks; i++) {
      for (unsigned int j = 0; j < sizeof(wifiList) / sizeof(wifiList[0]); j++) {
        if (strcmp(WiFi.SSID(i).c_str(), wifiList[j][0]) == 0) {
          Serial.print("Connecting to ");
          Serial.println(wifiList[j][0]);

          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Connecting to");
          lcd.setCursor(0, 1);
          lcd.print(wifiList[j][0]);

          WiFi.begin(wifiList[j][0], wifiList[j][1]);
          unsigned long startTime = millis();
          while (WiFi.status() != WL_CONNECTED && millis() - startTime < 10000) {
            delay(500);
            Serial.print(".");
          }

          if (WiFi.status() == WL_CONNECTED) {
            Serial.println("\nConnected!");
            Serial.print("IP Address: ");
            Serial.println(WiFi.localIP());

            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("WiFi Connected");
            lcd.setCursor(0, 1);
            lcd.print(WiFi.localIP());
            delay(2000);

            connected = true;
            break;
          }
        }
      }
      if (connected) break;
    }
  }

  if (!connected) {
    Serial.println("Failed to connect to any known network.");

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed");
    lcd.setCursor(0, 1);
    lcd.print("Check Settings");
  }
}

//! =======================================================  !//
//!               MQTT FUNCTIONS                             !//
//! =======================================================  !//
void reconnectMQTT() {
  // Loop until we're reconnected
  int attempts = 0;
  while (!mqtt.connected() && attempts < 3) {
    Serial.print("Attempting MQTT connection...");

    // Attempt to connect
    bool connected = false;
    if (mqtt_username[0] == '\0') {
      connected = mqtt.connect(mqtt_client_id);
    } else {
      connected = mqtt.connect(mqtt_client_id, mqtt_username, mqtt_password);
    }

    if (connected) {
      Serial.println("connected");

      // Publish a connection message
      JsonDocument doc;
      doc["status"] = "online";
      doc["ip"] = WiFi.localIP().toString();
      doc["rssi"] = WiFi.RSSI();

      char buffer[256];
      size_t n = serializeJson(doc, buffer);
      mqtt.publish(topic_status, buffer, n);
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqtt.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
    attempts++;
  }
}

//! =======================================================  !//
//!               AUDIO FUNCTIONS                             !//
//! =======================================================  !//
void startupTone() {
  // Play a short startup melody
  tone(BUZZER_PIN, 1000, 100);
  delay(150);
  tone(BUZZER_PIN, 1500, 100);
  delay(150);
  tone(BUZZER_PIN, 2000, 100);
  delay(150);
  noTone(BUZZER_PIN);
}

void alarmTone() {
  // Play an alarm tone
  for (int i = 0; i < 3; i++) {
    tone(BUZZER_PIN, 2000, 100);
    delay(150);
    tone(BUZZER_PIN, 1000, 100);
    delay(150);
  }
  noTone(BUZZER_PIN);
}

//! =======================================================  !//
//!               SENSOR FUNCTIONS                            !//
//! =======================================================  !//
void readSensor() {
  // Add a small delay before reading to stabilize the sensor
  delay(50);

  // Read humidity
  humidity = dht.readHumidity();
  // Read temperature in Celsius
  temperature = dht.readTemperature();

  // Check if any reads failed
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Sensor Error!");
    return;
  }

  // Print to serial monitor
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.print(" °C, Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");

  // Update LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Temp: ");
  lcd.print(temperature, 1);
  lcd.print((char)223); // Degree symbol
  lcd.print("C");
  lcd.setCursor(0, 1);
  lcd.print("Hum: ");
  lcd.print(humidity, 1);
  lcd.print("%");

  // Check for alarm conditions
  if (temperature > TEMP_HIGH_THRESHOLD || humidity > HUMIDITY_HIGH_THRESHOLD) {
    if (!alarmActive) {
      alarmActive = true;
      alarmTone();
    }
  } else {
    alarmActive = false;
  }

  // Publish to MQTT
  publishSensorData();
}

//! =======================================================  !//
//!               DATA PUBLISHING FUNCTIONS                  !//
//! =======================================================  !//
void publishSensorData() {
  if (!mqtt.connected()) {
    reconnectMQTT();
  }

  if (mqtt.connected()) {
    // Publish temperature
    JsonDocument tempDoc;
    tempDoc["value"] = temperature;
    tempDoc["timestamp"] = millis();
    tempDoc["unit"] = "C";

    char tempBuffer[128];
    size_t tempLen = serializeJson(tempDoc, tempBuffer);

    mqtt.publish(topic_temperature, tempBuffer, tempLen);

    // Publish humidity
    JsonDocument humDoc;
    humDoc["value"] = humidity;
    humDoc["timestamp"] = millis();
    humDoc["unit"] = "%";

    char humBuffer[128];
    size_t humLen = serializeJson(humDoc, humBuffer);

    mqtt.publish(topic_humidity, humBuffer, humLen);
  }
}

//! =======================================================  !//
//!               MAIN LOOP FUNCTION                          !//
//! =======================================================  !//
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }

  // Handle MQTT connection
  if (!mqtt.connected()) {
    reconnectMQTT();
  }
  mqtt.loop();

  // Read sensor at regular intervals
  unsigned long currentMillis = millis();
  if (currentMillis - lastReadingTime >= readingInterval) {
    lastReadingTime = currentMillis;
    readSensor();
  }

  // If alarm is active, blink the LCD backlight
  if (alarmActive) {
    if ((currentMillis / 500) % 2 == 0) {
      lcd.backlight();
    } else {
      lcd.noBacklight();
    }
  } else {
    lcd.backlight();
  }

  delay(100);  // Small delay to prevent watchdog reset
}
