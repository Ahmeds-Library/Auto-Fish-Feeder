# ESP8266 FishFeeder Firmware 2.0.0

Production-style Phase 2 firmware for Wemos D1 Mini / ESP8266 fish feeders using Firebase Authentication, Realtime Database, LittleFS persistent config, and per-device paths.

## Required Arduino setup

Board:
- Wemos D1 Mini / ESP8266

Libraries:
- ESP8266WiFi
- ESP8266WebServer
- LittleFS
- ArduinoJson
- Servo
- WiFiUdp
- NTPClient
- Firebase ESP Client (`Firebase_ESP_Client`)

Open `esp8266-fish-feeder.ino` in the Arduino IDE from this folder so the companion `.h/.cpp` files are included as sketch tabs.

## First boot setup portal

On first boot, or when `/config.json` is missing/invalid, the device starts AP mode:

- SSID: `FishFeeder-Setup` or `FishFeeder-{deviceId}` when known
- Password: `setup1234`
- URL: `http://192.168.4.1`

The portal collects Wi-Fi SSID/password, device ID, device name, Firebase API key, database URL, device email/password, admin PIN, motor type, servo pin, and timezone offset seconds.

## Persistent config

Config is stored in LittleFS at `/config.json`. The firmware mounts LittleFS without formatting on normal boot. It does not erase Wi-Fi or Firebase credentials after power cuts. Factory reset removes only `/config.json` and requires the confirmation string `FACTORY_RESET_FISH_FEEDER`.

MVP note: `adminPin` is stored plainly. Production hardware should hash it or use a stronger local admin credential design.

## Firebase device identity

Each ESP should have its own Firebase Authentication email/password account, such as `ff-001@device.local`. In Realtime Database, `/devices/{deviceId}/deviceAuthUid` must match that device account UID so rules allow status/log writes.

## Paths used

The firmware uses only per-device paths:

- `/devices/{deviceId}/commands/active`
- `/devices/{deviceId}/settings`
- `/devices/{deviceId}/schedules`
- `/devices/{deviceId}/status`
- `/devices/{deviceId}/logs`

It does not use legacy global `/feednow` or `/timers`.

## Command handling

Supported command types:
- `feed`
- `test_motor`
- `emergency_stop`
- `sync_settings`
- `factory_reset` with confirmation payload

Pending commands are marked `running`, executed, then marked `completed` or `failed`. Feed completion updates `status/feeding` and writes logs.

## Motor safety

Continuous 360 servos are controlled by direction/write value/duration, not precise degree rotation. Positional servos move to a feed angle, hold, and optionally return to rest. Durations are clamped to `settings/safety/maxRunMs`, and every command stops the motor afterward.

## Schedules

The scheduler reads `/devices/{deviceId}/schedules`, checks enabled schedules by day and HH:MM using NTP, updates `lastTriggeredKey`, and runs the same motor path as manual feed. Offline cached schedules are not implemented in Phase 2.

## Flash and test

1. Install the ESP8266 board package and required libraries.
2. Select `LOLIN(WEMOS) D1 R2 & mini` or equivalent ESP8266 board.
3. Flash `esp8266-fish-feeder.ino`.
4. Join the setup AP and save config.
5. Create/link the device in Firebase and ensure `deviceAuthUid` matches the ESP Auth UID.
6. Open the web dashboard and send Feed Now.
7. Confirm command status, status heartbeat, feeding fields, and logs update under `/devices/{deviceId}`.

## Known limitations

- Pairing/provisioning still requires manual Firebase setup or a future trusted Cloud Function.
- Log retention is not purged on-device; use web/admin tooling or Cloud Functions for cleanup.
- Offline schedule cache is not implemented in this phase.
