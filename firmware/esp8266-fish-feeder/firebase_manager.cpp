#include "firebase_manager.h"

#include <ESP8266WiFi.h>
#include <addons/RTDBHelper.h>
#include <addons/TokenHelper.h>

namespace {
const char *FIRMWARE_VERSION = "2.0.0";
const unsigned long HEARTBEAT_INTERVAL_MS = 20000;
const unsigned long COMMAND_POLL_INTERVAL_MS = 2500;
const unsigned long SETTINGS_SYNC_INTERVAL_MS = 60000;
const unsigned long PAIRING_CHECK_INTERVAL_MS = 60000;
const unsigned long PAIRING_TTL_MS = 15UL * 60UL * 1000UL;
}

bool FirebaseManager::begin(const DeviceConfig &deviceConfig, MotorController *motor, Logger *logger, NTPClient *timeClient, ConfigManager *configManager) {
  _deviceConfig = deviceConfig;
  _motor = motor;
  _logger = logger;
  _timeClient = timeClient;
  _configManager = configManager;
  _settings.motorType = _deviceConfig.motorType;
  _settings.servoPin = _deviceConfig.servoPin;
  _settings.timezoneOffsetSeconds = _deviceConfig.timezoneOffsetSeconds;

  _firebaseConfig.api_key = _deviceConfig.firebaseApiKey;
  _firebaseConfig.database_url = _deviceConfig.firebaseDatabaseUrl;
  _auth.user.email = _deviceConfig.deviceEmail;
  _auth.user.password = _deviceConfig.devicePassword;
  _firebaseConfig.token_status_callback = tokenStatusCallback;

  Firebase.begin(&_firebaseConfig, &_auth);
  Firebase.reconnectWiFi(true);

  _logger->begin(&_fbdo, _deviceConfig.deviceId);
  _logger->log("info", "Firebase device auth starting", nowMs());
  return true;
}

void FirebaseManager::loop() {
  if (!Firebase.ready()) return;

  unsigned long now = millis();
  if (now - _lastHeartbeatMs > HEARTBEAT_INTERVAL_MS) {
    sendHeartbeat();
    _lastHeartbeatMs = now;
  }

  if (now - _lastSettingsSyncMs > SETTINGS_SYNC_INTERVAL_MS) {
    syncSettings();
    _lastSettingsSyncMs = now;
  }

  if (now - _lastCommandPollMs > COMMAND_POLL_INTERVAL_MS) {
    processActiveCommand();
    _lastCommandPollMs = now;
  }

  if (now - _lastPairingCheckMs > PAIRING_CHECK_INTERVAL_MS) {
    ensurePairingRequest();
    _lastPairingCheckMs = now;
  }
}

bool FirebaseManager::syncSettings() {
  if (!Firebase.RTDB.getJSON(&_fbdo, devicePath("settings").c_str())) {
    _logger->log("warning", "Cloud settings missing or unreadable; using safe defaults", nowMs());
    return false;
  }

  FirebaseJson *json = _fbdo.to<FirebaseJson *>();
  String stringValue;
  int intValue;
  bool boolValue;

  if (readString(json, "motorType", stringValue)) _settings.motorType = stringValue;
  if (readString(json, "servoPin", stringValue)) _settings.servoPin = stringValue;
  if (readInt(json, "timezoneOffsetSeconds", intValue)) _settings.timezoneOffsetSeconds = intValue;
  if (readInt(json, "safety/maxRunMs", intValue)) _settings.safety.maxRunMs = intValue;
  if (readBool(json, "safety/emergencyStopEnabled", boolValue)) _settings.safety.emergencyStopEnabled = boolValue;

  if (readInt(json, "continuous360/cwValue", intValue)) _settings.continuous360.cwValue = intValue;
  if (readInt(json, "continuous360/ccwValue", intValue)) _settings.continuous360.ccwValue = intValue;
  if (readInt(json, "continuous360/stopValue", intValue)) _settings.continuous360.stopValue = intValue;
  if (readString(json, "continuous360/defaultDirection", stringValue)) _settings.continuous360.defaultDirection = stringValue;
  if (readInt(json, "continuous360/defaultDurationMs", intValue)) _settings.continuous360.defaultDurationMs = intValue;

  if (readInt(json, "positional/minAngle", intValue)) _settings.positional.minAngle = intValue;
  if (readInt(json, "positional/maxAngle", intValue)) _settings.positional.maxAngle = intValue;
  if (readInt(json, "positional/restAngle", intValue)) _settings.positional.restAngle = intValue;
  if (readInt(json, "positional/feedAngle", intValue)) _settings.positional.feedAngle = intValue;
  if (readBool(json, "positional/returnAfterFeed", boolValue)) _settings.positional.returnAfterFeed = boolValue;
  if (readInt(json, "positional/holdMs", intValue)) _settings.positional.holdMs = intValue;

  if (!ConfigManager::isValidMotorType(_settings.motorType)) {
    _logger->log("error", "Invalid cloud motor type; keeping local safe default", nowMs());
    _settings.motorType = _deviceConfig.motorType;
  }

  if (_motor != nullptr) _motor->applySettings(_settings);
  _logger->log("info", "Cloud settings synced", nowMs());
  return true;
}

void FirebaseManager::sendHeartbeat() {
  FirebaseJson updates;
  updates.set("online", true);
  updates.set("lastSeen", nowMs());
  updates.set("firmwareVersion", FIRMWARE_VERSION);
  updates.set("wifi/connected", WiFi.status() == WL_CONNECTED);
  updates.set("wifi/rssi", WiFi.RSSI());
  updates.set("firebase/connected", Firebase.ready());
  updates.set("firebase/lastError", _fbdo.errorReason());

  Firebase.RTDB.updateNode(&_fbdo, devicePath("status").c_str(), &updates);
}

void FirebaseManager::ensurePairingRequest() {
  if (_deviceConfig.pairingCode.length() != 6 || isPaired()) return;

  String path = "/pairingRequests/" + _deviceConfig.pairingCode;
  double now = (double)_timeClient->getEpochTime() * 1000.0;

  if (Firebase.RTDB.getJSON(&_fbdo, path.c_str())) {
    FirebaseJson *existing = _fbdo.to<FirebaseJson *>();
    FirebaseJsonData data;
    bool claimed = false;
    double expiresAt = 0;
    if (existing->get(data, "claimed")) claimed = data.boolValue;
    if (existing->get(data, "expiresAt")) expiresAt = data.doubleValue;
    if (!claimed && expiresAt > now) return;
  }

  FirebaseJson request;
  request.set("deviceId", _deviceConfig.deviceId);
  request.set("deviceName", _deviceConfig.deviceName.length() ? _deviceConfig.deviceName : "Fish Feeder " + _deviceConfig.deviceId);
  request.set("createdAt", now);
  request.set("expiresAt", now + PAIRING_TTL_MS);
  request.set("claimed", false);
  request.set("source", "device");

  if (Firebase.RTDB.setJSON(&_fbdo, path.c_str(), &request)) {
    _logger->log("info", "Pairing request published", nowMs());
  } else {
    _logger->log("warning", "Pairing request publish failed: " + _fbdo.errorReason(), nowMs());
  }
}

bool FirebaseManager::isPaired() {
  if (!Firebase.RTDB.getString(&_fbdo, devicePath("ownerUid").c_str())) return false;
  return _fbdo.stringData().length() > 0;
}

void FirebaseManager::processActiveCommand() {
  if (!Firebase.RTDB.getJSON(&_fbdo, devicePath("commands/active").c_str())) return;
  FirebaseJson *json = _fbdo.to<FirebaseJson *>();
  String status;
  if (!readString(json, "status", status) || status != "pending") return;
  handleCommand(json);
}

void FirebaseManager::handleCommand(FirebaseJson *json) {
  String type;
  readString(json, "type", type);
  _logger->log("command", "Command received: " + type, nowMs());
  setCommandStatus("running");

  if (type == "sync_settings") {
    bool ok = syncSettings();
    setCommandStatus(ok ? "completed" : "failed", ok ? "Settings synced" : "Settings sync failed");
    return;
  }

  if (type == "emergency_stop") {
    if (_settings.safety.emergencyStopEnabled && _motor != nullptr) _motor->emergencyStop();
    markMotorState("stopped");
    _logger->log("warning", "Emergency stop executed", nowMs());
    setCommandStatus("completed", "Emergency stop executed");
    return;
  }

  if (type == "factory_reset") {
    String confirmation;
    readString(json, "payload/confirmation", confirmation);
    if (_configManager != nullptr && _configManager->factoryReset(confirmation)) {
      _logger->log("warning", "Factory reset accepted; restarting", nowMs());
      setCommandStatus("completed", "Factory reset accepted");
      delay(500);
      ESP.restart();
    } else {
      setCommandStatus("failed", "Factory reset confirmation missing or invalid");
    }
    return;
  }

  if (type != "feed" && type != "test_motor") {
    setCommandStatus("failed", "Unsupported command type: " + type);
    return;
  }

  markMotorState("running");
  FeedRequest request = feedRequestFromJson(json);
  if (type == "test_motor" && request.durationMs == 0) request.durationMs = 250;

  String error;
  bool ok = _motor != nullptr && _motor->runFeed(request, error);
  _motor->stop();

  if (ok) {
    markMotorState("idle");
    markFeedingComplete("completed");
    _logger->log("success", type + " completed", nowMs());
    setCommandStatus("completed", "Motor command completed");
  } else {
    markMotorState("idle");
    Firebase.RTDB.setString(&_fbdo, devicePath("status/lastError").c_str(), error);
    _logger->log("error", error, nowMs());
    setCommandStatus("failed", error);
  }
}

void FirebaseManager::setCommandStatus(const String &status, const String &message) {
  FirebaseJson updates;
  updates.set("status", status);
  updates.set("updatedAt", nowMs());
  if (message.length()) updates.set("message", message);
  Firebase.RTDB.updateNode(&_fbdo, devicePath("commands/active").c_str(), &updates);
}

void FirebaseManager::markMotorState(const String &state) {
  FirebaseJson updates;
  updates.set("state", state);
  updates.set("lastRunAt", nowMs());
  updates.set("lastRunDurationMs", _motor != nullptr ? _motor->lastRunDurationMs() : 0);
  Firebase.RTDB.updateNode(&_fbdo, devicePath("status/motor").c_str(), &updates);
}

void FirebaseManager::markFeedingComplete(const String &status) {
  setTodayCountIfNeeded();
  _todayCount++;
  FirebaseJson updates;
  updates.set("todayCount", _todayCount);
  updates.set("todayKey", _todayKey);
  updates.set("lastFeedAt", nowMs());
  updates.set("lastFeedStatus", status);
  Firebase.RTDB.updateNode(&_fbdo, devicePath("status/feeding").c_str(), &updates);
}

void FirebaseManager::setTodayCountIfNeeded() {
  String key = currentDateKey();
  if (key != _todayKey) {
    _todayKey = key;
    _todayCount = 0;
  }
}

FeedRequest FirebaseManager::feedRequestFromJson(FirebaseJson *json) {
  FeedRequest request;
  String value;
  int intValue;
  if (readString(json, "payload/motorType", value)) request.motorType = value;
  if (readString(json, "payload/direction", value)) request.direction = value;
  if (readString(json, "payload/source", value)) request.source = value;
  if (readInt(json, "payload/durationMs", intValue)) request.durationMs = intValue;
  return request;
}

bool FirebaseManager::readString(FirebaseJson *json, const String &path, String &out) {
  FirebaseJsonData data;
  if (!json->get(data, path)) return false;
  out = data.stringValue;
  return true;
}

bool FirebaseManager::readInt(FirebaseJson *json, const String &path, int &out) {
  FirebaseJsonData data;
  if (!json->get(data, path)) return false;
  out = data.intValue;
  return true;
}

bool FirebaseManager::readBool(FirebaseJson *json, const String &path, bool &out) {
  FirebaseJsonData data;
  if (!json->get(data, path)) return false;
  out = data.boolValue;
  return true;
}

FirebaseData *FirebaseManager::data() {
  return &_fbdo;
}

String FirebaseManager::devicePath(const String &child) const {
  return "/devices/" + _deviceConfig.deviceId + "/" + child;
}

unsigned long FirebaseManager::nowMs() const {
  if (_timeClient != nullptr) return _timeClient->getEpochTime() * 1000UL;
  return millis();
}

const MotorSettings &FirebaseManager::settings() const {
  return _settings;
}

String FirebaseManager::currentDateKey() const {
  unsigned long epoch = _timeClient != nullptr ? _timeClient->getEpochTime() : 0;
  unsigned long days = epoch / 86400UL;
  return String(days);
}
