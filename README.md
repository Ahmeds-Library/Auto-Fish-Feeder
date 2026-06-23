# Auto Fish Feeder — Multi-Device Firebase IoT Dashboard

This repository now uses the upgraded multi-device architecture as the active project. The old single-device prototype has been moved to `legacy/` and must not be deployed or flashed for the upgraded system.

## Active project structure

```text
web/                         Active React + Vite + Tailwind Firebase dashboard
firmware/esp8266-fish-feeder/ Active ESP8266 / Wemos D1 Mini firmware
firebase/                    Active Realtime Database rules and seed data
docs/                        Active architecture, setup, schema, and testing docs
firebase.json                Firebase Hosting config for web/dist
.firebaserc.example          Example Firebase project config
legacy/                      Historical prototype only; do not deploy or flash
```

## Active frontend

The active dashboard is in `web/`.

```bash
cd web
cp .env.example .env
npm install
npm run dev
npm run build
```

Fill `.env` locally with Firebase Web App values. Do not commit `.env` or real Firebase credentials.

## Firebase Hosting deploy

`firebase.json` deploys only the React production build from `web/dist`; it does not deploy the old static prototype.

```bash
firebase use <project-id>
firebase deploy --only hosting,database
```

The Hosting rewrite sends all SPA routes to `/index.html`.

## Active firmware

The active firmware is in `firmware/esp8266-fish-feeder/`.

Flash `firmware/esp8266-fish-feeder/esp8266-fish-feeder.ino` to a Wemos D1 Mini / ESP8266. On first boot, join `FishFeeder-Setup` with password `setup1234`, open `http://192.168.4.1`, and enter Wi-Fi, Firebase, device Auth, motor, pin, and timezone settings.

Each ESP needs its own Firebase Auth account, and `/devices/{deviceId}/deviceAuthUid` must match that account UID.

## Active Firebase paths

The upgraded system uses per-device paths only:

- `/devices/{deviceId}/commands/active`
- `/devices/{deviceId}/settings`
- `/devices/{deviceId}/schedules`
- `/devices/{deviceId}/status`
- `/devices/{deviceId}/logs`
- `/users/{uid}/devices/{deviceId}`

Do not use the old global `/feednow` path.
Do not use the old global `/timers` path.

## Legacy code

`legacy/` contains the original prototype static web UI and Arduino firmware for historical reference only. Do not deploy it to Firebase Hosting and do not flash it to devices for the multi-device system.

## Documentation

- `docs/architecture.md`
- `docs/database-schema.md`
- `docs/setup-guide.md`
- `docs/testing-plan.md`
- `firmware/esp8266-fish-feeder/README.md`

## Auth and secure pairing

Signup creates `/users/{uid}`, signs the user out, shows “Account created successfully. Please log in.”, and redirects to `/auth/login`. Login and password reset pages show user-friendly errors.

Device pairing uses the setup portal and Cloud Function flow. The browser cannot scan nearby Wi-Fi networks directly, so connect to the FishFeeder setup Wi-Fi manually, open `http://192.168.4.1`, then use the Device ID and 6-digit pairing code or pairing URL in `/devices/pair`.

The `claimDevice` Cloud Function validates `/pairingRequests/{pairingCode}`, expiry, claim state, and current device ownership before linking the device to the logged-in user.

## Phase 4 hardware-test controls

The dashboard now includes the controls needed before live ESP8266 hardware testing:

- **Feed Now** writes a `feed` command to `/devices/{deviceId}/commands/active`.
- **Feed Test** writes a `test_motor` command for short motor verification.
- **Emergency Stop** writes an `emergency_stop` command to the selected device only.
- **Sync Settings** writes a `sync_settings` command after calibration changes.
- **Motor calibration** saves continuous-servo write values, positional-servo angles, timing, and safety max runtime under `/devices/{deviceId}/settings`.
- **Schedules** support enabled state, HH:MM time, day chips, feed mode, motor type, direction, and duration under `/devices/{deviceId}/schedules/{scheduleId}`.
- **Pairing success** redirects to the claimed device overview after the Cloud Function confirms ownership.
- **Dashboard clock** restores the old prototype clock idea as a new React glass card. The original analog clock remains historical code only under `legacy/`.

Before flashing hardware, verify Feed Now, Feed Test, Emergency Stop, Sync Settings, schedule CRUD, and command status updates against a seeded or real device record.
