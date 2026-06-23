#include "scheduler.h"

namespace {
const unsigned long SCHEDULE_CHECK_INTERVAL_MS = 15000;
}

void Scheduler::begin(FirebaseManager *firebase, MotorController *motor, Logger *logger, NTPClient *timeClient) {
  _firebase = firebase;
  _motor = motor;
  _logger = logger;
  _timeClient = timeClient;
}

void Scheduler::loop() {
  if (_firebase == nullptr || !Firebase.ready()) return;
  unsigned long now = millis();
  if (now - _lastCheckMs > SCHEDULE_CHECK_INTERVAL_MS) {
    checkSchedules();
    _lastCheckMs = now;
  }
}

void Scheduler::checkSchedules() {
  FirebaseData *fbdo = _firebase->data();
  String path = _firebase->devicePath("schedules");
  if (!Firebase.RTDB.getJSON(fbdo, path.c_str())) return;

  FirebaseJson *json = fbdo->to<FirebaseJson *>();
  size_t count = json->iteratorBegin();
  String key;
  String value;
  int type = 0;
  String currentDay = dayName();
  String currentTime = hhmm();
  String triggerKey = minuteKey();

  for (size_t i = 0; i < count; i++) {
    json->iteratorGet(i, type, key, value);
    if (!value.startsWith("{")) continue;

    FirebaseJson schedule;
    schedule.setJsonData(value);
    if (!shouldRun(&schedule, triggerKey, currentDay, currentTime)) continue;

    _logger->log("command", "Schedule triggered: " + key, _firebase->nowMs());
    String error;
    FeedRequest request = requestFromSchedule(&schedule);
    bool ok = _motor != nullptr && _motor->runFeed(request, error);
    if (_motor != nullptr) _motor->stop();

    Firebase.RTDB.setString(fbdo, (path + "/" + key + "/lastTriggeredKey").c_str(), triggerKey);
    if (ok) {
      _firebase->markFeedingComplete("completed");
      _logger->log("success", "Scheduled feed completed", _firebase->nowMs());
    } else {
      _logger->log("error", "Scheduled feed failed: " + error, _firebase->nowMs());
    }
  }

  json->iteratorEnd();
}

bool Scheduler::shouldRun(FirebaseJson *schedule, const String &triggerKey, const String &day, const String &time) {
  FirebaseJsonData data;
  if (!schedule->get(data, "enabled") || !data.boolValue) return false;
  if (!schedule->get(data, "time") || data.stringValue != time) return false;
  if (schedule->get(data, "lastTriggeredKey") && data.stringValue == triggerKey) return false;
  return dayAllowed(schedule, day);
}

bool Scheduler::dayAllowed(FirebaseJson *schedule, const String &day) {
  FirebaseJsonData data;
  if (!schedule->get(data, "days")) return true;
  String serializedDays = data.stringValue;
  return serializedDays.indexOf(day) >= 0;
}

FeedRequest Scheduler::requestFromSchedule(FirebaseJson *schedule) {
  FeedRequest request;
  FirebaseJsonData data;
  request.source = "schedule";
  if (schedule->get(data, "motorType")) request.motorType = data.stringValue;
  if (schedule->get(data, "direction")) request.direction = data.stringValue;
  if (schedule->get(data, "durationMs")) request.durationMs = data.intValue;
  if (request.durationMs == 0) request.durationMs = _firebase->settings().continuous360.defaultDurationMs;
  return request;
}

String Scheduler::dayName() const {
  static const char *days[] = {"sun", "mon", "tue", "wed", "thu", "fri", "sat"};
  int index = _timeClient != nullptr ? _timeClient->getDay() : 0;
  if (index < 0 || index > 6) index = 0;
  return days[index];
}

String Scheduler::minuteKey() const {
  unsigned long epoch = _timeClient != nullptr ? _timeClient->getEpochTime() : 0;
  return String(epoch / 60UL);
}

String Scheduler::hhmm() const {
  if (_timeClient == nullptr) return "00:00";
  char buffer[6];
  snprintf(buffer, sizeof(buffer), "%02d:%02d", _timeClient->getHours(), _timeClient->getMinutes());
  return String(buffer);
}
