# Testing Plan

- Create a user and confirm `/users/{uid}` is created.
- Link one sample device and confirm it appears on `/devices`.
- Link two sample devices and confirm device selector/list shows both.
- Create a second user and verify that User A cannot read User B devices with rules enabled.
- Click Feed Now and confirm only `/devices/{deviceId}/commands/active` changes.
- Confirm no code path writes global `/feednow` or `/timers` in the new web app.
- Create and delete schedules under `/devices/{deviceId}/schedules`.
- Confirm logs render from `/devices/{deviceId}/logs`.
- Confirm build output deploys to Firebase Hosting and direct route refreshes work.
- Phase 2: verify ESP8266 Wi-Fi persistence, emergency stop, continuous servo, positional servo, status heartbeat, and schedule duplicate prevention.

## Phase 2 firmware tests

- Flash a blank ESP8266 and confirm the setup AP appears.
- Save setup portal config, power cycle repeatedly, and confirm `/config.json` remains available.
- Confirm the firmware authenticates as the device Firebase Auth user and writes heartbeat to `/devices/{deviceId}/status`.
- Send `feed`, `test_motor`, `emergency_stop`, and `sync_settings` commands to `/devices/{deviceId}/commands/active`.
- Confirm no firmware code reads or writes global `/feednow` or `/timers`.
- Confirm continuous 360 mode uses direction/write value/duration and stops after `maxRunMs`.
- Confirm positional mode clamps angles and returns to rest when configured.
- Add a schedule and confirm it triggers once per scheduled minute and updates `lastTriggeredKey`.
- Confirm logs are written under `/devices/{deviceId}/logs`.
