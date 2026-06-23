# Architecture

Phase 1 converts FishFeeder into a Firebase-hosted multi-device dashboard foundation.

## Flow
- Web users authenticate with Firebase Authentication.
- User profiles live at `/users/{uid}`.
- Device ownership is represented by `/users/{uid}/devices/{deviceId}: true` and `/devices/{deviceId}/ownerUid`.
- The dashboard loads only linked device IDs and then reads `/devices/{deviceId}`.
- Manual feed writes a command to `/devices/{deviceId}/commands/active` only.
- Global `/feednow` and `/timers` are not used because they can trigger every feeder in a shared database.

## Phase 2 firmware contract
ESP8266 firmware should authenticate as a per-device Firebase Auth user, read its own `/devices/{deviceId}` paths, write `status` and `logs`, and process pending commands.

## Pairing limitation
Phase 1 intentionally provides a pairing UI placeholder only. Production pairing should be implemented with Cloud Functions/admin approval or carefully pre-provisioned rules so users cannot claim arbitrary devices.

## Phase 2 firmware architecture

The ESP8266 firmware now lives in `firmware/esp8266-fish-feeder/`. It boots by mounting LittleFS without auto-formatting, loading `/config.json`, and starting the setup AP portal when config is missing or invalid. Normal operation connects to saved Wi-Fi, authenticates to Firebase with a device-specific email/password identity, syncs settings, polls `/devices/{deviceId}/commands/active`, writes heartbeat status, writes logs, and checks `/devices/{deviceId}/schedules`.

Each device must have a Firebase Auth account and `/devices/{deviceId}/deviceAuthUid` must match that account UID for device status/log writes under the MVP rules. Firmware uses only per-device database paths and does not use global command or timer paths.
