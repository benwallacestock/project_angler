#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <WiFiManager.h>
#include <ArduinoJson.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0, 60000); // UTC, update every 60s

// ---- Device and MQTT topic setup ----
const char* device_guid = "a7b3c45d-e1f2-4a5b-8c9d-e0f1a2b3c4d5";
const char* device_name = "Roo";

String mqtt_topic_lighting_set =
    String(device_guid) + "/" + device_name + "/lighting/set";
String mqtt_topic_lighting_status =
    String(device_guid) + "/" + device_name + "/lighting/status";
String mqtt_topic_status =
    String(device_guid) + "/" + device_name + "/status";

// ---- MQTT broker ----
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

// ---- Pins ----
const int RED_PIN = D2;
const int GREEN_PIN = D1;
const int BLUE_PIN = D3;
const int BATTERY_PIN = A0;
const float VOLTAGE_MULTIPLIER = 4.144;
const float BATTERY_MAX = 4.2;
const float BATTERY_MIN = 3.0;

// ---- LED and State logic ----
String currentMode = "colour";
String currentColour = "#ffff00";
int currentRainbowSpeed = 5;
int customRed = 255, customGreen = 255, customBlue = 0;
float rainbowHue = 0.0;
unsigned long lastRainbowUpdate = 0;
unsigned long lastStatusPublish = 0;
const unsigned long statusPublishInterval = 30000;

// ---- STROBE State ---- (NEW)
String currentStrobeColour = "#ffffff";
int strobeRed = 255, strobeGreen = 255, strobeBlue = 255;
int currentStrobeSpeed = 5; // flashes/sec
bool strobeIsOn = false;
unsigned long lastStrobeUpdate = 0;

// ---- Captive Portal state and LED flashing ----
WiFiManager wifiManager;
bool wifi_setup_in_progress = false;
unsigned long lastRedFlash = 0;
const unsigned long redFlashInterval = 2000; // 2 seconds
bool greenFlashed = false;

// --- LED helper for common-anode RGB: HIGH=off, LOW=on ---
void setLED(int red, int green, int blue) {
  analogWrite(RED_PIN,   255 - red);
  analogWrite(GREEN_PIN, 255 - green);
  analogWrite(BLUE_PIN,  255 - blue);
}

void flashLED(int red, int green, int blue, int times, int duration_ms = 120) {
  for (int i = 0; i < times; i++) {
    setLED(red, green, blue);
    delay(duration_ms);
    setLED(0, 0, 0); // All OFF
    delay(duration_ms);
  }
}

// ---- Improved Wi-Fi connect helper (returns true if connected, flashes amber while trying) ----
bool tryConnectWiFi(unsigned long timeout_ms = 40000) { // Default: 40s
  WiFi.mode(WIFI_STA);
  WiFi.begin();
  unsigned long startAttemptTime = millis();
  unsigned long lastFlash = 0;
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < timeout_ms) {
    // Flash amber (red+green) every second
    if (millis() - lastFlash > 1000) {
      flashLED(255, 128, 0, 1, 100); // orange/amber for 'connecting'
      lastFlash = millis();
    }
    delay(100);
  }
  return (WiFi.status() == WL_CONNECTED);
}

// ---- Hex Colour ----
bool isHexColor(const String& input) {
  if (input.length() != 7) return false;
  if (input.charAt(0) != '#') return false;
  for (int i = 1; i < 7; i++) {
    char c = input.charAt(i);
    bool isDigit = (c >= '0' && c <= '9');
    bool isLower = (c >= 'a' && c <= 'f');
    bool isUpper = (c >= 'A' && c <= 'F');
    if (!(isDigit || isLower || isUpper)) return false;
  }
  return true;
}
void parseHexColor(String hexColor) {
  long number = strtol(hexColor.substring(1).c_str(), NULL, 16);
  int r = (number >> 16) & 0xFF, g = (number >> 8) & 0xFF, b = number & 0xFF;
  customRed = r; customGreen = g; customBlue = b;
}

// ---- MQTT Callbacks ----
void publishLightingStatus() {
  DynamicJsonDocument doc(128);
  doc["mode"] = currentMode;
  if (currentMode == "colour") doc["colour"] = currentColour;
  else if (currentMode == "rainbow") doc["speed"] = currentRainbowSpeed;
  else if (currentMode == "strobe") {
    doc["colour"] = currentStrobeColour;
    doc["speed"] = currentStrobeSpeed;
  }
  String out;
  serializeJson(doc, out);
  client.publish(mqtt_topic_lighting_status.c_str(), out.c_str(), true);
  Serial.println("Published lighting/status: " + out);
}

// ---- Device status ----
void publishDeviceStatus() {
  float voltage = readBatteryVoltage();
  float percentage = getBatteryPercentage(voltage);

  timeClient.update();

  DynamicJsonDocument doc(192);
  doc["batteryPercentage"] = percentage;
  doc["batteryVoltage"] = voltage;
  doc["uptime"] = (millis() / 1000);
  doc["wifiSignalStrength"] = WiFi.RSSI();
  doc["timestamp"] = timeClient.getEpochTime();

  // ISO 8601 UTC time
  char isoTime[25];
  time_t epoch = timeClient.getEpochTime();
  strftime(isoTime, sizeof(isoTime), "%Y-%m-%dT%H:%M:%SZ", gmtime(&epoch));
  doc["isoTime"] = isoTime;

  String out;
  serializeJson(doc, out);
  client.publish(mqtt_topic_status.c_str(), out.c_str(), true);
  Serial.println("Published device status: " + out);
}

// ---- MQTT Message callback ----
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; ++i) message += (char)payload[i];
  Serial.println("MQTT msg [" + String(topic) + "]: " + message);

  if (String(topic) == mqtt_topic_lighting_set) {
    DynamicJsonDocument doc(128);
    auto error = deserializeJson(doc, message);
    if (!error) {
      String mode = doc["mode"] | "";
      if (mode == "colour" && doc["colour"].is<const char*>()) {
        currentMode = "colour";
        currentColour = String((const char*)doc["colour"]);
        parseHexColor(currentColour);
        setLED(customRed, customGreen, customBlue);
      }
      else if (mode == "rainbow" && doc["speed"].is<int>()) {
        currentMode = "rainbow";
        int newSpeed = doc["speed"].as<int>();
        if (newSpeed < 1) newSpeed = 1;
        currentRainbowSpeed = newSpeed;
      }
      // ------- Add STROBE mode MQTT parsing here -------
      else if (mode == "strobe" && doc["colour"].is<const char*>() && doc["speed"].is<int>()) {
        currentMode = "strobe";
        currentStrobeColour = String((const char*)doc["colour"]);
        // Parse the strobe colour to RGB:
        long number = strtol(currentStrobeColour.substring(1).c_str(), NULL, 16);
        strobeRed   = (number >> 16) & 0xFF;
        strobeGreen = (number >> 8) & 0xFF;
        strobeBlue  = number & 0xFF;
        int newSpeed = doc["speed"].as<int>();
        if (newSpeed < 1) newSpeed = 1;
        currentStrobeSpeed = newSpeed;
        strobeIsOn = false;
        lastStrobeUpdate = millis();
      }
      // ------- End STROBE addition -------
      else {
        Serial.println("Invalid LightingPayload, ignoring");
        return;
      }
      publishLightingStatus();
    } else {
      Serial.println("LightingPayload JSON parse error");
    }
  }
}

void reconnect() {
  while (!client.connected()) {
    String clientId = "ESP8266-" + String(device_guid);
    if (client.connect(clientId.c_str())) {
      client.subscribe(mqtt_topic_lighting_set.c_str(), 1);
      Serial.println("Subscribed to: " + mqtt_topic_lighting_set);
    } else {
      Serial.println("MQTT connect failed, rc=" + String(client.state()));
      delay(5000);
    }
  }
}

// ---- Rainbow effect ----
void updateLEDPattern() {
  unsigned long now = millis();
  if (currentMode == "colour") {
    setLED(customRed, customGreen, customBlue);
  } else if (currentMode == "rainbow") {
    int s = currentRainbowSpeed;
    if (s < 1) s = 1;
    float degPerSec = 45.0f * s;
    float deltaT = (now - lastRainbowUpdate) / 1000.0f;
    rainbowHue += degPerSec * deltaT;
    while (rainbowHue >= 360.0) rainbowHue -= 360.0;
    while (rainbowHue < 0) rainbowHue += 360.0;
    HSVtoRGB((int)rainbowHue, 255, 255);
    lastRainbowUpdate = now;
  }
  // ------ Add STROBE mode here ------
  else if (currentMode == "strobe") {
    int interval = 500 / currentStrobeSpeed; // ms: on for N ms, off for N ms
    if (now - lastStrobeUpdate >= interval) {
      lastStrobeUpdate = now;
      strobeIsOn = !strobeIsOn;
      if (strobeIsOn) {
        setLED(strobeRed, strobeGreen, strobeBlue);
      } else {
        setLED(0,0,0); // LED OFF
      }
    }
  }
  // ------ End STROBE addition ------
  else {
    setLED(50, 255, 255);
  }
}

// ---- HSV to RGB ----
void HSVtoRGB(int hue, int sat, int val) {
  int region = hue / 60;
  int remainder = (hue % 60) * 255 / 60;
  int p = (val * (255 - sat)) / 255;
  int q = (val * (255 - ((sat * remainder) / 255))) / 255;
  int t = (val * (255 - ((sat * (255 - remainder)) / 255))) / 255;
  int r = 0, g = 0, b = 0;
  switch (region) {
    case 0: r = val; g = t; b = p; break;
    case 1: r = q; g = val; b = p; break;
    case 2: r = p; g = val; b = t; break;
    case 3: r = p; g = q; b = val; break;
    case 4: r = t; g = p; b = val; break;
    default: r = val; g = p; b = q; break;
  }
  setLED(r, g, b);
}

// ---- Battery logic ----
float readBatteryVoltage() {
  int adcValue = analogRead(BATTERY_PIN);
  float batteryVoltage = (adcValue / 1024.0) * VOLTAGE_MULTIPLIER;
  return batteryVoltage;
}
float getBatteryPercentage(float voltage) {
  float percentage = ((voltage - BATTERY_MIN) / (BATTERY_MAX - BATTERY_MIN)) * 100.0;
  if (percentage > 100.0) percentage = 100.0;
  if (percentage < 0.0) percentage = 0.0;
  return percentage;
}

// ---- SETUP ----
void setup() {
  Serial.begin(115200);
  delay(1000);
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);

  parseHexColor(currentColour);
  setLED(customRed, customGreen, customBlue);

  // Improved Wi-Fi reconnect logic:
  bool wifiConnected = tryConnectWiFi(40000); // try for 40 seconds
  if (!wifiConnected) {
    wifiManager.setConfigPortalBlocking(false);
    wifiManager.setTimeout(0);
    wifiManager.setAPStaticIPConfig(IPAddress(192, 168, 4, 1), IPAddress(192, 168, 4, 1), IPAddress(255, 255, 255, 0));
    String apName = "Angler - " + String(device_name);
    Serial.println("Starting portal: " + apName);
    wifiManager.startConfigPortal(apName.c_str());
    wifi_setup_in_progress = true;
    lastRedFlash = millis();
    setLED(255, 0, 255); delay(1000); setLED(255, 255, 255);
  } else {
    // Got Wi-Fi instantly (normal reconnect!), do green flash for user feedback
    flashLED(0, 255, 0, 3, 120);
    setLED(customRed, customGreen, customBlue);
    greenFlashed = true; // So we do NOT do again in loop
  }

  // --- Main application setup ---
  timeClient.begin();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  rainbowHue = 0.0;
  lastRainbowUpdate = millis();
  strobeIsOn = false;
  lastStrobeUpdate = millis();

  Serial.println("MQTT Lighting Set Topic: " + mqtt_topic_lighting_set);
  Serial.println("MQTT Lighting Status Topic: " + mqtt_topic_lighting_status);
  Serial.println("MQTT Status Topic: " + mqtt_topic_status);
}

// ---- LOOP ----
void loop() {
  // ---- Captive Portal Phase ----
  if (wifi_setup_in_progress) {
    wifiManager.process();

    // Flash red LED every 2 seconds during portal
    if (millis() - lastRedFlash > redFlashInterval) {
      flashLED(255, 0, 0, 1, 150);
      lastRedFlash = millis();
    }
    // Check for Wi-Fi connection from portal
    if (WiFi.status() == WL_CONNECTED && !greenFlashed) {
      flashLED(0, 255, 0, 3, 120);
      setLED(customRed, customGreen, customBlue);
      greenFlashed = true;
      wifi_setup_in_progress = false;
      Serial.println("WiFi connected! IP: " + WiFi.localIP().toString());
    }

    // Stay here until connected!
    return;
  }

  // ---- MAIN PROGRAM (After Wi-Fi connection) ----
  if (!client.connected()) reconnect();
  client.loop();

  updateLEDPattern();

  unsigned long now = millis();
  if (now - lastStatusPublish > statusPublishInterval) {
    publishDeviceStatus();
    lastStatusPublish = now;
  }
  delay(10);
}