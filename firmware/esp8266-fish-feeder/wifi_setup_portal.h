#pragma once

#include <Arduino.h>
#include <ESP8266WebServer.h>

#include "config_manager.h"

class WifiSetupPortal {
 public:
  WifiSetupPortal(ConfigManager *configManager, DeviceConfig *config);
  void begin(bool filesystemMounted);
  void handleClient();

 private:
  ESP8266WebServer _server;
  ConfigManager *_configManager;
  DeviceConfig *_config;
  bool _filesystemMounted = false;

  void handleRoot();
  void handleSave();
  void handleFactoryReset();
  String htmlPage(const String &message = "");
  String input(const String &name, const String &label, const String &value, const String &type = "text");
  bool requiredArg(const String &name);
};
