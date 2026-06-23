# Setup Guide

## Firebase

1. Create a Firebase project.
2. Enable Email/Password Authentication.
3. Create a Realtime Database.
4. Deploy rules from `firebase/database.rules.json`.
5. Register a Firebase Web App and copy config values.

## Active web dashboard

The active frontend is `web/`. The original static prototype is reference-only under `legacy/`.

```bash
cd web
cp .env.example .env
npm install
npm run dev
npm run build
```

Fill `.env` locally only; never commit secrets.

## Firebase Hosting

`firebase.json` serves `web/dist` and rewrites all SPA routes to `index.html`. It must not deploy the old static prototype.

```bash
firebase use <project-id>
firebase deploy --only hosting,database
```

## Manual seed

Import `firebase/database.seed.json` into Realtime Database for demo data, replacing placeholder UIDs with real Firebase Auth UIDs.

## ESP8266 firmware setup

The active firmware is `firmware/esp8266-fish-feeder/`. The original sketch is preserved under `legacy/firmware-code/` for history only.

1. Install Arduino IDE or Arduino CLI with ESP8266 board support.
2. Install the required libraries listed in `firmware/esp8266-fish-feeder/README.md`.
3. Open `firmware/esp8266-fish-feeder/esp8266-fish-feeder.ino`.
4. Select Wemos D1 Mini / ESP8266 and flash the sketch.
5. On first boot, join the `FishFeeder-Setup` Wi-Fi network with password `setup1234`.
6. Visit `http://192.168.4.1` and enter Wi-Fi, Firebase, device Auth, motor, pin, and timezone settings.
7. Create a Firebase Auth account for the device and set `/devices/{deviceId}/deviceAuthUid` to that UID.
8. Pair the device through `/devices/pair` using the setup portal Device ID and 6-digit code; the `claimDevice` Cloud Function links `/users/{uid}/devices/{deviceId}` and `/devices/{deviceId}/ownerUid`.
9. Test Feed Now from the dashboard and confirm `/devices/{deviceId}/commands/active`, `status`, and `logs` update.

The firmware does not format LittleFS on normal boot and does not erase saved credentials after power loss. Factory reset requires explicit confirmation.

## Secure device pairing

1. Flash and configure the ESP8266 firmware.
2. The setup portal shows the Device ID, 6-digit pairing code, and pairing URL.
3. In the hosted dashboard, log in and open `/devices/pair` or the pairing URL from the setup portal.
4. Submit the Device ID and pairing code.
5. The `claimDevice` Cloud Function validates the code, expiry, and ownership before linking the device.

Browsers cannot automatically list nearby Wi-Fi setup networks. Connect to `FishFeeder-Setup` manually first, then use the setup portal or pairing URL.

Deploy Functions with:

```bash
cd functions
npm install
npm run build
firebase deploy --only functions,database,hosting
```

## Phase 4 dashboard control setup

After deploying the web app and database rules, verify these hardware-test controls before connecting a motor:

1. Open a paired device and use **Feed Now**. Confirm `/devices/{deviceId}/commands/active/type` is `feed`.
2. Use **Feed Test**. Confirm the command type is `test_motor` with a short duration payload.
3. Use **Emergency Stop**. Confirm the command type is `emergency_stop` and the firmware marks the motor stopped.
4. Save **Motor Settings** for continuous 360 and positional modes. The dashboard saves calibration values, hold/default durations, and `settings/safety/maxRunMs`, then sends `sync_settings`.
5. Create schedules with enabled state, time, day chips, feed mode, motor type, direction, and duration. These records must live under `/devices/{deviceId}/schedules/{scheduleId}`.
6. Pair a device through `/devices/pair`; after a successful `claimDevice` response, the app redirects to `/devices/{deviceId}/overview`.
7. Check the Dashboard clock card. It is a React replacement for the old prototype clock, not the legacy jQuery clock.

Do not flash or deploy files from `legacy/`. The old analog clock and prototype `/feednow` behavior are historical references only.
