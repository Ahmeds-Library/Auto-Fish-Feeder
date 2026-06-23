#pragma once

#include <Arduino.h>
#include <Servo.h>

struct Continuous360Settings {
  int cwValue = 0;
  int ccwValue = 180;
  int stopValue = 90;
  String defaultDirection = "cw";
  unsigned long defaultDurationMs = 700;
};

struct PositionalSettings {
  int minAngle = 0;
  int maxAngle = 180;
  int restAngle = 90;
  int feedAngle = 0;
  bool returnAfterFeed = true;
  unsigned long holdMs = 700;
};

struct SafetySettings {
  unsigned long maxRunMs = 10000;
  bool emergencyStopEnabled = true;
};

struct MotorSettings {
  String motorType = "continuous360";
  String servoPin = "D4";
  long timezoneOffsetSeconds = 18000;
  SafetySettings safety;
  Continuous360Settings continuous360;
  PositionalSettings positional;
};

struct FeedRequest {
  String motorType = "";
  String direction = "";
  unsigned long durationMs = 0;
  String source = "manual";
};

class MotorController {
 public:
  void begin(uint8_t servoPin, const MotorSettings &settings);
  void applySettings(const MotorSettings &settings);
  bool runFeed(const FeedRequest &request, String &errorOut);
  void emergencyStop();
  void stop();
  String state() const;
  unsigned long lastRunDurationMs() const;

 private:
  Servo _servo;
  MotorSettings _settings;
  bool _attached = false;
  String _state = "idle";
  unsigned long _lastRunDurationMs = 0;

  bool runContinuous(const FeedRequest &request, String &errorOut);
  bool runPositional(const FeedRequest &request, String &errorOut);
  int clampAngle(int value, int minAngle, int maxAngle);
};
