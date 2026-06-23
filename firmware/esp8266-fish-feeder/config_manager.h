#pragma once

#include <Arduino.h>

struct DeviceConfig {
  bool configured = false;
  String wifiSsid;
  String wifiPassword;
  String deviceId;
  String deviceName;
  String firebaseApiKey;
  String firebaseDatabaseUrl;
  String deviceEmail;
  String devicePassword;
  String adminPin;
  String motorType = "continuous360";
  String servoPin = "D4";
  long timezoneOffsetSeconds = 18000;
};

class ConfigManager {
 public:
  bool begin();
  bool load(DeviceConfig &config);
  bool save(const DeviceConfig &config);
  bool factoryReset(const String &confirmation);
  bool exists() const;
  String lastError() const;

  static bool isValidMotorType(const String &motorType);
  static bool isSafeServoPin(const String &pinLabel);
  static uint8_t pinFromLabel(const String &pinLabel);

 private:
  String _lastError;
  bool validate(const DeviceConfig &config);
};
