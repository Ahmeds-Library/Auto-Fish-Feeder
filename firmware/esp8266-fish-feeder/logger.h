#pragma once

#include <Arduino.h>
#include <Firebase_ESP_Client.h>

class Logger {
 public:
  void begin(FirebaseData *fbdo, const String &deviceId);
  void log(const String &level, const String &message, unsigned long timestampMs);

 private:
  FirebaseData *_fbdo = nullptr;
  String _deviceId;
  String logsPath() const;
};
