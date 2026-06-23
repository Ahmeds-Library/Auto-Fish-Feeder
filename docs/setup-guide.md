# Setup Guide

## Firebase
1. Create a Firebase project.
2. Enable Email/Password Authentication.
3. Create a Realtime Database.
4. Deploy rules from `firebase/database.rules.json`.
5. Register a Firebase Web App and copy config values.

## Web app
```bash
cd web
cp .env.example .env
npm install
npm run dev
npm run build
```

Fill `.env` locally only; never commit secrets.

## Hosting
```bash
firebase use <project-id>
firebase deploy --only hosting,database
```

`firebase.json` serves `web/dist` and rewrites all SPA routes to `index.html`.

## Manual seed
Import `firebase/database.seed.json` into Realtime Database for demo data, replacing placeholder UIDs with real Firebase Auth UIDs.

## Phase 2 ESP8266 firmware setup

1. Install Arduino IDE or Arduino CLI with ESP8266 board support.
2. Install the required libraries listed in `firmware/esp8266-fish-feeder/README.md`.
3. Open `firmware/esp8266-fish-feeder/esp8266-fish-feeder.ino`.
4. Select Wemos D1 Mini / ESP8266 and flash the sketch.
5. On first boot, join the `FishFeeder-Setup` Wi-Fi network with password `setup1234`.
6. Visit `http://192.168.4.1` and enter Wi-Fi, Firebase, device Auth, motor, pin, and timezone settings.
7. Create a Firebase Auth account for the device and set `/devices/{deviceId}/deviceAuthUid` to that UID.
8. Link the device to the user under `/users/{uid}/devices/{deviceId}: true` and set `/devices/{deviceId}/ownerUid` manually or via a future trusted pairing flow.
9. Test Feed Now from the dashboard and confirm `/devices/{deviceId}/commands/active`, `status`, and `logs` update.

The firmware does not format LittleFS on normal boot and does not erase saved credentials after power loss. Factory reset requires explicit confirmation.
