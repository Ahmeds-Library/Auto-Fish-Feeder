#include "wifi_setup_portal.h"

#include <ESP8266WiFi.h>

WifiSetupPortal::WifiSetupPortal(ConfigManager *configManager, DeviceConfig *config)
    : _server(80), _configManager(configManager), _config(config) {}

void WifiSetupPortal::begin(bool filesystemMounted) {
  _filesystemMounted = filesystemMounted;
  String ssid = _config != nullptr && _config->deviceId.length() ? "FishFeeder-" + _config->deviceId : "FishFeeder-Setup";
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ssid.c_str(), "setup1234");

  _server.on("/", HTTP_GET, [this]() { handleRoot(); });
  _server.on("/save", HTTP_POST, [this]() { handleSave(); });
  _server.on("/factory-reset", HTTP_POST, [this]() { handleFactoryReset(); });
  _server.begin();

  Serial.print("Setup portal started: http://");
  Serial.println(WiFi.softAPIP());
}

void WifiSetupPortal::handleClient() {
  _server.handleClient();
}

void WifiSetupPortal::handleRoot() {
  String message = _filesystemMounted ? "Enter device configuration. Saved values persist in LittleFS across power cuts." : "LittleFS mount failed. Config cannot be saved until filesystem issue is fixed.";
  _server.send(200, "text/html", htmlPage(message));
}

void WifiSetupPortal::handleSave() {
  if (!_filesystemMounted) {
    _server.send(500, "text/html", htmlPage("LittleFS is not mounted; refusing to erase or overwrite config."));
    return;
  }

  const char *required[] = {"wifiSsid", "deviceId", "firebaseApiKey", "firebaseDatabaseUrl", "deviceEmail", "devicePassword", "adminPin"};
  for (size_t i = 0; i < sizeof(required) / sizeof(required[0]); i++) {
    if (!requiredArg(required[i])) {
      _server.send(400, "text/html", htmlPage(String("Missing required field: ") + required[i]));
      return;
    }
  }

  DeviceConfig newConfig;
  newConfig.configured = true;
  newConfig.wifiSsid = _server.arg("wifiSsid");
  newConfig.wifiPassword = _server.arg("wifiPassword");
  newConfig.deviceId = _server.arg("deviceId");
  newConfig.deviceName = _server.arg("deviceName").length() ? _server.arg("deviceName") : "Fish Feeder";
  newConfig.firebaseApiKey = _server.arg("firebaseApiKey");
  newConfig.firebaseDatabaseUrl = _server.arg("firebaseDatabaseUrl");
  newConfig.deviceEmail = _server.arg("deviceEmail");
  newConfig.devicePassword = _server.arg("devicePassword");
  newConfig.adminPin = _server.arg("adminPin");
  newConfig.motorType = _server.arg("motorType");
  newConfig.servoPin = _server.arg("servoPin").length() ? _server.arg("servoPin") : "D4";
  newConfig.timezoneOffsetSeconds = _server.arg("timezoneOffsetSeconds").length() ? _server.arg("timezoneOffsetSeconds").toInt() : 18000;

  if (!ConfigManager::isValidMotorType(newConfig.motorType) || !ConfigManager::isSafeServoPin(newConfig.servoPin)) {
    _server.send(400, "text/html", htmlPage("Invalid motor type or servo pin."));
    return;
  }

  if (!_configManager->save(newConfig)) {
    _server.send(500, "text/html", htmlPage("Config save failed: " + _configManager->lastError()));
    return;
  }

  _server.send(200, "text/html", htmlPage("Config saved. Restarting device..."));
  delay(1000);
  ESP.restart();
}

void WifiSetupPortal::handleFactoryReset() {
  if (!_filesystemMounted) {
    _server.send(500, "text/html", htmlPage("LittleFS is not mounted."));
    return;
  }

  if (_server.arg("confirmation") != "FACTORY_RESET_FISH_FEEDER") {
    _server.send(400, "text/html", htmlPage("Factory reset confirmation mismatch."));
    return;
  }

  if (_configManager->factoryReset(_server.arg("confirmation"))) {
    _server.send(200, "text/html", htmlPage("Config removed. Restarting into setup mode..."));
    delay(1000);
    ESP.restart();
  } else {
    _server.send(500, "text/html", htmlPage("Factory reset failed: " + _configManager->lastError()));
  }
}

String WifiSetupPortal::htmlPage(const String &message) {
  String html = F("<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'><title>FishFeeder Setup</title><style>body{font-family:Arial;background:#03111f;color:#e6fbff;margin:0;padding:24px}.card{max-width:760px;margin:auto;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:24px}label{display:block;margin-top:12px;color:#9bdff0}input,select{width:100%;box-sizing:border-box;padding:12px;border-radius:12px;border:1px solid #1e5b74;background:#061b2e;color:white}button{margin-top:18px;padding:12px 18px;border:0;border-radius:14px;background:#22d3ee;color:#03111f;font-weight:700}.warn{background:#44220a;padding:12px;border-radius:12px}</style></head><body><div class='card'><h1>FishFeeder Setup Portal</h1>");
  html += "<p class='warn'>" + message + "</p><form method='post' action='/save'>";
  html += input("wifiSsid", "Wi-Fi SSID *", _config->wifiSsid);
  html += input("wifiPassword", "Wi-Fi Password", _config->wifiPassword, "password");
  html += input("deviceId", "Device ID *", _config->deviceId);
  html += input("deviceName", "Device Name", _config->deviceName);
  html += input("firebaseApiKey", "Firebase API Key *", _config->firebaseApiKey);
  html += input("firebaseDatabaseUrl", "Firebase Database URL *", _config->firebaseDatabaseUrl);
  html += input("deviceEmail", "Device Email *", _config->deviceEmail, "email");
  html += input("devicePassword", "Device Password *", _config->devicePassword, "password");
  html += input("adminPin", "Admin PIN * (MVP stores plainly; hash in production)", _config->adminPin, "password");
  html += "<label>Motor Type</label><select name='motorType'><option value='continuous360'>continuous360</option><option value='positional'>positional</option></select>";
  html += input("servoPin", "Servo Pin", _config->servoPin.length() ? _config->servoPin : "D4");
  html += input("timezoneOffsetSeconds", "Timezone Offset Seconds", String(_config->timezoneOffsetSeconds));
  html += F("<button type='submit'>Save config and restart</button></form><hr><form method='post' action='/factory-reset'><input name='confirmation' placeholder='FACTORY_RESET_FISH_FEEDER'><button type='submit'>Factory reset config</button></form></div></body></html>");
  return html;
}

String WifiSetupPortal::input(const String &name, const String &label, const String &value, const String &type) {
  return "<label>" + label + "</label><input type='" + type + "' name='" + name + "' value='" + value + "'>";
}

bool WifiSetupPortal::requiredArg(const String &name) {
  return _server.hasArg(name) && _server.arg(name).length() > 0;
}
