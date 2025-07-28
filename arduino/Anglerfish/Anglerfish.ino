#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <WiFiManager.h>
#include <ArduinoJson.h>

// ---- Device and MQTT topic setup ----
const char* device_guid = "a7b3c45d-e1f2-4a5b-8c9d-e0f1a2b3c4d5";
const char* device_name = "Roo"; // Keep exactly as you want MQTT case!

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

// ---- Battery monitoring ----
const int BATTERY_PIN = A0;
const float VOLTAGE_MULTIPLIER = 4.144;
const float BATTERY_MAX = 4.2;
const float BATTERY_MIN = 3.0;

// ---- LED logic ----
String currentMode = "colour";
String currentColour = "#ffff00";
int currentRainbowSpeed = 5;

int customRed = 255, customGreen = 255, customBlue = 0;

// ---- Rainbow effect (smooth!) ----
float rainbowHue = 0.0;
unsigned long lastRainbowUpdate = 0;

// Timing for device status publish
unsigned long lastStatusPublish = 0;
const unsigned long statusPublishInterval = 30000;

// ---- Wi-Fi portal only ----
void setup_wifi_manager() {
  WiFiManager wifiManager;
  wifiManager.setConfigPortalBlocking(true); // Instruct to block here until done!
  wifiManager.setTimeout(600);
  wifiManager.setAPStaticIPConfig(IPAddress(192, 168, 4, 1), IPAddress(192, 168, 4, 1), IPAddress(255, 255, 255, 0));
  String apName = "Angler - " + String(device_name);
  Serial.println("Starting portal: " + apName);
  setLED(255, 0, 255); delay(1000); setLED(255, 255, 255);

  // Optional: try to aggressively prompt captive portal by DNS "trick"
  wifiManager.setConfigPortalTimeout(0); // never timeout captive portal

  if (!wifiManager.autoConnect(apName.c_str())) {
    Serial.println("Failed to connect via portal. Restarting...");
    delay(3000); ESP.reset(); delay(5000);
  }
  setLED(255, 255, 0); delay(1000); setLED(customRed, customGreen, customBlue);
  Serial.println("WiFi connected! IP: " + WiFi.localIP().toString());
}

// ---- Hex Color Parsing ----
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
  customRed = 255 - r; customGreen = 255 - g; customBlue = 255 - b;
}

// ---- MQTT Callbacks ----
void publishLightingStatus() {
  DynamicJsonDocument doc(128);
  doc["mode"] = currentMode;
  if (currentMode == "colour") doc["colour"] = currentColour;
  else if (currentMode == "rainbow") doc["speed"] = currentRainbowSpeed;
  String out;
  serializeJson(doc, out);
  client.publish(mqtt_topic_lighting_status.c_str(), out.c_str(), true);
  Serial.println("Published lighting/status: " + out);
}

void publishDeviceStatus() {
  float voltage = readBatteryVoltage();
  float percentage = getBatteryPercentage(voltage);

  DynamicJsonDocument doc(128);
  doc["batteryPercentage"] = percentage;
  doc["batteryVoltage"] = voltage;
  doc["uptime"] = (millis() / 1000);
  doc["wifiSignalStrength"] = WiFi.RSSI();
  String out; serializeJson(doc, out);
  client.publish(mqtt_topic_status.c_str(), out.c_str(), true);
  Serial.println("Published device status: " + out);
}

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

void setLED(int red, int green, int blue) {
  analogWrite(RED_PIN, red);
  analogWrite(GREEN_PIN, green);
  analogWrite(BLUE_PIN, blue);
}

// ---- Smooth Rainbow Effect ----
void updateLEDPattern() {
  unsigned long now = millis();
  if (currentMode == "colour") {
    setLED(customRed, customGreen, customBlue);
  } else if (currentMode == "rainbow") {
    int s = currentRainbowSpeed;
    if (s < 1) s = 1;
    float degPerSec = 45.0f * s; // adjust multiplier as desired for speed
    float deltaT = (now - lastRainbowUpdate) / 1000.0f;
    rainbowHue += degPerSec * deltaT;
    while (rainbowHue >= 360.0) rainbowHue -= 360.0;
    while (rainbowHue < 0) rainbowHue += 360.0;
    HSVtoRGB((int)rainbowHue, 255, 255);
    lastRainbowUpdate = now;
  } else {
    setLED(50, 255, 255);
  }
}

// ---- HSV to RGB ----
void HSVtoRGB(int hue, int sat, int val) {
  int region = hue / 60;
  int remainder = (hue % 60) * 255 / 60;
  int p = (val * (255 - sat)) / 255;
  int q = (val * (255 - (sat * remainder) / 255)) / 255;
  int t = (val * (255 - (sat * (255 - remainder)) / 255)) / 255;
  int r = 0, g = 0, b = 0;
  switch (region) {
    case 0: r = val; g = t; b = p; break;
    case 1: r = q; g = val; b = p; break;
    case 2: r = p; g = val; b = t; break;
    case 3: r = p; g = q; b = val; break;
    case 4: r = t; g = p; b = val; break;
    default: r = val; g = p; b = q; break;
  }
  setLED(255 - r, 255 - g, 255 - b);
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

// ---- Arduino Setup Loop ----
void setup() {
  Serial.begin(115200);
  delay(1000);
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);

  parseHexColor(currentColour);
  setLED(customRed, customGreen, customBlue);

  setup_wifi_manager();

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  rainbowHue = 0.0;
  lastRainbowUpdate = millis();

  Serial.println("MQTT Lighting Set Topic: " + mqtt_topic_lighting_set);
  Serial.println("MQTT Lighting Status Topic: " + mqtt_topic_lighting_status);
  Serial.println("MQTT Status Topic: " + mqtt_topic_status);
}

void loop() {
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