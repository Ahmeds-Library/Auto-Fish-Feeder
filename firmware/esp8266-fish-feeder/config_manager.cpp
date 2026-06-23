#include "config_manager.h"

#include <ArduinoJson.h>
#include <LittleFS.h>

namespace {
const char *CONFIG_PATH = "/config.json";
}

bool ConfigManager::begin() {
  // Intentionally avoid filesystem formatting on boot; doing so would erase
  // saved Wi-Fi/Firebase credentials after a power cut.
  if (!LittleFS.begin()) {
    _lastError = "LittleFS mount failed; config was not erased";
    return false;
  }
  return true;
}

bool ConfigManager::exists() const {
  return LittleFS.exists(CONFIG_PATH);
}

bool ConfigManager::load(DeviceConfig &config) {
  if (!LittleFS.exists(CONFIG_PATH)) {
    _lastError = "Config file missing";
    return false;
  }

  File file = LittleFS.open(CONFIG_PATH, "r");
  if (!file) {
    _lastError = "Unable to open config file";
    return false;
  }

  StaticJsonDocument<1024> doc;
  DeserializationError error = deserializeJson(doc, file);
  file.close();

  if (error) {
    _lastError = String("Config JSON parse failed: ") + error.c_str();
    return false;
  }

  config.configured = doc["configured"] | false;
  config.wifiSsid = doc["wifiSsid"] | "";
  config.wifiPassword = doc["wifiPassword"] | "";
  config.deviceId = doc["deviceId"] | "";
  config.deviceName = doc["deviceName"] | "Fish Feeder";
  config.firebaseApiKey = doc["firebaseApiKey"] | "";
  config.firebaseDatabaseUrl = doc["firebaseDatabaseUrl"] | "";
  config.deviceEmail = doc["deviceEmail"] | "";
  config.devicePassword = doc["devicePassword"] | "";
  config.adminPin = doc["adminPin"] | "";
  config.pairingCode = doc["pairingCode"] | "";
  config.webAppUrl = doc["webAppUrl"] | "https://your-firebase-hosting-domain.web.app";
  config.motorType = doc["motorType"] | "continuous360";
  config.servoPin = doc["servoPin"] | "D4";
  config.timezoneOffsetSeconds = doc["timezoneOffsetSeconds"] | 18000;

  return validate(config);
}

bool ConfigManager::save(const DeviceConfig &config) {
  if (!validate(config)) return false;

  StaticJsonDocument<1024> doc;
  doc["configured"] = config.configured;
  doc["wifiSsid"] = config.wifiSsid;
  doc["wifiPassword"] = config.wifiPassword;
  doc["deviceId"] = config.deviceId;
  doc["deviceName"] = config.deviceName;
  doc["firebaseApiKey"] = config.firebaseApiKey;
  doc["firebaseDatabaseUrl"] = config.firebaseDatabaseUrl;
  doc["deviceEmail"] = config.deviceEmail;
  doc["devicePassword"] = config.devicePassword;
  doc["adminPin"] = config.adminPin;
  doc["pairingCode"] = config.pairingCode;
  doc["webAppUrl"] = config.webAppUrl;
  doc["motorType"] = config.motorType;
  doc["servoPin"] = config.servoPin;
  doc["timezoneOffsetSeconds"] = config.timezoneOffsetSeconds;

  File file = LittleFS.open(CONFIG_PATH, "w");
  if (!file) {
    _lastError = "Unable to write config file";
    return false;
  }

  if (serializeJsonPretty(doc, file) == 0) {
    _lastError = "Config serialization failed";
    file.close();
    return false;
  }

  file.close();
  return true;
}

bool ConfigManager::factoryReset(const String &confirmation) {
  if (confirmation != "FACTORY_RESET_FISH_FEEDER") {
    _lastError = "Factory reset confirmation mismatch";
    return false;
  }

  if (LittleFS.exists(CONFIG_PATH) && !LittleFS.remove(CONFIG_PATH)) {
    _lastError = "Failed to remove config file";
    return false;
  }

  return true;
}

bool ConfigManager::validate(const DeviceConfig &config) {
  if (!config.configured) return true;

  if (config.wifiSsid.length() == 0 || config.deviceId.length() == 0 ||
      config.firebaseApiKey.length() == 0 || config.firebaseDatabaseUrl.length() == 0 ||
      config.deviceEmail.length() == 0 || config.devicePassword.length() == 0) {
    _lastError = "Required config fields are missing";
    return false;
  }

  if (!isValidMotorType(config.motorType)) {
    _lastError = "Invalid motor type";
    return false;
  }

  if (!isSafeServoPin(config.servoPin)) {
    _lastError = "Invalid servo pin";
    return false;
  }

  if (config.pairingCode.length() > 0 && config.pairingCode.length() != 6) {
    _lastError = "Pairing code must be 6 digits";
    return false;
  }

  return true;
}

bool ConfigManager::isValidMotorType(const String &motorType) {
  return motorType == "continuous360" || motorType == "positional";
}

bool ConfigManager::isSafeServoPin(const String &pinLabel) {
  String pin = pinLabel;
  pin.toUpperCase();
  return pin == "D1" || pin == "D2" || pin == "D3" || pin == "D4" ||
         pin == "D5" || pin == "D6" || pin == "D7" || pin == "D8";
}

uint8_t ConfigManager::pinFromLabel(const String &pinLabel) {
  String pin = pinLabel;
  pin.toUpperCase();
  if (pin == "D1") return D1;
  if (pin == "D2") return D2;
  if (pin == "D3") return D3;
  if (pin == "D5") return D5;
  if (pin == "D6") return D6;
  if (pin == "D7") return D7;
  if (pin == "D8") return D8;
  return D4;
}

String ConfigManager::lastError() const {
  return _lastError;
}
