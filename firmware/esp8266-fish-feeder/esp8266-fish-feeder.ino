#include <Arduino.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <Firebase_ESP_Client.h>
#include <LittleFS.h>
#include <NTPClient.h>
#include <Servo.h>
#include <WiFiUdp.h>

#include "config_manager.h"
#include "firebase_manager.h"
#include "logger.h"
#include "motor_controller.h"
#include "scheduler.h"
#include "wifi_setup_portal.h"

ConfigManager configManager;
DeviceConfig deviceConfig;
WifiSetupPortal setupPortal(&configManager, &deviceConfig);
MotorController motorController;
Logger logger;
FirebaseManager firebaseManager;
Scheduler scheduler;
WiFiUDP ntpUdp;
NTPClient timeClient(ntpUdp, "pool.ntp.org", 18000);

bool setupMode = false;
unsigned long lastWifiRetryMs = 0;

MotorSettings initialMotorSettings() {
  MotorSettings settings;
  settings.motorType = deviceConfig.motorType;
  settings.servoPin = deviceConfig.servoPin;
  settings.timezoneOffsetSeconds = deviceConfig.timezoneOffsetSeconds;
  return settings;
}

bool connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(deviceConfig.wifiSsid.c_str(), deviceConfig.wifiPassword.c_str());
  Serial.print("Connecting to saved Wi-Fi");
  for (int i = 0; i < 60 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi connected: ");
    Serial.println(WiFi.localIP());
    return true;
  }

  Serial.println("Wi-Fi connection failed; credentials were not erased");
  return false;
}

void startSetupPortal(bool filesystemMounted) {
  setupMode = true;
  setupPortal.begin(filesystemMounted);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println("FishFeeder ESP8266 firmware 2.0.0 booting");

  bool fsMounted = configManager.begin();
  if (!fsMounted) {
    Serial.println(configManager.lastError());
    startSetupPortal(false);
    return;
  }

  if (!configManager.load(deviceConfig) || !deviceConfig.configured) {
    Serial.println("No valid config found; starting setup portal");
    startSetupPortal(true);
    return;
  }

  MotorSettings settings = initialMotorSettings();
  motorController.begin(ConfigManager::pinFromLabel(deviceConfig.servoPin), settings);

  if (!connectWifi()) {
    // Keep retrying saved Wi-Fi in loop; do not delete config. Users can power
    // cycle and hold a future physical reset button or use setup portal after
    // explicit factory reset if needed.
    lastWifiRetryMs = millis();
  }

  timeClient.setTimeOffset(deviceConfig.timezoneOffsetSeconds);
  timeClient.begin();
  timeClient.update();

  firebaseManager.begin(deviceConfig, &motorController, &logger, &timeClient, &configManager);
  firebaseManager.syncSettings();
  scheduler.begin(&firebaseManager, &motorController, &logger, &timeClient);
  logger.log("info", "Boot complete", firebaseManager.nowMs());
}

void loop() {
  if (setupMode) {
    setupPortal.handleClient();
    delay(5);
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWifiRetryMs > 15000) {
      Serial.println("Wi-Fi disconnected; retrying saved credentials without wiping config");
      WiFi.disconnect();
      WiFi.begin(deviceConfig.wifiSsid.c_str(), deviceConfig.wifiPassword.c_str());
      lastWifiRetryMs = millis();
    }
    delay(50);
    return;
  }

  timeClient.update();
  firebaseManager.loop();
  scheduler.loop();
  delay(10);
}
