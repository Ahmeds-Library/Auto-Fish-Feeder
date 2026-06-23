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

## Phase 3 auth and pairing tests

- Signup with a new email and confirm the success message says “Account created successfully. Please log in.”
- Confirm signup signs the user out and redirects to `/auth/login`.
- Try login with an unknown email and confirm the “Go to signup” action appears.
- Try login with a wrong password and confirm a friendly error message appears.
- Use `/auth/forgot-password` and confirm the safe reset message appears.
- Open `/devices/pair?deviceId=FF-A84F21&code=483921` and confirm fields prefill.
- Pair with a valid unexpired code and confirm the user sees only their own device.
- Pair with an expired code and confirm the Cloud Function returns an expiry error.
- Pair an already claimed device and confirm the Cloud Function rejects the claim.
- Confirm normal users cannot directly write `/devices/{deviceId}/ownerUid`.

## Phase 4 pre-hardware dashboard tests

- Feed Now from `/devices/{deviceId}/feed` and confirm `commands/active/type` is `feed`.
- Feed Test from `/devices/{deviceId}/feed` and confirm `commands/active/type` is `test_motor`.
- Emergency Stop from `/devices/{deviceId}/feed` and confirm `commands/active/type` is `emergency_stop`.
- Sync Settings and motor calibration save from `/devices/{deviceId}/motor-settings`; confirm continuous values, positional values, and `settings/safety/maxRunMs` are saved.
- Validate motor settings client-side: angles/write values stay 0–180, durations stay 100–10000 ms, and positional feed/rest angles stay inside min/max.
- Create, edit, toggle, and delete schedules with enabled/time/days/feedMode/motorType/direction/durationMs under `/devices/{deviceId}/schedules/{scheduleId}`.
- Confirm successful pairing redirects to `/devices/{deviceId}/overview` after the Cloud Function returns success.
- Confirm Dashboard shows the new React clock card and the old clock code is still only in `legacy/`.
- Confirm the Active Command Status card appears on Overview and Feed pages with pending/running/completed/failed status tones.
- Re-run the forbidden-path search and confirm active code does not use global `/feednow` or `/timers`.
