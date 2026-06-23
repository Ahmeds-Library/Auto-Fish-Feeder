#include "motor_controller.h"

void MotorController::begin(uint8_t servoPin, const MotorSettings &settings) {
  _settings = settings;
  _servo.attach(servoPin);
  _attached = true;
  stop();
}

void MotorController::applySettings(const MotorSettings &settings) {
  _settings = settings;
  stop();
}

bool MotorController::runFeed(const FeedRequest &request, String &errorOut) {
  String type = request.motorType.length() ? request.motorType : _settings.motorType;
  if (type == "continuous360") return runContinuous(request, errorOut);
  if (type == "positional") return runPositional(request, errorOut);
  errorOut = "Unknown motor type: " + type;
  stop();
  return false;
}

bool MotorController::runContinuous(const FeedRequest &request, String &errorOut) {
  if (!_attached) {
    errorOut = "Servo is not attached";
    return false;
  }

  unsigned long duration = request.durationMs > 0 ? request.durationMs : _settings.continuous360.defaultDurationMs;
  if (duration > _settings.safety.maxRunMs) {
    duration = _settings.safety.maxRunMs;
  }

  String direction = request.direction.length() ? request.direction : _settings.continuous360.defaultDirection;
  int writeValue = direction == "ccw" ? _settings.continuous360.ccwValue : _settings.continuous360.cwValue;

  // Continuous 360 servos do not move to exact degrees. They are driven by
  // direction/write value and duration, then stopped.
  _state = "running";
  _servo.write(clampAngle(writeValue, 0, 180));
  delay(duration);
  _servo.write(clampAngle(_settings.continuous360.stopValue, 0, 180));
  delay(150);
  _lastRunDurationMs = duration;
  _state = "idle";
  return true;
}

bool MotorController::runPositional(const FeedRequest &, String &errorOut) {
  if (!_attached) {
    errorOut = "Servo is not attached";
    return false;
  }

  unsigned long hold = _settings.positional.holdMs;
  if (hold > _settings.safety.maxRunMs) {
    hold = _settings.safety.maxRunMs;
  }

  int minAngle = clampAngle(_settings.positional.minAngle, 0, 180);
  int maxAngle = clampAngle(_settings.positional.maxAngle, minAngle, 180);
  int feedAngle = clampAngle(_settings.positional.feedAngle, minAngle, maxAngle);
  int restAngle = clampAngle(_settings.positional.restAngle, minAngle, maxAngle);

  _state = "running";
  _servo.write(feedAngle);
  delay(hold);
  if (_settings.positional.returnAfterFeed) {
    _servo.write(restAngle);
  }
  _lastRunDurationMs = hold;
  _state = "idle";
  return true;
}

void MotorController::emergencyStop() {
  if (!_attached) return;
  if (_settings.motorType == "positional") {
    _servo.write(clampAngle(_settings.positional.restAngle, 0, 180));
  } else {
    _servo.write(clampAngle(_settings.continuous360.stopValue, 0, 180));
  }
  _state = "stopped";
}

void MotorController::stop() {
  if (!_attached) return;
  if (_settings.motorType == "positional") {
    _servo.write(clampAngle(_settings.positional.restAngle, 0, 180));
  } else {
    _servo.write(clampAngle(_settings.continuous360.stopValue, 0, 180));
  }
  _state = "idle";
}

String MotorController::state() const {
  return _state;
}

unsigned long MotorController::lastRunDurationMs() const {
  return _lastRunDurationMs;
}

int MotorController::clampAngle(int value, int minAngle, int maxAngle) {
  if (value < minAngle) return minAngle;
  if (value > maxAngle) return maxAngle;
  return value;
}
