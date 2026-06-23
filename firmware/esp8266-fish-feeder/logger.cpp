#include "logger.h"

void Logger::begin(FirebaseData *fbdo, const String &deviceId) {
  _fbdo = fbdo;
  _deviceId = deviceId;
}

void Logger::log(const String &level, const String &message, unsigned long timestampMs) {
  Serial.print("[");
  Serial.print(level);
  Serial.print("] ");
  Serial.println(message);

  if (_fbdo == nullptr || _deviceId.length() == 0 || !Firebase.ready()) return;

  FirebaseJson json;
  json.set("level", level);
  json.set("message", message);
  json.set("createdAt", timestampMs);
  json.set("source", "device");

  String path = logsPath();
  Firebase.RTDB.pushJSON(_fbdo, path.c_str(), &json);
}

String Logger::logsPath() const {
  return "/devices/" + _deviceId + "/logs";
}
