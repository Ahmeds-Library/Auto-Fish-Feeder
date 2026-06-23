#pragma once

#include <Arduino.h>
#include <Firebase_ESP_Client.h>
#include <NTPClient.h>

#include "firebase_manager.h"
#include "logger.h"
#include "motor_controller.h"

class Scheduler {
 public:
  void begin(FirebaseManager *firebase, MotorController *motor, Logger *logger, NTPClient *timeClient);
  void loop();

 private:
  FirebaseManager *_firebase = nullptr;
  MotorController *_motor = nullptr;
  Logger *_logger = nullptr;
  NTPClient *_timeClient = nullptr;
  unsigned long _lastCheckMs = 0;

  void checkSchedules();
  bool shouldRun(FirebaseJson *schedule, const String &triggerKey, const String &dayName, const String &hhmm);
  bool dayAllowed(FirebaseJson *schedule, const String &dayName);
  FeedRequest requestFromSchedule(FirebaseJson *schedule);
  String dayName() const;
  String minuteKey() const;
  String hhmm() const;
};
