#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <WiFiManager.h>
#include <ArduinoJson.h>

// Generate a unique GUID for this device
const char* device_guid = "a7b3c45d-e1f2-4a5b-8c9d-e0f1a2b3c4d5"; // Replace with your own GUID

// MQTT broker settings
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
String mqtt_topic_battery = String(device_guid) + "/roo/battery";
String mqtt_topic_set = String(device_guid) + "/roo/set";

// Pin definitions for RGB
const int RED_PIN   = D1; // GPIO5
const int GREEN_PIN = D3; // GPIO0
const int BLUE_PIN  = D4; // GPIO2

// Battery monitoring
const int BATTERY_PIN = A0;
const float VOLTAGE_MULTIPLIER = 4.0;

// Battery voltage thresholds (typical Li-ion)
const float BATTERY_MAX = 4.2;
const float BATTERY_MIN = 3.0;
const float BATTERY_LOW = 3.4;

// MQTT client
WiFiClient espClient;
PubSubClient client(espClient);

// Timing variables
unsigned long lastBatteryPublish = 0;
const unsigned long batteryPublishInterval = 30000;

// LED control variables
String currentPattern = "dim_red";
unsigned long patternTimer = 0;
int patternStep = 0;
bool patternDirection = true;
int customRed = 50, customGreen = 255, customBlue = 255; // For hex colours

// Rave mode variables
int raveColors[12][3] = {
  {255, 0, 0},     // Red
  {0, 255, 0},     // Green
  {0, 0, 255},     // Blue
  {255, 255, 0},   // Yellow
  {255, 0, 255},   // Magenta
  {0, 255, 255},   // Cyan
  {255, 128, 0},   // Orange
  {128, 0, 255},   // Purple
  {255, 20, 147},  // Deep pink
  {0, 255, 127},   // Spring green
  {255, 69, 0},    // Red orange
  {138, 43, 226}   // Blue violet
};

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=== ESP8266 Starting ===");
  
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);
  
  // Start with dim red (default)
  setLED(50, 255, 255); // Dim red for common anode
  
  Serial.println("Device GUID: " + String(device_guid));
  Serial.println("MQTT Battery Topic: " + mqtt_topic_battery);
  Serial.println("MQTT Control Topic: " + mqtt_topic_set);
  
  // WiFiManager setup
  setup_wifi_manager();
  
  // Set MQTT server and callback
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void setup_wifi_manager() {
  WiFiManager wifiManager;
  
  // Enable debug output
  wifiManager.setDebugOutput(true);
  
  // Reset settings for testing (uncomment if needed)
  // wifiManager.resetSettings();
  
  // Set longer timeout
  wifiManager.setTimeout(600); // 10 minutes timeout
  
  // Set custom AP configuration
  wifiManager.setAPStaticIPConfig(IPAddress(192,168,4,1), IPAddress(192,168,4,1), IPAddress(255,255,255,0));
  
  // Create AP name
  String apName = "ESP8266-" + String(ESP.getChipId(), HEX);
  Serial.println("Creating Access Point: " + apName);
  Serial.println("Connect to this network and go to: http://192.168.4.1");
  
  // Flash green LED to show AP mode
  setLED(255, 0, 255);
  delay(1000);
  setLED(255, 255, 255);
  
  // Try to connect
  if (!wifiManager.autoConnect(apName.c_str())) {
    Serial.println("Failed to connect and hit timeout");
    Serial.println("Restarting...");
    delay(3000);
    ESP.reset();
    delay(5000);
  }
  
  // Successfully connected - flash blue LED
  setLED(255, 255, 0);
  delay(1000);
  setLED(50, 255, 255); // Back to dim red
  
  Serial.println("WiFi connected successfully!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());
}

bool isHexColor(String input) {
  // Check if input is a valid hex color (# followed by 6 hex digits)
  if (input.length() != 7) return false;
  if (input.charAt(0) != '#') return false;
  
  for (int i = 1; i < 7; i++) {
    char c = input.charAt(i);
    if (!((c >= '0' && c <= '9') || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f'))) {
      return false;
    }
  }
  return true;
}

void parseHexColor(String hexColor) {
  // Parse hex color string like "#FF0000" to RGB values
  String hexValue = hexColor.substring(1); // Remove the '#'
  
  // Extract RGB components
  long number = strtol(hexValue.c_str(), NULL, 16);
  int r = (number >> 16) & 0xFF;
  int g = (number >> 8) & 0xFF;
  int b = number & 0xFF;
  
  // Convert to common anode values (invert)
  customRed = 255 - r;
  customGreen = 255 - g;
  customBlue = 255 - b;
  
  Serial.println("Parsed hex color: " + hexColor);
  Serial.println("RGB: " + String(r) + "," + String(g) + "," + String(b));
  Serial.println("Common Anode: " + String(customRed) + "," + String(customGreen) + "," + String(customBlue));
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println("Message received on topic: " + String(topic));
  Serial.println("Message: " + message);
  
  // Process the command
  if (String(topic) == mqtt_topic_set) {
    // Check if it's a hex color code
    if (isHexColor(message)) {
      parseHexColor(message);
      currentPattern = "hex";
      Serial.println("Hex color set: " + message);
    } else {
      currentPattern = message;
      Serial.println("Pattern changed to: " + currentPattern);
    }
    
    patternStep = 0;
    patternTimer = millis();
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    String clientId = "ESP8266-" + String(device_guid);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      Serial.println("MQTT Battery Topic: " + mqtt_topic_battery);
      Serial.println("MQTT Control Topic: " + mqtt_topic_set);
      
      // Subscribe to the control topic
      client.subscribe(mqtt_topic_set.c_str());
      Serial.println("Subscribed to: " + mqtt_topic_set);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setLED(int red, int green, int blue) {
  // For common anode RGB LED (HIGH = off, LOW = on)
  analogWrite(RED_PIN, red);
  analogWrite(GREEN_PIN, green);
  analogWrite(BLUE_PIN, blue);
}

void updateLEDPattern() {
  unsigned long now = millis();
  
  if (currentPattern == "off") {
    setLED(255, 255, 255); // All off
    
  } else if (currentPattern == "dim_red") {
    setLED(50, 255, 255); // Dim red
    
  } else if (currentPattern == "hex") {
    // Display custom hex color
    setLED(customRed, customGreen, customBlue);
    
  } else if (currentPattern == "rainbow") {
    // Rainbow cycle every 6 seconds
    if (now - patternTimer > 100) {
      patternTimer = now;
      int hue = (patternStep * 6) % 360;
      HSVtoRGB(hue, 255, 255);
      patternStep++;
      if (patternStep > 60) patternStep = 0;
    }
    
  } else if (currentPattern == "breathing") {
    // Breathing red effect
    if (now - patternTimer > 50) {
      patternTimer = now;
      if (patternDirection) {
        patternStep += 5;
        if (patternStep >= 255) {
          patternStep = 255;
          patternDirection = false;
        }
      } else {
        patternStep -= 5;
        if (patternStep <= 50) {
          patternStep = 50;
          patternDirection = true;
        }
      }
      setLED(255 - patternStep, 255, 255);
    }
    
  } else if (currentPattern == "rave") {
    // RAVE MODE - Multiple intense effects
    if (now - patternTimer > 80) { // Very fast updates
      patternTimer = now;
      
      // Random effect selector
      int effect = random(0, 4);
      
      switch(effect) {
        case 0: // Strobe effect
          if (patternStep % 2 == 0) {
            int colorIndex = random(0, 12);
            setLED(255 - raveColors[colorIndex][0], 
                   255 - raveColors[colorIndex][1], 
                   255 - raveColors[colorIndex][2]);
          } else {
            setLED(255, 255, 255); // Off
          }
          break;
          
        case 1: // Fast color switching
          {
            int colorIndex = random(0, 12);
            setLED(255 - raveColors[colorIndex][0], 
                   255 - raveColors[colorIndex][1], 
                   255 - raveColors[colorIndex][2]);
          }
          break;
          
        case 2: // Pulse effect
          {
            int colorIndex = patternStep % 12;
            int brightness = (sin(patternStep * 0.3) + 1) * 127.5;
            setLED(255 - (raveColors[colorIndex][0] * brightness / 255), 
                   255 - (raveColors[colorIndex][1] * brightness / 255), 
                   255 - (raveColors[colorIndex][2] * brightness / 255));
          }
          break;
          
        case 3: // Crazy rainbow
          {
            int hue = (patternStep * 15) % 360;
            HSVtoRGB(hue, 255, 255);
          }
          break;
      }
      
      patternStep++;
      if (patternStep > 1000) patternStep = 0;
    }
    
  } else if (currentPattern == "party") {
    // Party mode - slightly slower than rave
    if (now - patternTimer > 150) {
      patternTimer = now;
      
      // Cycle through bright colors with fading
      int colorIndex = (patternStep / 10) % 12;
      int fade = patternStep % 10;
      
      int brightness = 255 - (fade * 25);
      if (brightness < 100) brightness = 100;
      
      setLED(255 - (raveColors[colorIndex][0] * brightness / 255), 
             255 - (raveColors[colorIndex][1] * brightness / 255), 
             255 - (raveColors[colorIndex][2] * brightness / 255));
      
      patternStep++;
      if (patternStep > 120) patternStep = 0;
    }
    
  } else if (currentPattern == "strobe") {
    // Pure strobe effect
    if (now - patternTimer > 100) {
      patternTimer = now;
      
      if (patternStep % 2 == 0) {
        setLED(0, 0, 0); // Full white
      } else {
        setLED(255, 255, 255); // Off
      }
      
      patternStep++;
    }
    
  } else if (currentPattern == "disco") {
    // Disco ball effect
    if (now - patternTimer > 200) {
      patternTimer = now;
      
      // Random bright flashes
      if (random(0, 3) == 0) {
        int colorIndex = random(0, 12);
        setLED(255 - raveColors[colorIndex][0], 
               255 - raveColors[colorIndex][1], 
               255 - raveColors[colorIndex][2]);
      } else {
        setLED(255, 255, 255); // Off
      }
    }
    
  } else {
    // Unknown pattern - default to dim red
    setLED(50, 255, 255);
  }
}

void HSVtoRGB(int hue, int sat, int val) {
  // Convert HSV to RGB for rainbow effect
  int r, g, b;
  int region = hue / 60;
  int remainder = (hue % 60) * 256 / 60;
  
  int p = (val * (255 - sat)) / 255;
  int q = (val * (255 - ((sat * remainder) / 255))) / 255;
  int t = (val * (255 - ((sat * (255 - remainder)) / 255))) / 255;
  
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

void displayBatteryStatus(float voltage, float percentage) {
  Serial.print("Battery: ");
  Serial.print(voltage, 2);
  Serial.print("V (");
  Serial.print(percentage, 1);
  Serial.print("%) | Pattern: ");
  Serial.println(currentPattern);
}

void publishBatteryData(float voltage, float percentage) {
  if (!client.connected()) {
    reconnect();
  }
  
  String payload = "{";
  payload += "\"device_id\":\"" + String(device_guid) + "\",";
  payload += "\"voltage\":" + String(voltage, 2) + ",";
  payload += "\"percentage\":" + String(percentage, 1) + ",";
  payload += "\"pattern\":\"" + currentPattern + "\",";
  payload += "\"timestamp\":" + String(millis()) + ",";
  payload += "\"uptime\":" + String(millis() / 1000) + ",";
  payload += "\"wifi_rssi\":" + String(WiFi.RSSI());
  payload += "}";
  
  if (client.publish(mqtt_topic_battery.c_str(), payload.c_str())) {
    Serial.println("Battery data published");
  } else {
    Serial.println("Failed to publish battery data");
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Update LED pattern
  updateLEDPattern();
  
  // Battery monitoring
  float batteryVoltage = readBatteryVoltage();
  float batteryPercentage = getBatteryPercentage(batteryVoltage);
  
  unsigned long now = millis();
  if (now - lastBatteryPublish > batteryPublishInterval) {
    displayBatteryStatus(batteryVoltage, batteryPercentage);
    publishBatteryData(batteryVoltage, batteryPercentage);
    lastBatteryPublish = now;
  }
  
  delay(10); // Small delay to prevent watchdog issues
}