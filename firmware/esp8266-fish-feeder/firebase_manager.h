#pragma once

#include <Arduino.h>
#include <Firebase_ESP_Client.h>
#include <NTPClient.h>

#include "config_manager.h"
#include "logger.h"
#include "motor_controller.h"

class FirebaseManager {
 public:
  bool begin(const DeviceConfig &deviceConfig, MotorController *motor, Logger *logger, NTPClient *timeClient, ConfigManager *configManager);
  void loop();
  bool syncSettings();
  void sendHeartbeat();
  void processActiveCommand();
  void ensurePairingRequest();
  void markMotorState(const String &state);
  void markFeedingComplete(const String &status);
  void setTodayCountIfNeeded();
  FirebaseData *data();
  String devicePath(const String &child) const;
  unsigned long nowMs() const;
  const MotorSettings &settings() const;

 private:
  FirebaseData _fbdo;
  FirebaseAuth _auth;
  FirebaseConfig _firebaseConfig;
  DeviceConfig _deviceConfig;
  MotorSettings _settings;
  MotorController *_motor = nullptr;
  Logger *_logger = nullptr;
  NTPClient *_timeClient = nullptr;
  ConfigManager *_configManager = nullptr;
  unsigned long _lastHeartbeatMs = 0;
  unsigned long _lastCommandPollMs = 0;
  unsigned long _lastSettingsSyncMs = 0;
  unsigned long _lastPairingCheckMs = 0;
  String _todayKey;
  int _todayCount = 0;

  void handleCommand(FirebaseJson *json);
  void setCommandStatus(const String &status, const String &message = "");
  FeedRequest feedRequestFromJson(FirebaseJson *json);
  bool readString(FirebaseJson *json, const String &path, String &out);
  bool readInt(FirebaseJson *json, const String &path, int &out);
  bool readBool(FirebaseJson *json, const String &path, bool &out);
  bool isPaired();
  String currentDateKey() const;
};
